/* ============================================================================
   harness.js — micro-runner de testes, sem dependencias
   ----------------------------------------------------------------------------
   Funciona identicamente em Node (`node tests/run.mjs`) e no navegador
   (`tests/index.html`), para que a mesma suite valide o motor nos dois
   ambientes em que ele roda.
   ========================================================================== */

"use strict";

export const suites = [];

export function describe(name, fn) {
  const suite = { name, tests: [] };
  suites.push(suite);
  const ctx = {
    it(title, body) { suite.tests.push({ title, body }); }
  };
  fn(ctx);
}

class AssertionError extends Error {}

function fail(msg) { throw new AssertionError(msg); }

export const expect = (actual) => ({
  toBe(expected, msg) {
    if (!Object.is(actual, expected)) fail((msg ? msg + ": " : "") + "esperado " + fmt(expected) + ", recebido " + fmt(actual));
  },
  toEqual(expected, msg) {
    const a = JSON.stringify(actual), b = JSON.stringify(expected);
    if (a !== b) fail((msg ? msg + ": " : "") + "esperado " + b + ", recebido " + a);
  },
  /** Comparacao numerica com tolerancia absoluta (padrao 1e-6). */
  toBeCloseTo(expected, tol, msg) {
    const t = tol == null ? 1e-6 : tol;
    if (!Number.isFinite(actual)) fail((msg ? msg + ": " : "") + "valor nao finito: " + fmt(actual));
    if (Math.abs(actual - expected) > t) {
      fail((msg ? msg + ": " : "") + "esperado " + fmt(expected) + " (tol " + t + "), recebido " + fmt(actual) +
        " — diferenca " + (actual - expected).toExponential(3));
    }
  },
  toBeNull(msg) { if (actual !== null) fail((msg ? msg + ": " : "") + "esperado null, recebido " + fmt(actual)); },
  toBeTrue(msg) { if (actual !== true) fail((msg ? msg + ": " : "") + "esperado true, recebido " + fmt(actual)); },
  toBeFalse(msg) { if (actual !== false) fail((msg ? msg + ": " : "") + "esperado false, recebido " + fmt(actual)); },
  toBeFinite(msg) {
    if (typeof actual !== "number" || !Number.isFinite(actual)) {
      fail((msg ? msg + ": " : "") + "esperado numero finito, recebido " + fmt(actual));
    }
  },
  toBeGreaterThan(x, msg) { if (!(actual > x)) fail((msg ? msg + ": " : "") + fmt(actual) + " nao e maior que " + fmt(x)); },
  toBeLessThan(x, msg) { if (!(actual < x)) fail((msg ? msg + ": " : "") + fmt(actual) + " nao e menor que " + fmt(x)); },
  toContain(x, msg) {
    const ok = Array.isArray(actual) ? actual.includes(x) : String(actual).includes(x);
    if (!ok) fail((msg ? msg + ": " : "") + fmt(actual) + " nao contem " + fmt(x));
  },
  toHaveLength(n, msg) {
    if (!actual || actual.length !== n) fail((msg ? msg + ": " : "") + "esperado tamanho " + n + ", recebido " + (actual ? actual.length : "n/a"));
  },
  toThrow(msg) {
    let threw = false;
    try { actual(); } catch (e) { threw = true; }
    if (!threw) fail((msg ? msg + ": " : "") + "esperava que lancasse excecao");
  }
});

function fmt(v) {
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toPrecision(12);
  if (typeof v === "string") return JSON.stringify(v);
  return String(v);
}

/**
 * runAll — executa todas as suites registradas.
 * @param {(evt:Object)=>void} [report] callback por teste, para a UI do browser
 */
export async function runAll(report) {
  let passed = 0, failed = 0;
  const failures = [];
  for (const suite of suites) {
    for (const t of suite.tests) {
      try {
        await t.body();
        passed++;
        report && report({ suite: suite.name, title: t.title, ok: true });
      } catch (e) {
        failed++;
        const info = { suite: suite.name, title: t.title, ok: false, error: e.message, stack: e.stack };
        failures.push(info);
        report && report(info);
      }
    }
  }
  return { passed, failed, total: passed + failed, failures, suites: suites.length };
}
