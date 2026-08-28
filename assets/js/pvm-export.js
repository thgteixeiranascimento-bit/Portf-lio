/* ============================================================================
   pvm-export.js — exportacao Excel / CSV / JSON
   ----------------------------------------------------------------------------
   RESPONSABILIDADE UNICA: serializar o que ja foi calculado. Nao recalcula
   nenhum efeito — todos os numeros vem de `result`, produzido pelo motor.

   O .xlsx sai com seis abas (protocolo 48), formatacao financeira de verdade
   (negativos entre parenteses, percentuais, p.p.) e uma aba de metodologia que
   torna o arquivo auditavel fora do navegador.
   ========================================================================== */

"use strict";

import { writeXlsx, XLSX_STYLE } from "./pvm-xlsx.js";
import {
  METHODOLOGIES, getMethodology, PVM_ENGINE_VERSION,
  REVENUE_BUCKET_LABELS, GM_BUCKET_LABELS
} from "./pvm-engine.js";

export const PVM_EXPORT_VERSION = "1.0.0";

const S = XLSX_STYLE;

/* ------------------------------------------------------------------ download */

export function downloadBlob(data, filename, mime) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function stamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes());
}

/* ----------------------------------------------------------- montagem das abas */

function sheet1Summary(ctx) {
  const { result, audit, validation } = ctx;
  const rev = result.revenue, gm = result.grossMargin;
  const method = getMethodology(result.methodology);
  const rows = [], styles = [];
  const put = (cells, st) => { rows.push(cells); styles.push(st || []); };

  put(["Price · Volume · Mix — Executive Summary"], [S.TITLE]);
  put([]);
  put(["Analise", audit.name], [S.BOLD]);
  put(["Arquivo de origem", audit.fileName || "(nao informado)"], [S.BOLD]);
  put(["Gerado em", new Date(), null], [S.BOLD, S.DATETIME]);
  put(["Periodo base", String(audit.basePeriod)], [S.BOLD]);
  put(["Periodo de comparacao", String(audit.currentPeriod)], [S.BOLD]);
  put(["Metodologia PVM", method.label], [S.BOLD]);
  put(["Motor de calculo", "PVM engine v" + result.engineVersion], [S.BOLD]);
  put(["Filtros aplicados", audit.filterLabel || "nenhum"], [S.BOLD]);
  put(["Moeda", audit.currency || "-"], [S.BOLD]);
  put([]);

  put(["INDICADORES — RECEITA"], [S.BOLD]);
  put(["Indicador", "Valor"], [S.HEADER, S.HEADER]);
  put(["Receita base", rev.base], [null, S.MONEY]);
  put(["Receita atual", rev.current], [null, S.MONEY]);
  put(["Variacao de receita", rev.delta], [null, S.MONEY]);
  put(["Variacao de receita %", rev.deltaPct], [null, S.PERCENT]);
  put(["Quantidade base", rev.quantityBase], [null, S.NUMBER]);
  put(["Quantidade atual", rev.quantityCurrent], [null, S.NUMBER]);
  put(["Variacao de quantidade %", rev.quantityDeltaPct], [null, S.PERCENT]);
  put(["Preco medio base", rev.avgPriceBase], [null, S.MONEY2]);
  put(["Preco medio atual", rev.avgPriceCurrent], [null, S.MONEY2]);
  put(["Itens ativos / novos / descontinuados / nao comparaveis",
    result.counts.active + " / " + result.counts.new + " / " + result.counts.discontinued + " / " + result.counts["non-comparable"]]);
  put([]);

  put(["REVENUE BRIDGE"], [S.BOLD]);
  put(["Componente", "Valor", "% da variacao", "% da base"], [S.HEADER, S.HEADER, S.HEADER, S.HEADER]);
  put(["Receita base", rev.base, null, null], [null, S.MONEY]);
  for (const st of rev.bridge.steps) {
    put([st.label, st.value,
      rev.delta !== 0 ? st.value / Math.abs(rev.delta) : null,
      rev.base !== 0 ? st.value / Math.abs(rev.base) : null],
      [null, S.MONEY, S.PERCENT, S.PERCENT]);
  }
  put(["Receita atual", rev.current, null, null], [S.BOLD, S.MONEY_BOLD]);
  put(["Residuo de reconciliacao", rev.bridge.residual], [null, S.MONEY2]);
  put(["Tolerancia", rev.bridge.tolerance], [null, S.MONEY2]);
  put(["Status", rev.bridge.status], [S.BOLD, S.BOLD]);
  put([]);

  if (gm) {
    put(["INDICADORES — MARGEM BRUTA"], [S.BOLD]);
    put(["Indicador", "Valor"], [S.HEADER, S.HEADER]);
    put(["Margem bruta base", gm.base], [null, S.MONEY]);
    put(["Margem bruta atual", gm.current], [null, S.MONEY]);
    put(["Variacao de margem bruta", gm.delta], [null, S.MONEY]);
    put(["GM% base", gm.gmPctBase], [null, S.PERCENT]);
    put(["GM% atual", gm.gmPctCurrent], [null, S.PERCENT]);
    put(["Variacao de GM%", gm.gmPctDeltaPP == null ? null : gm.gmPctDeltaPP * 100], [null, S.PP]);
    put(["Cobertura de COGS (itens)", gm.coverage.items + " de " + gm.coverage.totalItems]);
    put(["Cobertura de COGS (% da receita base)", gm.coverage.revenueShare], [null, S.PERCENT]);
    put([]);
    put(["GROSS MARGIN BRIDGE"], [S.BOLD]);
    put(["Componente", "Valor", "% da variacao", "% da base"], [S.HEADER, S.HEADER, S.HEADER, S.HEADER]);
    put(["Margem bruta base", gm.base, null, null], [null, S.MONEY]);
    for (const st of gm.bridge.steps) {
      put([st.label, st.value,
        gm.delta !== 0 ? st.value / Math.abs(gm.delta) : null,
        gm.base !== 0 ? st.value / Math.abs(gm.base) : null],
        [null, S.MONEY, S.PERCENT, S.PERCENT]);
    }
    put(["Margem bruta atual", gm.current, null, null], [S.BOLD, S.MONEY_BOLD]);
    put(["Residuo de reconciliacao", gm.bridge.residual], [null, S.MONEY2]);
    put(["Status", gm.bridge.status], [S.BOLD, S.BOLD]);
    put([]);
    put(["COGS BRIDGE"], [S.BOLD]);
    put(["Componente", "Valor"], [S.HEADER, S.HEADER]);
    put(["COGS base", result.cost.base], [null, S.MONEY]);
    for (const st of result.cost.bridge.steps) put([st.label, st.value], [null, S.MONEY]);
    put(["COGS atual", result.cost.current], [S.BOLD, S.MONEY_BOLD]);
    put(["Status", result.cost.bridge.status], [S.BOLD, S.BOLD]);
    put([]);
  } else {
    put(["MARGEM BRUTA", "COGS nao mapeado — analise de margem indisponivel nesta exportacao."], [S.BOLD]);
    put([]);
  }

  if (validation) {
    put(["DATA QUALITY SCORE"], [S.BOLD]);
    put(["Componente", "Nota (0-100)"], [S.HEADER, S.HEADER]);
    put(["Score geral", validation.quality.score], [S.BOLD, S.NUMBER]);
    for (const [k, v] of Object.entries(validation.quality.components)) {
      put([k, v == null ? "nao avaliado" : v], [null, v == null ? null : S.NUMBER]);
    }
  }

  return { name: "Executive Summary", rows, styles, widths: [42, 20, 16, 16], freeze: 1 };
}

function sheet2Revenue(ctx) {
  const { result, items, dimensionColumns } = ctx;
  const rev = result.revenue;
  const method = getMethodology(result.methodology);
  const dims = dimensionColumns || [];

  const head = ["SKU", "Produto"].concat(dims).concat([
    "Status", "UOM",
    "Revenue Base", "Revenue Current",
    "Quantity Base", "Quantity Current",
    "Price Base", "Price Current",
    "Price Effect", "Volume Effect", "Mix Effect"
  ]);
  if (method.hasCross) head.push("Cross Effect");
  head.push("New", "Discontinued", "Other", "Delta Revenue", "Reconciliation");

  const rows = [head];
  const styles = [head.map(() => S.HEADER)];
  const nDims = dims.length;

  for (const it of items) {
    const e = rev.effects.get(it.key) || {};
    const sum = (e.price || 0) + (e.volume || 0) + (e.mix || 0) + (e.cross || 0) +
                (e.new || 0) + (e.discontinued || 0) + (e.other || 0);
    const delta = it.rev1 - it.rev0;
    const line = [it.key, it.label];
    for (const d of dims) line.push(it.dims[d] != null ? it.dims[d] : "");
    line.push(it.status, it.uom || "",
      it.rev0, it.rev1, it.q0, it.q1, it.p0, it.p1,
      e.price || 0, e.volume || 0, e.mix || 0);
    if (method.hasCross) line.push(e.cross || 0);
    line.push(e.new || 0, e.discontinued || 0, e.other || 0, delta, delta - sum);
    rows.push(line);

    const st = [null, null];
    for (let i = 0; i < nDims; i++) st.push(null);
    st.push(null, null,
      S.MONEY, S.MONEY, S.NUMBER, S.NUMBER, S.MONEY2, S.MONEY2,
      S.MONEY, S.MONEY, S.MONEY);
    if (method.hasCross) st.push(S.MONEY);
    st.push(S.MONEY, S.MONEY, S.MONEY, S.MONEY, S.MONEY2);
    styles.push(st);
  }

  // linha de total, para conferencia rapida dentro do proprio Excel
  const b = rev.buckets;
  const total = ["TOTAL", ""].concat(dims.map(() => "")).concat(["", "",
    rev.base, rev.current, rev.quantityBase, rev.quantityCurrent, rev.avgPriceBase, rev.avgPriceCurrent,
    b.price, b.volume, b.mix]);
  if (method.hasCross) total.push(b.cross);
  total.push(b.new, b.discontinued, b.other, rev.delta, rev.bridge.residual);
  rows.push([]);
  styles.push([]);
  rows.push(total);
  const tst = [S.BOLD, null].concat(dims.map(() => null)).concat([null, null,
    S.MONEY_BOLD, S.MONEY_BOLD, S.NUMBER, S.NUMBER, S.MONEY2, S.MONEY2,
    S.MONEY_BOLD, S.MONEY_BOLD, S.MONEY_BOLD]);
  if (method.hasCross) tst.push(S.MONEY_BOLD);
  tst.push(S.MONEY_BOLD, S.MONEY_BOLD, S.MONEY_BOLD, S.MONEY_BOLD, S.MONEY2);
  styles.push(tst);

  const widths = [16, 26].concat(dims.map(() => 16)).concat([14, 8]).concat(new Array(head.length).fill(15));
  return { name: "Revenue PVM", rows, styles, widths: widths.slice(0, head.length), freeze: 1 };
}

function sheet3GrossMargin(ctx) {
  const { result, items, dimensionColumns } = ctx;
  const gm = result.grossMargin;
  const dims = dimensionColumns || [];

  if (!gm) {
    return {
      name: "Gross Margin PVM",
      rows: [["Gross Margin PVM"], [], ["COGS nao foi mapeado nesta analise."],
             ["Mapeie a coluna COGS (ou custo unitario) na etapa 02 para habilitar a ponte de margem bruta."]],
      styles: [[S.TITLE]], widths: [80]
    };
  }
  const method = getMethodology(result.methodology);
  const head = ["SKU", "Produto"].concat(dims).concat([
    "Status",
    "Revenue Base", "Revenue Current", "COGS Base", "COGS Current",
    "GM Base", "GM Current", "GM% Base", "GM% Current",
    "Unit Cost Base", "Unit Cost Current",
    "Selling Price", "Unit Cost Effect", "Volume", "Sales Mix", "Cost Mix"
  ]);
  if (method.hasCross) head.push("Cross");
  head.push("New", "Discontinued", "Other", "Delta GM", "Reconciliation");

  const rows = [head];
  const styles = [head.map(() => S.HEADER)];

  for (const it of items) {
    const e = gm.effects.get(it.key);
    if (!e || !e.inScope) continue;
    const gm0 = it.rev0 - (it.cogs0 || 0), gm1 = it.rev1 - (it.cogs1 || 0);
    const sum = e.sellingPrice + e.unitCost + e.volume + e.salesMix + e.costMix + e.cross + e.new + e.discontinued + e.other;
    const line = [it.key, it.label];
    for (const d of dims) line.push(it.dims[d] != null ? it.dims[d] : "");
    line.push(it.status,
      it.rev0, it.rev1, it.cogs0, it.cogs1, gm0, gm1,
      it.rev0 ? gm0 / it.rev0 : null, it.rev1 ? gm1 / it.rev1 : null,
      it.c0, it.c1,
      e.sellingPrice, e.unitCost, e.volume, e.salesMix, e.costMix);
    if (method.hasCross) line.push(e.cross);
    line.push(e.new, e.discontinued, e.other, gm1 - gm0, (gm1 - gm0) - sum);
    rows.push(line);

    const st = [null, null].concat(dims.map(() => null)).concat([null,
      S.MONEY, S.MONEY, S.MONEY, S.MONEY, S.MONEY, S.MONEY, S.PERCENT, S.PERCENT,
      S.MONEY2, S.MONEY2, S.MONEY, S.MONEY, S.MONEY, S.MONEY, S.MONEY]);
    if (method.hasCross) st.push(S.MONEY);
    st.push(S.MONEY, S.MONEY, S.MONEY, S.MONEY, S.MONEY2);
    styles.push(st);
  }

  rows.push([]); styles.push([]);
  const b = gm.buckets;
  const total = ["TOTAL", ""].concat(dims.map(() => "")).concat([""])
    .concat([gm.revenueBase, gm.revenueCurrent, null, null, gm.base, gm.current, gm.gmPctBase, gm.gmPctCurrent, null, null,
      b.sellingPrice, b.unitCost, b.volume, b.salesMix, b.costMix]);
  if (method.hasCross) total.push(b.cross);
  total.push(b.new, b.discontinued, b.other, gm.delta, gm.bridge.residual);
  rows.push(total);
  const tst = [S.BOLD, null].concat(dims.map(() => null)).concat([null,
    S.MONEY_BOLD, S.MONEY_BOLD, null, null, S.MONEY_BOLD, S.MONEY_BOLD, S.PERCENT, S.PERCENT, null, null,
    S.MONEY_BOLD, S.MONEY_BOLD, S.MONEY_BOLD, S.MONEY_BOLD, S.MONEY_BOLD]);
  if (method.hasCross) tst.push(S.MONEY_BOLD);
  tst.push(S.MONEY_BOLD, S.MONEY_BOLD, S.MONEY_BOLD, S.MONEY_BOLD, S.MONEY2);
  styles.push(tst);

  const widths = [16, 26].concat(dims.map(() => 16)).concat(new Array(head.length).fill(15));
  return { name: "Gross Margin PVM", rows, styles, widths: widths.slice(0, head.length), freeze: 1 };
}

function sheet4DataQuality(ctx) {
  const { validation, result, integrity } = ctx;
  const rows = [], styles = [];
  const put = (c, s) => { rows.push(c); styles.push(s || []); };

  put(["Data Quality & Model Integrity"], [S.TITLE]);
  put([]);
  put(["MODEL INTEGRITY"], [S.BOLD]);
  put(["Controle", "Valor", "Status"], [S.HEADER, S.HEADER, S.HEADER]);
  for (const c of (integrity || [])) {
    put([c.label, c.value, c.pass == null ? "—" : (c.pass ? "PASS" : "FAIL")],
      [null, c.numeric ? S.MONEY2 : null, null]);
  }
  put([]);

  if (validation) {
    put(["DATA QUALITY SCORE"], [S.BOLD]);
    put(["Componente", "Nota (0-100)"], [S.HEADER, S.HEADER]);
    put(["Score geral", validation.quality.score], [S.BOLD, S.NUMBER]);
    for (const [k, v] of Object.entries(validation.quality.components)) {
      put([k, v == null ? "nao avaliado" : v], [null, v == null ? null : S.NUMBER]);
    }
    put([]);
    put(["OCORRENCIAS IDENTIFICADAS"], [S.BOLD]);
    put(["Severidade", "Problema", "Detalhe", "Ocorrencias", "Acao sugerida", "Exemplos"],
      [S.HEADER, S.HEADER, S.HEADER, S.HEADER, S.HEADER, S.HEADER]);
    if (!validation.issues.length) put(["—", "Nenhuma ocorrencia identificada", "", 0, "", ""]);
    for (const i of validation.issues) {
      put([i.severity, i.title, i.detail, i.count, i.suggestion,
        (i.rows || []).slice(0, 20).join(", ")], [null, null, null, S.NUMBER]);
    }
    put([]);
    put(["Nota: nenhum valor da base foi alterado pelo simulador. As ocorrencias acima sao diagnostico, nao correcao."]);
  }
  put([]);
  put(["CLASSIFICACAO DE ITENS"], [S.BOLD]);
  put(["Status", "Itens"], [S.HEADER, S.HEADER]);
  put(["Active (comparavel)", result.counts.active], [null, S.NUMBER]);
  put(["New", result.counts.new], [null, S.NUMBER]);
  put(["Discontinued", result.counts.discontinued], [null, S.NUMBER]);
  put(["Non-comparable", result.counts["non-comparable"]], [null, S.NUMBER]);

  return { name: "Data Quality", rows, styles, widths: [16, 40, 60, 13, 46, 40], freeze: 1 };
}

function sheet5Mapping(ctx) {
  const { audit, parseIssues } = ctx;
  const rows = [], styles = [];
  const put = (c, s) => { rows.push(c); styles.push(s || []); };

  put(["Input Mapping"], [S.TITLE]);
  put([]);
  put(["Campo PVM", "Coluna de origem"], [S.HEADER, S.HEADER]);
  const labels = {
    sku: "SKU / ID", product: "Produto", category: "Categoria", period: "Periodo",
    quantity: "Quantidade", revenue: "Receita", unitPrice: "Preco unitario",
    cogs: "COGS", unitCost: "Custo unitario", uom: "Unidade de medida",
    customer: "Cliente", channel: "Canal", region: "Regiao",
    salesRep: "Vendedor", businessUnit: "Unidade de negocio",
    revenueBase: "Receita (base)", revenueCurrent: "Receita (atual)",
    quantityBase: "Quantidade (base)", quantityCurrent: "Quantidade (atual)",
    cogsBase: "COGS (base)", cogsCurrent: "COGS (atual)"
  };
  for (const [k, label] of Object.entries(labels)) {
    if (audit.mapping && audit.mapping[k]) put([label, audit.mapping[k]]);
  }
  put([]);
  put(["Parametros de leitura"], [S.BOLD]);
  put(["Arquivo", audit.fileName || "—"]);
  put(["Aba", audit.sheetName || "—"]);
  put(["Formato detectado", audit.layout === "wide" ? "WIDE (colunas base/atual)" : "LONG (uma linha por item x periodo)"]);
  put(["Granularidade do periodo", audit.periodGranularity]);
  put(["Linhas lidas", audit.rowCount], [null, S.NUMBER]);
  put(["Itens apos agregacao", audit.itemCount], [null, S.NUMBER]);
  put(["Periodo base", String(audit.basePeriod)]);
  put(["Periodo de comparacao", String(audit.currentPeriod)]);
  put([]);
  if (parseIssues) {
    put(["Conversoes durante a leitura"], [S.BOLD]);
    put(["Ocorrencia", "Linhas"], [S.HEADER, S.HEADER]);
    const t = {
      nonNumericQuantity: "Quantidade nao numerica", nonNumericRevenue: "Receita nao numerica",
      nonNumericCogs: "COGS nao numerico", missingKey: "Linha sem identificador",
      missingPeriod: "Linha sem periodo", derivedRevenue: "Receita derivada de preco x quantidade",
      derivedCogs: "COGS derivado de custo unitario x quantidade"
    };
    for (const [k, label] of Object.entries(t)) put([label, parseIssues[k] || 0], [null, S.NUMBER]);
  }
  put([]);
  put(["Trilha de auditoria"], [S.BOLD]);
  put(["analysisId", audit.analysisId]);
  put(["createdAt", audit.createdAt]);
  put(["calculationVersion", audit.calculationVersion]);
  put(["parserVersion", audit.parserVersion]);
  put(["validatorVersion", audit.validatorVersion]);
  put(["filters", audit.filterLabel || "nenhum"]);

  return { name: "Input Mapping", rows, styles, widths: [34, 46], freeze: 1 };
}

function sheet6Methodology(ctx) {
  const { result } = ctx;
  const method = getMethodology(result.methodology);
  const rows = [], styles = [];
  const put = (c, s) => { rows.push(c); styles.push(s || []); };

  put(["Methodology & Controls"], [S.TITLE]);
  put([]);
  put(["Metodologia adotada nesta analise", method.label], [S.BOLD, S.BOLD]);
  put(["Observacao", method.note]);
  put([]);
  put(["Formulas aplicadas (por item i, populacao comparavel)"], [S.BOLD]);
  put(["Efeito", "Formula"], [S.HEADER, S.HEADER]);
  put(["Price", method.priceFormula], [null, S.CODE]);
  put(["Volume", method.volumeFormula], [null, S.CODE]);
  put(["Mix", method.mixFormula], [null, S.CODE]);
  put(["Cross", method.crossFormula], [null, S.CODE]);
  put([]);
  put(["Notacao"], [S.BOLD]);
  put(["P0_i, P1_i", "preco unitario do item i no periodo base e atual = Receita / Quantidade"]);
  put(["Q0_i, Q1_i", "quantidade do item i no periodo base e atual"]);
  put(["Pm0", "preco medio ponderado do portfolio no periodo base = soma(Receita0) / soma(Q0)"]);
  put(["g", "fator de crescimento de quantidade = soma(Q1) / soma(Q0), calculado SO na populacao comparavel"]);
  put(["C0_i, C1_i", "custo unitario do item i = COGS / Quantidade"]);
  put([]);
  put(["Tratamento de itens"], [S.BOLD]);
  put(["Active", "Presente nos dois periodos com quantidade positiva. Entra em Price, Volume e Mix."]);
  put(["New", "Ausente no periodo base. Efeito = Receita do periodo atual. Nao entra em Price/Volume/Mix."]);
  put(["Discontinued", "Ausente no periodo atual. Efeito = menos a Receita do periodo base."]);
  put(["Non-comparable", "Presente nos dois periodos, mas sem preco unitario definido (quantidade nula ou negativa). Toda a variacao vai para o balde Other."]);
  put([]);
  put(["Ponte de receita"], [S.BOLD]);
  put(["Receita base + Price + Volume + Mix" + (method.hasCross ? " + Cross" : "") + " + New + Discontinued + Other = Receita atual"], [S.CODE]);
  put([]);
  put(["Ponte de margem bruta"], [S.BOLD]);
  put(["GM base + Selling price - Unit cost + Volume + Sales mix - Cost mix" + (method.hasCross ? " + Cross" : "") + " + New + Discontinued + Other = GM atual"], [S.CODE]);
  put(["Construcao", "A ponte de GM e a diferenca exata, item a item, entre a ponte de receita e a ponte de COGS. Como cada lado fecha por identidade algebrica, a diferenca tambem fecha."]);
  put([]);
  put(["Politica de arredondamento"], [S.BOLD]);
  put(["Calculo", "Nenhum arredondamento em etapa intermediaria. Toda a aritmetica em ponto flutuante de dupla precisao, com somatorio compensado (Neumaier) nos totais."]);
  put(["Apresentacao", "Arredondamento apenas na exibicao e nesta exportacao."]);
  put(["Tolerancia de reconciliacao", "max(0,01 ; |valor atual| x 1e-9)"]);
  put(["Residuo observado (receita)", result.revenue.bridge.residual], [null, S.MONEY2]);
  put(["Residuo observado (margem)", result.grossMargin ? result.grossMargin.bridge.residual : "n/d"],
    [null, result.grossMargin ? S.MONEY2 : null]);
  put([]);
  put(["Unidades de medida"], [S.BOLD]);
  put(["Requisito", "O efeito Mix pressupoe quantidades somaveis entre si. Com UOM heterogenea, a interpretacao de Volume e Mix deixa de ser valida."]);
  put(["Situacao nesta analise", result.uom.heterogeneous
    ? ("HETEROGENEA — unidades: " + result.uom.units.join(", "))
    : (result.uom.declared ? ("Homogenea — " + (result.uom.units[0] || "")) : "UOM nao informada na base")]);
  put([]);
  put(["Convencoes alternativas disponiveis no simulador"], [S.BOLD]);
  put(["Metodologia", "Price", "Volume", "Mix", "Cross"], [S.HEADER, S.HEADER, S.HEADER, S.HEADER, S.HEADER]);
  for (const m of Object.values(METHODOLOGIES)) {
    put([m.label, m.priceFormula, m.volumeFormula, m.mixFormula, m.crossFormula],
      [m.id === method.id ? S.BOLD : null, S.CODE, S.CODE, S.CODE, S.CODE]);
  }
  put([]);
  put(["Limitacoes declaradas"], [S.BOLD]);
  put(["1", "O resultado depende da qualidade e da comparabilidade da base enviada."]);
  put(["2", "Preco unitario e derivado de Receita / Quantidade: descontos, devolucoes e bonificacoes afetam esse preco medio."]);
  put(["3", "Itens novos e descontinuados nao possuem par de comparacao e por isso nao geram efeito de preco ou de mix."]);
  put(["4", "Mudanca de granularidade (SKU vs. categoria) altera a fronteira entre Volume e Mix: mix interno a um grupo desaparece quando se agrega antes de calcular. Este simulador sempre calcula no nivel do item e so depois agrega."]);
  put([]);
  put(["Disclaimer"], [S.BOLD]);
  put(["This tool is intended for financial planning and analytical purposes. Results depend on the quality and comparability of the uploaded data. Users should validate accounting definitions and business-specific classifications before relying on the analysis."]);
  put([]);
  put(["Referencias"], [S.BOLD]);
  put(["FTI Consulting", "A Quantifiable Approach to Price Volume Mix Analysis — https://www.fticonsulting.com/insights/white-papers/quantifiable-approach-price-volume-mix-analysis"]);
  put(["Workbook do webinar", "PVM variance analysis webinar (PVM_DATA.xlsx / PVM_calculations.xlsx), abas Basic, Advanced e New method"]);
  put(["Motor", "PVM engine v" + PVM_ENGINE_VERSION]);

  return { name: "Methodology", rows, styles, widths: [30, 96, 46, 46, 40], freeze: 1 };
}

/* --------------------------------------------------------------- API publica */

/**
 * exportToExcel — gera e baixa o .xlsx com as seis abas.
 * @param {Object} ctx { result, items, audit, validation, integrity, parseIssues, dimensionColumns, currencySymbol }
 */
export async function exportToExcel(ctx) {
  const sheets = [
    sheet1Summary(ctx),
    sheet2Revenue(ctx),
    sheet3GrossMargin(ctx),
    sheet4DataQuality(ctx),
    sheet5Mapping(ctx),
    sheet6Methodology(ctx)
  ];
  const bytes = await writeXlsx(sheets, { currencySymbol: ctx.currencySymbol || "" });
  const name = "PVM-" + (ctx.audit.basePeriod || "base") + "-vs-" + (ctx.audit.currentPeriod || "atual") + "-" + stamp() + ".xlsx";
  downloadBlob(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), name);
  return { fileName: name, bytes: bytes.length, sheets: sheets.length };
}

function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/**
 * exportToCsv — detalhe por item. Usa ";" como separador e virgula decimal,
 * que e o que o Excel em pt-BR abre sem assistente de importacao.
 */
export function exportToCsv(ctx) {
  const sheet = sheet2Revenue(ctx);
  const lines = sheet.rows
    .filter(r => r && r.length)
    .map(r => r.map(c => typeof c === "number" ? csvEscape(String(c).replace(".", ",")) : csvEscape(c)).join(";"));
  const content = "﻿" + lines.join("\r\n");
  const name = "PVM-detalhe-" + stamp() + ".csv";
  downloadBlob(new Blob([content], { type: "text/csv;charset=utf-8" }), name);
  return { fileName: name, rows: lines.length };
}

/**
 * exportToJson — resultado completo, para reprocessamento externo.
 * Os Map de efeitos sao convertidos em objetos.
 */
export function exportToJson(ctx) {
  const { result, items, audit, validation } = ctx;
  const effects = {};
  for (const it of items) {
    effects[it.key] = {
      label: it.label, status: it.status, dims: it.dims, uom: it.uom,
      revenueBase: it.rev0, revenueCurrent: it.rev1,
      quantityBase: it.q0, quantityCurrent: it.q1,
      cogsBase: it.cogs0, cogsCurrent: it.cogs1,
      priceBase: it.p0, priceCurrent: it.p1,
      revenue: result.revenue.effects.get(it.key) || null,
      grossMargin: result.grossMargin ? (result.grossMargin.effects.get(it.key) || null) : null
    };
  }
  const payload = {
    schema: "pvm-simulator/analysis@1",
    engineVersion: result.engineVersion,
    exportVersion: PVM_EXPORT_VERSION,
    audit,
    methodology: {
      id: result.methodology,
      label: result.methodologyLabel,
      formulas: {
        price: getMethodology(result.methodology).priceFormula,
        volume: getMethodology(result.methodology).volumeFormula,
        mix: getMethodology(result.methodology).mixFormula,
        cross: getMethodology(result.methodology).crossFormula
      }
    },
    revenue: {
      base: result.revenue.base, current: result.revenue.current, delta: result.revenue.delta,
      buckets: result.revenue.buckets, bridge: stripBridge(result.revenue.bridge),
      stats: result.revenue.stats, counts: result.counts,
      labels: REVENUE_BUCKET_LABELS
    },
    cost: result.cost ? {
      base: result.cost.base, current: result.cost.current,
      buckets: result.cost.buckets, bridge: stripBridge(result.cost.bridge), coverage: result.cost.coverage
    } : null,
    grossMargin: result.grossMargin ? {
      base: result.grossMargin.base, current: result.grossMargin.current, delta: result.grossMargin.delta,
      gmPctBase: result.grossMargin.gmPctBase, gmPctCurrent: result.grossMargin.gmPctCurrent,
      gmPctDeltaPP: result.grossMargin.gmPctDeltaPP,
      buckets: result.grossMargin.buckets, bridge: stripBridge(result.grossMargin.bridge),
      coverage: result.grossMargin.coverage, labels: GM_BUCKET_LABELS
    } : null,
    uom: result.uom,
    validation: validation ? { quality: validation.quality, issues: validation.issues } : null,
    items: effects
  };
  const name = "PVM-" + stamp() + ".json";
  downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }), name);
  return { fileName: name };
}

function stripBridge(b) {
  return {
    base: b.base, current: b.current, delta: b.delta,
    steps: b.steps, effectsSum: b.effectsSum, expected: b.expected,
    residual: b.residual, tolerance: b.tolerance, status: b.status
  };
}

/* ------------------------------------------------------- template para o usuario */

/**
 * exportTemplate — planilha vazia com as colunas esperadas e uma aba de
 * instrucoes. Serve como ponto de partida para quem ainda nao tem a base.
 */
export async function exportTemplate(templateColumns) {
  const cols = templateColumns.map(c => c.name);
  const header = cols.map(() => S.HEADER);
  const example = [
    ["SKU-001", "Produto Alfa", "Categoria A", "2024", 1200, 120000, 72000, "UN", "Cliente 1", "Distribuidor", "Sudeste"],
    ["SKU-001", "Produto Alfa", "Categoria A", "2025", 1320, 145200, 81400, "UN", "Cliente 1", "Distribuidor", "Sudeste"],
    ["SKU-002", "Produto Beta", "Categoria B", "2024", 800, 40000, 27000, "UN", "Cliente 2", "Varejo", "Sul"],
    ["SKU-002", "Produto Beta", "Categoria B", "2025", 700, 38500, 24500, "UN", "Cliente 2", "Varejo", "Sul"]
  ];
  const dataSheet = {
    name: "Dados",
    rows: [cols].concat(example),
    styles: [header],
    widths: [14, 22, 16, 12, 12, 14, 14, 8, 16, 14, 14],
    freeze: 1
  };
  const help = {
    name: "Instrucoes",
    rows: [
      ["Template — Price · Volume · Mix Simulator"],
      [],
      ["Campo", "Obrigatorio", "Observacao"],
      ...templateColumns.map(c => [c.name, c.required ? "SIM" : "opcional", c.note]),
      [],
      ["Como usar"],
      ["1", "Substitua as quatro linhas de exemplo da aba Dados pela sua base."],
      ["2", "Use uma linha por item e por periodo (formato LONG). Repita o SKU em cada periodo."],
      ["3", "O campo Period aceita ano (2025), mes (2025-01), trimestre (2025-Q1), data ou rotulo de cenario (Real, Orcado, Forecast)."],
      ["4", "Se nao houver COGS, a analise de Receita funciona normalmente; a de Margem Bruta fica indisponivel."],
      ["5", "Mantenha a mesma unidade de medida (UOM) dentro de uma analise — o efeito Mix pressupoe quantidades somaveis."],
      [],
      ["Os nomes das colunas nao precisam ser exatamente estes: o simulador tem uma tela de mapeamento de colunas."]
    ],
    styles: [[S.TITLE], [], [S.HEADER, S.HEADER, S.HEADER]],
    widths: [18, 14, 92], freeze: 1
  };
  const bytes = await writeXlsx([dataSheet, help], {});
  downloadBlob(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    "PVM-template.xlsx");
  return { fileName: "PVM-template.xlsx" };
}

/** Relatorio de erros isolado (protocolo 72), em CSV. */
export function exportIssuesCsv(validation) {
  const head = ["Severidade", "Problema", "Detalhe", "Ocorrencias", "Acao sugerida", "Exemplos"];
  const lines = [head.join(";")];
  for (const i of validation.issues) {
    lines.push([i.severity, i.title, i.detail, i.count, i.suggestion, (i.rows || []).join(" | ")]
      .map(csvEscape).join(";"));
  }
  const name = "PVM-ocorrencias-" + stamp() + ".csv";
  downloadBlob(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }), name);
  return { fileName: name };
}
