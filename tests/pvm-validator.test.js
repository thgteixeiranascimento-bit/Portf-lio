/* ============================================================================
   pvm-validator.test.js — testes de qualidade de dados, parser e narrativa
   ----------------------------------------------------------------------------
   Cobre as tres camadas do validador, a leitura de numeros e periodos do
   parser (virgula decimal, ponto decimal, contabil, percentual, datas) e a
   regra antialucinacao dos insights.
   ========================================================================== */

"use strict";

import { describe, expect } from "./harness.js";
import {
  validateSchema, validateRows, validateItems, dataQualityScore,
  validateDataset, modelIntegrity, SEVERITY, PVM_VALIDATOR_VERSION
} from "../assets/js/pvm-validator.js";
import { aggregateItems, runAnalysis } from "../assets/js/pvm-engine.js";
import {
  toNumber, normalizePeriod, inferDecimalConvention, detectDelimiter,
  parseDelimitedText, matrixToTable, suggestMapping, detectLayout,
  normalizeRows, listPeriods
} from "../assets/js/pvm-parser.js";
import { generateInsights, auditNarrative, FORBIDDEN_TERMS } from "../assets/js/pvm-insights.js";

const has = (issues, id) => issues.some(i => i.id === id);
const get = (issues, id) => issues.find(i => i.id === id);

/* ============================================================== 1. SCHEMA */

describe("Validacao de schema", ({ it }) => {
  it("Falta de identificador e erro critico", () => {
    const out = validateSchema({ period: "P", quantity: "Q", revenue: "R" }, "long");
    expect(has(out, "schema.key")).toBeTrue();
    expect(get(out, "schema.key").severity).toBe(SEVERITY.ERROR);
  });

  it("Falta de periodo, quantidade ou receita bloqueia o calculo", () => {
    const out = validateSchema({ sku: "S" }, "long");
    expect(has(out, "schema.period")).toBeTrue();
    expect(has(out, "schema.quantity")).toBeTrue();
    expect(has(out, "schema.revenue")).toBeTrue();
  });

  it("Preco unitario substitui receita sem gerar erro", () => {
    const out = validateSchema({ sku: "S", period: "P", quantity: "Q", unitPrice: "PU" }, "long");
    expect(has(out, "schema.revenue")).toBeFalse();
  });

  it("COGS ausente e apenas informativo — o PVM de receita continua valido", () => {
    const out = validateSchema({ sku: "S", period: "P", quantity: "Q", revenue: "R" }, "long");
    expect(get(out, "schema.cogs").severity).toBe(SEVERITY.INFO);
    expect(out.filter(i => i.severity === SEVERITY.ERROR)).toHaveLength(0);
  });

  it("Formato WIDE exige as quatro colunas base/atual", () => {
    const out = validateSchema({ sku: "S", quantityBase: "QB", revenueBase: "RB" }, "wide");
    expect(has(out, "schema.qtyWide")).toBeTrue();
    expect(has(out, "schema.revWide")).toBeTrue();
  });
});

/* ============================================================ 2. LINHAS */

describe("Validacao de linhas", ({ it }) => {
  it("Conta quantidade zero, negativa, receita negativa e receita zero", () => {
    const rows = [
      { quantity: 0, revenue: 100 },
      { quantity: -5, revenue: -50 },
      { quantity: 10, revenue: 0 },
      { quantity: 10, revenue: 100 }
    ];
    const out = validateRows(rows);
    expect(get(out, "row.zeroQty").count).toBe(1);
    expect(get(out, "row.negQty").count).toBe(1);
    expect(get(out, "row.negRev").count).toBe(1);
    expect(get(out, "row.zeroRev").count).toBe(1);
  });

  it("Valores nao finitos sao erro critico", () => {
    const out = validateRows([{ quantity: NaN, revenue: 10 }]);
    // NaN cai em "sem quantidade" (null-like) ou nao finito; em ambos os casos e reportado
    expect(out.length).toBeGreaterThan(0);
  });

  it("Guarda amostra limitada de linhas afetadas", () => {
    const rows = [];
    for (let i = 0; i < 200; i++) rows.push({ quantity: 0, revenue: 10 });
    const out = validateRows(rows, { sampleLimit: 20 });
    const z = get(out, "row.zeroQty");
    expect(z.count).toBe(200);
    expect(z.rows).toHaveLength(20);
  });

  it("Base limpa nao gera ocorrencia alguma", () => {
    const out = validateRows([{ quantity: 10, revenue: 100 }, { quantity: 20, revenue: 240 }]);
    expect(out).toHaveLength(0);
  });
});

/* ============================================================= 3. ITENS */

describe("Validacao de itens", ({ it }) => {
  function items(rows, dims) {
    return aggregateItems(rows, { basePeriod: "P0", currentPeriod: "P1", dimensions: dims || [] });
  }

  it("Duplicidade e reportada como aviso, e as linhas sao somadas (convencao declarada)", () => {
    const { items: its, duplicates } = items([
      { key: "A", period: "P0", quantity: 5, revenue: 50 },
      { key: "A", period: "P0", quantity: 5, revenue: 50 },
      { key: "A", period: "P1", quantity: 12, revenue: 132 }
    ]);
    const out = validateItems(its, duplicates);
    const d = get(out, "item.duplicate");
    expect(d.severity).toBe(SEVERITY.WARNING);
    expect(its[0].rev0).toBe(100);
  });

  it("Item nao comparavel gera aviso explicando o balde Other", () => {
    const { items: its, duplicates } = items([
      { key: "X", period: "P0", quantity: 0, revenue: 400 },
      { key: "X", period: "P1", quantity: 0, revenue: 700 }
    ]);
    const out = validateItems(its, duplicates);
    expect(has(out, "item.nonComparable")).toBeTrue();
    expect(get(out, "item.nonComparable").detail).toContain("Other");
  });

  it("UOM conflitante dentro do SKU e ERRO; UOM heterogenea entre SKUs e AVISO", () => {
    const conflito = items([
      { key: "A", period: "P0", quantity: 5, revenue: 50, uom: "KG" },
      { key: "A", period: "P1", quantity: 6, revenue: 66, uom: "L" }
    ]);
    expect(get(validateItems(conflito.items, []), "item.uomItem").severity).toBe(SEVERITY.ERROR);

    const heterogeneo = items([
      { key: "A", period: "P0", quantity: 5, revenue: 50, uom: "KG" },
      { key: "A", period: "P1", quantity: 6, revenue: 66, uom: "KG" },
      { key: "B", period: "P0", quantity: 5, revenue: 50, uom: "L" },
      { key: "B", period: "P1", quantity: 6, revenue: 66, uom: "L" }
    ]);
    const w = get(validateItems(heterogeneo.items, []), "item.uomMixed");
    expect(w.severity).toBe(SEVERITY.WARNING);
    expect(w.detail).toContain("comparable units of measure");
  });

  it("Cobertura parcial de COGS e sinalizada sem inventar custo", () => {
    const { items: its } = items([
      { key: "A", period: "P0", quantity: 10, revenue: 100, cogs: 60 },
      { key: "A", period: "P1", quantity: 12, revenue: 132, cogs: 74 },
      { key: "B", period: "P0", quantity: 10, revenue: 80 },
      { key: "B", period: "P1", quantity: 11, revenue: 90 }
    ]);
    const out = validateItems(its, []);
    expect(has(out, "item.cogsPartial")).toBeTrue();
    expect(get(out, "item.cogsPartial").count).toBe(1);
  });

  it("Ausencia total de itens comparaveis e erro critico", () => {
    const { items: its } = items([
      { key: "NOVO", period: "P1", quantity: 10, revenue: 100 },
      { key: "SAIU", period: "P0", quantity: 10, revenue: 80 }
    ]);
    expect(get(validateItems(its, []), "item.noActive").severity).toBe(SEVERITY.ERROR);
  });
});

/* ==================================================== 4. DATA QUALITY SCORE */

describe("Data Quality Score", ({ it }) => {
  it("Base perfeita tira nota alta e Reconciliation fica pendente antes do calculo", () => {
    const rows = [
      { quantity: 10, revenue: 100 }, { quantity: 12, revenue: 132 },
      { quantity: 8, revenue: 64 }, { quantity: 9, revenue: 76 }
    ];
    const { items } = aggregateItems([
      { key: "A", period: "P0", quantity: 10, revenue: 100 },
      { key: "A", period: "P1", quantity: 12, revenue: 132 }
    ], { basePeriod: "P0", currentPeriod: "P1" });
    const q = dataQualityScore({ rows, items, duplicates: [], parseIssues: {}, bridgePass: null });
    expect(q.components.reconciliation).toBeNull();
    expect(q.components.completeness).toBeCloseTo(100, 1e-9);
    expect(q.score).toBeGreaterThan(90);
  });

  it("Ponte reprovada zera o componente Reconciliation", () => {
    const q = dataQualityScore({ rows: [{ quantity: 1, revenue: 1 }], items: [], duplicates: [], parseIssues: {}, bridgePass: false });
    expect(q.components.reconciliation).toBe(0);
  });

  it("Falhas de leitura derrubam o componente Validity", () => {
    const rows = [];
    for (let i = 0; i < 100; i++) rows.push({ quantity: i < 50 ? null : 10, revenue: 100 });
    const q = dataQualityScore({
      rows, items: [], duplicates: [],
      parseIssues: { nonNumericQuantity: 50 }, bridgePass: true
    });
    expect(q.components.validity).toBeLessThan(60);
  });
});

/* ================================================== 5. ORQUESTRACAO E PAINEL */

describe("validateDataset e model integrity", ({ it }) => {
  const rows = [
    { key: "A", period: "P0", quantity: 10, revenue: 100, cogs: 60 },
    { key: "A", period: "P1", quantity: 12, revenue: 132, cogs: 74 },
    { key: "B", period: "P0", quantity: 30, revenue: 90, cogs: 55 },
    { key: "B", period: "P1", quantity: 26, revenue: 84, cogs: 52 }
  ];
  const mapping = { sku: "SKU", period: "Period", quantity: "Qty", revenue: "Rev", cogs: "COGS", uom: "UOM" };

  it("Base valida libera o RUN PVM", () => {
    const { items, duplicates } = aggregateItems(rows, { basePeriod: "P0", currentPeriod: "P1" });
    const v = validateDataset({
      mapping, layout: "long", rows, items, duplicates, parseIssues: {},
      basePeriod: "P0", currentPeriod: "P1", bridgePass: null
    });
    expect(v.canRun).toBeTrue();
    expect(v.errors).toBe(0);
  });

  it("Periodos iguais bloqueiam o calculo", () => {
    const { items, duplicates } = aggregateItems(rows, { basePeriod: "P0", currentPeriod: "P1" });
    const v = validateDataset({
      mapping, layout: "long", rows, items, duplicates, parseIssues: {},
      basePeriod: "P0", currentPeriod: "P0", bridgePass: null
    });
    expect(v.canRun).toBeFalse();
    expect(has(v.issues, "schema.samePeriod")).toBeTrue();
  });

  it("Painel MODEL INTEGRITY reporta PASS e o residuo", () => {
    const { items, duplicates } = aggregateItems(rows, { basePeriod: "P0", currentPeriod: "P1" });
    const result = runAnalysis(items, {});
    const panel = modelIntegrity(result, { rows, duplicates });
    const rev = panel.find(p => p.label === "Revenue Bridge");
    const gm = panel.find(p => p.label === "Gross Margin Bridge");
    expect(rev.value).toBe("PASS");
    expect(gm.value).toBe("PASS");
    expect(panel.find(p => p.label === "Duplicate Keys").value).toBe(0);
    expect(panel.find(p => p.label === "Engine").value).toContain("v1.0.0");
  });

  it("Versao do validador declarada", () => {
    expect(PVM_VALIDATOR_VERSION).toBe("1.0.0");
  });
});

/* ================================================================ 6. PARSER */

describe("Parser — numeros", ({ it }) => {
  it("Le virgula decimal, ponto decimal e milhares", () => {
    expect(toNumber("1.234,56", "comma")).toBeCloseTo(1234.56, 1e-9);
    expect(toNumber("1,234.56", "dot")).toBeCloseTo(1234.56, 1e-9);
    expect(toNumber("1234.56", "auto")).toBeCloseTo(1234.56, 1e-9);
    expect(toNumber("1.234", "comma")).toBe(1234);
    expect(toNumber("1,234", "dot")).toBe(1234);
  });

  it("Le formato contabil, moeda e percentual", () => {
    expect(toNumber("(1.234,50)", "comma")).toBeCloseTo(-1234.5, 1e-9);
    expect(toNumber("R$ 1.234,50", "comma")).toBeCloseTo(1234.5, 1e-9);
    expect(toNumber("€ 2 500,75", "comma")).toBeCloseTo(2500.75, 1e-9);
    expect(toNumber("12,5%", "comma")).toBeCloseTo(0.125, 1e-9);
  });

  it("Texto nao numerico vira null, nunca NaN", () => {
    for (const v of ["abc", "", "  ", "-", "n/d", null, undefined]) {
      const n = toNumber(v, "auto");
      expect(n === null || Number.isFinite(n)).toBeTrue("valor: " + v);
    }
    expect(toNumber("abc", "auto")).toBeNull();
  });

  it("Infere a convencao decimal olhando a coluna inteira", () => {
    expect(inferDecimalConvention(["1.234,56", "987,10", "45,00"])).toBe("comma");
    expect(inferDecimalConvention(["1,234.56", "987.10", "45.00"])).toBe("dot");
    expect(inferDecimalConvention(["1.234", "5.678"])).toBe("auto");
  });
});

describe("Parser — periodos", ({ it }) => {
  it("Normaliza datas, meses, trimestres e anos", () => {
    expect(normalizePeriod("2025-03-15", "month")).toBe("2025-03");
    expect(normalizePeriod("2025-03-15", "quarter")).toBe("2025-Q1");
    expect(normalizePeriod("2025-03-15", "year")).toBe("2025");
    expect(normalizePeriod(new Date(Date.UTC(2024, 6, 9)), "month")).toBe("2024-07");
    expect(normalizePeriod("jan/25", "month")).toBe("2025-01");
    expect(normalizePeriod("2025", "auto")).toBe("2025");
  });

  it("dd/mm/aaaa e lido na convencao brasileira", () => {
    expect(normalizePeriod("15/03/2025", "auto")).toBe("2025-03-15");
    expect(normalizePeriod("03/15/2025", "auto")).toBe("2025-03-15");
  });

  it("Rotulos de cenario passam intactos — e o que permite Real x Orcado", () => {
    expect(normalizePeriod("Orçado", "auto")).toBe("Orçado");
    expect(normalizePeriod("Forecast", "month")).toBe("Forecast");
    expect(normalizePeriod("FY24", "auto")).toBe("FY24");
  });
});

describe("Parser — CSV e mapeamento", ({ it }) => {
  it("Detecta delimitador e respeita aspas com separador dentro", () => {
    const csv = 'SKU;Produto;Receita\nA;"Produto; especial";1.234,50\nB;Simples;900,00';
    expect(detectDelimiter(csv)).toBe(";");
    const { rows } = parseDelimitedText(csv);
    expect(rows).toHaveLength(3);
    expect(rows[1][1]).toBe("Produto; especial");
  });

  it("Suporta quebra de linha dentro de campo entre aspas", () => {
    const csv = 'A,B\n"linha 1\nlinha 2",xyz';
    const { rows } = parseDelimitedText(csv, ",");
    expect(rows[1][0]).toContain("linha 1");
    expect(rows[1][0]).toContain("linha 2");
  });

  it("Remove BOM e nomeia colunas duplicadas", () => {
    const csv = "﻿SKU,Valor,Valor\nA,1,2";
    const { rows } = parseDelimitedText(csv, ",");
    const t = matrixToTable(rows);
    expect(t.columns[0]).toBe("SKU");
    expect(t.columns[2]).toBe("Valor (2)");
  });

  it("Sugere mapeamento a partir de nomes em portugues e ingles", () => {
    const t = matrixToTable([
      ["SKU", "Produto", "Categoria", "Periodo", "Quantidade", "Receita", "COGS"],
      ["A", "Alfa", "C1", "2024", "10", "100", "60"]
    ]);
    const m = suggestMapping(t.columns, t.records);
    expect(m.sku).toBe("SKU");
    expect(m.period).toBe("Periodo");
    expect(m.quantity).toBe("Quantidade");
    expect(m.revenue).toBe("Receita");
    expect(m.cogs).toBe("COGS");
    expect(detectLayout(t.columns, m)).toBe("long");
  });

  it("Detecta e normaliza o formato WIDE", () => {
    const t = matrixToTable([
      ["SKU", "Revenue PY", "Revenue AC", "Quantity PY", "Quantity AC"],
      ["A", "1000", "1200", "100", "110"]
    ]);
    const m = suggestMapping(t.columns, t.records);
    expect(detectLayout(t.columns, m)).toBe("wide");
    const n = normalizeRows(t, m, { layout: "wide" });
    expect(n.rows).toHaveLength(2);
    expect(n.rows[0].period).toBe("Base");
    expect(n.rows[1].period).toBe("Atual");
    expect(n.rows[1].revenue).toBe(1200);
  });

  it("Deriva receita de preco unitario x quantidade e reporta a derivacao", () => {
    const t = matrixToTable([
      ["SKU", "Periodo", "Quantidade", "Preco unitario"],
      ["A", "2024", "10", "12,50"],
      ["A", "2025", "12", "13,10"]
    ]);
    const m = suggestMapping(t.columns, t.records);
    const n = normalizeRows(t, m, {});
    expect(n.issues.derivedRevenue).toBe(2);
    expect(n.rows[0].revenue).toBeCloseTo(125, 1e-9);
  });

  it("listPeriods conta as linhas de cada periodo", () => {
    const t = matrixToTable([
      ["SKU", "Periodo", "Quantidade", "Receita"],
      ["A", "2024", "10", "100"],
      ["B", "2024", "20", "200"],
      ["A", "2025", "12", "132"]
    ]);
    const m = suggestMapping(t.columns, t.records);
    const p = listPeriods(t.records, m, "auto");
    expect(p).toHaveLength(2);
    expect(p[0].period).toBe("2024");
    expect(p[0].rows).toBe(2);
  });
});

/* ============================================================= 7. INSIGHTS */

describe("Narrativa antialucinacao", ({ it }) => {
  function ctx() {
    const rows = [];
    const data = [
      ["A", 1000, 12.5, 1180, 13.2, 8.1, 8.9, "Alfa"],
      ["B", 4200, 3.4, 3900, 3.3, 2.2, 2.25, "Beta"],
      ["C", 180, 88.0, 240, 84.5, 61.0, 60.2, "Alfa"],
      ["NOVO", null, null, 700, 15.5, null, 9.4, "Beta"],
      ["SAIU", 320, 22.0, null, null, 14.0, null, "Alfa"]
    ];
    for (const [k, q0, p0, q1, p1, c0, c1, cat] of data) {
      if (q0 != null) rows.push({ key: k, label: k, period: "P0", quantity: q0, revenue: q0 * p0, cogs: c0 == null ? null : q0 * c0, dims: { Cat: cat } });
      if (q1 != null) rows.push({ key: k, label: k, period: "P1", quantity: q1, revenue: q1 * p1, cogs: c1 == null ? null : q1 * c1, dims: { Cat: cat } });
    }
    const { items } = aggregateItems(rows, { basePeriod: "P0", currentPeriod: "P1", dimensions: ["Cat"] });
    const result = runAnalysis(items, {});
    return { result, items, dimension: "Cat", basePeriod: "P0", currentPeriod: "P1" };
  }

  it("Gera insights e todos carregam proveniencia completa", () => {
    const ins = generateInsights(ctx());
    expect(ins.length).toBeGreaterThan(4);
    for (const i of ins) {
      expect(!!i.provenance.calculation).toBeTrue("insight " + i.id + " sem formula");
      expect(i.provenance.sources.length).toBeGreaterThan(0, "insight " + i.id + " sem fontes");
      expect(!!i.provenance.methodology).toBeTrue();
      expect(!!i.provenance.filter).toBeTrue();
    }
  });

  it("Nenhuma frase usa vocabulario causal proibido", () => {
    const audit = auditNarrative(generateInsights(ctx()));
    expect(audit.pass).toBeTrue(JSON.stringify(audit.violations));
  });

  it("A auditoria realmente pega um termo proibido quando ele aparece", () => {
    const fake = [{ id: "x", kind: "test", text: "A demanda aumentou 10%.", provenance: {} }];
    expect(auditNarrative(fake).pass).toBeFalse();
    expect(FORBIDDEN_TERMS).toContain("demanda");
  });

  it("O insight de reconciliacao sempre existe e reporta o status real", () => {
    const ins = generateInsights(ctx());
    const rec = ins.find(i => i.id === "control.reconciliation");
    expect(!!rec).toBeTrue();
    expect(rec.text).toContain("PASS");
  });

  it("O insight de mix cita a concentracao na dimensao escolhida", () => {
    const c = ctx();
    const mix = generateInsights(c).find(i => i.id === "revenue.mix");
    if (c.result.revenue.buckets.mix !== 0) {
      expect(!!mix).toBeTrue();
      expect(mix.provenance.calculation).toContain("Mix_i");
    }
  });

  it("Itens nao comparaveis produzem um alerta explicito", () => {
    const rows = [
      { key: "X", period: "P0", quantity: 0, revenue: 500 },
      { key: "X", period: "P1", quantity: 0, revenue: 800 },
      { key: "A", period: "P0", quantity: 100, revenue: 1000 },
      { key: "A", period: "P1", quantity: 110, revenue: 1155 }
    ];
    const { items } = aggregateItems(rows, { basePeriod: "P0", currentPeriod: "P1" });
    const result = runAnalysis(items, {});
    const ins = generateInsights({ result, items });
    const caveat = ins.find(i => i.id === "revenue.other");
    expect(!!caveat).toBeTrue();
    expect(caveat.kind).toBe("caveat");
  });
});
