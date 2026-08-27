/* ============================================================================
   pvm-insights.js — narrativa executiva derivada EXCLUSIVAMENTE dos calculos
   ----------------------------------------------------------------------------
   REGRA ANTIALUCINACAO (protocolo 44)
   Cada frase e montada a partir de um numero que ja existe em `result`. O
   modulo nao tem acesso a internet, nao consulta modelo de linguagem e nao
   possui nenhuma base de conhecimento sobre o negocio do usuario.

   VOCABULARIO PROIBIDO — o simulador nao afirma:
     "demanda", "preferencia do consumidor", "estrategia bem-sucedida",
     "expansao de mercado", "inflacao", "elasticidade"
   porque nenhum desses fatos esta na base. Diz-se "o volume aumentou", nao
   "a demanda aumentou": quantidade vendida nao prova demanda.

   Toda frase carrega `provenance` — formula, numeros de origem, filtro
   aplicado e metodologia — exibido no botao "Why?".
   ========================================================================== */

"use strict";

import { getMethodology, aggregateEffectsBy, topDrivers, safeDiv } from "./pvm-engine.js";

export const PVM_INSIGHTS_VERSION = "1.0.0";

/** Termos que a narrativa nunca deve conter. Usado tambem pelos testes. */
export const FORBIDDEN_TERMS = [
  "demanda", "demand", "preferencia", "preference", "estrategia bem-sucedida",
  "successful strategy", "expansao de mercado", "market expansion", "inflacao",
  "inflation", "elasticidade", "elasticity", "tendencia de mercado", "market trend"
];

const DEFAULT_FMT = {
  money: v => (v == null ? "n/d" : String(Math.round(v))),
  signedMoney: v => (v == null ? "n/d" : (v >= 0 ? "+" : "") + Math.round(v)),
  pct: v => (v == null ? "n/d" : (v * 100).toFixed(1) + "%"),
  signedPct: v => (v == null ? "n/d" : (v >= 0 ? "+" : "") + (v * 100).toFixed(1) + "%"),
  pp: v => (v == null ? "n/d" : (v >= 0 ? "+" : "") + (v * 100).toFixed(1) + " p.p."),
  int: v => (v == null ? "n/d" : String(Math.round(v)))
};

function mk(id, kind, text, provenance) {
  return { id, kind, text, provenance };
}

const BUCKET_PT = {
  price: "Preco", volume: "Volume", mix: "Mix",
  cross: "Interacao preco x volume", new: "Produtos novos",
  discontinued: "Produtos descontinuados", other: "Itens nao comparaveis"
};

/**
 * generateInsights — devolve uma lista ordenada de insights com proveniencia.
 *
 * @param {Object} ctx
 * @param {Object} ctx.result       saida de runAnalysis
 * @param {Array}  ctx.items        itens filtrados usados no calculo
 * @param {Object} [ctx.fmt]        formatadores da UI (money, pct, pp, ...)
 * @param {string} [ctx.filterLabel] descricao dos filtros ativos
 * @param {string} [ctx.dimension]  dimensao usada para concentracao
 * @param {string} [ctx.basePeriod]
 * @param {string} [ctx.currentPeriod]
 */
export function generateInsights(ctx) {
  const { result, items } = ctx;
  const F = Object.assign({}, DEFAULT_FMT, ctx.fmt || {});
  const method = getMethodology(result.methodology);
  const filterLabel = ctx.filterLabel || "nenhum filtro aplicado (base completa)";
  const periods = (ctx.basePeriod || "base") + " -> " + (ctx.currentPeriod || "atual");
  const out = [];
  const rev = result.revenue;
  const b = rev.buckets;

  const prov = (calculation, sources) => ({
    calculation,
    sources,
    filter: filterLabel,
    periods,
    methodology: method.label,
    engine: "PVM engine v" + result.engineVersion
  });

  /* -------------------------------------------------------- 1. variacao total */
  const dir = rev.delta > 0 ? "aumentou" : (rev.delta < 0 ? "caiu" : "ficou estavel");
  out.push(mk("revenue.delta", "headline",
    "A receita " + dir + " " + F.money(Math.abs(rev.delta)) +
    (rev.deltaPct == null ? "" : " (" + F.signedPct(rev.deltaPct) + ")") +
    ", de " + F.money(rev.base) + " para " + F.money(rev.current) + ".",
    prov("dReceita = Receita_atual - Receita_base",
      ["Receita_base = " + rev.base, "Receita_atual = " + rev.current, "dReceita = " + rev.delta])));

  /* ---------------------------------------------- 2. maior driver da variacao */
  const drivers = Object.keys(b)
    .filter(k => Math.abs(b[k]) > 0)
    .sort((x, y) => Math.abs(b[y]) - Math.abs(b[x]));
  if (drivers.length) {
    const k = drivers[0];
    const share = safeDiv(Math.abs(b[k]), Math.abs(rev.delta));
    out.push(mk("revenue.topDriver", "driver",
      "O maior componente isolado foi " + BUCKET_PT[k] + ": " + F.signedMoney(b[k]) +
      (share == null ? "" : ", equivalente a " + F.pct(share) + " do modulo da variacao total") + ".",
      prov(formulaFor(k, method),
        ["Efeito " + BUCKET_PT[k] + " = " + b[k], "dReceita = " + rev.delta])));
  }

  /* --------------------------------------------------------- 3. preco e volume */
  if (b.price !== 0) {
    const priceDir = b.price > 0 ? "adicionou" : "subtraiu";
    const relBase = safeDiv(b.price, rev.base);
    out.push(mk("revenue.price", "price",
      "O efeito Preco " + priceDir + " " + F.money(Math.abs(b.price)) +
      (relBase == null ? "" : " (" + F.signedPct(relBase) + " sobre a receita base") + ")" +
      ". O preco medio ponderado do portfolio passou de " + F.money(rev.avgPriceBase) +
      " para " + F.money(rev.avgPriceCurrent) + " por unidade.",
      prov(method.priceFormula,
        ["Efeito Preco = " + b.price, "Preco medio base = " + rev.avgPriceBase,
         "Preco medio atual = " + rev.avgPriceCurrent])));
  }
  if (b.volume !== 0) {
    const g = rev.stats.growthFactor;
    out.push(mk("revenue.volume", "volume",
      "O efeito Volume foi de " + F.signedMoney(b.volume) + ". A quantidade da populacao comparavel variou " +
      F.signedPct(g - 1) + " (de " + F.int(rev.stats.quantityBase) + " para " + F.int(rev.stats.quantityCurrent) + " unidades).",
      prov(method.volumeFormula + "; g = soma(Q1) / soma(Q0) na populacao comparavel",
        ["Efeito Volume = " + b.volume, "g = " + g,
         "Q0 comparavel = " + rev.stats.quantityBase, "Q1 comparavel = " + rev.stats.quantityCurrent])));
  }

  /* ------------------------------------------------ 4. mix e sua concentracao */
  if (b.mix !== 0) {
    const sign = b.mix > 0 ? "favoravel" : "desfavoravel";
    let text = "O mix de produtos foi " + sign + " em " + F.money(Math.abs(b.mix)) +
      ": a composicao das quantidades deslocou-se para itens de preco base " +
      (b.mix > 0 ? "acima" : "abaixo") + " da media do portfolio (" + F.money(rev.stats.avgPriceBase) + " por unidade).";
    const sources = ["Efeito Mix = " + b.mix, "Preco medio base do portfolio = " + rev.stats.avgPriceBase];

    if (ctx.dimension && items && items.length) {
      const groups = aggregateEffectsBy(items, rev, ctx.dimension);
      const positive = groups.filter(r => r.mix > 0).sort((a, c) => c.mix - a.mix);
      const totalPos = positive.reduce((a, c) => a + c.mix, 0);
      if (positive.length && totalPos > 0) {
        const top = positive[0];
        const sh = safeDiv(top.mix, totalPos);
        text += " " + top.group + " respondeu por " + F.pct(sh) + " da contribuicao positiva de Mix.";
        sources.push(ctx.dimension + " = " + top.group + " -> Mix = " + top.mix,
          "Soma dos Mix positivos = " + totalPos);
      }
    }
    out.push(mk("revenue.mix", "mix", text, prov(method.mixFormula, sources)));
  }

  /* ------------------------------------------------ 5. renovacao de portfolio */
  if (b.new !== 0 || b.discontinued !== 0) {
    const net = b.new + b.discontinued;
    out.push(mk("revenue.portfolio", "portfolio",
      "A renovacao do portfolio contribuiu " + F.signedMoney(net) + ": " +
      result.counts.new + " itens novos adicionaram " + F.money(b.new) + " e " +
      result.counts.discontinued + " itens descontinuados retiraram " + F.money(Math.abs(b.discontinued)) + ".",
      prov("New = soma(Receita_atual) dos itens sem periodo base; Discontinued = -soma(Receita_base) dos itens sem periodo atual",
        ["New = " + b.new, "Discontinued = " + b.discontinued,
         "Itens novos = " + result.counts.new, "Itens descontinuados = " + result.counts.discontinued])));
  }

  /* -------------------------------------------------- 6. itens nao comparaveis */
  if (b.other !== 0) {
    out.push(mk("revenue.other", "caveat",
      "Atencao: " + result.counts["non-comparable"] + " itens ficaram fora de Price/Volume/Mix por nao terem preco unitario definido nos dois periodos. " +
      "A variacao desses itens (" + F.signedMoney(b.other) + ") aparece na ponte como 'Other', sem ser atribuida a nenhum efeito.",
      prov("Other = soma(Receita_atual - Receita_base) dos itens com quantidade nula ou negativa em algum periodo",
        ["Other = " + b.other, "Itens nao comparaveis = " + result.counts["non-comparable"]])));
  }

  /* ---------------------------------------------------------- 7. margem bruta */
  const gm = result.grossMargin;
  if (gm) {
    const gmDir = gm.delta > 0 ? "aumentou" : (gm.delta < 0 ? "caiu" : "ficou estavel");
    out.push(mk("gm.delta", "margin",
      "A margem bruta " + gmDir + " " + F.money(Math.abs(gm.delta)) + ", de " + F.money(gm.base) +
      " para " + F.money(gm.current) + ". Em percentual, de " + F.pct(gm.gmPctBase) + " para " +
      F.pct(gm.gmPctCurrent) + " (" + F.pp(gm.gmPctDeltaPP) + ").",
      prov("GM = Receita - COGS ; GM% = GM / Receita ; d p.p. = GM%_atual - GM%_base",
        ["GM base = " + gm.base, "GM atual = " + gm.current,
         "GM% base = " + gm.gmPctBase, "GM% atual = " + gm.gmPctCurrent])));

    const spread = gm.buckets.sellingPrice + gm.buckets.unitCost;
    out.push(mk("gm.spread", "margin",
      "Preco de venda contribuiu " + F.signedMoney(gm.buckets.sellingPrice) + " e o custo unitario " +
      F.signedMoney(gm.buckets.unitCost) + ", resultando em um efeito liquido de preco-custo de " +
      F.signedMoney(spread) + ".",
      prov("Selling price = soma((P1-P0) x Q1) ; Unit cost = -soma((C1-C0) x Q1)",
        ["Selling price = " + gm.buckets.sellingPrice, "Unit cost = " + gm.buckets.unitCost,
         "Liquido = " + spread])));

    if (!gm.coverage.complete) {
      out.push(mk("gm.coverage", "caveat",
        "A analise de margem cobre " + gm.coverage.items + " de " + gm.coverage.totalItems +
        " itens (" + F.pct(gm.coverage.revenueShare) + " da receita base). Itens sem COGS ficaram de fora — nenhum custo foi arbitrado para completar a ponte.",
        prov("Escopo de GM = itens com COGS informado nos periodos em que existem",
          ["Itens com COGS = " + gm.coverage.items, "Total de itens = " + gm.coverage.totalItems,
           "Participacao na receita base = " + gm.coverage.revenueShare])));
    }
  }

  /* ----------------------------------------------------- 8. drivers extremos */
  if (items && items.length) {
    const t = topDrivers(items, rev, "mix", 1);
    if (t.positive.length && t.negative.length) {
      out.push(mk("revenue.mixDrivers", "driver",
        "Maior contribuicao positiva de Mix: " + t.positive[0].label + " (" + F.signedMoney(t.positive[0].value) +
        "). Maior contribuicao negativa: " + t.negative[0].label + " (" + F.signedMoney(t.negative[0].value) + ").",
        prov(method.mixFormula,
          [t.positive[0].label + " -> Mix = " + t.positive[0].value,
           t.negative[0].label + " -> Mix = " + t.negative[0].value])));
    }
  }

  /* ------------------------------------------------------------- 9. UOM */
  if (result.uom && result.uom.heterogeneous) {
    out.push(mk("data.uom", "caveat",
      result.uom.message + " Unidades encontradas: " + result.uom.units.join(", ") + ".",
      prov("Verificacao de UOM sobre a populacao analisada",
        ["Unidades distintas = " + result.uom.units.length])));
  }

  /* -------------------------------------------------------- 10. reconciliacao */
  out.push(mk("control.reconciliation", "control",
    "Controle de reconciliacao: a ponte de receita fechou com residuo de " + rev.bridge.residual.toExponential(2) +
    " (tolerancia " + rev.bridge.tolerance.toExponential(2) + ") — " + rev.bridge.status + "." +
    (gm ? " Ponte de margem bruta: " + gm.bridge.status + "." : ""),
    prov("Residuo = Receita_atual - (Receita_base + soma dos efeitos); tolerancia = max(0,01; |Receita_atual| x 1e-9)",
      ["Residuo receita = " + rev.bridge.residual, "Tolerancia = " + rev.bridge.tolerance]
        .concat(gm ? ["Residuo margem = " + gm.bridge.residual] : []))));

  return out;
}

function formulaFor(bucket, method) {
  switch (bucket) {
    case "price": return method.priceFormula;
    case "volume": return method.volumeFormula;
    case "mix": return method.mixFormula;
    case "cross": return method.crossFormula;
    case "new": return "New = soma(Receita_atual) dos itens sem periodo base";
    case "discontinued": return "Discontinued = -soma(Receita_base) dos itens sem periodo atual";
    default: return "Other = soma(dReceita) dos itens sem preco unitario definido";
  }
}

/**
 * auditNarrative — verificacao automatica de que nenhum insight usou vocabulario
 * causal proibido. Roda nos testes e tambem em runtime (o painel exibe o
 * resultado), para que a regra nao dependa de disciplina humana.
 */
export function auditNarrative(insights) {
  const violations = [];
  for (const ins of insights) {
    const norm = ins.text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const term of FORBIDDEN_TERMS) {
      if (norm.includes(term)) violations.push({ id: ins.id, term });
    }
  }
  return { pass: violations.length === 0, violations };
}
