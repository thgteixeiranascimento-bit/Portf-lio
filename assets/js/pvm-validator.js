/* ============================================================================
   pvm-validator.js — qualidade de dados e controles de integridade
   ----------------------------------------------------------------------------
   RESPONSABILIDADE UNICA: olhar para a base e dizer o que esta errado, com
   contagem e linhas afetadas. NUNCA altera um valor do usuario.

   Tres camadas, na ordem em que sao executadas:
     SCHEMA     campos obrigatorios mapeados, tipos, periodos selecionados
     BUSINESS   quantidade, receita, custo, unidade de medida
     INTEGRITY  duplicidade, nulos, NaN/Infinity, divisao por zero, negativos

   Severidade:
     error    bloqueia o botao RUN PVM (o resultado seria enganoso)
     warning  nao bloqueia, mas fica visivel no painel e na exportacao
     info     contexto
   ========================================================================== */

"use strict";

import { STATUS, safeDiv, cogsInScope } from "./pvm-engine.js";

export const PVM_VALIDATOR_VERSION = "1.0.0";

export const SEVERITY = { ERROR: "error", WARNING: "warning", INFO: "info" };

function issue(id, severity, title, detail, extra) {
  return Object.assign({ id, severity, title, detail, count: 0, rows: [], suggestion: "" }, extra || {});
}

/* ---------------------------------------------------------------- 1. SCHEMA */

/**
 * validateSchema — checa se o mapeamento permite calcular PVM.
 * Minimo para Receita: chave + periodo + quantidade + (receita OU preco unitario).
 */
export function validateSchema(mapping, layout) {
  const out = [];
  const has = (f) => !!mapping[f];

  if (!has("sku") && !has("product")) {
    out.push(issue("schema.key", SEVERITY.ERROR,
      "Coluna de identificacao nao mapeada",
      "O PVM precisa de um identificador por item (SKU ou Produto) para parear os dois periodos.",
      { suggestion: "Mapeie a coluna SKU (ou Produto) na etapa 02." }));
  }

  if (layout === "wide") {
    if (!has("quantityBase") || !has("quantityCurrent")) {
      out.push(issue("schema.qtyWide", SEVERITY.ERROR,
        "Quantidade base/atual nao mapeada",
        "No formato WIDE sao necessarias duas colunas de quantidade (periodo base e periodo atual).",
        { suggestion: "Mapeie Quantity Base e Quantity Current, ou mude para o formato LONG." }));
    }
    if (!has("revenueBase") || !has("revenueCurrent")) {
      out.push(issue("schema.revWide", SEVERITY.ERROR,
        "Receita base/atual nao mapeada",
        "No formato WIDE sao necessarias duas colunas de receita.",
        { suggestion: "Mapeie Revenue Base e Revenue Current." }));
    }
  } else {
    if (!has("period")) {
      out.push(issue("schema.period", SEVERITY.ERROR,
        "Coluna de periodo nao mapeada",
        "Sem periodo nao ha o que comparar. Use data, mes, trimestre, ano ou o rotulo do cenario (Real, Orcado, Forecast).",
        { suggestion: "Mapeie a coluna Period na etapa 02." }));
    }
    if (!has("quantity")) {
      out.push(issue("schema.quantity", SEVERITY.ERROR,
        "Coluna de quantidade nao mapeada",
        "Sem quantidade nao existem efeitos Volume e Mix — apenas a variacao total de receita.",
        { suggestion: "Mapeie a coluna Quantity." }));
    }
    if (!has("revenue") && !has("unitPrice")) {
      out.push(issue("schema.revenue", SEVERITY.ERROR,
        "Receita (ou preco unitario) nao mapeada",
        "E preciso Receita, ou Preco unitario para que a receita seja calculada como preco x quantidade.",
        { suggestion: "Mapeie Revenue ou Unit Price." }));
    }
  }

  if (!has("cogs") && !has("unitCost") && !has("cogsBase") && !has("cogsCurrent")) {
    out.push(issue("schema.cogs", SEVERITY.INFO,
      "COGS nao mapeado",
      "A analise de Margem Bruta fica indisponivel. O PVM de Receita funciona normalmente.",
      { suggestion: "Mapeie COGS (ou custo unitario) para habilitar a ponte de Margem Bruta." }));
  }
  if (!has("uom")) {
    out.push(issue("schema.uom", SEVERITY.INFO,
      "Unidade de medida nao informada",
      "Sem UOM o simulador nao consegue verificar se as quantidades sao somaveis entre si. O efeito Mix pressupoe unidades comparaveis.",
      { suggestion: "Mapeie a coluna UOM, ou confirme que toda a base usa a mesma unidade." }));
  }
  return out;
}

/* -------------------------------------------------------------- 2. BUSINESS */

/**
 * validateRows — percorre as linhas normalizadas e conta problemas de negocio.
 * Guarda ate `sampleLimit` indices de linha por problema para o relatorio.
 */
export function validateRows(rows, options) {
  const opts = options || {};
  const limit = opts.sampleLimit || 50;
  const out = [];
  const push = (bag, i) => { if (bag.rows.length < limit) bag.rows.push(i + 1); bag.count++; };

  const zeroQty = issue("row.zeroQty", SEVERITY.WARNING,
    "Registros com Quantity = 0",
    "Preco unitario indefinido nessas linhas. O item so entra em Price/Volume/Mix se tiver quantidade positiva nos dois periodos.",
    { suggestion: "Verifique se sao devolucoes, bonificacoes ou erro de extracao." });
  const negQty = issue("row.negQty", SEVERITY.WARNING,
    "Registros com quantidade negativa",
    "Normalmente indicam devolucoes. Somadas ao item, reduzem a quantidade liquida do periodo.",
    { suggestion: "Confirme se devolucoes devem entrar no PVM ou ser tratadas a parte." });
  const negRev = issue("row.negRev", SEVERITY.WARNING,
    "Registros com receita negativa",
    "Descontos, abatimentos ou estornos. Sao mantidos como estao — o simulador nao altera valores.",
    { suggestion: "Verifique a politica contabil de deducoes de receita." });
  const zeroRev = issue("row.zeroRev", SEVERITY.INFO,
    "Registros com receita zero e quantidade positiva",
    "Preco unitario zero (amostras, bonificacao). Isso puxa o preco medio do portfolio para baixo.",
    { suggestion: "Considere filtrar bonificacoes antes de analisar preco." });
  const noQty = issue("row.missingQty", SEVERITY.WARNING,
    "Registros sem quantidade",
    "Linhas em que a coluna Quantity nao pode ser lida como numero. Contam como quantidade zero na agregacao.",
    { suggestion: "Verifique o separador decimal na etapa 02." });
  const noRev = issue("row.missingRev", SEVERITY.WARNING,
    "Registros sem receita",
    "Linhas em que a coluna Revenue nao pode ser lida como numero. Contam como receita zero na agregacao.",
    { suggestion: "Verifique o separador decimal e celulas de texto na coluna de receita." });
  const nonFinite = issue("row.nonFinite", SEVERITY.ERROR,
    "Valores nao finitos (NaN / Infinity)",
    "Valores que nao sao numeros reais nao podem entrar em um modelo financeiro.",
    { suggestion: "Corrija na origem e reenvie o arquivo." });

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const q = r.quantity, rev = r.revenue;
    if (q != null && !Number.isFinite(q)) push(nonFinite, i);
    else if (rev != null && !Number.isFinite(rev)) push(nonFinite, i);
    if (q == null) push(noQty, i);
    else if (q === 0) push(zeroQty, i);
    else if (q < 0) push(negQty, i);
    if (rev == null) push(noRev, i);
    else if (rev < 0) push(negRev, i);
    else if (rev === 0 && q != null && q > 0) push(zeroRev, i);
  }

  for (const b of [nonFinite, noQty, noRev, zeroQty, negQty, negRev, zeroRev]) if (b.count > 0) out.push(b);
  return out;
}

/* ------------------------------------------------------------- 3. INTEGRITY */

/**
 * validateItems — problemas que so aparecem depois da agregacao por item.
 */
export function validateItems(items, duplicates, options) {
  const opts = options || {};
  const limit = opts.sampleLimit || 50;
  const out = [];

  if (duplicates && duplicates.length) {
    out.push(issue("item.duplicate", SEVERITY.WARNING,
      "Chaves duplicadas (SKU + periodo)",
      "Mais de uma linha para a mesma combinacao de item e periodo. O simulador SOMA essas linhas (convencao declarada) em vez de descartar qualquer uma.",
      {
        count: duplicates.length,
        rows: duplicates.slice(0, limit).map(d => d.label + " @ " + d.period),
        suggestion: "Se as linhas representam canais ou clientes diferentes, inclua essa dimensao na chave."
      }));
  }

  const nonComparable = items.filter(it => it.status === STATUS.NON_COMPARABLE);
  if (nonComparable.length) {
    out.push(issue("item.nonComparable", SEVERITY.WARNING,
      "Itens presentes nos dois periodos, mas sem preco calculavel",
      "Quantidade zero ou negativa em pelo menos um dos periodos torna o preco unitario indefinido. Esses itens NAO entram em Price/Volume/Mix: a variacao inteira vai para o balde 'Other', visivel na ponte.",
      {
        count: nonComparable.length,
        rows: nonComparable.slice(0, limit).map(it => it.label),
        suggestion: "Trate devolucoes/bonificacoes separadamente ou agregue o item em um nivel com quantidade positiva."
      }));
  }

  const uomConf = items.filter(it => it.uomConflict);
  if (uomConf.length) {
    out.push(issue("item.uomItem", SEVERITY.ERROR,
      "Item com mais de uma unidade de medida",
      "O mesmo SKU aparece com UOMs diferentes. Somar essas quantidades produz um numero sem significado economico.",
      {
        count: uomConf.length,
        rows: uomConf.slice(0, limit).map(it => it.label + " (" + it.uomList.join(", ") + ")"),
        suggestion: "Converta para uma unidade unica antes de enviar, ou filtre por UOM."
      }));
  }

  const units = new Set();
  for (const it of items) if (it.uom) units.add(it.uom);
  if (units.size > 1) {
    out.push(issue("item.uomMixed", SEVERITY.WARNING,
      "Unidades de medida heterogeneas na populacao",
      "Mix analysis requires comparable units of measure. Select a homogeneous UOM or use an alternative decomposition.",
      {
        count: units.size,
        rows: Array.from(units),
        suggestion: "Use o filtro Unit of Measure para analisar uma unidade por vez. Enquanto houver mais de uma UOM, os efeitos Volume e Mix ficam sinalizados."
      }));
  }

  const withCogs = items.filter(cogsInScope).length;
  if (withCogs > 0 && withCogs < items.length) {
    out.push(issue("item.cogsPartial", SEVERITY.WARNING,
      "COGS incompleto",
      "Ha itens sem COGS em um dos periodos. Eles ficam FORA da analise de Margem Bruta — o simulador nao assume custo zero para fechar a ponte.",
      {
        count: items.length - withCogs,
        rows: items.filter(it => !cogsInScope(it)).slice(0, limit).map(it => it.label),
        suggestion: "Complete o COGS ou leia a Margem Bruta apenas sobre a populacao coberta (indicada no painel)."
      }));
  }

  const active = items.filter(it => it.status === STATUS.ACTIVE);
  if (active.length === 0 && items.length > 0) {
    out.push(issue("item.noActive", SEVERITY.ERROR,
      "Nenhum item comparavel entre os dois periodos",
      "Sem itens presentes nos dois periodos nao existe decomposicao Price/Volume/Mix — toda a variacao seria New + Discontinued.",
      { suggestion: "Confira se os periodos base e atual estao corretos e se a chave do item e a mesma nos dois." }));
  }
  return out;
}

/* ------------------------------------------------- 4. DATA QUALITY SCORE */

/**
 * dataQualityScore — cinco componentes independentes, 0 a 100.
 *
 * completeness   celulas preenchidas nos campos obrigatorios
 * consistency    ausencia de contradicoes (receita sem quantidade, negativos)
 * uniqueness     ausencia de chaves duplicadas
 * validity       celulas que efetivamente viraram numero
 * reconciliation resultado da ponte (null enquanto nao houver calculo)
 *
 * O score geral e a media dos componentes DISPONIVEIS — reconciliation so
 * entra depois do calculo, e isso fica explicito na interface.
 */
export function dataQualityScore(context) {
  const { rows, items, duplicates, parseIssues, bridgePass } = context;
  const n = Math.max(1, rows.length);

  let filled = 0, valid = 0, inconsistent = 0;
  for (const r of rows) {
    let f = 0, tot = 2;
    if (r.quantity != null) f++;
    if (r.revenue != null) f++;
    filled += f / tot;
    if (r.quantity != null && Number.isFinite(r.quantity)) valid += 0.5;
    if (r.revenue != null && Number.isFinite(r.revenue)) valid += 0.5;
    const badZero = (r.revenue != null && r.revenue !== 0 && (r.quantity == null || r.quantity === 0));
    const badNeg = (r.quantity != null && r.quantity < 0);
    if (badZero || badNeg) inconsistent++;
  }

  const dupRows = (duplicates || []).length;
  const pi = parseIssues || {};
  const parseBad = (pi.nonNumericQuantity || 0) + (pi.nonNumericRevenue || 0) + (pi.nonNumericCogs || 0)
                 + (pi.missingKey || 0) + (pi.missingPeriod || 0);

  const uomConflicts = (items || []).filter(it => it.uomConflict).length;
  const nonComparable = (items || []).filter(it => it.status === STATUS.NON_COMPARABLE).length;
  const itemCount = Math.max(1, (items || []).length);

  const pct = (x) => Math.max(0, Math.min(100, x * 100));
  const components = {
    completeness: pct(filled / n),
    consistency: pct(1 - (inconsistent + uomConflicts + nonComparable) / (n + itemCount)),
    uniqueness: pct(1 - dupRows / Math.max(1, itemCount * 2)),
    validity: pct((valid / n) * (1 - Math.min(1, parseBad / n))),
    reconciliation: bridgePass == null ? null : (bridgePass ? 100 : 0)
  };
  const available = Object.values(components).filter(v => v != null);
  const score = available.reduce((a, b) => a + b, 0) / available.length;

  return { score, components };
}

/* --------------------------------------------------------- 5. ORQUESTRACAO */

/**
 * validateDataset — executa as tres camadas e devolve o pacote completo que a
 * interface exibe no painel "Data Quality" e que vai para a aba 4 do Excel.
 */
export function validateDataset(context) {
  const { mapping, layout, rows, items, duplicates, parseIssues, basePeriod, currentPeriod, bridgePass } = context;

  const issues = []
    .concat(validateSchema(mapping || {}, layout))
    .concat(validateRows(rows || []))
    .concat(validateItems(items || [], duplicates || []));

  if (basePeriod != null && currentPeriod != null && String(basePeriod) === String(currentPeriod)) {
    issues.push(issue("schema.samePeriod", SEVERITY.ERROR,
      "Periodo base e periodo de comparacao sao iguais",
      "A variacao seria zero por construcao.",
      { suggestion: "Escolha dois periodos diferentes na etapa 03." }));
  }
  if ((items || []).length === 0 && (rows || []).length > 0) {
    issues.push(issue("schema.noItems", SEVERITY.ERROR,
      "Nenhum item nos periodos selecionados",
      "As linhas foram lidas, mas nenhuma pertence aos periodos base/atual escolhidos.",
      { suggestion: "Reveja a selecao de periodos e a granularidade (dia/mes/trimestre/ano)." }));
  }

  const quality = dataQualityScore({ rows: rows || [], items: items || [], duplicates, parseIssues, bridgePass });
  const errors = issues.filter(i => i.severity === SEVERITY.ERROR);
  const warnings = issues.filter(i => i.severity === SEVERITY.WARNING);

  return {
    version: PVM_VALIDATOR_VERSION,
    issues,
    errors: errors.length,
    warnings: warnings.length,
    canRun: errors.length === 0,
    quality,
    summary: buildSummary(context)
  };
}

/** Linhas do quadro-resumo do painel Data Quality. */
function buildSummary(context) {
  const rows = context.rows || [];
  const items = context.items || [];
  const counts = { active: 0, new: 0, discontinued: 0, "non-comparable": 0 };
  for (const it of items) counts[it.status] = (counts[it.status] || 0) + 1;
  const complete = rows.filter(r => r.quantity != null && r.revenue != null).length;
  return {
    rowsImported: rows.length,
    uniqueItems: items.length,
    basePeriod: context.basePeriod,
    currentPeriod: context.currentPeriod,
    completeRows: complete,
    completeShare: safeDiv(complete, rows.length),
    counts
  };
}

/**
 * modelIntegrity — painel MODEL INTEGRITY (protocolo 70).
 * Le o resultado ja calculado; nao recalcula nada.
 */
export function modelIntegrity(result, context) {
  const rev = result.revenue;
  const gm = result.grossMargin;
  const rowsProcessed = (context && context.rows ? context.rows.length : 0);
  const invalid = (context && context.rows ? context.rows.filter(r => r.quantity == null && r.revenue == null).length : 0);
  const dup = (context && context.duplicates ? context.duplicates.length : 0);
  const uomConflicts = (result.uom && result.uom.itemConflicts ? result.uom.itemConflicts.length : 0);

  return [
    { label: "Revenue Bridge", value: rev.bridge.status, pass: rev.bridge.pass },
    { label: "Gross Margin Bridge", value: gm ? gm.bridge.status : "N/D", pass: gm ? gm.bridge.pass : null },
    { label: "COGS Bridge", value: result.cost ? result.cost.bridge.status : "N/D", pass: result.cost ? result.cost.bridge.pass : null },
    { label: "Rows Processed", value: rowsProcessed, pass: null },
    { label: "Invalid Rows", value: invalid, pass: invalid === 0 },
    { label: "Duplicate Keys", value: dup, pass: dup === 0 },
    { label: "UOM Conflicts", value: uomConflicts, pass: uomConflicts === 0 },
    { label: "Residual (Receita)", value: rev.bridge.residual, pass: rev.bridge.pass, numeric: true },
    { label: "Residual (Margem)", value: gm ? gm.bridge.residual : null, pass: gm ? gm.bridge.pass : null, numeric: true },
    { label: "Engine", value: "v" + result.engineVersion, pass: null }
  ];
}
