/* ============================================================================
   pvm-engine.test.js — testes matematicos do motor PVM
   ----------------------------------------------------------------------------
   Cobertura:
     A..I   casos de sanidade do protocolo (so preco, so volume, so mix, ...)
     edge   quantidade zero, receita zero, negativos, SKU duplicado, UOM,
            base vazia, 1 linha, 100k linhas, acentos, virgula decimal
     ident  Variacao de receita  = soma dos efeitos de receita
            Variacao de margem   = soma dos efeitos de margem
            em TODAS as quatro convencoes metodologicas
     ref    reproducao dos numeros do workbook de referencia do webinar
   ========================================================================== */

"use strict";

import { describe, expect } from "./harness.js";
import {
  PVM_ENGINE_VERSION, METHODOLOGIES, STATUS,
  aggregateItems, classifySku, populationStats, safeDiv, kahanSum,
  calculateWeightedAveragePrice, calculateRevenuePVM, calculateCostPVM,
  calculateGrossMarginPVM, reconcileBridge, runAnalysis, compareMethodologies,
  filterItems, distinctValues, aggregateEffectsBy, topDrivers, mixMatrix,
  checkUnitsOfMeasure, reconciliationTolerance, calculatePriceEffect,
  calculateVolumeEffect, calculateMixEffect, calculateCrossEffect
} from "../assets/js/pvm-engine.js";

const METHOD_IDS = Object.keys(METHODOLOGIES);

/* ---------------------------------------------------------------- helpers */

/** Constroi itens a partir de uma lista compacta [key, q0, p0, q1, p1, c0?, c1?]. */
function build(spec, extra) {
  const rows = [];
  for (const s of spec) {
    const [key, q0, p0, q1, p1, c0, c1] = s;
    const dims = (extra && extra.dims && extra.dims[key]) || {};
    const uom = (extra && extra.uom && extra.uom[key]) || null;
    if (q0 != null) {
      rows.push({
        key, label: key, period: "P0", quantity: q0, revenue: q0 * p0,
        cogs: c0 == null ? null : q0 * c0, uom, dims
      });
    }
    if (q1 != null) {
      rows.push({
        key, label: key, period: "P1", quantity: q1, revenue: q1 * p1,
        cogs: c1 == null ? null : q1 * c1, uom, dims
      });
    }
  }
  const dimNames = extra && extra.dimNames ? extra.dimNames : [];
  return aggregateItems(rows, { basePeriod: "P0", currentPeriod: "P1", dimensions: dimNames });
}

function bridgeSum(buckets) {
  return kahanSum(Object.values(buckets));
}

/* =========================================================== 1. UTILITARIOS */

describe("Utilitarios numericos", ({ it }) => {
  it("safeDiv nunca devolve Infinity nem NaN", () => {
    expect(safeDiv(10, 0)).toBeNull();
    expect(safeDiv(0, 0)).toBeNull();
    expect(safeDiv(null, 5)).toBeNull();
    expect(safeDiv(NaN, 5)).toBeNull();
    expect(safeDiv(Infinity, 5)).toBeNull();
    expect(safeDiv(10, 4)).toBe(2.5);
  });

  it("preco medio ponderado usa receita/quantidade, nao media de precos", () => {
    // 1 unidade a 100 e 999 unidades a 1 -> media ponderada ~1.099, nao 50.5
    const p = calculateWeightedAveragePrice(100 + 999, 1 + 999);
    expect(p).toBeCloseTo(1.099, 1e-9);
  });

  it("kahanSum e estavel com parcelas de ordens muito diferentes", () => {
    const vals = [1e16, 1, -1e16, 1, 1, 1];
    expect(kahanSum(vals)).toBe(4, "somatorio compensado preserva as parcelas pequenas");
    // a soma ingenua perde a parcela absorvida por 1e16 e devolve 3
    const naive = vals.reduce((a, b) => a + b, 0);
    expect(naive).toBe(3, "soma ingenua perde precisao");
    expect(naive).toBeLessThan(4);
  });

  it("tolerancia de reconciliacao escala com o valor", () => {
    expect(reconciliationTolerance(0)).toBe(0.01);
    expect(reconciliationTolerance(1e12)).toBeCloseTo(1000, 1e-6);
  });
});

/* ======================================================== 2. CLASSIFICACAO */

describe("Classificacao de itens", ({ it }) => {
  it("Active exige presenca e quantidade positiva nos dois periodos", () => {
    expect(classifySku({ q0: 10, q1: 12, rev0: 100, rev1: 130 })).toBe(STATUS.ACTIVE);
  });
  it("New: ausente no base", () => {
    expect(classifySku({ q0: 0, q1: 12, rev0: 0, rev1: 130 })).toBe(STATUS.NEW);
  });
  it("Discontinued: ausente no atual", () => {
    expect(classifySku({ q0: 10, q1: 0, rev0: 100, rev1: 0 })).toBe(STATUS.DISCONTINUED);
  });
  it("Non-comparable: presente nos dois, mas sem quantidade positiva", () => {
    expect(classifySku({ q0: 0, q1: 5, rev0: 90, rev1: 60 })).toBe(STATUS.NON_COMPARABLE);
    expect(classifySku({ q0: -3, q1: 5, rev0: -90, rev1: 60 })).toBe(STATUS.NON_COMPARABLE);
  });
  it("Empty: sem movimento", () => {
    expect(classifySku({ q0: 0, q1: 0, rev0: 0, rev1: 0 })).toBe(STATUS.EMPTY);
  });
  it("g e Pm0 usam somente a populacao comparavel", () => {
    const { items } = build([
      ["A", 100, 10, 150, 10],
      ["NOVO", null, null, 500, 3],
      ["SAIU", 400, 2, null, null]
    ]);
    const st = populationStats(items);
    expect(st.quantityBase).toBe(100, "novos/descontinuados nao entram em Q0");
    expect(st.quantityCurrent).toBe(150, "novos/descontinuados nao entram em Q1");
    expect(st.growthFactor).toBeCloseTo(1.5);
    expect(st.avgPriceBase).toBeCloseTo(10);
  });
});

/* ================================================ 3. CASOS DE SANIDADE A-I */

describe("Casos de sanidade (protocolo 60)", ({ it }) => {
  it("Caso A — so o preco muda: Price != 0, Volume = 0, Mix = 0", () => {
    for (const m of METHOD_IDS) {
      const { items } = build([["A", 100, 10, 100, 12], ["B", 200, 5, 200, 6]]);
      const r = calculateRevenuePVM(items, { methodology: m });
      expect(r.buckets.price).toBeGreaterThan(0, m);
      expect(r.buckets.volume).toBeCloseTo(0, 1e-9, m + " volume");
      expect(r.buckets.mix).toBeCloseTo(0, 1e-9, m + " mix");
      expect(r.bridge.residual).toBeCloseTo(0, r.bridge.tolerance, m + " ponte");
    }
  });

  it("Caso B — volume total cresce proporcionalmente: Price = 0, Volume != 0, Mix ~ 0", () => {
    for (const m of METHOD_IDS) {
      const { items } = build([["A", 100, 10, 120, 10], ["B", 200, 5, 240, 5]]);
      const r = calculateRevenuePVM(items, { methodology: m });
      expect(r.buckets.price).toBeCloseTo(0, 1e-9, m + " price");
      expect(r.buckets.volume).toBeCloseTo(400, 1e-6, m + " volume");  // 2000 * 0.2
      expect(r.buckets.mix).toBeCloseTo(0, 1e-6, m + " mix total");
      expect(r.bridge.residual).toBeCloseTo(0, r.bridge.tolerance, m);
    }
  });

  it("Caso C — mesmo volume total, composicao muda: Volume ~ 0, Mix != 0", () => {
    for (const m of METHOD_IDS) {
      // total de 300 unidades nos dois periodos; migra do item barato para o caro
      const { items } = build([["CARO", 100, 20, 150, 20], ["BARATO", 200, 5, 150, 5]]);
      const r = calculateRevenuePVM(items, { methodology: m });
      expect(r.buckets.volume).toBeCloseTo(0, 1e-6, m + " volume");
      expect(r.buckets.mix).toBeCloseTo(750, 1e-6, m + " mix");  // +50*20 -50*5
      expect(r.bridge.residual).toBeCloseTo(0, r.bridge.tolerance, m);
    }
  });

  it("Caso D — nada muda: todos os efeitos zero", () => {
    for (const m of METHOD_IDS) {
      const { items } = build([["A", 100, 10, 100, 10], ["B", 50, 3, 50, 3]]);
      const r = calculateRevenuePVM(items, { methodology: m });
      expect(r.delta).toBeCloseTo(0, 1e-9, m);
      for (const k of ["price", "volume", "mix", "cross", "new", "discontinued", "other"]) {
        expect(r.buckets[k]).toBeCloseTo(0, 1e-9, m + " " + k);
      }
    }
  });

  it("Caso E — SKU novo: reconciliacao perfeita e efeito isolado em New", () => {
    for (const m of METHOD_IDS) {
      const { items } = build([["A", 100, 10, 100, 10], ["NOVO", null, null, 40, 25]]);
      const r = calculateRevenuePVM(items, { methodology: m });
      expect(r.buckets.new).toBeCloseTo(1000, 1e-9, m);
      expect(r.buckets.price).toBeCloseTo(0, 1e-9, m);
      expect(r.buckets.mix).toBeCloseTo(0, 1e-9, m + " novo nao gera mix");
      expect(r.delta).toBeCloseTo(bridgeSum(r.buckets), r.bridge.tolerance, m);
    }
  });

  it("Caso F — SKU descontinuado: reconciliacao perfeita e efeito isolado", () => {
    for (const m of METHOD_IDS) {
      const { items } = build([["A", 100, 10, 100, 10], ["SAIU", 40, 25, null, null]]);
      const r = calculateRevenuePVM(items, { methodology: m });
      expect(r.buckets.discontinued).toBeCloseTo(-1000, 1e-9, m);
      expect(r.buckets.mix).toBeCloseTo(0, 1e-9, m);
      expect(r.delta).toBeCloseTo(bridgeSum(r.buckets), r.bridge.tolerance, m);
    }
  });

  it("Caso G — preco e volume mudam juntos: ponte fecha em todas as convencoes", () => {
    const spec = [["A", 100, 10, 130, 11.5], ["B", 200, 5, 170, 4.2], ["C", 50, 30, 65, 31]];
    for (const m of METHOD_IDS) {
      const { items } = build(spec);
      const r = calculateRevenuePVM(items, { methodology: m });
      expect(r.bridge.pass).toBeTrue(m);
      expect(r.delta).toBeCloseTo(bridgeSum(r.buckets), r.bridge.tolerance, m);
    }
  });

  it("Caso H — mix favoravel: itens mais caros ganham participacao -> Mix > 0", () => {
    for (const m of METHOD_IDS) {
      const { items } = build([["CARO", 100, 20, 200, 20], ["BARATO", 300, 4, 300, 4]]);
      const r = calculateRevenuePVM(items, { methodology: m });
      expect(r.buckets.mix).toBeGreaterThan(0, m);
    }
  });

  it("Caso I — mix desfavoravel: itens mais baratos ganham participacao -> Mix < 0", () => {
    for (const m of METHOD_IDS) {
      const { items } = build([["CARO", 100, 20, 100, 20], ["BARATO", 300, 4, 600, 4]]);
      const r = calculateRevenuePVM(items, { methodology: m });
      expect(r.buckets.mix).toBeLessThan(0, m);
    }
  });
});

/* ===================================================== 4. TESTE DE IDENTIDADE */

describe("Identidade da ponte (protocolos 58 e 59)", ({ it }) => {
  const spec = [
    ["A", 1000, 12.5, 1180, 13.2, 8.1, 8.9],
    ["B", 4200, 3.4, 3900, 3.3, 2.2, 2.25],
    ["C", 180, 88.0, 240, 84.5, 61.0, 60.2],
    ["D", 9500, 0.85, 12100, 0.91, 0.62, 0.66],
    ["NOVO", null, null, 700, 15.5, null, 9.4],
    ["SAIU", 320, 22.0, null, null, 14.0, null]
  ];

  it("Receita: base + soma dos efeitos = atual, nas quatro convencoes", () => {
    for (const m of METHOD_IDS) {
      const { items } = build(spec);
      const r = calculateRevenuePVM(items, { methodology: m });
      const total = r.base + r.buckets.price + r.buckets.volume + r.buckets.mix +
        r.buckets.cross + r.buckets.new + r.buckets.discontinued + r.buckets.other;
      expect(total).toBeCloseTo(r.current, r.bridge.tolerance, m);
      expect(r.bridge.status).toBe("PASS", m);
    }
  });

  it("COGS: base + soma dos efeitos = atual", () => {
    for (const m of METHOD_IDS) {
      const { items } = build(spec);
      const c = calculateCostPVM(items, { methodology: m });
      expect(c.base + bridgeSum(c.buckets)).toBeCloseTo(c.current, c.bridge.tolerance, m);
      expect(c.bridge.status).toBe("PASS", m);
    }
  });

  it("Margem bruta: base + soma dos efeitos = atual", () => {
    for (const m of METHOD_IDS) {
      const { items } = build(spec);
      const gm = calculateGrossMarginPVM(items, { methodology: m });
      const total = gm.base + gm.buckets.sellingPrice + gm.buckets.unitCost + gm.buckets.volume +
        gm.buckets.salesMix + gm.buckets.costMix + gm.buckets.cross +
        gm.buckets.new + gm.buckets.discontinued + gm.buckets.other;
      expect(total).toBeCloseTo(gm.current, gm.bridge.tolerance, m);
      expect(gm.bridge.status).toBe("PASS", m);
    }
  });

  it("Margem bruta e exatamente a diferenca entre a ponte de receita e a de COGS", () => {
    const { items } = build(spec);
    const gm = calculateGrossMarginPVM(items, {});
    expect(gm.buckets.sellingPrice).toBeCloseTo(gm.revenue.buckets.price, 1e-9);
    expect(gm.buckets.unitCost).toBeCloseTo(-gm.cost.buckets.price, 1e-9);
    expect(gm.buckets.volume).toBeCloseTo(gm.revenue.buckets.volume - gm.cost.buckets.volume, 1e-9);
    expect(gm.buckets.salesMix).toBeCloseTo(gm.revenue.buckets.mix, 1e-9);
    expect(gm.buckets.costMix).toBeCloseTo(-gm.cost.buckets.mix, 1e-9);
  });

  it("reconcileBridge confirma a identidade de forma independente", () => {
    const { items } = build(spec);
    const r = calculateRevenuePVM(items, {});
    const check = reconcileBridge(r.base, r.current, r.buckets);
    expect(check.pass).toBeTrue();
    expect(check.residual).toBeCloseTo(0, check.tolerance);
  });

  it("Mix nunca e um plug: recalculado pela formula, bate com o total do motor", () => {
    const { items } = build(spec);
    const stats = populationStats(items);
    const g = stats.growthFactor;
    // formula explicita da convencao FTI, item a item
    let mix = 0;
    for (const it of items) {
      if (it.status !== STATUS.ACTIVE) continue;
      mix += it.p0 * (it.q1 - g * it.q0);
    }
    const r = calculateRevenuePVM(items, { methodology: "fti" });
    expect(r.buckets.mix).toBeCloseTo(mix, 1e-6);
  });

  it("Formulacao centrada da FTI (P0 - Pm0) da o mesmo total de Mix", () => {
    const { items } = build(spec);
    const stats = populationStats(items);
    const g = stats.growthFactor, pm0 = stats.avgPriceBase;
    let centered = 0;
    for (const it of items) {
      if (it.status !== STATUS.ACTIVE) continue;
      centered += (it.p0 - pm0) * (it.q1 - g * it.q0);
    }
    const r = calculateRevenuePVM(items, { methodology: "fti" });
    expect(centered).toBeCloseTo(r.buckets.mix, 1e-6);
  });

  it("FTI-style e a convencao de preco medio dao os MESMOS totais de Volume e Mix", () => {
    const { items } = build(spec);
    const a = calculateRevenuePVM(items, { methodology: "fti" });
    const b = calculateRevenuePVM(items, { methodology: "portfolioAvg" });
    expect(a.buckets.volume).toBeCloseTo(b.buckets.volume, 1e-6);
    expect(a.buckets.mix).toBeCloseTo(b.buckets.mix, 1e-6);
    expect(a.buckets.price).toBeCloseTo(b.buckets.price, 1e-9);
  });

  it("Volume total = Receita base comparavel x (g - 1)", () => {
    const { items } = build(spec);
    const st = populationStats(items);
    const r = calculateRevenuePVM(items, { methodology: "fti" });
    expect(r.buckets.volume).toBeCloseTo(st.revenueBase * (st.growthFactor - 1), 1e-6);
  });

  it("Convencao Cross isola exatamente a interacao (P1-P0)(Q1-Q0)", () => {
    const { items } = build(spec);
    const r = calculateRevenuePVM(items, { methodology: "cross" });
    let cross = 0;
    for (const it of items) {
      if (it.status !== STATUS.ACTIVE) continue;
      cross += (it.p1 - it.p0) * (it.q1 - it.q0);
    }
    expect(r.buckets.cross).toBeCloseTo(cross, 1e-6);
  });

  it("Todas as convencoes concordam no total (a variacao nao depende da convencao)", () => {
    const { items } = build(spec);
    const rows = compareMethodologies(items);
    for (const row of rows) {
      expect(row.pass).toBeTrue(row.id);
      const sum = bridgeSum(row.buckets);
      expect(sum).toBeCloseTo(rows[0].buckets ? bridgeSum(rows[0].buckets) : sum, 1e-6, row.id);
    }
  });

  it("Efeitos elementares expostos batem com a decomposicao completa", () => {
    const { items } = build([["A", 100, 10, 130, 11.5], ["B", 200, 5, 170, 4.2]]);
    const st = populationStats(items);
    const it = items.find(x => x.key === "A");
    const price = calculatePriceEffect(it.p0, it.p1, it.q0, it.q1, "fti");
    const vol = calculateVolumeEffect(it.p0, st.avgPriceBase, it.q0, it.q1, st.growthFactor, "fti");
    const mix = calculateMixEffect(it.p0, st.avgPriceBase, it.q0, it.q1, st.growthFactor, "fti");
    const cross = calculateCrossEffect(it.p0, it.p1, it.q0, it.q1, "fti");
    const r = calculateRevenuePVM(items, { methodology: "fti" });
    const e = r.effects.get("A");
    expect(e.price).toBeCloseTo(price, 1e-9);
    expect(e.volume).toBeCloseTo(vol, 1e-9);
    expect(e.mix).toBeCloseTo(mix, 1e-9);
    expect(e.cross).toBeCloseTo(cross, 1e-9);
    expect(price + vol + mix + cross).toBeCloseTo(it.rev1 - it.rev0, 1e-6, "identidade item a item");
  });
});

/* ============================================================ 5. EDGE CASES */

describe("Edge cases (protocolo 61)", ({ it }) => {
  it("Quantity = 0 nos dois periodos com receita: item vira nao comparavel, sem NaN", () => {
    const rows = [
      { key: "X", period: "P0", quantity: 0, revenue: 500 },
      { key: "X", period: "P1", quantity: 0, revenue: 800 },
      { key: "A", period: "P0", quantity: 100, revenue: 1000 },
      { key: "A", period: "P1", quantity: 110, revenue: 1155 }
    ];
    const { items } = aggregateItems(rows, { basePeriod: "P0", currentPeriod: "P1" });
    const r = calculateRevenuePVM(items, {});
    expect(items.find(i => i.key === "X").status).toBe(STATUS.NON_COMPARABLE);
    expect(r.buckets.other).toBeCloseTo(300, 1e-9);
    for (const v of Object.values(r.buckets)) expect(v).toBeFinite();
    expect(r.bridge.pass).toBeTrue();
  });

  it("Receita zero com quantidade positiva nao quebra o preco medio", () => {
    const rows = [
      { key: "BONIF", period: "P0", quantity: 500, revenue: 0 },
      { key: "BONIF", period: "P1", quantity: 400, revenue: 0 },
      { key: "A", period: "P0", quantity: 100, revenue: 1000 },
      { key: "A", period: "P1", quantity: 110, revenue: 1155 }
    ];
    const { items } = aggregateItems(rows, { basePeriod: "P0", currentPeriod: "P1" });
    const r = calculateRevenuePVM(items, {});
    expect(r.stats.avgPriceBase).toBeFinite();
    expect(r.bridge.pass).toBeTrue();
    for (const v of Object.values(r.buckets)) expect(v).toBeFinite();
  });

  it("Receita e quantidade negativas (devolucoes) sao mantidas e reconciliam", () => {
    const rows = [
      { key: "DEV", period: "P0", quantity: -20, revenue: -400 },
      { key: "DEV", period: "P1", quantity: -35, revenue: -700 },
      { key: "A", period: "P0", quantity: 100, revenue: 1000 },
      { key: "A", period: "P1", quantity: 130, revenue: 1430 }
    ];
    const { items } = aggregateItems(rows, { basePeriod: "P0", currentPeriod: "P1" });
    const r = calculateRevenuePVM(items, {});
    expect(items.find(i => i.key === "DEV").status).toBe(STATUS.NON_COMPARABLE);
    expect(r.bridge.pass).toBeTrue();
    expect(r.base).toBeCloseTo(600, 1e-9);
    expect(r.current).toBeCloseTo(730, 1e-9);
  });

  it("COGS ausente em parte da base: GM cobre so a populacao com custo", () => {
    const { items } = build([
      ["A", 100, 10, 110, 11, 6, 6.4],
      ["SEMCUSTO", 200, 4, 220, 4.2]
    ]);
    const gm = calculateGrossMarginPVM(items, {});
    expect(gm.coverage.complete).toBeFalse();
    expect(gm.coverage.items).toBe(1);
    expect(gm.bridge.pass).toBeTrue();
    // GM base considera apenas o item A
    expect(gm.base).toBeCloseTo(100 * 10 - 100 * 6, 1e-9);
  });

  it("SKU duplicado no mesmo periodo e somado e reportado", () => {
    const rows = [
      { key: "A", period: "P0", quantity: 60, revenue: 600 },
      { key: "A", period: "P0", quantity: 40, revenue: 400 },
      { key: "A", period: "P1", quantity: 120, revenue: 1320 }
    ];
    const { items, duplicates } = aggregateItems(rows, { basePeriod: "P0", currentPeriod: "P1" });
    expect(duplicates).toHaveLength(1);
    expect(items[0].q0).toBe(100);
    expect(items[0].rev0).toBe(1000);
  });

  it("Linhas de periodos nao selecionados sao ignoradas e contabilizadas", () => {
    const rows = [
      { key: "A", period: "P0", quantity: 10, revenue: 100 },
      { key: "A", period: "P1", quantity: 12, revenue: 132 },
      { key: "A", period: "P2", quantity: 99, revenue: 9999 }
    ];
    const { items, skippedRows } = aggregateItems(rows, { basePeriod: "P0", currentPeriod: "P1" });
    expect(skippedRows).toBe(1);
    expect(items[0].rev1).toBe(132);
  });

  it("Base vazia nao lanca excecao", () => {
    const { items } = aggregateItems([], { basePeriod: "P0", currentPeriod: "P1" });
    expect(items).toHaveLength(0);
    const r = calculateRevenuePVM(items, {});
    expect(r.base).toBe(0);
    expect(r.bridge.pass).toBeTrue();
  });

  it("Uma unica linha (apenas periodo atual) vira produto novo", () => {
    const { items } = aggregateItems([{ key: "A", period: "P1", quantity: 10, revenue: 250 }],
      { basePeriod: "P0", currentPeriod: "P1" });
    const r = calculateRevenuePVM(items, {});
    expect(r.counts.new).toBe(1);
    expect(r.buckets.new).toBe(250);
    expect(r.bridge.pass).toBeTrue();
  });

  it("Nenhum item comparavel: toda a variacao vai para New/Discontinued", () => {
    const { items } = build([["NOVO", null, null, 10, 5], ["SAIU", 20, 3, null, null]]);
    const r = calculateRevenuePVM(items, {});
    expect(r.buckets.price).toBe(0);
    expect(r.buckets.volume).toBe(0);
    expect(r.buckets.mix).toBe(0);
    expect(r.bridge.pass).toBeTrue();
  });

  it("Acentos e caracteres nao ASCII nas chaves e dimensoes", () => {
    const rows = [
      { key: "Café Especial ☕", label: "Café Especial ☕", period: "P0", quantity: 10, revenue: 300, dims: { Região: "São Paulo" } },
      { key: "Café Especial ☕", label: "Café Especial ☕", period: "P1", quantity: 14, revenue: 462, dims: { Região: "São Paulo" } }
    ];
    const { items } = aggregateItems(rows, { basePeriod: "P0", currentPeriod: "P1", dimensions: ["Região"] });
    expect(items[0].label).toBe("Café Especial ☕");
    expect(items[0].dims["Região"]).toBe("São Paulo");
    const r = calculateRevenuePVM(items, {});
    expect(r.bridge.pass).toBeTrue();
  });

  it("UOM heterogenea e detectada e traz a mensagem exigida", () => {
    const { items } = build([["A", 10, 5, 12, 5], ["B", 20, 3, 25, 3]],
      { uom: { A: "KG", B: "L" } });
    const u = checkUnitsOfMeasure(items);
    expect(u.heterogeneous).toBeTrue();
    expect(u.message).toContain("comparable units of measure");
  });

  it("UOM conflitante dentro do mesmo SKU e sinalizada", () => {
    const rows = [
      { key: "A", period: "P0", quantity: 10, revenue: 50, uom: "KG" },
      { key: "A", period: "P1", quantity: 12, revenue: 66, uom: "L" }
    ];
    const { items } = aggregateItems(rows, { basePeriod: "P0", currentPeriod: "P1" });
    expect(items[0].uomConflict).toBeTrue();
    expect(items[0].uomList).toHaveLength(2);
  });

  it("Precisao: 100.000 itens reconciliam dentro da tolerancia", () => {
    const rows = [];
    for (let i = 0; i < 100000; i++) {
      const p0 = 1 + (i % 97) * 0.37;
      const q0 = 10 + (i % 53) * 3;
      const p1 = p0 * (1 + ((i % 11) - 5) / 100);
      const q1 = q0 * (1 + ((i % 17) - 8) / 100);
      rows.push({ key: "S" + i, period: "P0", quantity: q0, revenue: q0 * p0, cogs: q0 * p0 * 0.6 });
      rows.push({ key: "S" + i, period: "P1", quantity: q1, revenue: q1 * p1, cogs: q1 * p1 * 0.62 });
    }
    const t0 = Date.now();
    const { items } = aggregateItems(rows, { basePeriod: "P0", currentPeriod: "P1" });
    const res = runAnalysis(items, {});
    const ms = Date.now() - t0;
    expect(items).toHaveLength(100000);
    expect(res.revenue.bridge.pass).toBeTrue("ponte de receita com 100k itens");
    expect(res.grossMargin.bridge.pass).toBeTrue("ponte de margem com 100k itens");
    expect(ms).toBeLessThan(30000, "agregacao + analise de 200k linhas em menos de 30s");
  });

  it("Nenhum bucket produz NaN ou Infinity em cenarios degenerados", () => {
    const cenarios = [
      [["A", 0, 0, 0, 0]],
      [["A", 1e-12, 1e12, 1e-12, 1e12]],
      [["A", 1e9, 1e-9, 1e9, 1e-9]],
      [["A", 100, 10, 0.0000001, 10]]
    ];
    for (const spec of cenarios) {
      const { items } = build(spec);
      const r = calculateRevenuePVM(items, {});
      for (const [k, v] of Object.entries(r.buckets)) expect(v).toBeFinite("bucket " + k);
      expect(r.bridge.residual).toBeFinite();
    }
  });
});

/* ================================================ 6. AGREGACAO E DRILL-DOWN */

describe("Agregacao por dimensao e drill-down", ({ it }) => {
  const spec = [
    ["A1", 100, 10, 120, 11], ["A2", 200, 4, 180, 4.2],
    ["B1", 50, 30, 70, 29], ["B2", 300, 2, 330, 2.1]
  ];
  const extra = {
    dimNames: ["Cat"],
    dims: { A1: { Cat: "Alfa" }, A2: { Cat: "Alfa" }, B1: { Cat: "Beta" }, B2: { Cat: "Beta" } }
  };

  it("A soma dos grupos e igual ao total do portfolio", () => {
    const { items } = build(spec, extra);
    const r = calculateRevenuePVM(items, {});
    const groups = aggregateEffectsBy(items, r, "Cat");
    const sum = k => groups.reduce((a, g) => a + g[k], 0);
    expect(sum("price")).toBeCloseTo(r.buckets.price, 1e-6);
    expect(sum("volume")).toBeCloseTo(r.buckets.volume, 1e-6);
    expect(sum("mix")).toBeCloseTo(r.buckets.mix, 1e-6);
    expect(sum("delta")).toBeCloseTo(r.delta, 1e-6);
  });

  it("Agregar ANTES de calcular produziria um Mix diferente — por isso o motor nao faz isso", () => {
    const { items } = build(spec, extra);
    const granular = calculateRevenuePVM(items, {});
    // simula o erro: consolidar cada categoria em um unico item e so entao decompor
    const rolled = [];
    for (const cat of ["Alfa", "Beta"]) {
      const membros = items.filter(i => i.dims.Cat === cat);
      const q0 = membros.reduce((a, m) => a + m.q0, 0), q1 = membros.reduce((a, m) => a + m.q1, 0);
      const r0 = membros.reduce((a, m) => a + m.rev0, 0), r1 = membros.reduce((a, m) => a + m.rev1, 0);
      rolled.push({ key: cat, period: "P0", quantity: q0, revenue: r0 });
      rolled.push({ key: cat, period: "P1", quantity: q1, revenue: r1 });
    }
    const agg = aggregateItems(rolled, { basePeriod: "P0", currentPeriod: "P1" });
    const coarse = calculateRevenuePVM(agg.items, {});
    expect(Math.abs(coarse.buckets.mix - granular.buckets.mix)).toBeGreaterThan(1,
      "o mix interno ao grupo desaparece quando se agrega antes de calcular");
    // as duas pontes ainda fecham — o que muda e a ATRIBUICAO, nao o total
    expect(coarse.delta).toBeCloseTo(granular.delta, 1e-6);
  });

  it("Filtrar recalcula g e Pm0 e mantem a ponte fechada", () => {
    const { items } = build(spec, extra);
    const filtered = filterItems(items, { Cat: ["Alfa"] });
    expect(filtered).toHaveLength(2);
    const r = calculateRevenuePVM(filtered, {});
    expect(r.bridge.pass).toBeTrue();
    expect(r.base).toBeCloseTo(100 * 10 + 200 * 4, 1e-9);
    const full = calculateRevenuePVM(items, {});
    expect(r.stats.growthFactor).toBeLessThan(full.stats.growthFactor + 10);
  });

  it("distinctValues lista as dimensoes disponiveis", () => {
    const { items } = build(spec, extra);
    expect(distinctValues(items, "Cat")).toEqual(["Alfa", "Beta"]);
    expect(distinctValues(items, "__status__")).toEqual(["active"]);
  });

  it("topDrivers separa positivos e negativos por efeito", () => {
    const { items } = build(spec, extra);
    const r = calculateRevenuePVM(items, {});
    const t = topDrivers(items, r, "price", 5);
    expect(t.positive.length + t.negative.length).toBeGreaterThan(0);
    for (const p of t.positive) expect(p.value).toBeGreaterThan(0);
    for (const n of t.negative) expect(n.value).toBeLessThan(0);
  });

  it("mixMatrix devolve diferencial de preco e variacao de participacao coerentes", () => {
    const { items } = build(spec, extra);
    const r = calculateRevenuePVM(items, {});
    const pts = mixMatrix(items, r);
    expect(pts).toHaveLength(4);
    const somaShare0 = pts.reduce((a, p) => a + p.shareBase, 0);
    const somaShare1 = pts.reduce((a, p) => a + p.shareCurrent, 0);
    expect(somaShare0).toBeCloseTo(1, 1e-9);
    expect(somaShare1).toBeCloseTo(1, 1e-9);
    for (const p of pts) expect(p.priceDifferential).toBeFinite();
  });
});

/* ============================================= 7. WORKBOOK DE REFERENCIA */

describe("Workbook de referencia do webinar", ({ it }) => {
  // PVM_DATA.xlsx, formato long, 2019 -> 2020 (15 produtos)
  const REF = [
    ["Product 01", 9670.432692307691, 80458, 11189.988876529476, 100598],
    ["Product 02", 31000, 50345, 50514.41860465117, 108606],
    ["Product 03", null, null, 4677.114967462038, 43145],
    ["Product 04", 4836.072144288577, 32052, 9587.777777777777, 43123],
    ["Product 05", 43262.59259259259, 116809, 35539.3220338983, 108841],
    ["Product 06", 1890.6976744186047, 8130, null, null],
    ["Product 07", 1468.8458972648432, 22018, null, null],
    ["Product 08", 6918.888888888889, 62270, 6937.055837563452, 68330],
    ["Product 09", 35428.125, 113370, 43680.71428571429, 122306],
    ["Product 10", 3765.326633165829, 74930, 4038.439306358381, 69865],
    ["Product 11", 4685.344827586207, 54350, 3785.5045871559632, 41262],
    ["Product 12", null, null, 3337.8991596638652, 39721],
    ["Product 13", 2064.6666666666665, 12388, 1898, 13286],
    ["Product 14", 19425.67901234568, 147348, 15563.197969543147, 129638],
    ["Product 15", 16865.8064516129, 24956, null, null]
  ];
  function refItems() {
    const rows = [];
    for (const [key, q0, r0, q1, r1] of REF) {
      if (q0 != null) rows.push({ key, label: key, period: "2019", quantity: q0, revenue: r0 });
      if (q1 != null) rows.push({ key, label: key, period: "2020", quantity: q1, revenue: r1 });
    }
    return aggregateItems(rows, { basePeriod: "2019", currentPeriod: "2020" }).items;
  }

  it("Totais de receita batem com o workbook", () => {
    const r = calculateRevenuePVM(refItems(), {});
    expect(r.base).toBeCloseTo(799424, 1e-6);
    expect(r.current).toBeCloseTo(888721, 1e-6);
    expect(r.delta).toBeCloseTo(89297, 1e-6);
  });

  it("Classificacao Active/New/Discontinued bate com a aba Advanced", () => {
    const r = calculateRevenuePVM(refItems(), {});
    expect(r.counts.active).toBe(10);
    expect(r.counts.new).toBe(2);
    expect(r.counts.discontinued).toBe(3);
  });

  it("Efeito Preco reproduz exatamente o valor do workbook", () => {
    // aba Advanced, celula J17 = SUBTOTAL(109,[Price]) = 15289.408112425059
    const r = calculateRevenuePVM(refItems(), { methodology: "fti" });
    expect(r.buckets.price).toBeCloseTo(15289.408112425059, 1e-6);
  });

  it("New e Discontinued reproduzem o workbook", () => {
    const r = calculateRevenuePVM(refItems(), {});
    expect(r.buckets.new).toBeCloseTo(82866, 1e-9);       // L17
    expect(r.buckets.discontinued).toBeCloseTo(-55104, 1e-9); // M17
  });

  it("Volume + Mix somam o mesmo que no workbook, apesar da divisao interna diferente", () => {
    // O workbook recalcula o Volume TOTAL usando o preco medio de todas as
    // linhas (inclusive novos e descontinuados) e obtem o Mix por diferenca.
    // Este motor restringe g e Pm0 a populacao comparavel e calcula o Mix por
    // formula. A soma Volume + Mix e identica; a atribuicao entre os dois nao.
    const r = calculateRevenuePVM(refItems(), { methodology: "fti" });
    const workbookVol = 41747.61420692974;   // K17
    const workbookMix = 4497.977680645185;   // N17
    expect(r.buckets.volume + r.buckets.mix).toBeCloseTo(workbookVol + workbookMix, 1e-6);
  });

  it("A ponte fecha com residuo zero", () => {
    const r = calculateRevenuePVM(refItems(), {});
    expect(r.bridge.pass).toBeTrue();
    expect(Math.abs(r.bridge.residual)).toBeLessThan(1e-6);
  });
});

/* ================================================================ 8. VERSAO */

describe("Versionamento", ({ it }) => {
  it("A versao do motor esta declarada e viaja no resultado", () => {
    expect(PVM_ENGINE_VERSION).toBe("1.0.0");
    const { items } = build([["A", 10, 5, 12, 6]]);
    const res = runAnalysis(items, {});
    expect(res.engineVersion).toBe("1.0.0");
    expect(res.revenue.engineVersion).toBe("1.0.0");
  });

  it("Metodologia desconhecida lanca erro em vez de escolher em silencio", () => {
    expect(() => calculateRevenuePVM([], { methodology: "nao-existe" })).toThrow();
  });
});
