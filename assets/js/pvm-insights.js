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

const BUCKET_LABEL = {
  price: ["Preço", "Price"], volume: ["Volume", "Volume"], mix: ["Mix", "Mix"],
  cross: ["Interação preço × volume", "Price × volume interaction"],
  new: ["Produtos novos", "New products"],
  discontinued: ["Produtos descontinuados", "Discontinued products"],
  other: ["Itens não comparáveis", "Non-comparable items"]
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
  /* O portfólio é bilíngue. A narrativa recebe o tradutor do app; sem ele,
     o módulo continua funcionando em português (é o caso dos testes em Node). */
  const t = typeof ctx.t === "function" ? ctx.t : ((pt) => pt);
  const method = getMethodology(result.methodology);
  const filterLabel = ctx.filterLabel || t("nenhum filtro aplicado (base completa)", "no filter applied (full dataset)");
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
  const dir = t(rev.delta > 0 ? "aumentou" : (rev.delta < 0 ? "caiu" : "ficou estável"),
                rev.delta > 0 ? "rose by" : (rev.delta < 0 ? "fell by" : "was flat at"));
  out.push(mk("revenue.delta", "headline",
    t("A receita ", "Revenue ") + dir + " " + F.money(Math.abs(rev.delta)) +
    (rev.deltaPct == null ? "" : " (" + F.signedPct(rev.deltaPct) + ")") +
    t(", de ", ", from ") + F.money(rev.base) + t(" para ", " to ") + F.money(rev.current) + ".",
    prov("dReceita = Receita_atual - Receita_base",
      ["Receita_base = " + rev.base, "Receita_atual = " + rev.current, "dReceita = " + rev.delta])));

  /* ---------------------------------------------- 2. maior driver da variacao */
  const drivers = Object.keys(b)
    .filter(k => Math.abs(b[k]) > 0)
    .sort((x, y) => Math.abs(b[y]) - Math.abs(b[x]));
  if (drivers.length) {
    const k = drivers[0];
    const share = safeDiv(Math.abs(b[k]), Math.abs(rev.delta));
    const kLabel = t(BUCKET_LABEL[k][0], BUCKET_LABEL[k][1]);
    out.push(mk("revenue.topDriver", "driver",
      t("O maior componente isolado foi ", "The single largest component was ") + kLabel + ": " + F.signedMoney(b[k]) +
      (share == null ? "" : t(", equivalente a ", ", equal to ") + F.pct(share) +
        t(" do módulo da variação total", " of the absolute total variance")) + ".",
      prov(formulaFor(k, method),
        [kLabel + " effect = " + b[k], "dRevenue = " + rev.delta])));
  }

  /* --------------------------------------------------------- 3. preco e volume */
  if (b.price !== 0) {
    const priceDir = t(b.price > 0 ? "adicionou" : "subtraiu", b.price > 0 ? "added" : "removed");
    const relBase = safeDiv(b.price, rev.base);
    out.push(mk("revenue.price", "price",
      t("O efeito Preço ", "The Price effect ") + priceDir + " " + F.money(Math.abs(b.price)) +
      (relBase == null ? "" : " (" + F.signedPct(relBase) + t(" sobre a receita base", " of base revenue") + ")") +
      t(". O preço médio ponderado do portfólio passou de ",
        ". The portfolio weighted average price moved from ") + F.money(rev.avgPriceBase) +
      t(" para ", " to ") + F.money(rev.avgPriceCurrent) + t(" por unidade.", " per unit."),
      prov(method.priceFormula,
        ["Price effect = " + b.price, "Average base price = " + rev.avgPriceBase,
         "Average current price = " + rev.avgPriceCurrent])));
  }
  if (b.volume !== 0) {
    const g = rev.stats.growthFactor;
    out.push(mk("revenue.volume", "volume",
      t("O efeito Volume foi de ", "The Volume effect was ") + F.signedMoney(b.volume) +
      t(". A quantidade da população comparável variou ", ". Quantity in the comparable population moved ") +
      F.signedPct(g - 1) + t(" (de ", " (from ") + F.int(rev.stats.quantityBase) + t(" para ", " to ") +
      F.int(rev.stats.quantityCurrent) + t(" unidades).", " units)."),
      prov(method.volumeFormula + "; g = sum(Q1) / sum(Q0) over the comparable population",
        ["Volume effect = " + b.volume, "g = " + g,
         "Comparable Q0 = " + rev.stats.quantityBase, "Comparable Q1 = " + rev.stats.quantityCurrent])));
  }

  /* ------------------------------------------------ 4. mix e sua concentracao */
  if (b.mix !== 0) {
    const sign = t(b.mix > 0 ? "favorável" : "desfavorável", b.mix > 0 ? "favourable" : "unfavourable");
    let text = t("O mix de produtos foi ", "The product mix was ") + sign +
      t(" em ", " by ") + F.money(Math.abs(b.mix)) +
      t(": a composição das quantidades deslocou-se para itens de preço base ",
        ": the quantity composition shifted towards items whose base price is ") +
      t(b.mix > 0 ? "acima" : "abaixo", b.mix > 0 ? "above" : "below") +
      t(" da média do portfólio (", " the portfolio average (") + F.money(rev.stats.avgPriceBase) +
      t(" por unidade).", " per unit).");
    const sources = ["Mix effect = " + b.mix, "Portfolio average base price = " + rev.stats.avgPriceBase];

    if (ctx.dimension && items && items.length) {
      const groups = aggregateEffectsBy(items, rev, ctx.dimension);
      const positive = groups.filter(r => r.mix > 0).sort((a, c) => c.mix - a.mix);
      const totalPos = positive.reduce((a, c) => a + c.mix, 0);
      if (positive.length && totalPos > 0) {
        const top = positive[0];
        const sh = safeDiv(top.mix, totalPos);
        text += " " + top.group + t(" respondeu por ", " accounted for ") + F.pct(sh) +
          t(" da contribuição positiva de Mix.", " of the positive Mix contribution.");
        sources.push(ctx.dimension + " = " + top.group + " -> Mix = " + top.mix,
          "Sum of positive Mix = " + totalPos);
      }
    }
    out.push(mk("revenue.mix", "mix", text, prov(method.mixFormula, sources)));
  }

  /* ------------------------------------------------ 5. renovacao de portfolio */
  if (b.new !== 0 || b.discontinued !== 0) {
    const net = b.new + b.discontinued;
    out.push(mk("revenue.portfolio", "portfolio",
      t("A renovação do portfólio contribuiu ", "Portfolio turnover contributed ") + F.signedMoney(net) + ": " +
      result.counts.new + t(" itens novos adicionaram ", " new items added ") + F.money(b.new) +
      t(" e ", " and ") + result.counts.discontinued +
      t(" itens descontinuados retiraram ", " discontinued items removed ") + F.money(Math.abs(b.discontinued)) + ".",
      prov("New = sum(Revenue_current) of items absent from the base period; Discontinued = -sum(Revenue_base) of items absent from the current period",
        ["New = " + b.new, "Discontinued = " + b.discontinued,
         "New items = " + result.counts.new, "Discontinued items = " + result.counts.discontinued])));
  }

  /* -------------------------------------------------- 6. itens nao comparaveis */
  if (b.other !== 0) {
    out.push(mk("revenue.other", "caveat",
      t("Atenção: ", "Note: ") + result.counts["non-comparable"] +
      t(" itens ficaram fora de Price/Volume/Mix por não terem preço unitário definido nos dois períodos. A variação desses itens (",
        " items fell outside Price/Volume/Mix because their unit price is undefined in one of the periods. Their variance (") +
      F.signedMoney(b.other) +
      t(") aparece na ponte como 'Other', sem ser atribuída a nenhum efeito.",
        ") appears in the bridge as 'Other', attributed to no effect."),
      prov("Other = sum(Revenue_current - Revenue_base) of items with zero or negative quantity in either period",
        ["Other = " + b.other, "Non-comparable items = " + result.counts["non-comparable"]])));
  }

  /* ---------------------------------------------------------- 7. margem bruta */
  const gm = result.grossMargin;
  if (gm) {
    const gmDir = t(gm.delta > 0 ? "aumentou" : (gm.delta < 0 ? "caiu" : "ficou estável"),
                    gm.delta > 0 ? "rose by" : (gm.delta < 0 ? "fell by" : "was flat at"));
    out.push(mk("gm.delta", "margin",
      t("A margem bruta ", "Gross margin ") + gmDir + " " + F.money(Math.abs(gm.delta)) +
      t(", de ", ", from ") + F.money(gm.base) + t(" para ", " to ") + F.money(gm.current) +
      t(". Em percentual, de ", ". In percentage terms, from ") + F.pct(gm.gmPctBase) +
      t(" para ", " to ") + F.pct(gm.gmPctCurrent) + " (" + F.pp(gm.gmPctDeltaPP) + ").",
      prov("GM = Revenue - COGS ; GM% = GM / Revenue ; d p.p. = GM%_current - GM%_base",
        ["Base GM = " + gm.base, "Current GM = " + gm.current,
         "Base GM% = " + gm.gmPctBase, "Current GM% = " + gm.gmPctCurrent])));

    const spread = gm.buckets.sellingPrice + gm.buckets.unitCost;
    out.push(mk("gm.spread", "margin",
      t("Preço de venda contribuiu ", "Selling price contributed ") + F.signedMoney(gm.buckets.sellingPrice) +
      t(" e o custo unitário ", " and unit cost ") + F.signedMoney(gm.buckets.unitCost) +
      t(", resultando em um efeito líquido de preço-custo de ", ", for a net price-cost effect of ") +
      F.signedMoney(spread) + ".",
      prov("Selling price = sum((P1-P0) x Q1) ; Unit cost = -sum((C1-C0) x Q1)",
        ["Selling price = " + gm.buckets.sellingPrice, "Unit cost = " + gm.buckets.unitCost,
         "Net = " + spread])));

    if (!gm.coverage.complete) {
      out.push(mk("gm.coverage", "caveat",
        t("A análise de margem cobre ", "The margin analysis covers ") + gm.coverage.items +
        t(" de ", " of ") + gm.coverage.totalItems + t(" itens (", " items (") +
        F.pct(gm.coverage.revenueShare) +
        t(" da receita base). Itens sem COGS ficaram de fora — nenhum custo foi arbitrado para completar a ponte.",
          " of base revenue). Items without COGS were left out — no cost was assumed to close the bridge."),
        prov("GM scope = items with COGS reported in the periods where they exist",
          ["Items with COGS = " + gm.coverage.items, "Total items = " + gm.coverage.totalItems,
           "Share of base revenue = " + gm.coverage.revenueShare])));
    }
  }

  /* ----------------------------------------------------- 8. drivers extremos */
  if (items && items.length) {
    const d = topDrivers(items, rev, "mix", 1);
    if (d.positive.length && d.negative.length) {
      out.push(mk("revenue.mixDrivers", "driver",
        t("Maior contribuição positiva de Mix: ", "Largest positive Mix contribution: ") + d.positive[0].label +
        " (" + F.signedMoney(d.positive[0].value) + ")." +
        t(" Maior contribuição negativa: ", " Largest negative contribution: ") + d.negative[0].label +
        " (" + F.signedMoney(d.negative[0].value) + ").",
        prov(method.mixFormula,
          [d.positive[0].label + " -> Mix = " + d.positive[0].value,
           d.negative[0].label + " -> Mix = " + d.negative[0].value])));
    }
  }

  /* ------------------------------------------------------------- 9. UOM */
  if (result.uom && result.uom.heterogeneous) {
    out.push(mk("data.uom", "caveat",
      result.uom.message + t(" Unidades encontradas: ", " Units found: ") + result.uom.units.join(", ") + ".",
      prov("UOM check over the analysed population",
        ["Distinct units = " + result.uom.units.length])));
  }

  /* -------------------------------------------------------- 10. reconciliacao */
  out.push(mk("control.reconciliation", "control",
    t("Controle de reconciliação: a ponte de receita fechou com resíduo de ",
      "Reconciliation control: the revenue bridge closed with a residual of ") + rev.bridge.residual.toExponential(2) +
    t(" (tolerância ", " (tolerance ") + rev.bridge.tolerance.toExponential(2) + ") — " + rev.bridge.status + "." +
    (gm ? t(" Ponte de margem bruta: ", " Gross margin bridge: ") + gm.bridge.status + "." : ""),
    prov("Residual = Revenue_current - (Revenue_base + sum of effects); tolerance = max(0.01; |Revenue_current| x 1e-9)",
      ["Revenue residual = " + rev.bridge.residual, "Tolerance = " + rev.bridge.tolerance]
        .concat(gm ? ["Margin residual = " + gm.bridge.residual] : []))));

  return out;
}

function formulaFor(bucket, method) {
  switch (bucket) {
    case "price": return method.priceFormula;
    case "volume": return method.volumeFormula;
    case "mix": return method.mixFormula;
    case "cross": return method.crossFormula;
    case "new": return "New = sum(Revenue_current) of items absent from the base period";
    case "discontinued": return "Discontinued = -sum(Revenue_base) of items absent from the current period";
    default: return "Other = sum(dRevenue) of items with no defined unit price";
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
