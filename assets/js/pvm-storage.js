/* ============================================================================
   pvm-storage.js — persistencia local das analises
   ----------------------------------------------------------------------------
   RESPONSABILIDADE UNICA: salvar e recuperar analises no proprio navegador.

   Nada e enviado para servidor. O GitHub Pages serve apenas arquivos estaticos
   e nao existe backend neste projeto — por isso a afirmacao de privacidade da
   interface e verdadeira por arquitetura, nao por promessa.

   IndexedDB e o armazenamento primario (suporta objetos grandes). Se ele nao
   estiver disponivel (modo privado antigo, politica de site), o modulo cai para
   localStorage e AVISA no retorno, para que a interface possa dizer ao usuario
   que o limite e menor.
   ========================================================================== */

"use strict";

export const PVM_STORAGE_VERSION = "1.0.0";

const DB_NAME = "pvm-simulator";
const DB_VERSION = 1;
const STORE = "analyses";
const LS_KEY = "pvm.analyses.v1";

function hasIDB() {
  try { return typeof indexedDB !== "undefined" && indexedDB !== null; } catch (e) { return false; }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const st = db.createObjectStore(STORE, { keyPath: "analysisId" });
        st.createIndex("createdAt", "createdAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Falha ao abrir o IndexedDB."));
  });
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    let result;
    try { result = fn(store); } catch (e) { reject(e); return; }
    t.oncomplete = () => resolve(result && result.result !== undefined ? result.result : result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

/* ------------------------------------------------------------- localStorage */

function lsRead() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}
function lsWrite(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

/* ------------------------------------------------------------------- API */

export function newAnalysisId() {
  const rnd = (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return "pvm-" + Date.now().toString(36) + "-" + rnd;
}

/**
 * buildAuditTrail — carimbo de auditoria salvo junto de cada analise
 * (protocolo 68). Sem ele nao e possivel reproduzir um resultado antigo.
 */
export function buildAuditTrail(ctx) {
  return {
    analysisId: ctx.analysisId || newAnalysisId(),
    name: ctx.name || "Analise sem nome",
    createdAt: new Date().toISOString(),
    fileName: ctx.fileName || null,
    fileSize: ctx.fileSize || null,
    sheetName: ctx.sheetName || null,
    rowCount: ctx.rowCount || 0,
    itemCount: ctx.itemCount || 0,
    layout: ctx.layout || null,
    mapping: ctx.mapping || {},
    periodGranularity: ctx.periodGranularity || "auto",
    basePeriod: ctx.basePeriod || null,
    currentPeriod: ctx.currentPeriod || null,
    methodology: ctx.methodology || null,
    filters: ctx.filters || {},
    currency: ctx.currency || null,
    scale: ctx.scale || null,
    calculationVersion: ctx.calculationVersion || null,
    parserVersion: ctx.parserVersion || null,
    validatorVersion: ctx.validatorVersion || null
  };
}

/**
 * saveAnalysis — grava a analise. `record` deve conter audit + resultados
 * resumidos (nao a base bruta, para nao estourar a cota do navegador).
 * @returns {Promise<{ok:boolean, backend:string, analysisId:string, warning?:string}>}
 */
export async function saveAnalysis(record) {
  const rec = Object.assign({}, record);
  if (!rec.analysisId) rec.analysisId = newAnalysisId();
  if (!rec.createdAt) rec.createdAt = new Date().toISOString();

  if (hasIDB()) {
    try {
      const db = await openDB();
      await tx(db, "readwrite", (st) => st.put(rec));
      db.close();
      return { ok: true, backend: "IndexedDB", analysisId: rec.analysisId };
    } catch (e) { /* cai para localStorage */ }
  }
  try {
    const list = lsRead().filter(r => r.analysisId !== rec.analysisId);
    list.push(rec);
    lsWrite(list);
    return {
      ok: true, backend: "localStorage", analysisId: rec.analysisId,
      warning: "IndexedDB indisponivel: a analise foi salva em localStorage, que tem limite menor (cerca de 5 MB)."
    };
  } catch (e) {
    return { ok: false, backend: "nenhum", analysisId: rec.analysisId, warning: "Nao foi possivel salvar: " + e.message };
  }
}

/** listAnalyses — metadados das analises salvas, mais recentes primeiro. */
export async function listAnalyses() {
  if (hasIDB()) {
    try {
      const db = await openDB();
      const all = await new Promise((resolve, reject) => {
        const t = db.transaction(STORE, "readonly");
        const req = t.objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
      db.close();
      return all.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    } catch (e) { /* cai para localStorage */ }
  }
  return lsRead().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function loadAnalysis(analysisId) {
  if (hasIDB()) {
    try {
      const db = await openDB();
      const rec = await new Promise((resolve, reject) => {
        const t = db.transaction(STORE, "readonly");
        const req = t.objectStore(STORE).get(analysisId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
      db.close();
      if (rec) return rec;
    } catch (e) { /* cai para localStorage */ }
  }
  return lsRead().find(r => r.analysisId === analysisId) || null;
}

export async function deleteAnalysis(analysisId) {
  if (hasIDB()) {
    try {
      const db = await openDB();
      await tx(db, "readwrite", (st) => st.delete(analysisId));
      db.close();
    } catch (e) { /* segue para localStorage */ }
  }
  try { lsWrite(lsRead().filter(r => r.analysisId !== analysisId)); } catch (e) { /* ignora */ }
  return true;
}

/** Preferencias leves (moeda, escala, metodologia) — sempre em localStorage. */
const PREF_KEY = "pvm.prefs.v1";
export function savePrefs(prefs) {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); return true; } catch (e) { return false; }
}
export function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

export function storageBackend() {
  return hasIDB() ? "IndexedDB" : (typeof localStorage !== "undefined" ? "localStorage" : "nenhum");
}
