/* ============================================================================
   pvm-app.js — orquestracao da interface do simulador PVM
   ----------------------------------------------------------------------------
   RESPONSABILIDADE UNICA: estado da tela, eventos e renderizacao.
   NENHUM calculo financeiro acontece aqui — todo numero exibido vem de
   pvm-engine.js. Esta separacao e o que permite testar a matematica sem
   navegador e garante que nenhum valor seja "ajustado" na camada visual.
   ========================================================================== */

"use strict";

import {
  PVM_ENGINE_VERSION, METHODOLOGIES, DEFAULT_METHODOLOGY, getMethodology,
  aggregateItems, runAnalysis, filterItems, distinctValues, aggregateEffectsBy,
  topDrivers, mixMatrix, compareMethodologies, groupValueOf, STATUS, safeDiv
} from "./pvm-engine.js";
import {
  PVM_PARSER_VERSION, readFileToTable, matrixToTable, suggestMapping, detectLayout,
  listPeriods, normalizeRows, DIMENSION_FIELDS, TEMPLATE_COLUMNS
} from "./pvm-parser.js";
import { PVM_VALIDATOR_VERSION, validateDataset, modelIntegrity } from "./pvm-validator.js";
import { generateInsights, auditNarrative } from "./pvm-insights.js";
import { waterfall, contributionBars, mixScatter, redrawAll } from "./pvm-charts.js";
import {
  exportToExcel, exportToCsv, exportToJson, exportTemplate, exportIssuesCsv
} from "./pvm-export.js";
import {
  saveAnalysis, listAnalyses, loadAnalysis, deleteAnalysis,
  buildAuditTrail, savePrefs, loadPrefs, storageBackend
} from "./pvm-storage.js";

/* ============================================================== 1. ESTADO == */

const state = {
  fileName: null, fileSize: null, kind: null, delimiter: null,
  sheets: [], sheetIndex: 0,
  columns: [], conventions: {}, preview: [],
  table: null,                 // usado apenas no fallback sem worker
  mapping: {}, layout: "long", granularity: "auto", decimal: "auto",
  periods: [], basePeriod: null, currentPeriod: null,
  rows: 0, rowsSample: [], parseIssues: null,
  items: [], duplicates: [], dimensionColumns: [],
  filters: {}, methodology: DEFAULT_METHODOLOGY,
  currency: "BRL", scale: 1,
  mode: "revenue", contribMode: "abs",
  dimension: null, drill: null, topN: 25, search: "", sort: { key: "delta", dir: "desc" },
  expanded: new Set(),
  result: null, validation: null, insights: [], methodCompareStale: true,
  filteredItems: [], analysisId: null, analysisName: ""
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ========================================================= 2. FORMATACAO == */

const CURRENCIES = { BRL: "R$", USD: "$", EUR: "€", GBP: "£", none: "" };
const SCALE_SUFFIX = { 1: "", 1000: " mil", 1000000: " mi", 1000000000: " bi" };

const nf = (min, max) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: min, maximumFractionDigits: max });

function sym() { return CURRENCIES[state.currency] != null ? CURRENCIES[state.currency] : ""; }
function suffix() { return SCALE_SUFFIX[state.scale] || ""; }

/** Casas decimais adaptadas a escala, para nao perder informacao em "milhoes". */
function decimalsFor(v) {
  const a = Math.abs(v / state.scale);
  if (state.scale === 1) return a < 10 ? 2 : 0;
  return a < 10 ? 2 : (a < 1000 ? 1 : 0);
}

const F = {
  money(v) {
    if (v == null || !Number.isFinite(v)) return "—";
    const s = v / state.scale;
    const d = decimalsFor(v);
    const prefix = sym() ? sym() + " " : "";
    return (s < 0 ? "-" : "") + prefix + nf(d, d).format(Math.abs(s)) + suffix();
  },
  signedMoney(v) {
    if (v == null || !Number.isFinite(v)) return "—";
    const s = v / state.scale;
    const d = decimalsFor(v);
    const prefix = sym() ? sym() + " " : "";
    const sign = s > 0 ? "+" : (s < 0 ? "-" : "");
    return sign + prefix + nf(d, d).format(Math.abs(s)) + suffix();
  },
  unitMoney(v) {
    if (v == null || !Number.isFinite(v)) return "—";
    const prefix = sym() ? sym() + " " : "";
    return (v < 0 ? "-" : "") + prefix + nf(2, 4).format(Math.abs(v));
  },
  pct(v) { return (v == null || !Number.isFinite(v)) ? "—" : nf(1, 1).format(v * 100) + "%"; },
  signedPct(v) { return (v == null || !Number.isFinite(v)) ? "—" : (v >= 0 ? "+" : "") + nf(1, 1).format(v * 100) + "%"; },
  pp(v) { return (v == null || !Number.isFinite(v)) ? "—" : (v >= 0 ? "+" : "") + nf(1, 1).format(v * 100) + " p.p."; },
  /** p.p. com precisão explícita — o eixo da matriz de mix escolhe as casas
      conforme o passo, senão participações de 0,002% viram "+0,0 p.p." */
  ppN(v, d) {
    if (v == null || !Number.isFinite(v)) return "—";
    const k = Math.max(1, Math.min(6, d == null ? 1 : d));
    return (v >= 0 ? "+" : "") + nf(k, k).format(v * 100) + " p.p.";
  },
  int(v) { return (v == null || !Number.isFinite(v)) ? "—" : nf(0, 0).format(Math.round(v)); },
  qty(v) { return (v == null || !Number.isFinite(v)) ? "—" : nf(0, Math.abs(v) < 100 ? 2 : 0).format(v); },
  score(v) { return v == null ? "—" : nf(0, 0).format(Math.round(v)); }
};

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ============================================================ 3. UI BASE == */

function setStep(n) {
  $$("#flow li").forEach(li => {
    const s = Number(li.dataset.step);
    li.classList.toggle("on", s === n);
    li.classList.toggle("done", s < n);
  });
}
function showStep(n, opts) {
  const sec = $("#step-" + n);
  if (sec) sec.hidden = false;
  setStep(n);
  if (opts && opts.scroll && sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
}
function hideFrom(n) {
  for (let i = n; i <= 5; i++) { const s = $("#step-" + i); if (s) s.hidden = true; }
}

let overlayDepth = 0;
function overlay(on, text, pct) {
  const box = $("#pvm-overlay");
  if (on) {
    overlayDepth++;
    box.hidden = false;
    if (text) $("#overlay-text").textContent = text;
    $("#overlay-bar").style.width = (pct == null ? 0 : pct) + "%";
  } else {
    overlayDepth = Math.max(0, overlayDepth - 1);
    if (overlayDepth === 0) box.hidden = true;
  }
}
function overlayProgress(text, pct) {
  if ($("#pvm-overlay").hidden) return;
  if (text) $("#overlay-text").textContent = text;
  $("#overlay-bar").style.width = (pct || 0) + "%";
}

function status(msg, isError) {
  const el = $("#upload-status");
  el.hidden = false;
  el.className = "pvm-status" + (isError ? " err" : "");
  el.innerHTML = msg;
}

function modal(title, html) {
  $("#modal-title").textContent = title;
  $("#modal-body").innerHTML = html;
  $("#pvm-modal").hidden = false;
  $("#modal-close").focus();
}
function closeModal() { $("#pvm-modal").hidden = true; }

/* ============================================================= 4. WORKER == */

let worker = null, workerSeq = 0, workerBroken = false;
const pending = new Map();

function getWorker() {
  if (workerBroken) return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./pvm-worker.js", import.meta.url), { type: "module" });
    worker.onmessage = (ev) => {
      const d = ev.data || {};
      const p = pending.get(d.id);
      if (!p) return;
      if (d.progress) { overlayProgress(d.stage, d.pct); return; }
      pending.delete(d.id);
      d.ok ? p.resolve(d) : p.reject(new Error(d.error || "Falha no processamento."));
    };
    worker.onerror = () => {
      // Worker indisponivel (por exemplo, abertura via file://): segue na thread
      // principal. O calculo e identico; apenas a interface pode travar em bases
      // muito grandes, e isso e avisado ao usuario.
      workerBroken = true;
      for (const [, p] of pending) p.reject(new Error("__fallback__"));
      pending.clear();
      try { worker.terminate(); } catch (e) { /* ignora */ }
      worker = null;
    };
    return worker;
  } catch (e) {
    workerBroken = true;
    return null;
  }
}

function ask(type, payload, transfer) {
  const w = getWorker();
  if (!w) return Promise.reject(new Error("__fallback__"));
  const id = ++workerSeq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    try { w.postMessage(Object.assign({ id, type }, payload), transfer || []); }
    catch (e) { pending.delete(id); reject(new Error("__fallback__")); }
  });
}

/* ===================================================== 5. CARREGAR ARQUIVO */

async function handleFile(file) {
  hideFrom(2);
  state.result = null;
  resetAnalysisState();
  overlay(true, "Lendo o arquivo…", 5);
  try {
    const buffer = await file.arrayBuffer();
    let res;
    try {
      res = await ask("load", { buffer, fileName: file.name, fileType: file.type }, [buffer]);
    } catch (e) {
      if (e.message !== "__fallback__") throw e;
      res = await loadOnMainThread(file);
    }
    state.fileName = res.fileName;
    state.fileSize = res.fileSize;
    state.kind = res.kind;
    state.delimiter = res.delimiter;
    state.sheets = res.sheets;
    state.sheetIndex = pickBestSheet(res.sheets);
    status("<b>" + esc(res.fileName) + "</b> — " + F.int(res.sheets[state.sheetIndex].rowCount) +
      " linhas, " + res.sheets[state.sheetIndex].columns.length + " colunas" +
      (res.kind === "csv" ? " · delimitador <code>" + esc(res.delimiter === "\t" ? "TAB" : res.delimiter) + "</code>" : "") +
      (res.sheets.length > 1 ? " · " + res.sheets.length + " abas" : "") +
      (workerBroken ? " · <b>processando na thread principal</b> (Web Worker indisponivel neste contexto)" : ""));
    await inspectSheet(true);
    showStep(2, { scroll: true });
  } catch (e) {
    status("Nao foi possivel ler o arquivo: " + esc(e.message), true);
  } finally {
    overlay(false);
  }
}

/** Escolhe a aba com mais linhas — normalmente a que tem os dados. */
function pickBestSheet(sheets) {
  let best = 0;
  for (let i = 1; i < sheets.length; i++) if (sheets[i].rowCount > sheets[best].rowCount) best = i;
  return best;
}

/* Fallback sem worker: as mesmas funcoes puras, na thread principal. */
const mainTables = [];
async function loadOnMainThread(file) {
  const raw = await readFileToTable(file);
  mainTables.length = 0;
  const sheets = raw.sheets.map((s, i) => {
    const t = matrixToTable(s.matrix);
    mainTables.push(t);
    return { index: i, name: s.name, columns: t.columns, rowCount: t.records.length, conventions: t.conventions };
  });
  return { fileName: raw.fileName, fileSize: raw.fileSize, kind: raw.kind, delimiter: raw.delimiter || null, sheets };
}

async function inspectSheet(autoMap) {
  const sheet = state.sheets[state.sheetIndex];
  const payload = {
    sheetIndex: state.sheetIndex,
    mapping: autoMap ? {} : state.mapping,
    layout: autoMap ? null : state.layout,
    periodGranularity: state.granularity
  };
  let res;
  try {
    res = await ask("inspect", payload);
  } catch (e) {
    if (e.message !== "__fallback__") throw e;
    const t = mainTables[state.sheetIndex];
    const mapping = autoMap ? suggestMapping(t.columns, t.records) : state.mapping;
    const layout = autoMap ? detectLayout(t.columns, mapping) : state.layout;
    res = {
      mapping, layout,
      periods: layout === "long" ? listPeriods(t.records, mapping, state.granularity) : [],
      columns: t.columns, conventions: t.conventions, rowCount: t.records.length,
      preview: t.records.slice(0, 50).map(r => t.columns.map(c => r[c] instanceof Date ? r[c].toISOString().slice(0, 10) : (r[c] == null ? "" : String(r[c]))))
    };
  }
  if (autoMap) { state.mapping = res.mapping; state.layout = res.layout; }
  state.columns = res.columns;
  state.conventions = res.conventions;
  state.preview = res.preview;
  state.rows = res.rowCount;
  state.periods = res.periods || [];
  renderMapping();
  renderPreview();
  renderDatasetStats();
  renderPeriodSelectors();
}

/* ======================================================= 6. ETAPA 02 MAP == */

const FIELD_LABELS = [
  ["sku", "SKU / ID do item", true, "Chave que pareia os dois periodos"],
  ["product", "Product", false, "Rotulo exibido nos graficos e tabelas"],
  ["category", "Category", false, "Dimensao de agrupamento e drill-down"],
  ["period", "Period", true, "Data, mes, trimestre, ano ou cenario"],
  ["quantity", "Quantity", true, "Base de Volume e Mix"],
  ["revenue", "Revenue", true, "Receita liquida do periodo"],
  ["unitPrice", "Unit Price", false, "Alternativa a Receita (receita = preco x quantidade)"],
  ["cogs", "COGS", false, "Habilita o PVM de Margem Bruta"],
  ["unitCost", "Unit Cost", false, "Alternativa ao COGS"],
  ["uom", "UOM", false, "Unidade de medida — Mix exige unidades comparaveis"],
  ["customer", "Customer", false, "Dimensao opcional"],
  ["channel", "Channel", false, "Dimensao opcional"],
  ["region", "Region", false, "Dimensao opcional"],
  ["salesRep", "Sales rep", false, "Dimensao opcional"],
  ["businessUnit", "Business unit", false, "Dimensao opcional"]
];
const WIDE_FIELD_LABELS = [
  ["sku", "SKU / ID do item", true, "Chave do item"],
  ["product", "Product", false, "Rotulo exibido"],
  ["category", "Category", false, "Dimensao de agrupamento"],
  ["quantityBase", "Quantity — periodo base", true, ""],
  ["quantityCurrent", "Quantity — periodo atual", true, ""],
  ["revenueBase", "Revenue — periodo base", true, ""],
  ["revenueCurrent", "Revenue — periodo atual", true, ""],
  ["cogsBase", "COGS — periodo base", false, "Habilita Margem Bruta"],
  ["cogsCurrent", "COGS — periodo atual", false, "Habilita Margem Bruta"],
  ["uom", "UOM", false, "Unidade de medida"],
  ["customer", "Customer", false, "Dimensao opcional"],
  ["channel", "Channel", false, "Dimensao opcional"],
  ["region", "Region", false, "Dimensao opcional"]
];

function renderMapping() {
  const wrap = $("#sheet-wrap");
  if (state.sheets.length > 1) {
    wrap.hidden = false;
    $("#sheet").innerHTML = state.sheets
      .map((s, i) => '<option value="' + i + '"' + (i === state.sheetIndex ? " selected" : "") + ">" +
        esc(s.name) + " (" + F.int(s.rowCount) + " linhas)</option>").join("");
  } else wrap.hidden = true;

  $("#layout").value = state.layout;
  $("#granularity").value = state.granularity;
  $("#decimal").value = state.decimal;
  $("#gran-wrap").hidden = state.layout === "wide";

  const fields = state.layout === "wide" ? WIDE_FIELD_LABELS : FIELD_LABELS;
  const body = $("#map-table tbody");
  const opts = ['<option value="">— nao mapeado —</option>']
    .concat(state.columns.map(c => '<option value="' + esc(c) + '">' + esc(c) + "</option>")).join("");

  body.innerHTML = fields.map(([key, label, required, note]) => {
    const sel = state.mapping[key] || "";
    return '<tr class="' + (sel ? "mapped" : "") + '" data-field="' + key + '">' +
      "<td>" + esc(label) + "</td>" +
      '<td><select data-map="' + key + '">' + opts + "</select></td>" +
      "<td>" + (required ? '<span class="pvm-req">obrigatorio</span>' : '<span class="pvm-opt">opcional</span>') +
      (note ? ' <span style="color:var(--muted);font-size:.8rem">' + esc(note) + "</span>" : "") + "</td></tr>";
  }).join("");

  body.querySelectorAll("select[data-map]").forEach(s => {
    s.value = state.mapping[s.dataset.map] || "";
    s.addEventListener("change", async () => {
      const k = s.dataset.map;
      if (s.value) state.mapping[k] = s.value; else delete state.mapping[k];
      hideFrom(4);
      await inspectSheet(false);
    });
  });
}

function renderPreview() {
  const cols = state.columns;
  if (!state.preview || !state.preview.length) { $("#preview").innerHTML = '<div class="pvm-empty">Sem linhas para pre-visualizar.</div>'; return; }
  $("#preview").innerHTML = '<table class="tbl"><thead><tr><th>#</th>' +
    cols.map(c => "<th>" + esc(c) + "</th>").join("") + "</tr></thead><tbody>" +
    state.preview.map((r, i) => "<tr><td>" + (i + 1) + "</td>" +
      cols.map((c, j) => "<td>" + esc(r[j]) + "</td>").join("") + "</tr>").join("") +
    "</tbody></table>";
}

function renderDatasetStats() {
  const periods = state.periods.length;
  const mapped = Object.keys(state.mapping).length;
  const tiles = [
    ["Linhas", F.int(state.rows), state.kind === "csv" ? "arquivo CSV/TSV" : "planilha Excel"],
    ["Colunas", String(state.columns.length), mapped + " mapeadas"],
    ["Periodos detectados", state.layout === "wide" ? "2 (formato WIDE)" : String(periods),
      state.layout === "wide" ? "colunas base/atual" : "granularidade: " + state.granularity],
    ["Formato", state.layout === "wide" ? "WIDE" : "LONG", state.layout === "wide" ? "uma linha por item" : "uma linha por item x periodo"]
  ];
  $("#dataset-stats").innerHTML = tiles.map(([l, v, s]) =>
    '<div class="tile"><div class="lbl">' + esc(l) + '</div><div class="val">' + esc(v) +
    '</div><div class="sub">' + esc(s) + "</div></div>").join("");
}

/* ================================================== 7. ETAPA 03 VALIDATE == */

function renderPeriodSelectors() {
  const bs = $("#base-period"), cs = $("#current-period");
  if (state.layout === "wide") {
    const opts = '<option value="Base">Base</option><option value="Atual">Atual</option>';
    bs.innerHTML = opts; cs.innerHTML = opts;
    bs.value = "Base"; cs.value = "Atual";
    state.basePeriod = "Base"; state.currentPeriod = "Atual";
    bs.disabled = cs.disabled = true;
    return;
  }
  bs.disabled = cs.disabled = false;
  const list = state.periods;
  const opts = list.map(p => '<option value="' + esc(p.period) + '">' + esc(p.period) +
    " (" + F.int(p.rows) + " linhas)</option>").join("");
  bs.innerHTML = opts; cs.innerHTML = opts;
  if (list.length >= 2) {
    state.basePeriod = list[list.length - 2].period;
    state.currentPeriod = list[list.length - 1].period;
  } else if (list.length === 1) {
    state.basePeriod = state.currentPeriod = list[0].period;
  } else { state.basePeriod = state.currentPeriod = null; }
  if (state.basePeriod != null) bs.value = state.basePeriod;
  if (state.currentPeriod != null) cs.value = state.currentPeriod;
}

function renderMethodologySelect() {
  const sel = $("#methodology");
  sel.innerHTML = Object.values(METHODOLOGIES)
    .map(m => '<option value="' + m.id + '">' + esc(m.label) + "</option>").join("");
  sel.value = state.methodology;
  renderMethodNote();
}
function renderMethodNote() {
  const m = getMethodology(state.methodology);
  $("#method-note").innerHTML = "<b>" + esc(m.label) + ".</b> " + esc(m.note) +
    " &nbsp;<code>" + esc(m.priceFormula) + "</code> · <code>" + esc(m.volumeFormula) +
    "</code> · <code>" + esc(m.mixFormula) + "</code>" +
    (m.hasCross ? " · <code>" + esc(m.crossFormula) + "</code>" : "");
}

/** Constroi itens (worker ou fallback) e roda a validacao previa. */
async function buildItems() {
  const payload = {
    sheetIndex: state.sheetIndex,
    mapping: state.mapping,
    layout: state.layout,
    periodGranularity: state.granularity,
    basePeriod: state.basePeriod,
    currentPeriod: state.currentPeriod,
    conventions: overrideConventions()
  };
  let res;
  try {
    res = await ask("build", payload);
  } catch (e) {
    if (e.message !== "__fallback__") throw e;
    const t0 = mainTables[state.sheetIndex];
    const t = payload.conventions ? Object.assign({}, t0, { conventions: payload.conventions }) : t0;
    const norm = normalizeRows(t, state.mapping, { layout: state.layout, periodGranularity: state.granularity });
    const dims = DIMENSION_FIELDS.filter(f => state.mapping[f]).map(f => state.mapping[f]);
    const agg = aggregateItems(norm.rows, {
      basePeriod: state.basePeriod, currentPeriod: state.currentPeriod, dimensions: dims
    });
    res = {
      items: agg.items, duplicates: agg.duplicates, skippedRows: agg.skippedRows,
      rows: norm.rows.length, rowsSample: norm.rows.slice(0, 5000),
      parseIssues: norm.issues, periods: norm.periods, layout: norm.layout, dimensionColumns: dims
    };
  }
  state.items = res.items;
  state.duplicates = res.duplicates;
  state.parseIssues = res.parseIssues;
  state.rowsSample = res.rowsSample;
  state.dimensionColumns = res.dimensionColumns;
  return res;
}

async function validateNow() {
  overlay(true, "Validando a base…", 30);
  try {
    await buildItems();
    state.validation = validateDataset({
      mapping: state.mapping, layout: state.layout,
      rows: state.rowsSample, items: state.items, duplicates: state.duplicates,
      parseIssues: state.parseIssues,
      basePeriod: state.basePeriod, currentPeriod: state.currentPeriod,
      bridgePass: null
    });
    renderValidation();
  } catch (e) {
    status("Falha ao preparar os dados: " + esc(e.message), true);
  } finally { overlay(false); }
}

function renderValidation() {
  const v = state.validation;
  const s = v.summary;
  const rows = [];
  const line = (kind, st, text, num) =>
    '<div class="pvm-dq-row ' + kind + '"><span class="st">' + st + '</span><span class="d">' + text + "</span>" +
    (num ? '<span class="num">' + num + "</span>" : "") + "</div>";

  rows.push(line("ok", "✓", F.int(s.rowsImported) + " linhas importadas"));
  rows.push(line("ok", "✓", F.int(s.uniqueItems) + " itens unicos identificados"));
  rows.push(line(state.basePeriod && state.currentPeriod && state.basePeriod !== state.currentPeriod ? "ok" : "bad",
    state.basePeriod !== state.currentPeriod ? "✓" : "✕",
    "Periodos: <b>" + esc(String(s.basePeriod)) + "</b> vs. <b>" + esc(String(s.currentPeriod)) + "</b>"));
  rows.push(line(s.completeShare != null && s.completeShare > 0.98 ? "ok" : "warn",
    s.completeShare != null && s.completeShare > 0.98 ? "✓" : "⚠",
    F.pct(s.completeShare) + " dos registros com quantidade e receita",
    F.int(s.completeRows) + " / " + F.int(s.rowsImported)));
  rows.push(line("ok", "✓", "Ativos: " + s.counts.active + " · Novos: " + s.counts.new +
    " · Descontinuados: " + s.counts.discontinued + " · Nao comparaveis: " + s.counts["non-comparable"]));
  $("#dq-summary").innerHTML = rows.join("");

  const order = { error: 0, warning: 1, info: 2 };
  const issues = v.issues.slice().sort((a, b) => order[a.severity] - order[b.severity]);
  $("#dq-issues").innerHTML = issues.length ? issues.map(i =>
    '<div class="pvm-issue ' + i.severity + '">' +
    '<div class="t">' + (i.severity === "error" ? "✕" : i.severity === "warning" ? "⚠" : "ⓘ") + " " + esc(i.title) +
    (i.count ? '<span class="cnt">' + F.int(i.count) + " ocorrencia" + (i.count > 1 ? "s" : "") + "</span>" : "") + "</div>" +
    '<div class="d">' + esc(i.detail) + "</div>" +
    (i.suggestion ? '<div class="s">→ ' + esc(i.suggestion) + "</div>" : "") +
    (i.rows && i.rows.length ? '<div class="rows">' + esc(i.rows.slice(0, 12).join(" · ")) +
      (i.rows.length > 12 ? " …" : "") + "</div>" : "") +
    "</div>").join("")
    : '<div class="pvm-issue info"><div class="t">✓ Nenhuma ocorrencia identificada</div></div>';

  renderScore(v.quality);

  const blocked = !v.canRun;
  $("#btn-run").disabled = blocked;
  const b = $("#run-blocked");
  b.hidden = !blocked;
  if (blocked) b.textContent = "Corrija " + v.errors + " erro" + (v.errors > 1 ? "s" : "") + " critico" + (v.errors > 1 ? "s" : "") + " antes de calcular.";
}

function renderScore(q) {
  const cls = v => v == null ? "" : (v >= 85 ? "ok" : v >= 60 ? "warn" : "bad");
  const names = {
    completeness: "Completeness", consistency: "Consistency", uniqueness: "Uniqueness",
    validity: "Validity", reconciliation: "Reconciliation"
  };
  const bars = Object.entries(q.components).map(([k, val]) =>
    '<div class="pvm-score-bar"><span>' + names[k] + "</span>" +
    '<span class="track"><i class="' + cls(val) + '" style="width:' + (val == null ? 0 : val) + '%"></i></span>' +
    '<span class="v' + (val == null ? " na" : "") + '">' + (val == null ? "n/a" : F.score(val)) + "</span></div>").join("");
  $("#dq-score").innerHTML =
    '<div class="pvm-score"><div><div class="big ' + cls(q.score) + '">' + F.score(q.score) + "</div>" +
    '<div class="lbl">de 100</div></div>' +
    '<div style="font-size:.85rem;color:var(--ink-2)">Media dos componentes avaliados. ' +
    "<b>Reconciliation</b> so e avaliada depois do calculo — e o teste de que a ponte fecha.</div></div>" +
    '<div class="pvm-score-bars">' + bars + "</div>";
}

/* ======================================================== 8. CALCULO/RENDER */

function activeFilters() {
  const out = {};
  for (const [k, v] of Object.entries(state.filters)) if (v && v.length) out[k] = v;
  return out;
}
function filterLabel() {
  const f = activeFilters();
  const keys = Object.keys(f);
  if (!keys.length) return "nenhum filtro aplicado (base completa)";
  return keys.map(k => dimLabel(k) + ": " + f[k].join(", ")).join(" · ");
}
function dimLabel(k) {
  if (k === "__status__") return "Status";
  if (k === "__uom__") return "UOM";
  if (k === "__key__") return "Item";
  return k;
}

function runPVM(opts) {
  const items = filterItems(state.items, activeFilters());
  state.filteredItems = items;
  if (!items.length) {
    state.result = null;
    $("#kpis").innerHTML = '<div class="pvm-empty">Nenhum item atende aos filtros selecionados.</div>';
    return;
  }
  state.result = runAnalysis(items, { methodology: state.methodology });

  // Reconciliation entra no score somente agora, com o resultado em maos.
  state.validation = validateDataset({
    mapping: state.mapping, layout: state.layout,
    rows: state.rowsSample, items: state.items, duplicates: state.duplicates,
    parseIssues: state.parseIssues,
    basePeriod: state.basePeriod, currentPeriod: state.currentPeriod,
    bridgePass: state.result.revenue.bridge.pass &&
      (!state.result.grossMargin || state.result.grossMargin.bridge.pass)
  });
  renderScore(state.validation.quality);

  if (!state.dimension) state.dimension = defaultDimension();
  renderAll();
  if (opts && opts.reveal) { showStep(4, { scroll: true }); showStep(5); }
}

function defaultDimension() {
  return state.dimensionColumns.length ? state.dimensionColumns[0] : "__status__";
}

function currentResult() {
  const r = state.result;
  if (!r) return null;
  return state.mode === "gm" && r.grossMargin ? r.grossMargin : r.revenue;
}

/**
 * renderAll — redesenho completo, usado quando o RESULTADO muda (novo cálculo,
 * filtro, metodologia, moeda ou escala).
 */
function renderAll() {
  if (!state.result) return;
  renderModeAvailability();
  renderUomAlert();
  renderFiltersPanel();
  renderDimensionSelects();
  renderMixMatrix();          // depende só do PVM de receita, não do modo
  renderMethodologyPanel();
  // A comparação roda as QUATRO convenções sobre a população inteira. Numa base
  // de 50 mil itens são quatro decomposições completas a cada filtro — por isso
  // ela só é calculada quando o painel está de fato aberto.
  state.methodCompareStale = true;
  if ($("#method-compare-details").open) renderMethodComparison();
  renderSavedList();
  renderModeViews();
}

/**
 * renderModeViews — só o que muda entre Revenue PVM e Gross Margin PVM.
 *
 * A matriz de mix, o painel de metodologia e a comparação de convenções não
 * dependem do modo; redesenhá-los a cada clique custava mais de 10 s numa base
 * de 50 mil itens, sem mudar um pixel.
 */
function renderModeViews() {
  if (!state.result) return;
  renderKpis();
  renderWaterfall();
  renderContribution();
  renderDimensionChart();
  renderTopDrivers();
  renderDriversTable();
  renderInsights();
  renderIntegrity();
}

function renderModeAvailability() {
  const gmBtn = $('#mode-seg button[data-mode="gm"]');
  const has = !!state.result.grossMargin;
  gmBtn.disabled = !has;
  gmBtn.title = has ? "" : "Mapeie COGS na etapa 02 para habilitar";
  if (!has && state.mode === "gm") setMode("revenue");
}

function renderUomAlert() {
  const box = $("#uom-alert");
  const u = state.result.uom;
  if (!u.heterogeneous) { box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = "<span>⚠</span><div><b>" + esc(u.message) + "</b><br>" +
    "Unidades presentes na populacao analisada: <b>" + esc(u.units.join(", ")) + "</b>. " +
    "Os efeitos <b>Volume</b> e <b>Mix</b> continuam sendo calculados e a ponte fecha, mas somar " +
    "quantidades de unidades diferentes torna a leitura desses dois efeitos economicamente inválida. " +
    "Use o filtro <b>UOM</b> para analisar uma unidade por vez.</div>";
}

/* ------------------------------------------------------------------- KPIs */

function renderKpis() {
  const r = state.result;
  const tiles = [];
  const tile = (cls, lbl, val, sub, flag) =>
    '<div class="tile ' + cls + '"><div class="lbl">' + esc(lbl) + '</div><div class="val">' + val +
    "</div>" + (sub ? '<div class="sub">' + sub + "</div>" : "") +
    (flag ? '<div class="kpi-flag">' + esc(flag) + "</div>" : "") + "</div>";

  if (state.mode === "revenue") {
    const rev = r.revenue, b = rev.buckets;
    const uomFlag = r.uom.heterogeneous ? "UOM heterogenea" : null;
    tiles.push(tile("kpi-total", "Revenue Base", F.money(rev.base),
      F.qty(rev.quantityBase) + " un · " + F.unitMoney(rev.avgPriceBase) + "/un"));
    tiles.push(tile("kpi-total", "Revenue Current", F.money(rev.current),
      F.qty(rev.quantityCurrent) + " un · " + F.unitMoney(rev.avgPriceCurrent) + "/un"));
    tiles.push(tile("kpi-head " + (rev.delta >= 0 ? "kpi-eff pos" : "kpi-eff neg"), "Revenue Change",
      F.signedMoney(rev.delta), F.signedPct(rev.deltaPct) + " · volume " + F.signedPct(rev.quantityDeltaPct)));
    tiles.push(tile("kpi-eff " + (b.price >= 0 ? "pos" : "neg"), "Price Effect", F.signedMoney(b.price), shareOf(b.price, rev.delta)));
    tiles.push(tile("kpi-eff " + (b.volume >= 0 ? "pos" : "neg"), "Volume Effect", F.signedMoney(b.volume), shareOf(b.volume, rev.delta), uomFlag));
    tiles.push(tile("kpi-eff " + (b.mix >= 0 ? "pos" : "neg"), "Mix Effect", F.signedMoney(b.mix), shareOf(b.mix, rev.delta), uomFlag));
    if (getMethodology(state.methodology).hasCross) {
      tiles.push(tile("kpi-eff " + (b.cross >= 0 ? "pos" : "neg"), "Cross Effect", F.signedMoney(b.cross), shareOf(b.cross, rev.delta)));
    }
    if (b.new !== 0) tiles.push(tile("kpi-eff pos", "New Products", F.signedMoney(b.new), r.counts.new + " itens"));
    if (b.discontinued !== 0) tiles.push(tile("kpi-eff neg", "Discontinued", F.signedMoney(b.discontinued), r.counts.discontinued + " itens"));
    if (b.other !== 0) tiles.push(tile("kpi-eff", "Other", F.signedMoney(b.other), r.counts["non-comparable"] + " itens nao comparaveis"));
  } else {
    const gm = r.grossMargin, b = gm.buckets;
    tiles.push(tile("kpi-total", "Gross Margin Base", F.money(gm.base), "sobre " + F.money(gm.revenueBase) + " de receita"));
    tiles.push(tile("kpi-total", "Gross Margin Current", F.money(gm.current), "sobre " + F.money(gm.revenueCurrent) + " de receita"));
    tiles.push(tile("kpi-head " + (gm.delta >= 0 ? "kpi-eff pos" : "kpi-eff neg"), "Δ Gross Margin", F.signedMoney(gm.delta),
      shareOf(gm.delta, gm.base, "da GM base")));
    tiles.push(tile("kpi-total", "GM% Base", F.pct(gm.gmPctBase), ""));
    tiles.push(tile("kpi-total", "GM% Current", F.pct(gm.gmPctCurrent), ""));
    tiles.push(tile("kpi-head " + (gm.gmPctDeltaPP >= 0 ? "kpi-eff pos" : "kpi-eff neg"), "Δ GM p.p.", F.pp(gm.gmPctDeltaPP), ""));
    tiles.push(tile("kpi-eff " + (b.sellingPrice >= 0 ? "pos" : "neg"), "Selling Price", F.signedMoney(b.sellingPrice), shareOf(b.sellingPrice, gm.delta)));
    tiles.push(tile("kpi-eff " + (b.unitCost >= 0 ? "pos" : "neg"), "Unit Cost", F.signedMoney(b.unitCost), shareOf(b.unitCost, gm.delta)));
    tiles.push(tile("kpi-eff " + (b.volume >= 0 ? "pos" : "neg"), "Volume", F.signedMoney(b.volume), shareOf(b.volume, gm.delta)));
    tiles.push(tile("kpi-eff " + (b.salesMix >= 0 ? "pos" : "neg"), "Sales Mix", F.signedMoney(b.salesMix), shareOf(b.salesMix, gm.delta)));
    tiles.push(tile("kpi-eff " + (b.costMix >= 0 ? "pos" : "neg"), "Cost Mix", F.signedMoney(b.costMix), shareOf(b.costMix, gm.delta)));
    if (!gm.coverage.complete) {
      tiles.push(tile("", "Cobertura de COGS", F.pct(gm.coverage.revenueShare),
        gm.coverage.items + " de " + gm.coverage.totalItems + " itens", "cobertura parcial"));
    }
  }
  $("#kpis").innerHTML = tiles.join("");
}

function shareOf(v, total, label) {
  const s = safeDiv(v, Math.abs(total));
  return s == null ? "" : F.signedPct(s) + " " + (label || "da variacao");
}

/* ------------------------------------------------------------- WATERFALL */

function renderWaterfall() {
  const r = currentResult();
  const m = getMethodology(state.methodology);
  const formulas = state.mode === "revenue" ? {
    price: m.priceFormula, volume: m.volumeFormula, mix: m.mixFormula, cross: m.crossFormula,
    new: "New = soma(Receita atual) dos itens sem periodo base",
    discontinued: "Discontinued = -soma(Receita base) dos itens sem periodo atual",
    other: "Other = soma(dReceita) dos itens sem preco unitario definido"
  } : {
    sellingPrice: "Selling price = soma((P1-P0) x Q1)",
    unitCost: "Unit cost = -soma((C1-C0) x Q1)",
    volume: "Volume = Volume(receita) - Volume(custo)",
    salesMix: "Sales mix = Mix(receita)",
    costMix: "Cost mix = -Mix(custo)",
    cross: m.crossFormula,
    new: "New = soma(GM atual) dos itens novos",
    discontinued: "Discontinued = -soma(GM base) dos descontinuados",
    other: "Other = soma(dGM) dos nao comparaveis"
  };
  const steps = r.bridge.steps.filter(s => s.value !== 0 || ["price", "volume", "mix", "sellingPrice", "unitCost", "salesMix", "costMix"].includes(s.key));
  waterfall($("#chart-waterfall"), {
    title: state.mode === "revenue" ? "Revenue bridge" : "Gross margin bridge",
    sub: (state.basePeriod || "base") + " → " + (state.currentPeriod || "atual") +
      " · " + m.label + " · residuo " + F.unitMoney(r.bridge.residual) + " (" + r.bridge.status + ")",
    base: r.base, current: r.current, steps,
    baseLabel: state.mode === "revenue" ? "Revenue base" : "GM base",
    currentLabel: state.mode === "revenue" ? "Revenue current" : "GM current",
    fmt: F.money, fmtSigned: F.signedMoney, fmtPct: F.signedPct,
    formulas,
    note: "Passe o mouse (ou navegue com Tab) sobre cada barra para ver valor, participacao na variacao e a formula aplicada."
  });
}

function renderContribution() {
  const r = currentResult();
  const rows = r.bridge.steps
    .filter(s => s.value !== 0)
    .map(s => ({ label: s.label, value: s.value }));
  contributionBars($("#chart-contrib"), {
    title: "Contribuicao por efeito",
    sub: state.contribMode === "pct" ? "Percentual do modulo da variacao total" : "Valores absolutos",
    rows, mode: state.contribMode, total: r.delta,
    fmt: F.money, fmtSigned: F.signedMoney, fmtPct: F.signedPct
  });
}

function renderDimensionChart() {
  const r = currentResult();
  const dim = state.dimension || defaultDimension();
  const groups = aggregateEffectsBy(state.filteredItems, r, dim)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 12);
  contributionBars($("#chart-dim"), {
    title: "Variacao por " + dimLabel(dim),
    sub: "Efeitos calculados no item e depois agregados — nunca recalculados sobre medias do grupo",
    rows: groups.map(g => ({
      label: g.group, value: g.delta,
      detail: state.mode === "revenue"
        ? "Price " + F.signedMoney(g.price) + " · Volume " + F.signedMoney(g.volume) + " · Mix " + F.signedMoney(g.mix)
        : "Preco " + F.signedMoney(g.sellingPrice) + " · Custo " + F.signedMoney(g.unitCost) + " · Mix " + F.signedMoney(g.salesMix)
    })),
    mode: "abs", fmt: F.money, fmtSigned: F.signedMoney, fmtPct: F.signedPct
  });
}

function renderMixMatrix() {
  const pts = mixMatrix(state.filteredItems, state.result.revenue);
  mixScatter($("#chart-mix"), {
    title: "Matriz de mix — diferencial de preco x variacao de participacao",
    sub: "Preco medio base do portfolio: " + F.unitMoney(state.result.revenue.stats.avgPriceBase) + " por unidade",
    points: pts,
    fmt: F.money, fmtSigned: F.unitMoney, fmtPP: F.pp, fmtPPN: F.ppN, fmtPct: F.pct,
    note: "Bolhas azuis: efeito Mix positivo. Bolhas vermelhas: efeito Mix negativo. Tamanho proporcional a receita atual."
  });
}

function renderTopDrivers() {
  const r = currentResult();
  const buckets = state.mode === "revenue"
    ? [["price", "Price"], ["volume", "Volume"], ["mix", "Mix"]]
    : [["sellingPrice", "Selling price"], ["unitCost", "Unit cost"], ["volume", "Volume"], ["salesMix", "Sales mix"]];
  const build = (side) => buckets.map(([key, label]) => {
    const t = topDrivers(state.filteredItems, r, key, 5);
    const list = t[side];
    return '<div style="margin-bottom:12px"><div class="eyebrow">' + esc(label) + "</div>" +
      (list.length ? '<table class="tbl"><tbody>' + list.map(d =>
        "<tr><td>" + esc(d.label) + '</td><td class="' + (d.value >= 0 ? "pos" : "neg") + '">' +
        F.signedMoney(d.value) + "</td></tr>").join("") + "</tbody></table>"
        : '<div class="pvm-empty" style="padding:10px">Nenhum item nesta direcao.</div>') + "</div>";
  }).join("");
  $("#top-pos").innerHTML = '<div class="tbl-scroll" style="padding:10px 12px">' + build("positive") + "</div>";
  $("#top-neg").innerHTML = '<div class="tbl-scroll" style="padding:10px 12px">' + build("negative") + "</div>";
}

/* ---------------------------------------------------------------- filtros */

/* Acima deste número de valores distintos, uma dimensão deixa de virar lista de
   seleção: 50 mil <option> travam a interface e ninguém escolhe numa lista
   assim. O motivo é dito na tela, e a busca da tabela de drivers cobre o caso. */
const FILTER_CARDINALITY_CAP = 300;

function renderFiltersPanel() {
  const dims = ["__status__"].concat(state.dimensionColumns);
  if (state.items.some(it => it.uom)) dims.push("__uom__");
  $("#filters-row").innerHTML = dims.map(d => {
    const values = distinctValues(state.items, d);
    const sel = state.filters[d] || [];
    if (values.length > FILTER_CARDINALITY_CAP) {
      return '<div class="pvm-filter"><span>' + esc(dimLabel(d)) + "</span>" +
        '<div class="pvm-note" style="margin:0">' + F.int(values.length) +
        " valores distintos — alto demais para uma lista de seleção. Use a busca na " +
        "<b>tabela de drivers</b> ou agrupe por esta dimensão em <b>Agrupar por</b>.</div></div>";
    }
    return '<div class="pvm-filter"><span>' + esc(dimLabel(d)) +
      (sel.length ? ' <span class="cnt">' + sel.length + " selecionado(s)</span>" : "") + "</span>" +
      '<select multiple data-filter="' + esc(d) + '" size="' + Math.min(6, Math.max(3, values.length)) + '">' +
      values.map(v => '<option value="' + esc(v) + '"' + (sel.includes(v) ? " selected" : "") + ">" +
        esc(v) + "</option>").join("") + "</select></div>";
  }).join("");
  $$("#filters-row select[data-filter]").forEach(s => {
    s.addEventListener("change", () => {
      const dim = s.dataset.filter;
      const vals = Array.from(s.selectedOptions).map(o => o.value);
      if (vals.length) state.filters[dim] = vals; else delete state.filters[dim];
      state.expanded.clear();
      runPVM();
    });
  });
}

function renderDimensionSelects() {
  const dims = state.dimensionColumns.concat(["__status__"]);
  if (state.items.some(it => it.uom)) dims.push("__uom__");
  const opts = dims.map(d => '<option value="' + esc(d) + '">' + esc(dimLabel(d)) + "</option>").join("");
  const ds = $("#dim-select");
  ds.innerHTML = opts;
  ds.value = state.dimension && dims.includes(state.dimension) ? state.dimension : dims[0];
  state.dimension = ds.value;

  const drill = $("#drill-select");
  drill.innerHTML = '<option value="__key__">Item (SKU)</option>' + opts;
  drill.value = state.drill || "__key__";
  state.drill = drill.value;
}

/* ------------------------------------------------------- tabela de drivers */

function bucketColumns() {
  const m = getMethodology(state.methodology);
  if (state.mode === "revenue") {
    const c = [["price", "Price"], ["volume", "Volume"], ["mix", "Mix"]];
    if (m.hasCross) c.push(["cross", "Cross"]);
    return c.concat([["new", "New"], ["discontinued", "Disc."], ["other", "Other"]]);
  }
  const c = [["sellingPrice", "Selling price"], ["unitCost", "Unit cost"],
             ["volume", "Volume"], ["salesMix", "Sales mix"], ["costMix", "Cost mix"]];
  if (m.hasCross) c.push(["cross", "Cross"]);
  return c.concat([["new", "New"], ["discontinued", "Disc."], ["other", "Other"]]);
}

function renderDriversTable() {
  const r = currentResult();
  const cols = bucketColumns();
  const grouping = state.drill && state.drill !== "__key__";
  let rows;

  if (grouping) {
    rows = aggregateEffectsBy(state.filteredItems, r, state.drill)
      .map(g => ({ id: g.group, label: g.group, group: true, base: g.base, current: g.current, delta: g.delta, buckets: g, items: g.items }));
  } else {
    rows = state.filteredItems.map(it => {
      const e = r.effects.get(it.key) || {};
      const base = state.mode === "gm" ? it.rev0 - (it.cogs0 || 0) : it.rev0;
      const cur = state.mode === "gm" ? it.rev1 - (it.cogs1 || 0) : it.rev1;
      return { id: it.key, label: it.label, status: it.status, group: false, base, current: cur, delta: cur - base, buckets: e, inScope: e.inScope !== false };
    }).filter(x => x.inScope);
  }

  const q = state.search.trim().toLowerCase();
  if (q) rows = rows.filter(x => String(x.label).toLowerCase().includes(q));

  const key = state.sort.key, dir = state.sort.dir === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    const va = key === "label" ? String(a.label) : (key === "delta" ? a.delta : (a.buckets[key] || 0));
    const vb = key === "label" ? String(b.label) : (key === "delta" ? b.delta : (b.buckets[key] || 0));
    if (typeof va === "string") return dir * va.localeCompare(vb, "pt-BR");
    return dir * (va - vb);
  });

  /* Teto de linhas no DOM. "Todos" com 50 mil itens travaria a interface por
     dezenas de segundos; o teto e declarado na legenda e a lista completa
     continua disponivel no CSV e no Excel. */
  const DOM_CAP = 1000;
  const wanted = state.topN > 0 ? state.topN : rows.length;
  const shown = Math.min(wanted, DOM_CAP, rows.length);
  const limited = rows.slice(0, shown);
  const domCapped = wanted > DOM_CAP && rows.length > DOM_CAP;
  const th = (k, label) => '<th class="sortable ' + (state.sort.key === k ? state.sort.dir : "") + '" data-sort="' + k + '">' + esc(label) + "</th>";

  let html = '<table class="tbl"><caption>' +
    (grouping ? "Drivers por " + esc(dimLabel(state.drill)) : "Drivers por item") +
    " — " + F.int(rows.length) + " linha(s)" +
    (shown < rows.length ? ", exibindo " + F.int(shown) : "") +
    (domCapped ? " (teto de " + F.int(DOM_CAP) + " linhas na tela — use a busca, ou baixe o CSV para a lista completa)" : "") +
    "</caption><thead><tr>" + th("label", grouping ? dimLabel(state.drill) : "Item") +
    (grouping ? "<th>Itens</th>" : "<th>Status</th>") +
    "<th>" + (state.mode === "gm" ? "GM base" : "Receita base") + "</th>" +
    "<th>" + (state.mode === "gm" ? "GM atual" : "Receita atual") + "</th>" +
    cols.map(([k, l]) => th(k, l)).join("") + th("delta", "Δ") + "</tr></thead><tbody>";

  if (!limited.length) {
    html += '<tr><td colspan="' + (cols.length + 5) + '"><div class="pvm-empty">Nenhuma linha corresponde ao filtro/busca.</div></td></tr>';
  }
  for (const x of limited) {
    const expandable = grouping;
    html += "<tr" + (expandable ? ' class="drill" data-group="' + esc(x.id) + '"' : "") + ">" +
      "<td>" + (expandable ? (state.expanded.has(x.id) ? "▾ " : "▸ ") : "") + esc(x.label) + "</td>" +
      (grouping ? "<td>" + F.int(x.items) + "</td>" : '<td class="st-' + esc(x.status) + '">' + esc(x.status) + "</td>") +
      "<td>" + F.money(x.base) + "</td><td>" + F.money(x.current) + "</td>" +
      cols.map(([k]) => '<td class="' + ((x.buckets[k] || 0) >= 0 ? "pos" : "neg") + '">' +
        ((x.buckets[k] || 0) === 0 ? "—" : F.signedMoney(x.buckets[k])) + "</td>").join("") +
      '<td class="' + (x.delta >= 0 ? "pos" : "neg") + '">' + F.signedMoney(x.delta) + "</td></tr>";

    if (expandable && state.expanded.has(x.id)) {
      const children = state.filteredItems
        .filter(it => groupValueOf(it, state.drill) === x.id)
        .map(it => {
          const e = r.effects.get(it.key) || {};
          const base = state.mode === "gm" ? it.rev0 - (it.cogs0 || 0) : it.rev0;
          const cur = state.mode === "gm" ? it.rev1 - (it.cogs1 || 0) : it.rev1;
          return { it, e, base, cur, delta: cur - base };
        })
        .filter(c => c.e.inScope !== false)
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
        .slice(0, 20);
      for (const c of children) {
        html += '<tr class="sub"><td style="padding-left:26px">↳ ' + esc(c.it.label) + "</td>" +
          '<td class="st-' + esc(c.it.status) + '">' + esc(c.it.status) + "</td>" +
          "<td>" + F.money(c.base) + "</td><td>" + F.money(c.cur) + "</td>" +
          cols.map(([k]) => "<td>" + ((c.e[k] || 0) === 0 ? "—" : F.signedMoney(c.e[k])) + "</td>").join("") +
          "<td>" + F.signedMoney(c.delta) + "</td></tr>";
      }
    }
  }
  html += "</tbody></table>";
  $("#drivers").innerHTML = html;

  $$("#drivers th.sortable").forEach(t => t.addEventListener("click", () => {
    const k = t.dataset.sort;
    state.sort = { key: k, dir: state.sort.key === k && state.sort.dir === "desc" ? "asc" : "desc" };
    renderDriversTable();
  }));
  $$("#drivers tr.drill").forEach(t => t.addEventListener("click", () => {
    const g = t.dataset.group;
    state.expanded.has(g) ? state.expanded.delete(g) : state.expanded.add(g);
    renderDriversTable();
  }));

  $("#drill-note").innerHTML = grouping
    ? "Clique em uma linha para abrir os itens do grupo (ate 20 por grupo, ordenados por materialidade). " +
      "Os efeitos do grupo sao a <b>soma dos efeitos calculados no item</b> — o simulador nunca recalcula PVM sobre medias agregadas."
    : "Cada linha e um item na menor granularidade disponivel. Ordene clicando no cabecalho.";
}

/* -------------------------------------------------------------- insights */

function renderInsights() {
  state.insights = generateInsights({
    result: state.result,
    items: state.filteredItems,
    fmt: F,
    filterLabel: filterLabel(),
    dimension: state.dimension,
    basePeriod: state.basePeriod,
    currentPeriod: state.currentPeriod
  });
  $("#insights").innerHTML = state.insights.map((i, idx) =>
    '<div class="pvm-insight ' + esc(i.kind) + '">' + esc(i.text) +
    '<button class="why" type="button" data-why="' + idx + '">Why?</button></div>').join("");
  $$("#insights .why").forEach(b => b.addEventListener("click", () => {
    const ins = state.insights[Number(b.dataset.why)];
    const p = ins.provenance;
    modal("Proveniencia do insight",
      "<h4>Afirmacao</h4><p>" + esc(ins.text) + "</p>" +
      "<h4>Calculation</h4><pre>" + esc(p.calculation) + "</pre>" +
      "<h4>Source values</h4><ul>" + p.sources.map(s => "<li>" + esc(s) + "</li>").join("") + "</ul>" +
      "<h4>Periods</h4><p>" + esc(p.periods) + "</p>" +
      "<h4>Filter</h4><p>" + esc(p.filter) + "</p>" +
      "<h4>Methodology</h4><p>" + esc(p.methodology) + " · " + esc(p.engine) + "</p>");
  }));

  const audit = auditNarrative(state.insights);
  const el = $("#narrative-audit");
  el.className = "pvm-audit " + (audit.pass ? "ok" : "bad");
  el.textContent = audit.pass
    ? "Auditoria da narrativa: nenhuma afirmacao causal sem evidencia nos dados (" + state.insights.length + " frases verificadas contra a lista de termos proibidos)."
    : "Auditoria da narrativa FALHOU: " + audit.violations.map(v => v.id + " → \"" + v.term + "\"").join("; ");
}

/* ------------------------------------------------------- model integrity */

function renderIntegrity() {
  const list = modelIntegrity(state.result, { rows: state.rowsSample, duplicates: state.duplicates });
  $("#integrity").innerHTML = list.map(c => {
    const cls = c.pass == null ? "" : (c.pass ? "pass" : "fail");
    const mark = c.pass == null ? "" : (c.pass ? "✓" : "✕");
    const val = c.numeric ? (c.value == null ? "—" : F.unitMoney(c.value))
      : (typeof c.value === "number" ? F.int(c.value) : esc(c.value));
    return '<div class="row ' + cls + '"><div class="l">' + esc(c.label) + "</div>" +
      '<div class="v">' + val + " <span>" + mark + "</span></div></div>";
  }).join("");
}

/* ----------------------------------------------------------- metodologia */

function renderMethodologyPanel() {
  const m = getMethodology(state.methodology);
  const r = state.result;
  const rev = r.revenue;
  $("#methodology-panel").innerHTML =
    "<h4>Metodologia adotada</h4><p><b>" + esc(m.label) + ".</b> " + esc(m.note) + "</p>" +
    '<div class="f">Price_i&nbsp;&nbsp;= ' + esc(m.priceFormula.split("= ")[1] || m.priceFormula) + "<br>" +
    "Volume_i = " + esc(m.volumeFormula.split("= ")[1] || m.volumeFormula) + "<br>" +
    "Mix_i&nbsp;&nbsp;&nbsp;&nbsp;= " + esc(m.mixFormula.split("= ")[1] || m.mixFormula) +
    (m.hasCross ? "<br>Cross_i&nbsp;&nbsp;= " + esc(m.crossFormula.split("= ")[1] || m.crossFormula) : "") + "</div>" +
    "<h4>Parametros calculados nesta analise</h4>" +
    '<div class="f">g&nbsp;&nbsp;&nbsp;= soma(Q1)/soma(Q0) = ' + rev.stats.growthFactor.toFixed(8) +
    "<br>Pm0 = soma(Receita0)/soma(Q0) = " + (rev.stats.avgPriceBase == null ? "n/d" : rev.stats.avgPriceBase.toFixed(8)) +
    (rev.stats.avgCostBase != null ? "<br>Cm0 = soma(COGS0)/soma(Q0) = " + rev.stats.avgCostBase.toFixed(8) : "") +
    "<br>populacao comparavel = " + rev.stats.activeItems + " itens</div>" +
    "<h4>Tratamento de novos e descontinuados</h4>" +
    "<p><b>New</b>: item ausente no periodo base. Efeito = receita do periodo atual, sem gerar preco nem mix. " +
    "<b>Discontinued</b>: item ausente no periodo atual. Efeito = menos a receita do periodo base. " +
    "Nenhum dos dois entra em <code>g</code> nem no preco medio do portfolio — se entrassem, o crescimento " +
    "de quantidade seria contaminado por itens sem par de comparacao.</p>" +
    "<h4>Itens nao comparaveis</h4>" +
    "<p>Item presente nos dois periodos, mas com quantidade nula ou negativa em algum deles: o preco unitario " +
    "seria uma divisao por zero. Esses itens vao integralmente para o balde <b>Other</b> — nunca para Price/Volume/Mix.</p>" +
    "<h4>Unidades de medida</h4>" +
    "<p>" + (r.uom.declared
      ? (r.uom.heterogeneous
        ? "<b>Heterogenea nesta analise</b> — unidades: " + esc(r.uom.units.join(", ")) + ". " + esc(r.uom.message)
        : "Homogenea (" + esc(r.uom.units[0] || "") + ").")
      : "UOM nao informada na base. O simulador nao consegue verificar a comparabilidade das quantidades.") + "</p>" +
    "<h4>Politica de arredondamento</h4>" +
    "<p>Nenhum arredondamento em etapa intermediaria; somatorio compensado (Neumaier) nos totais; " +
    "arredondamento apenas na exibicao e na exportacao.</p>" +
    "<h4>Tolerancia de reconciliacao</h4>" +
    "<p><code>max(0,01 ; |valor atual| x 1e-9)</code> = " + F.unitMoney(rev.bridge.tolerance) +
    ". Residuo observado na receita: <b>" + F.unitMoney(rev.bridge.residual) + "</b> (" + rev.bridge.status + ")" +
    (r.grossMargin ? "; na margem bruta: <b>" + F.unitMoney(r.grossMargin.bridge.residual) + "</b> (" + r.grossMargin.bridge.status + ")" : "") + ".</p>" +
    "<h4>Versao do motor</h4><p><code>PVM_ENGINE_VERSION = " + esc(PVM_ENGINE_VERSION) + "</code></p>";
}

function renderMethodComparison() {
  if (!state.result) return;
  state.methodCompareStale = false;
  const rows = compareMethodologies(state.filteredItems);
  $("#method-compare").innerHTML = '<table class="tbl"><thead><tr>' +
    "<th>Convencao</th><th>Price</th><th>Volume</th><th>Mix</th><th>Cross</th><th>Ponte</th></tr></thead><tbody>" +
    rows.map(c => '<tr class="' + (c.id === state.methodology ? "method-on" : "") + '">' +
      "<td>" + esc(c.label) + (c.id === state.methodology ? " <b>(ativa)</b>" : "") + "</td>" +
      "<td>" + F.signedMoney(c.buckets.price) + "</td>" +
      "<td>" + F.signedMoney(c.buckets.volume) + "</td>" +
      "<td>" + F.signedMoney(c.buckets.mix) + "</td>" +
      "<td>" + (c.hasCross ? F.signedMoney(c.buckets.cross) : "—") + "</td>" +
      '<td class="' + (c.pass ? "pos" : "neg") + '">' + (c.pass ? "PASS" : "FAIL") + "</td></tr>" +
      '<tr class="sub"><td colspan="6" class="mono">' + esc(c.priceFormula) + " &nbsp;|&nbsp; " +
      esc(c.volumeFormula) + " &nbsp;|&nbsp; " + esc(c.mixFormula) +
      (c.hasCross ? " &nbsp;|&nbsp; " + esc(c.crossFormula) : "") + "</td></tr>").join("") +
    "</tbody></table>" +
    '<p class="pvm-note">Os efeitos New, Discontinued e Other sao identicos em todas as convencoes — ' +
    "eles nao dependem da decomposicao preco/volume/mix. As quatro pontes fecham exatamente.</p>";
}

/* ============================================================ 9. EXPORTAR */

function exportContext() {
  const audit = buildAuditTrail({
    analysisId: state.analysisId,
    name: state.analysisName || ($("#analysis-name") && $("#analysis-name").value) || ("PVM " + (state.basePeriod || "") + " vs " + (state.currentPeriod || "")),
    fileName: state.fileName, fileSize: state.fileSize,
    sheetName: state.sheets[state.sheetIndex] ? state.sheets[state.sheetIndex].name : null,
    rowCount: state.rows, itemCount: state.filteredItems.length,
    layout: state.layout, mapping: state.mapping, periodGranularity: state.granularity,
    basePeriod: state.basePeriod, currentPeriod: state.currentPeriod,
    methodology: state.methodology, filters: activeFilters(),
    currency: state.currency, scale: state.scale,
    calculationVersion: PVM_ENGINE_VERSION,
    parserVersion: PVM_PARSER_VERSION,
    validatorVersion: PVM_VALIDATOR_VERSION
  });
  audit.filterLabel = filterLabel();
  state.analysisId = audit.analysisId;
  return {
    result: state.result, items: state.filteredItems, audit,
    validation: state.validation,
    integrity: modelIntegrity(state.result, { rows: state.rowsSample, duplicates: state.duplicates }),
    parseIssues: state.parseIssues,
    dimensionColumns: state.dimensionColumns,
    currencySymbol: CURRENCIES[state.currency] || ""
  };
}

/* ======================================================= 10. SALVAR/CARREGAR */

async function doSave() {
  if (!state.result) return;
  const name = $("#analysis-name").value.trim() || ("PVM " + state.basePeriod + " vs " + state.currentPeriod);
  state.analysisName = name;
  const ctx = exportContext();
  const rec = Object.assign({}, ctx.audit, {
    name,
    summary: {
      revenue: {
        base: state.result.revenue.base, current: state.result.revenue.current,
        delta: state.result.revenue.delta, buckets: state.result.revenue.buckets,
        residual: state.result.revenue.bridge.residual, status: state.result.revenue.bridge.status
      },
      grossMargin: state.result.grossMargin ? {
        base: state.result.grossMargin.base, current: state.result.grossMargin.current,
        delta: state.result.grossMargin.delta, buckets: state.result.grossMargin.buckets,
        gmPctBase: state.result.grossMargin.gmPctBase, gmPctCurrent: state.result.grossMargin.gmPctCurrent,
        residual: state.result.grossMargin.bridge.residual, status: state.result.grossMargin.bridge.status
      } : null,
      counts: state.result.counts,
      quality: state.validation ? state.validation.quality : null
    },
    // Itens agregados: permitem reabrir a analise sem o arquivo original.
    items: state.items.map(it => ({
      key: it.key, label: it.label, dims: it.dims, uom: it.uom,
      q0: it.q0, q1: it.q1, rev0: it.rev0, rev1: it.rev1,
      cogs0: it.cogs0, cogs1: it.cogs1
    })),
    dimensionColumns: state.dimensionColumns
  });
  const out = await saveAnalysis(rec);
  $("#save-status").innerHTML = out.ok
    ? "Salvo em <b>" + esc(out.backend) + "</b> · id <code>" + esc(out.analysisId) + "</code>" +
      (out.warning ? "<br>" + esc(out.warning) : "")
    : '<span style="color:var(--bad)">' + esc(out.warning) + "</span>";
  renderSavedList();
}

async function renderSavedList() {
  const list = await listAnalyses();
  const el = $("#saved-list");
  if (!el) return;
  if (!list.length) {
    el.innerHTML = '<div class="pvm-empty">Nenhuma analise salva neste navegador. Armazenamento disponivel: ' +
      esc(storageBackend()) + ".</div>";
    return 0;
  }
  el.innerHTML = '<table class="tbl"><thead><tr><th>Analise</th><th>Periodos</th><th>Metodologia</th>' +
    "<th>Δ Receita</th><th>Ponte</th><th>Criada em</th><th></th></tr></thead><tbody>" +
    list.map(a => "<tr><td>" + esc(a.name) + "</td><td>" + esc(String(a.basePeriod)) + " → " + esc(String(a.currentPeriod)) + "</td>" +
      "<td>" + esc((METHODOLOGIES[a.methodology] || {}).label || a.methodology || "—") + "</td>" +
      "<td>" + (a.summary ? F.signedMoney(a.summary.revenue.delta) : "—") + "</td>" +
      '<td class="' + (a.summary && a.summary.revenue.status === "PASS" ? "pos" : "neg") + '">' +
      (a.summary ? esc(a.summary.revenue.status) : "—") + "</td>" +
      "<td>" + esc(new Date(a.createdAt).toLocaleString("pt-BR")) + "</td>" +
      '<td><button class="btn" data-open="' + esc(a.analysisId) + '">Abrir</button> ' +
      '<button class="btn danger" data-del="' + esc(a.analysisId) + '">Excluir</button></td></tr>').join("") +
    "</tbody></table>";

  el.querySelectorAll("button[data-open]").forEach(b =>
    b.addEventListener("click", () => openSaved(b.dataset.open)));
  el.querySelectorAll("button[data-del]").forEach(b =>
    b.addEventListener("click", async () => { await deleteAnalysis(b.dataset.del); renderSavedList(); }));
  return list.length;
}

async function openSaved(id) {
  const rec = await loadAnalysis(id);
  if (!rec || !rec.items) { status("Analise nao encontrada ou sem itens salvos.", true); return; }
  overlay(true, "Reabrindo analise…", 40);
  try {
    state.analysisId = rec.analysisId;
    state.analysisName = rec.name;
    state.fileName = rec.fileName;
    state.fileSize = rec.fileSize;
    state.mapping = rec.mapping || {};
    state.layout = rec.layout || "long";
    state.granularity = rec.periodGranularity || "auto";
    state.basePeriod = rec.basePeriod;
    state.currentPeriod = rec.currentPeriod;
    state.methodology = rec.methodology || DEFAULT_METHODOLOGY;
    state.filters = rec.filters || {};
    state.currency = rec.currency || "BRL";
    state.scale = rec.scale || 1;
    state.dimensionColumns = rec.dimensionColumns || [];
    state.duplicates = [];
    state.parseIssues = null;
    state.rowsSample = [];
    state.rows = rec.rowCount || 0;
    // Reconstroi os itens a partir do registro salvo, reaplicando a classificacao.
    const { items } = aggregateItems(
      rec.items.flatMap(it => ([
        { key: it.key, label: it.label, period: "B", quantity: it.q0, revenue: it.rev0, cogs: it.cogs0, uom: it.uom, dims: it.dims },
        { key: it.key, label: it.label, period: "C", quantity: it.q1, revenue: it.rev1, cogs: it.cogs1, uom: it.uom, dims: it.dims }
      ])),
      { basePeriod: "B", currentPeriod: "C", dimensions: state.dimensionColumns }
    );
    state.items = items;
    $("#currency").value = state.currency;
    $("#scale").value = String(state.scale);
    $("#methodology").value = state.methodology;
    $("#analysis-name").value = rec.name || "";
    renderMethodNote();
    state.dimension = null;
    state.expanded.clear();
    runPVM({ reveal: true });
    status("Analise <b>" + esc(rec.name) + "</b> reaberta a partir do armazenamento local (" +
      esc(new Date(rec.createdAt).toLocaleString("pt-BR")) + "). Os itens agregados foram restaurados; " +
      "o arquivo original nao e armazenado.");
  } finally { overlay(false); }
}

/* ========================================================== 11. DEMO DATA */

/**
 * Dataset DEMO — sintetico e rotulado.
 * Nao representa nenhuma empresa real. Existe apenas para demonstrar o
 * funcionamento da ferramenta: 15 itens, dois periodos, com um item novo,
 * um descontinuado e variacoes de preco, volume e mix deliberadas.
 */
function demoDataset() {
  const cat = ["Bebidas", "Bebidas", "Bebidas", "Alimentos", "Alimentos", "Alimentos",
               "Higiene", "Higiene", "Limpeza", "Limpeza", "Limpeza", "Congelados",
               "Congelados", "Padaria", "Padaria"];
  const reg = ["Sudeste", "Sul", "Nordeste", "Sudeste", "Sul", "Centro-Oeste", "Sudeste",
               "Nordeste", "Sul", "Sudeste", "Norte", "Sudeste", "Sul", "Nordeste", "Sudeste"];
  const chn = ["Varejo", "Atacado", "Varejo", "Atacado", "Varejo", "Varejo", "Atacado",
               "Varejo", "Atacado", "Varejo", "Atacado", "Varejo", "Atacado", "Varejo", "Atacado"];
  const p0 = [12.50, 8.20, 24.90, 5.40, 3.10, 18.75, 32.00, 9.90, 6.80, 14.20, 4.50, 27.30, 11.60, 7.40, 21.00];
  const q0 = [42000, 88000, 12500, 156000, 240000, 9800, 6200, 71000, 132000, 38000, 195000, 8100, 54000, 96000, 15600];
  const p1 = [13.40, 8.05, 26.10, 5.65, 3.05, 19.90, 33.80, 10.30, 6.55, 15.10, 4.35, 28.90, 12.40, 7.10, 22.60];
  const q1 = [46500, 79000, 15800, 168000, 214000, 12600, 5400, 76500, 121000, 44500, 210000, 9700, 49000, 108000, 18900];
  const mg0 = [0.34, 0.28, 0.42, 0.24, 0.19, 0.46, 0.51, 0.31, 0.22, 0.37, 0.17, 0.44, 0.29, 0.26, 0.39];
  const mg1 = [0.33, 0.26, 0.44, 0.25, 0.17, 0.45, 0.53, 0.30, 0.20, 0.38, 0.16, 0.42, 0.31, 0.24, 0.41];

  const rows = [];
  for (let i = 0; i < 15; i++) {
    const sku = "DEMO-" + String(i + 1).padStart(3, "0");
    const name = "DEMO Produto " + String(i + 1).padStart(2, "0");
    const dims = { Categoria: cat[i], Regiao: reg[i], Canal: chn[i] };
    // item 12 (indice 11) e NOVO: nao existe no periodo base
    if (i !== 11) {
      rows.push({
        key: sku, label: name, period: "2024", uom: "UN", dims,
        quantity: q0[i], revenue: p0[i] * q0[i], cogs: p0[i] * q0[i] * (1 - mg0[i])
      });
    }
    // item 7 (indice 6) e DESCONTINUADO: nao existe no periodo atual
    if (i !== 6) {
      rows.push({
        key: sku, label: name, period: "2025", uom: "UN", dims,
        quantity: q1[i], revenue: p1[i] * q1[i], cogs: p1[i] * q1[i] * (1 - mg1[i])
      });
    }
  }
  return rows;
}

function loadDemo() {
  resetAnalysisState();
  const rows = demoDataset();
  const dims = ["Categoria", "Regiao", "Canal"];
  state.fileName = "DATASET DEMO (sintetico)";
  state.fileSize = null;
  state.kind = "demo";
  state.sheets = [{ index: 0, name: "DEMO", columns: ["SKU", "Produto", "Categoria", "Regiao", "Canal", "Periodo", "Quantidade", "Receita", "COGS", "UOM"], rowCount: rows.length, conventions: {} }];
  state.sheetIndex = 0;
  state.columns = state.sheets[0].columns;
  state.mapping = {
    sku: "SKU", product: "Produto", category: "Categoria", region: "Regiao", channel: "Canal",
    period: "Periodo", quantity: "Quantidade", revenue: "Receita", cogs: "COGS", uom: "UOM"
  };
  state.layout = "long";
  state.granularity = "auto";
  state.periods = [{ period: "2024", rows: 14 }, { period: "2025", rows: 14 }];
  state.basePeriod = "2024"; state.currentPeriod = "2025";
  state.rows = rows.length;
  state.rowsSample = rows;
  state.parseIssues = { nonNumericQuantity: 0, nonNumericRevenue: 0, nonNumericCogs: 0, missingKey: 0, missingPeriod: 0, derivedRevenue: 0, derivedCogs: 0 };
  state.preview = rows.slice(0, 50).map(r => [r.key, r.label, r.dims.Categoria, r.dims.Regiao, r.dims.Canal,
    r.period, String(r.quantity), r.revenue.toFixed(2), r.cogs.toFixed(2), r.uom]);
  state.dimensionColumns = dims;

  const agg = aggregateItems(rows, { basePeriod: "2024", currentPeriod: "2025", dimensions: dims });
  state.items = agg.items;
  state.duplicates = agg.duplicates;

  status("<b>Dataset DEMO carregado.</b> 15 produtos sinteticos, dois periodos (2024 → 2025), " +
    "com um produto novo e um descontinuado. <b>Rotulado como demonstracao — nao representa empresa real.</b>");
  renderMapping(); renderPreview(); renderDatasetStats(); renderPeriodSelectors();
  showStep(2); showStep(3);

  state.validation = validateDataset({
    mapping: state.mapping, layout: state.layout, rows, items: state.items,
    duplicates: state.duplicates, parseIssues: state.parseIssues,
    basePeriod: "2024", currentPeriod: "2025", bridgePass: null
  });
  renderValidation();
  runPVM({ reveal: true });
}

function resetAnalysisState() {
  state.filters = {};
  state.expanded.clear();
  state.dimension = null;
  state.drill = "__key__";
  state.search = "";
  state.analysisId = null;
  state.sort = { key: "delta", dir: "desc" };
}

/* =========================================================== 12. EVENTOS */

function overrideConventions() {
  if (state.decimal === "auto") return null;
  const out = {};
  for (const c of state.columns) out[c] = state.decimal;
  return out;
}

function setMode(mode) {
  state.mode = mode;
  $$("#mode-seg button").forEach(b => {
    const on = b.dataset.mode === mode;
    b.classList.toggle("on", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  });
  state.sort = { key: "delta", dir: "desc" };
  if (state.result) renderModeViews();
}

function wire() {
  /* --- upload --- */
  const drop = $("#drop"), input = $("#file");
  drop.addEventListener("click", () => input.click());
  drop.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
  input.addEventListener("change", () => { if (input.files[0]) handleFile(input.files[0]); });
  ["dragenter", "dragover"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add("drag"); }));
  ["dragleave", "drop"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove("drag"); }));
  drop.addEventListener("drop", e => { if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });

  $("#btn-demo").addEventListener("click", loadDemo);
  $("#btn-template").addEventListener("click", async () => {
    try { await exportTemplate(TEMPLATE_COLUMNS); }
    catch (e) { status("Nao foi possivel gerar o template: " + esc(e.message), true); }
  });
  $("#btn-load").addEventListener("click", () => { showStep(5, { scroll: true }); renderSavedList(); });

  /* --- mapeamento --- */
  $("#sheet").addEventListener("change", async e => {
    state.sheetIndex = Number(e.target.value);
    hideFrom(4);
    await inspectSheet(true);
  });
  $("#layout").addEventListener("change", async e => {
    state.layout = e.target.value; hideFrom(4); await inspectSheet(false);
  });
  $("#granularity").addEventListener("change", async e => {
    state.granularity = e.target.value; hideFrom(4); await inspectSheet(false);
  });
  $("#decimal").addEventListener("change", e => { state.decimal = e.target.value; hideFrom(4); });
  $("#btn-to-3").addEventListener("click", async () => {
    showStep(3, { scroll: true });
    await validateNow();
  });

  /* --- validacao --- */
  $("#base-period").addEventListener("change", async e => { state.basePeriod = e.target.value; await validateNow(); });
  $("#current-period").addEventListener("change", async e => { state.currentPeriod = e.target.value; await validateNow(); });
  $("#methodology").addEventListener("change", e => {
    state.methodology = e.target.value;
    renderMethodNote();
    savePrefs({ methodology: state.methodology, currency: state.currency, scale: state.scale });
    if (state.result) runPVM();
  });
  $("#method-help").addEventListener("click", showMethodHelp);
  $("#method-help").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showMethodHelp(); } });
  $("#btn-run").addEventListener("click", () => {
    overlay(true, "Calculando…", 60);
    setTimeout(() => { try { runPVM({ reveal: true }); } finally { overlay(false); } }, 20);
  });
  $("#btn-issues-csv").addEventListener("click", () => { if (state.validation) exportIssuesCsv(state.validation); });

  /* --- analise --- */
  $$("#mode-seg button").forEach(b => b.addEventListener("click", () => { if (!b.disabled) setMode(b.dataset.mode); }));
  $$("#contrib-seg button").forEach(b => b.addEventListener("click", () => {
    state.contribMode = b.dataset.mode;
    $$("#contrib-seg button").forEach(x => x.classList.toggle("on", x === b));
    renderContribution();
  }));
  $("#currency").addEventListener("change", e => {
    state.currency = e.target.value;
    savePrefs({ methodology: state.methodology, currency: state.currency, scale: state.scale });
    if (state.result) renderAll();
  });
  $("#scale").addEventListener("change", e => {
    state.scale = Number(e.target.value);
    savePrefs({ methodology: state.methodology, currency: state.currency, scale: state.scale });
    if (state.result) renderAll();
  });
  $("#btn-filters").addEventListener("click", () => {
    const p = $("#filters-panel");
    p.hidden = !p.hidden;
    $("#btn-filters").setAttribute("aria-expanded", p.hidden ? "false" : "true");
  });
  $("#btn-clear-filters").addEventListener("click", () => { state.filters = {}; state.expanded.clear(); runPVM(); });
  $("#dim-select").addEventListener("change", e => {
    state.dimension = e.target.value; renderDimensionChart(); renderInsights();
  });
  $("#drill-select").addEventListener("change", e => {
    state.drill = e.target.value; state.expanded.clear(); renderDriversTable();
  });
  $("#topn").addEventListener("change", e => { state.topN = Number(e.target.value); renderDriversTable(); });
  let searchTimer = null;
  $("#search").addEventListener("input", e => {
    clearTimeout(searchTimer);
    const v = e.target.value;
    searchTimer = setTimeout(() => { state.search = v; renderDriversTable(); }, 180);
  });
  $("#btn-csv").addEventListener("click", () => { if (state.result) exportToCsv(exportContext()); });

  /* --- exportacao --- */
  $("#btn-xlsx").addEventListener("click", async () => {
    if (!state.result) return;
    overlay(true, "Gerando o arquivo Excel…", 50);
    try {
      const out = await exportToExcel(exportContext());
      $("#save-status").innerHTML = "Excel gerado: <b>" + esc(out.fileName) + "</b> (" +
        F.int(out.bytes / 1024) + " KB, " + out.sheets + " abas).";
    } catch (e) {
      $("#save-status").innerHTML = '<span style="color:var(--bad)">Falha ao gerar o Excel: ' + esc(e.message) + "</span>";
    } finally { overlay(false); }
  });
  $("#btn-csv2").addEventListener("click", () => { if (state.result) exportToCsv(exportContext()); });
  $("#btn-json").addEventListener("click", () => { if (state.result) exportToJson(exportContext()); });
  $("#btn-save").addEventListener("click", doSave);

  $("#method-compare-details").addEventListener("toggle", (e) => {
    if (e.target.open && state.methodCompareStale && state.result) {
      $("#method-compare").innerHTML = '<div class="pvm-empty">Calculando as quatro convenções…</div>';
      setTimeout(renderMethodComparison, 20);
    }
  });

  /* --- modal --- */
  $("#modal-close").addEventListener("click", closeModal);
  $("#pvm-modal").addEventListener("click", e => { if (e.target.id === "pvm-modal") closeModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
}

function showMethodHelp() {
  const rows = Object.values(METHODOLOGIES).map(m =>
    "<h4>" + esc(m.label) + "</h4><p>" + esc(m.note) + "</p><pre>" +
    esc(m.priceFormula) + "\n" + esc(m.volumeFormula) + "\n" + esc(m.mixFormula) +
    (m.hasCross ? "\n" + esc(m.crossFormula) : "") + "</pre>").join("");
  modal("Convencoes metodologicas de PVM",
    "<p>As quatro convencoes decompoem a mesma variacao e todas reconciliam exatamente. " +
    "A diferenca esta em onde a interacao preco x quantidade e alocada e em como o balde de " +
    "quantidade e repartido entre Volume e Mix.</p>" + rows +
    "<h4>Notacao</h4><pre>P0_i, P1_i  preco unitario do item i (base, atual)\n" +
    "Q0_i, Q1_i  quantidade do item i (base, atual)\n" +
    "Pm0         preco medio ponderado base do portfolio = soma(Receita0)/soma(Q0)\n" +
    "g           soma(Q1)/soma(Q0) na populacao comparavel</pre>");
}

/* ============================================================== 13. INICIO */

function init() {
  const prefs = loadPrefs();
  if (prefs) {
    if (prefs.methodology && METHODOLOGIES[prefs.methodology]) state.methodology = prefs.methodology;
    if (prefs.currency && CURRENCIES[prefs.currency] != null) state.currency = prefs.currency;
    if (prefs.scale && SCALE_SUFFIX[prefs.scale] != null) state.scale = prefs.scale;
  }
  $("#currency").value = state.currency;
  $("#scale").value = String(state.scale);
  renderMethodologySelect();
  wire();
  renderSavedList().then(n => {
    if (!n) return;
    // Ja existem analises neste navegador: a etapa 05 fica acessivel de imediato,
    // para que reabrir um trabalho anterior nao exija subir o arquivo de novo.
    showStep(5);
    setStep(1);
    status("Ha <b>" + n + " analise" + (n > 1 ? "s" : "") + " salva" + (n > 1 ? "s" : "") +
      "</b> neste navegador. Voce pode <a href=\"#step-5\">reabrir uma delas</a> ou carregar uma base nova.");
  });
  window.addEventListener("resize", () => { if (state.result) redrawAll(document); });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();

/* Exposto apenas para inspecao no console e para os testes de browser. */
window.PVM = {
  state,
  version: { engine: PVM_ENGINE_VERSION, parser: PVM_PARSER_VERSION, validator: PVM_VALIDATOR_VERSION },
  run: runPVM, demo: loadDemo, F, STATUS
};
