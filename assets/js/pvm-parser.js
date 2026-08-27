/* ============================================================================
   pvm-parser.js — ingestao de dados
   ----------------------------------------------------------------------------
   RESPONSABILIDADE UNICA: transformar um arquivo do usuario em uma tabela
   (colunas + linhas) e, depois, aplicar o mapeamento de colunas para produzir
   as linhas normalizadas que o motor consome. Nao calcula PVM.

   Tudo acontece no navegador: o arquivo e lido por FileReader/ArrayBuffer e
   nunca sai da maquina do usuario.

   Decisoes de projeto
   - Nenhum nome de coluna e obrigatorio. O parser SUGERE um mapeamento; quem
     decide e o usuario, na tela de mapeamento.
   - Numeros sao interpretados por coluna, nao por celula: a convencao decimal
     (virgula ou ponto) e inferida a partir de uma amostra da coluna inteira,
     o que evita ler "1.234" ora como 1234, ora como 1,234.
   - Nada e "corrigido" em silencio: valores que nao viram numero viram null e
     sao contabilizados para o painel de qualidade.
   ========================================================================== */

"use strict";

import { readXlsx, xlsxReadSupported } from "./pvm-xlsx.js";

export const PVM_PARSER_VERSION = "1.0.0";

/* ------------------------------------------------------------------ deteccao */

const DELIMITERS = [",", ";", "\t", "|"];

/** Escolhe o delimitador que produz o maior numero de colunas de forma estavel. */
export function detectDelimiter(sample) {
  const lines = sample.split(/\r\n|\n|\r/).filter(l => l.trim() !== "").slice(0, 20);
  if (!lines.length) return ",";
  let best = ",", bestScore = -1;
  for (const d of DELIMITERS) {
    const counts = lines.map(l => splitCsvLine(l, d).length);
    const first = counts[0];
    if (first < 2) continue;
    const stable = counts.filter(c => c === first).length / counts.length;
    const score = stable * 100 + first;
    if (score > bestScore) { bestScore = score; best = d; }
  }
  return best;
}

/** Divide UMA linha de CSV respeitando aspas duplas (RFC 4180). */
function splitCsvLine(line, delim) {
  const out = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === delim) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

/**
 * parseDelimitedText — CSV/TSV completo, com suporte a quebras de linha dentro
 * de campos entre aspas.
 */
export function parseDelimitedText(text, delimiter) {
  let s = text;
  if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);      // BOM
  const delim = delimiter || detectDelimiter(s.slice(0, 64 * 1024));

  const rows = [];
  let row = [], cur = "", inQ = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQ) {
      if (ch === '"') {
        if (s[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
      continue;
    }
    if (ch === '"') { inQ = true; continue; }
    if (ch === delim) { row.push(cur); cur = ""; continue; }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && s[i + 1] === "\n") i++;
      row.push(cur); cur = "";
      rows.push(row); row = [];
      continue;
    }
    cur += ch;
  }
  row.push(cur);
  if (row.length > 1 || row[0] !== "") rows.push(row);
  return { rows, delimiter: delim };
}

/* -------------------------------------------------------------- numeros/datas */

const CURRENCY_CHARS = /[R$€£¥₽₹\s '’]/g;

/**
 * inferDecimalConvention — decide, para uma COLUNA, se o separador decimal e
 * virgula (pt-BR/UE) ou ponto (EN). Usa a amostra inteira, nao a celula.
 *
 * Regra: se houver algum valor com ponto E virgula, o ultimo dos dois e o
 * decimal. Caso contrario, um separador que apareca sempre seguido de
 * exatamente 3 digitos e milhar; qualquer outro numero de casas indica decimal.
 */
export function inferDecimalConvention(samples) {
  let commaDecimal = 0, dotDecimal = 0;
  for (const raw of samples) {
    if (typeof raw !== "string") continue;
    const s = raw.replace(CURRENCY_CHARS, "").replace(/%$/, "").trim();
    if (!/[0-9]/.test(s)) continue;
    const lastComma = s.lastIndexOf(","), lastDot = s.lastIndexOf(".");
    if (lastComma >= 0 && lastDot >= 0) {
      if (lastComma > lastDot) commaDecimal++; else dotDecimal++;
      continue;
    }
    if (lastComma >= 0) {
      const tail = s.slice(lastComma + 1);
      if (/^[0-9]{3}$/.test(tail) && s.split(",").length > 2) continue; // 1,234,567
      if (/^[0-9]{3}$/.test(tail)) continue;                            // ambiguo: ignora
      if (/^[0-9]+$/.test(tail)) commaDecimal++;
    } else if (lastDot >= 0) {
      const tail = s.slice(lastDot + 1);
      if (/^[0-9]{3}$/.test(tail)) continue;                            // ambiguo: ignora
      if (/^[0-9]+$/.test(tail)) dotDecimal++;
    }
  }
  if (commaDecimal > dotDecimal) return "comma";
  if (dotDecimal > commaDecimal) return "dot";
  return "auto";
}

/**
 * toNumber — converte uma celula em numero, ou null.
 * Nunca devolve NaN nem Infinity.
 */
export function toNumber(value, convention) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Date) return null;

  let s = String(value).replace(CURRENCY_CHARS, "").trim();
  if (s === "" || s === "-" || s === "--") return null;

  let negative = false;
  if (/^\(.*\)$/.test(s)) { negative = true; s = s.slice(1, -1); }   // (1.234) contabil
  let percent = false;
  if (s.endsWith("%")) { percent = true; s = s.slice(0, -1); }

  const conv = convention || "auto";
  if (conv === "comma") s = s.replace(/\./g, "").replace(",", ".");
  else if (conv === "dot") s = s.replace(/,/g, "");
  else {
    const lastComma = s.lastIndexOf(","), lastDot = s.lastIndexOf(".");
    if (lastComma >= 0 && lastDot >= 0) {
      if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
      else s = s.replace(/,/g, "");
    } else if (lastComma >= 0) {
      const tail = s.slice(lastComma + 1);
      s = /^[0-9]{3}$/.test(tail) ? s.replace(/,/g, "") : s.replace(",", ".");
    }
  }
  s = s.replace(/−/g, "-").replace(/\s/g, "");
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(s)) return null;
  let n = Number(s);
  if (!Number.isFinite(n)) return null;
  if (percent) n = n / 100;
  return negative ? -n : n;
}

const MONTHS_PT = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };
const MONTHS_EN = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

/**
 * normalizePeriod — transforma o valor da coluna Periodo em um rotulo estavel.
 *
 * Datas viram um rotulo na granularidade escolhida (dia/mes/trimestre/ano), o
 * que habilita comparacoes Mes x Mes, Trimestre x Trimestre e Ano x Ano a
 * partir da mesma base. Textos livres ("Orcado", "Real", "FY24") sao mantidos
 * como estao — e o que permite Real x Orcado e Real x Forecast.
 */
export function normalizePeriod(value, granularity) {
  const g = granularity || "auto";
  const fmt = (y, m, d) => {
    if (g === "year") return String(y);
    if (g === "quarter") return y + "-Q" + (Math.floor((m - 1) / 3) + 1);
    if (g === "month") return y + "-" + String(m).padStart(2, "0");
    if (g === "day" || d != null) return y + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    return y + "-" + String(m).padStart(2, "0");
  };

  if (value instanceof Date && !isNaN(value.getTime())) {
    return fmt(value.getUTCFullYear(), value.getUTCMonth() + 1, g === "auto" ? value.getUTCDate() : value.getUTCDate());
  }
  if (value == null) return "";
  if (typeof value === "number") {
    if (value >= 1900 && value <= 2200 && Number.isInteger(value)) return String(value);
    return String(value);
  }
  const s = String(value).trim();
  if (s === "") return "";

  let m;
  if ((m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s))) return fmt(+m[1], +m[2], +m[3]);
  if ((m = /^(\d{4})-(\d{2})$/.exec(s))) return fmt(+m[1], +m[2], null);
  if ((m = /^(\d{4})[-\/ ]?[Qq]([1-4])$/.exec(s))) {
    const y = +m[1], q = +m[2];
    return g === "year" ? String(y) : y + "-Q" + q;
  }
  if ((m = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(s))) {
    // Convencao pt-BR (dd/mm/yyyy) por padrao. Se o SEGUNDO campo for > 12, so
    // pode ser dia, entao a data esta em mm/dd/yyyy.
    const a = +m[1], b = +m[2], y = +m[3];
    const usDay = b > 12 && a <= 12;
    return fmt(y, usDay ? a : b, usDay ? b : a);
  }
  if ((m = /^([a-zA-Zç]{3})[\/\-\s]?(\d{2,4})$/.exec(s))) {
    const key = m[1].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const mon = MONTHS_PT[key] || MONTHS_EN[key];
    if (mon) {
      let y = +m[2];
      if (y < 100) y += y < 70 ? 2000 : 1900;
      return fmt(y, mon, null);
    }
  }
  if (/^\d{4}$/.test(s)) return s;
  return s;
}

/* ------------------------------------------------------------- leitura de arquivo */

function extOf(name) {
  const m = /\.([a-z0-9]+)$/i.exec(name || "");
  return m ? m[1].toLowerCase() : "";
}

/** Decodifica bytes como UTF-8; se houver caracteres de substituicao, tenta latin1. */
function decodeText(buffer) {
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const bad = (utf8.match(/�/g) || []).length;
  if (bad === 0 || bad / Math.max(1, utf8.length) < 0.0002) return utf8;
  try { return new TextDecoder("windows-1252").decode(buffer); } catch (e) { return utf8; }
}

/**
 * readFileToTable — le um File/Blob e devolve as abas disponiveis como matrizes.
 * @returns {Promise<{kind:string, sheets:Array<{name:string, matrix:Array<Array<any>>}>, delimiter?:string, fileName:string, fileSize:number}>}
 */
export async function readFileToTable(file) {
  const name = file.name || "dados";
  const ext = extOf(name);
  const buffer = await file.arrayBuffer();

  if (ext === "xlsx" || ext === "xlsm" || ext === "xltx") {
    if (!xlsxReadSupported()) {
      throw new Error("Este navegador nao consegue abrir .xlsx sem bibliotecas externas. Salve a base como .csv e envie novamente.");
    }
    const wb = await readXlsx(buffer);
    return {
      kind: "xlsx", fileName: name, fileSize: file.size,
      sheets: wb.sheets.map(s => ({ name: s.name, matrix: s.rows }))
    };
  }
  if (ext === "xls") {
    throw new Error("O formato .xls (Excel 97-2003) nao e suportado. Abra no Excel e salve como .xlsx ou .csv.");
  }

  const text = decodeText(buffer);
  const delim = ext === "tsv" ? "\t" : detectDelimiter(text.slice(0, 64 * 1024));
  const parsed = parseDelimitedText(text, delim);
  return {
    kind: "csv", fileName: name, fileSize: file.size, delimiter: parsed.delimiter,
    sheets: [{ name: name, matrix: parsed.rows }]
  };
}

/* ------------------------------------------------------- matriz -> tabela tipada */

function isBlankRow(row) {
  return !row || row.every(c => c == null || String(c).trim() === "");
}

/**
 * matrixToTable — encontra a linha de cabecalho, nomeia colunas duplicadas e
 * infere a convencao decimal de cada coluna.
 */
export function matrixToTable(matrix) {
  const rows = (matrix || []).filter(r => !isBlankRow(r));
  if (!rows.length) return { columns: [], records: [], headerRow: 0, conventions: {} };

  // cabecalho = primeira linha nao vazia com maioria de celulas textuais
  let headerIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const r = rows[i];
    const filled = r.filter(c => c != null && String(c).trim() !== "");
    if (filled.length < 2) continue;
    const textual = filled.filter(c => typeof c === "string" && toNumber(c) == null).length;
    if (textual >= Math.ceil(filled.length * 0.6)) { headerIdx = i; break; }
  }

  const rawHeader = rows[headerIdx] || [];
  const width = rows.reduce((w, r) => Math.max(w, r.length), 0);
  const seen = new Map();
  const columns = [];
  for (let c = 0; c < width; c++) {
    let nm = rawHeader[c] == null ? "" : String(rawHeader[c]).trim();
    if (nm === "") nm = "Coluna " + (c + 1);
    const n = (seen.get(nm) || 0) + 1;
    seen.set(nm, n);
    columns.push(n > 1 ? nm + " (" + n + ")" : nm);
  }

  const body = rows.slice(headerIdx + 1);
  const records = body.map(r => {
    const o = {};
    for (let c = 0; c < width; c++) o[columns[c]] = r[c] == null ? null : r[c];
    return o;
  });

  const conventions = {};
  const sampleSize = Math.min(records.length, 400);
  for (const col of columns) {
    const samples = [];
    for (let i = 0; i < sampleSize; i++) {
      const v = records[i][col];
      if (typeof v === "string" && v.trim() !== "") samples.push(v);
    }
    conventions[col] = inferDecimalConvention(samples);
  }

  return { columns, records, headerRow: headerIdx, conventions };
}

/* -------------------------------------------------------- sugestao de mapeamento */

const FIELD_HINTS = {
  sku: ["sku", "codigo", "cod", "id", "item", "material", "produto id", "product id", "part number", "ean"],
  product: ["produto", "product", "descricao", "description", "nome", "name", "artigo"],
  category: ["categoria", "category", "grupo", "group", "familia", "family", "linha", "segmento", "product group"],
  period: ["periodo", "period", "data", "date", "mes", "month", "ano", "year", "competencia", "quarter", "trimestre", "cenario", "scenario", "versao", "version"],
  revenue: ["receita", "revenue", "faturamento", "vendas", "sales", "valor", "net sales", "amount", "turnover", "billing"],
  quantity: ["quantidade", "quantity", "qtd", "qty", "volume", "units", "unidades", "pecas"],
  unitPrice: ["preco", "price", "preco unitario", "unit price", "preco medio", "asp", "avg price"],
  cogs: ["cogs", "custo", "cost", "cmv", "cpv", "custo das vendas", "cost of goods", "custo total"],
  unitCost: ["custo unitario", "unit cost", "custo medio"],
  uom: ["uom", "unidade", "unit", "unidade de medida", "unit of measure", "um"],
  customer: ["cliente", "customer", "conta", "account", "comprador"],
  channel: ["canal", "channel", "rota"],
  region: ["regiao", "region", "pais", "country", "estado", "state", "uf", "territorio", "zona"],
  salesRep: ["vendedor", "sales rep", "representante", "consultor"],
  businessUnit: ["unidade de negocio", "business unit", "bu", "divisao", "division", "segmento"]
};

const WIDE_HINTS = {
  revenueBase: ["revenue py", "receita py", "revenue base", "receita base", "revenue ly", "receita ano anterior", "revenue prior"],
  revenueCurrent: ["revenue ac", "receita ac", "revenue current", "receita atual", "revenue cy", "revenue actual"],
  quantityBase: ["quantity py", "quantidade py", "quantity base", "quantidade base", "volume py", "qty py"],
  quantityCurrent: ["quantity ac", "quantidade ac", "quantity current", "quantidade atual", "volume ac", "qty ac"],
  cogsBase: ["cogs py", "custo py", "cogs base", "custo base"],
  cogsCurrent: ["cogs ac", "custo ac", "cogs current", "custo atual"]
};

function norm(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

function scoreHint(colName, hints) {
  const c = norm(colName);
  if (!c) return 0;
  let best = 0;
  for (const h of hints) {
    const hn = norm(h);
    if (c === hn) best = Math.max(best, 100);
    else if (c.startsWith(hn + " ") || c.endsWith(" " + hn)) best = Math.max(best, 80);
    else if (c.includes(hn)) best = Math.max(best, 60 + hn.length);
    else if (hn.includes(c) && c.length >= 3) best = Math.max(best, 40);
  }
  return best;
}

/**
 * suggestMapping — propoe um mapeamento inicial. E apenas uma SUGESTAO: a tela
 * de mapeamento sempre mostra o que foi detectado e permite trocar.
 */
export function suggestMapping(columns, records) {
  const used = new Set();
  const map = {};
  const pick = (field, hints) => {
    let best = null, bestScore = 45;
    for (const col of columns) {
      if (used.has(col)) continue;
      const sc = scoreHint(col, hints);
      if (sc > bestScore) { bestScore = sc; best = col; }
    }
    if (best) { map[field] = best; used.add(best); }
  };
  // campos mais especificos primeiro, para nao roubarem colunas dos genericos
  for (const f of ["revenueBase", "revenueCurrent", "quantityBase", "quantityCurrent", "cogsBase", "cogsCurrent"]) {
    pick(f, WIDE_HINTS[f]);
  }
  for (const f of ["sku", "period", "quantity", "revenue", "cogs", "unitPrice", "unitCost", "uom",
                   "category", "product", "customer", "channel", "region", "salesRep", "businessUnit"]) {
    pick(f, FIELD_HINTS[f]);
  }
  return map;
}

/**
 * detectLayout — LONG (uma linha por item x periodo) ou WIDE (uma linha por
 * item, com colunas separadas para base e atual).
 */
export function detectLayout(columns, mapping) {
  const m = mapping || {};
  const wideHits = ["revenueBase", "revenueCurrent", "quantityBase", "quantityCurrent"].filter(k => m[k]).length;
  if (wideHits >= 2 && !m.period) return "wide";
  if (m.period) return "long";
  return wideHits >= 2 ? "wide" : "long";
}

/** Lista os periodos distintos encontrados na coluna mapeada como Periodo. */
export function listPeriods(records, mapping, granularity) {
  const col = mapping.period;
  if (!col) return [];
  const counts = new Map();
  for (const r of records) {
    const p = normalizePeriod(r[col], granularity);
    if (p === "") continue;
    counts.set(p, (counts.get(p) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([period, rows]) => ({ period, rows }))
    .sort((a, b) => String(a.period).localeCompare(String(b.period), "pt-BR", { numeric: true }));
}

export const DIMENSION_FIELDS = ["category", "product", "customer", "channel", "region", "salesRep", "businessUnit"];

/**
 * normalizeRows — aplica o mapeamento e devolve as linhas que o motor consome:
 *   { key, label, period, quantity, revenue, cogs, uom, dims }
 *
 * Regras (todas explicitas, nenhuma silenciosa):
 * - Receita ausente e preco unitario presente  -> receita = preco x quantidade
 * - Preco ausente                              -> derivado em Receita/Quantidade
 *                                                 pelo motor, com guarda de zero
 * - COGS ausente e custo unitario presente     -> cogs = custo unitario x quantidade
 * - Celulas nao numericas viram null e sao contabilizadas em `issues`
 */
export function normalizeRows(table, mapping, options) {
  const opts = options || {};
  const layout = opts.layout || detectLayout(table.columns, mapping);
  const conv = table.conventions || {};
  const gran = opts.periodGranularity || "auto";
  const dims = {};
  for (const f of DIMENSION_FIELDS) if (mapping[f]) dims[f] = mapping[f];

  const num = (rec, col) => (col ? toNumber(rec[col], conv[col]) : null);
  const str = (rec, col) => {
    if (!col) return null;
    const v = rec[col];
    if (v == null) return null;
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    const s = String(v).trim();
    return s === "" ? null : s;
  };

  const issues = {
    nonNumericQuantity: 0, nonNumericRevenue: 0, nonNumericCogs: 0,
    missingKey: 0, missingPeriod: 0, derivedRevenue: 0, derivedCogs: 0
  };
  const out = [];
  const dimLabels = Object.keys(dims);

  const buildDims = (rec) => {
    const d = {};
    for (const f of dimLabels) d[mapping[f]] = str(rec, mapping[f]) || "";
    return d;
  };

  const keyCol = mapping.sku || mapping.product;
  const labelCol = mapping.product || mapping.sku;

  if (layout === "wide") {
    const BASE = opts.basePeriodLabel || "Base";
    const CUR = opts.currentPeriodLabel || "Atual";
    for (const rec of table.records) {
      const key = str(rec, keyCol);
      if (!key) { issues.missingKey++; continue; }
      const label = str(rec, labelCol) || key;
      const dd = buildDims(rec);
      const uom = str(rec, mapping.uom);

      const sides = [
        { period: BASE, q: num(rec, mapping.quantityBase), rev: num(rec, mapping.revenueBase), cogs: num(rec, mapping.cogsBase) },
        { period: CUR, q: num(rec, mapping.quantityCurrent), rev: num(rec, mapping.revenueCurrent), cogs: num(rec, mapping.cogsCurrent) }
      ];
      for (const s of sides) {
        if (s.q == null && s.rev == null && s.cogs == null) continue;
        out.push({
          key, label, period: s.period, uom, dims: dd,
          quantity: s.q, revenue: s.rev, cogs: s.cogs
        });
      }
    }
    return { rows: out, layout, issues, periods: [BASE, CUR] };
  }

  for (const rec of table.records) {
    const key = str(rec, keyCol);
    if (!key) { issues.missingKey++; continue; }
    const period = normalizePeriod(rec[mapping.period], gran);
    if (period === "") { issues.missingPeriod++; continue; }

    let quantity = num(rec, mapping.quantity);
    let revenue = num(rec, mapping.revenue);
    const unitPrice = num(rec, mapping.unitPrice);
    let cogs = num(rec, mapping.cogs);
    const unitCost = num(rec, mapping.unitCost);

    if (mapping.quantity && rec[mapping.quantity] != null && String(rec[mapping.quantity]).trim() !== "" && quantity == null) issues.nonNumericQuantity++;
    if (mapping.revenue && rec[mapping.revenue] != null && String(rec[mapping.revenue]).trim() !== "" && revenue == null) issues.nonNumericRevenue++;
    if (mapping.cogs && rec[mapping.cogs] != null && String(rec[mapping.cogs]).trim() !== "" && cogs == null) issues.nonNumericCogs++;

    if (revenue == null && unitPrice != null && quantity != null) { revenue = unitPrice * quantity; issues.derivedRevenue++; }
    if (cogs == null && unitCost != null && quantity != null) { cogs = unitCost * quantity; issues.derivedCogs++; }

    out.push({
      key,
      label: str(rec, labelCol) || key,
      period,
      uom: str(rec, mapping.uom),
      dims: buildDims(rec),
      quantity, revenue, cogs
    });
  }
  const periods = Array.from(new Set(out.map(r => r.period)))
    .sort((a, b) => String(a).localeCompare(String(b), "pt-BR", { numeric: true }));
  return { rows: out, layout, issues, periods };
}

/* ------------------------------------------------------------------ template */

export const TEMPLATE_COLUMNS = [
  { name: "SKU", required: true, note: "Identificador unico do item. Obrigatorio." },
  { name: "Product", required: false, note: "Nome do produto (rotulo nos graficos)." },
  { name: "Category", required: false, note: "Categoria/familia — usada em drill-down e filtros." },
  { name: "Period", required: true, note: "Periodo: 2025-01, 2025-Q1, 2025, Orcado, Forecast..." },
  { name: "Quantity", required: true, note: "Quantidade vendida. Obrigatoria para Volume e Mix." },
  { name: "Revenue", required: true, note: "Receita liquida do periodo. Se ausente, informe Unit Price." },
  { name: "COGS", required: false, note: "Custo dos produtos vendidos. Necessario para o PVM de Margem Bruta." },
  { name: "UOM", required: false, note: "Unidade de medida. Mix exige unidades comparaveis." },
  { name: "Customer", required: false, note: "Dimensao opcional." },
  { name: "Channel", required: false, note: "Dimensao opcional." },
  { name: "Region", required: false, note: "Dimensao opcional." }
];
