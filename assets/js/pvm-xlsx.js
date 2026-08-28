/* ============================================================================
   pvm-xlsx.js — codec XLSX minimo, sem dependencias externas
   ----------------------------------------------------------------------------
   O portfolio nao carrega bibliotecas de terceiros (funciona offline e no
   GitHub Pages sem CDN). Um arquivo .xlsx e um ZIP de XML, entao este modulo
   implementa apenas o que o simulador precisa:

     LEITURA   ZIP (central directory) + DEFLATE via DecompressionStream
               + varredura de XML (workbook, rels, sharedStrings, styles,
               worksheets), com deteccao de datas pelo numFmt.
     ESCRITA   ZIP (DEFLATE via CompressionStream, com fallback para STORE)
               + SpreadsheetML minimo com inlineStr e formatos financeiros.

   Compatibilidade: DecompressionStream/CompressionStream('deflate-raw') estao
   disponiveis em Chrome 80+, Edge 80+, Safari 16.4+, Firefox 113+ e Node 18+.
   Quando ausente, `xlsxSupport()` devolve false e o app orienta o uso de CSV.
   ========================================================================== */

"use strict";

/* ------------------------------------------------------------------ suporte */

export function xlsxReadSupported() {
  return typeof DecompressionStream === "function";
}
export function xlsxWriteSupported() {
  return true; // com CompressionStream comprime; sem ele, grava STORE
}

/* --------------------------------------------------------------------- CRC32 */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

/* ------------------------------------------------------------------ ZIP read */

async function inflateRaw(bytes) {
  const ds = new DecompressionStream("deflate-raw");
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

/**
 * unzip — le o central directory de um ZIP e devolve Map<nome, Uint8Array>.
 * Suporta os metodos 0 (stored) e 8 (deflate), que sao os unicos que o Excel
 * e o LibreOffice produzem.
 */
export async function unzip(arrayBuffer) {
  const u8 = new Uint8Array(arrayBuffer);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);

  // End Of Central Directory: assinatura 0x06054b50, varrendo de tras pra frente
  let eocd = -1;
  const minScan = Math.max(0, u8.length - 66000);
  for (let i = u8.length - 22; i >= minScan; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("Arquivo nao parece um .xlsx valido (ZIP sem diretorio central).");

  let entries = dv.getUint16(eocd + 10, true);
  let cdOffset = dv.getUint32(eocd + 16, true);
  let cdSize = dv.getUint32(eocd + 12, true);

  // ZIP64: valores 0xFFFFFFFF indicam que o real esta no EOCD64
  if (cdOffset === 0xFFFFFFFF || entries === 0xFFFF || cdSize === 0xFFFFFFFF) {
    for (let i = eocd - 20; i >= 0; i--) {
      if (dv.getUint32(i, true) === 0x07064b50) {
        const eocd64 = Number(dv.getBigUint64(i + 8, true));
        if (dv.getUint32(eocd64, true) === 0x06064b50) {
          entries = Number(dv.getBigUint64(eocd64 + 32, true));
          cdSize = Number(dv.getBigUint64(eocd64 + 40, true));
          cdOffset = Number(dv.getBigUint64(eocd64 + 48, true));
        }
        break;
      }
    }
  }

  const dec = new TextDecoder("utf-8");
  const files = new Map();
  let p = cdOffset;
  for (let n = 0; n < entries; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true);
    let compSize = dv.getUint32(p + 20, true);
    let uncompSize = dv.getUint32(p + 24, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    let localOff = dv.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nameLen));

    // campo extra ZIP64 (0x0001), quando os tamanhos estouram 32 bits
    if (compSize === 0xFFFFFFFF || uncompSize === 0xFFFFFFFF || localOff === 0xFFFFFFFF) {
      let ep = p + 46 + nameLen;
      const eEnd = ep + extraLen;
      while (ep + 4 <= eEnd) {
        const hid = dv.getUint16(ep, true), hsz = dv.getUint16(ep + 2, true);
        if (hid === 0x0001) {
          let q = ep + 4;
          if (uncompSize === 0xFFFFFFFF) { uncompSize = Number(dv.getBigUint64(q, true)); q += 8; }
          if (compSize === 0xFFFFFFFF) { compSize = Number(dv.getBigUint64(q, true)); q += 8; }
          if (localOff === 0xFFFFFFFF) { localOff = Number(dv.getBigUint64(q, true)); q += 8; }
          break;
        }
        ep += 4 + hsz;
      }
    }
    p += 46 + nameLen + extraLen + commentLen;

    if (name.endsWith("/")) continue;
    // cabecalho local: tamanhos de nome/extra podem diferir do central
    const lnLen = dv.getUint16(localOff + 26, true);
    const leLen = dv.getUint16(localOff + 28, true);
    const dataStart = localOff + 30 + lnLen + leLen;
    const raw = u8.subarray(dataStart, dataStart + compSize);
    files.set(name, { method, raw, uncompSize });
  }

  const out = new Map();
  for (const [name, f] of files) {
    if (f.method === 0) out.set(name, f.raw.slice());
    else if (f.method === 8) out.set(name, await inflateRaw(f.raw));
    else throw new Error('Metodo de compressao ZIP nao suportado (' + f.method + ') em "' + name + '".');
  }
  return out;
}

/* ----------------------------------------------------------------- ZIP write */

async function deflateRaw(bytes) {
  if (typeof CompressionStream !== "function") return null;
  try {
    const cs = new CompressionStream("deflate-raw");
    const stream = new Blob([bytes]).stream().pipeThrough(cs);
    const buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
  } catch (e) {
    return null;
  }
}

function dosDateTime(d) {
  const time = ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) | ((d.getSeconds() / 2) & 31);
  const date = (((d.getFullYear() - 1980) & 127) << 9) | (((d.getMonth() + 1) & 15) << 5) | (d.getDate() & 31);
  return { time, date };
}

/**
 * zip — monta um arquivo ZIP a partir de [{name, data:Uint8Array}].
 * Usa DEFLATE quando CompressionStream existe; caso contrario grava STORE
 * (o Excel abre os dois).
 */
export async function zip(entries, when) {
  const enc = new TextEncoder();
  const stamp = dosDateTime(when || new Date());
  const parts = [];
  const central = [];
  let offset = 0;

  for (const e of entries) {
    const nameBytes = enc.encode(e.name);
    const data = e.data;
    const crc = crc32(data);
    let method = 0, payload = data;
    const def = await deflateRaw(data);
    if (def && def.length < data.length) { method = 8; payload = def; }

    const local = new Uint8Array(30 + nameBytes.length);
    const ldv = new DataView(local.buffer);
    ldv.setUint32(0, 0x04034b50, true);
    ldv.setUint16(4, 20, true);            // version needed
    ldv.setUint16(6, 0x0800, true);        // flag: nomes em UTF-8
    ldv.setUint16(8, method, true);
    ldv.setUint16(10, stamp.time, true);
    ldv.setUint16(12, stamp.date, true);
    ldv.setUint32(14, crc, true);
    ldv.setUint32(18, payload.length, true);
    ldv.setUint32(22, data.length, true);
    ldv.setUint16(26, nameBytes.length, true);
    ldv.setUint16(28, 0, true);
    local.set(nameBytes, 30);

    parts.push(local, payload);
    central.push({ nameBytes, crc, method, comp: payload.length, uncomp: data.length, offset });
    offset += local.length + payload.length;
  }

  const cdStart = offset;
  for (const c of central) {
    const rec = new Uint8Array(46 + c.nameBytes.length);
    const dv = new DataView(rec.buffer);
    dv.setUint32(0, 0x02014b50, true);
    dv.setUint16(4, 20, true);
    dv.setUint16(6, 20, true);
    dv.setUint16(8, 0x0800, true);
    dv.setUint16(10, c.method, true);
    dv.setUint16(12, stamp.time, true);
    dv.setUint16(14, stamp.date, true);
    dv.setUint32(16, c.crc, true);
    dv.setUint32(20, c.comp, true);
    dv.setUint32(24, c.uncomp, true);
    dv.setUint16(28, c.nameBytes.length, true);
    dv.setUint32(42, c.offset, true);
    rec.set(c.nameBytes, 46);
    parts.push(rec);
    offset += rec.length;
  }

  const eocd = new Uint8Array(22);
  const edv = new DataView(eocd.buffer);
  edv.setUint32(0, 0x06054b50, true);
  edv.setUint16(8, central.length, true);
  edv.setUint16(10, central.length, true);
  edv.setUint32(12, offset - cdStart, true);
  edv.setUint32(16, cdStart, true);
  parts.push(eocd);

  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

/* ------------------------------------------------------------------ XML util */

const XML_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

export function xmlDecode(s) {
  if (s.indexOf("&") < 0) return s;
  return s.replace(/&(#x?[0-9A-Fa-f]+|[a-z]+);/g, (m, g) => {
    if (g[0] === "#") {
      const code = g[1] === "x" || g[1] === "X" ? parseInt(g.slice(2), 16) : parseInt(g.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return XML_ENTITIES[g] != null ? XML_ENTITIES[g] : m;
  });
}

export function xmlEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;")
    // caracteres de controle sao invalidos em XML 1.0
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

function attr(tag, name) {
  // (?:^|\s) evita casar "s=" dentro de outro nome de atributo (ex.: "cols=")
  const re = new RegExp('(?:^|\\s)' + name + '="([^"]*)"');
  const m = re.exec(tag);
  return m ? xmlDecode(m[1]) : null;
}

/**
 * scanElements — varredura linear de elementos <tag ...> ... </tag> ou <tag .../>.
 *
 * Um regex do tipo /<c\b([^>]*)(?:\/>|>([\s\S]*?)<\/c>)/ parece resolver, mas
 * falha: diante de <c r="A1"/><c r="B1"><v>1</v></c> o motor de regex prefere o
 * ramo ">...</c>" na posicao mais longa e engole DUAS celulas em uma so. A
 * varredura abaixo e deterministica e linear, e por isso tambem e mais rapida
 * em planilhas grandes.
 *
 * @param {string} xml
 * @param {string} tag  nome do elemento, sem "<"
 * @param {(attrs:string, inner:string)=>void} onEl
 */
function scanElements(xml, tag, onEl) {
  const re = new RegExp("<" + tag + "\\b([^>]*)>", "g");
  const close = "</" + tag + ">";
  let m;
  while ((m = re.exec(xml))) {
    let attrs = m[1];
    let inner = "";
    if (attrs.charCodeAt(attrs.length - 1) === 47 /* "/" */) {
      attrs = attrs.slice(0, -1);
    } else {
      const end = xml.indexOf(close, re.lastIndex);
      inner = end < 0 ? xml.slice(re.lastIndex) : xml.slice(re.lastIndex, end);
      re.lastIndex = end < 0 ? xml.length : end + close.length;
    }
    onEl("<" + tag + attrs + ">", inner);
  }
}

/* -------------------------------------------------------------- XLSX leitura */

const BUILTIN_DATE_FMT = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 45, 46, 47, 50, 51, 52, 53, 54, 55, 56, 57, 58]);

function parseStyles(xml) {
  const dateXf = new Set();
  if (!xml) return dateXf;
  const custom = new Map();
  scanElements(xml, "numFmt", (tag) => {
    const id = parseInt(attr(tag, "numFmtId"), 10);
    const code = attr(tag, "formatCode") || "";
    if (Number.isFinite(id)) custom.set(id, code);
  });
  const cellXfsBlock = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(xml);
  if (!cellXfsBlock) return dateXf;
  let i = 0;
  scanElements(cellXfsBlock[1], "xf", (tag) => {
    const idx = i++;
    const id = parseInt(attr(tag, "numFmtId"), 10);
    if (!Number.isFinite(id)) return;
    if (BUILTIN_DATE_FMT.has(id)) { dateXf.add(idx); return; }
    const code = custom.get(id);
    if (code) {
      // remove literais entre aspas e o marcador de cor antes de procurar y/m/d
      const clean = code.replace(/"[^"]*"/g, "").replace(/\[[^\]]*\]/g, "");
      if (/[ymd]/i.test(clean)) dateXf.add(idx);
    }
  });
  return dateXf;
}

function parseSharedStrings(xml) {
  const out = [];
  if (!xml) return out;
  scanElements(xml, "si", (tag, body) => {
    let text = "";
    const tRe = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
    let t;
    while ((t = tRe.exec(body))) text += xmlDecode(t[1]);
    out.push(text);
  });
  return out;
}

function colToIndex(ref) {
  let n = 0;
  for (let i = 0; i < ref.length; i++) {
    const c = ref.charCodeAt(i);
    if (c >= 65 && c <= 90) n = n * 26 + (c - 64);
    else if (c >= 97 && c <= 122) n = n * 26 + (c - 96);
    else break;
  }
  return n - 1;
}

/** Serial do Excel -> Date UTC (considera o bug do ano bissexto de 1900). */
export function excelSerialToDate(serial) {
  if (!Number.isFinite(serial)) return null;
  const ms = Math.round((serial - 25569) * 86400000);
  const d = new Date(ms);
  return isNaN(d.getTime()) ? null : d;
}

function parseSheet(xml, shared, dateXf) {
  const rows = [];
  scanElements(xml, "row", (rowTag, body) => {
    const rIdx = parseInt(attr(rowTag, "r"), 10);
    const cells = [];
    let auto = 0;
    scanElements(body, "c", (tag, inner) => {
      const ref = attr(tag, "r");
      const idx = ref ? colToIndex(ref) : auto;
      auto = idx + 1;
      const t = attr(tag, "t");
      const s = parseInt(attr(tag, "s"), 10);

      let value = null;
      if (t === "inlineStr") {
        let text = "";
        const tRe = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
        let tm;
        while ((tm = tRe.exec(inner))) text += xmlDecode(tm[1]);
        value = text;
      } else {
        const vm = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(inner);
        const rawV = vm ? xmlDecode(vm[1]) : null;
        if (rawV == null || rawV === "") value = null;
        else if (t === "s") value = shared[parseInt(rawV, 10)] != null ? shared[parseInt(rawV, 10)] : "";
        else if (t === "str") value = rawV;
        else if (t === "b") value = rawV === "1";
        else if (t === "e") value = null;                 // erro do Excel -> vazio
        else if (t === "d") value = rawV;                 // ISO 8601
        else {
          const num = Number(rawV);
          if (!Number.isFinite(num)) value = rawV;
          else if (Number.isFinite(s) && dateXf.has(s)) {
            const d = excelSerialToDate(num);
            value = d ? d : num;
          } else value = num;
        }
      }
      cells[idx] = value;
    });
    const target = Number.isFinite(rIdx) ? rIdx - 1 : rows.length;
    for (let i = 0; i < cells.length; i++) if (cells[i] === undefined) cells[i] = null;
    rows[target] = cells;
  });
  for (let i = 0; i < rows.length; i++) if (!rows[i]) rows[i] = [];
  return rows;
}

/**
 * readXlsx — le um .xlsx e devolve { sheets: [{ name, rows }] }.
 * `rows` e uma matriz de valores primitivos (string | number | boolean | Date | null).
 */
export async function readXlsx(arrayBuffer) {
  if (!xlsxReadSupported()) {
    throw new Error("Este navegador nao suporta a leitura de .xlsx sem bibliotecas externas (DecompressionStream ausente). Exporte a base como .csv e envie novamente.");
  }
  const files = await unzip(arrayBuffer);
  const dec = new TextDecoder("utf-8");
  const text = (name) => (files.has(name) ? dec.decode(files.get(name)) : null);

  const wbXml = text("xl/workbook.xml");
  if (!wbXml) throw new Error("Estrutura .xlsx inesperada: xl/workbook.xml nao encontrado.");
  const relsXml = text("xl/_rels/workbook.xml.rels") || "";
  const shared = parseSharedStrings(text("xl/sharedStrings.xml"));
  const dateXf = parseStyles(text("xl/styles.xml"));

  const relMap = new Map();
  scanElements(relsXml, "Relationship", (tag) => {
    const id = attr(tag, "Id");
    let target = attr(tag, "Target") || "";
    if (target.startsWith("/")) target = target.slice(1);
    else if (!target.startsWith("xl/")) target = "xl/" + target.replace(/^\.\//, "");
    relMap.set(id, target);
  });

  const sheets = [];
  let fallback = 0;
  scanElements(wbXml, "sheet", (tag) => {
    const name = attr(tag, "name") || ("Sheet" + (sheets.length + 1));
    const rid = attr(tag, "r:id") || attr(tag, "relationshipId");
    let path = rid ? relMap.get(rid) : null;
    if (!path || !files.has(path)) path = "xl/worksheets/sheet" + (++fallback) + ".xml";
    const xml = text(path);
    sheets.push({ name, rows: xml ? parseSheet(xml, shared, dateXf) : [] });
  });
  return { sheets };
}

/* -------------------------------------------------------------- XLSX escrita */

/* Formatos numericos personalizados registrados no styles.xml.
   Indices em cellXfs (usados como `style` nas celulas):
     0 geral | 1 negrito | 2 titulo | 3 moeda | 4 moeda negrito
     5 percentual | 6 p.p. | 7 numero | 8 data/hora | 9 cabecalho
     10 monoespacado (formulas) | 11 moeda 2 casas                        */
export const XLSX_STYLE = {
  DEFAULT: 0, BOLD: 1, TITLE: 2, MONEY: 3, MONEY_BOLD: 4,
  PERCENT: 5, PP: 6, NUMBER: 7, DATETIME: 8, HEADER: 9, CODE: 10, MONEY2: 11
};

function stylesXml(currencySymbol) {
  const cur = xmlEscape(currencySymbol || "");
  const money = cur ? '"' + cur + ' "#,##0;[Red]\\("' + cur + ' "#,##0\\)' : '#,##0;[Red]\\(#,##0\\)';
  const money2 = cur ? '"' + cur + ' "#,##0.00;[Red]\\("' + cur + ' "#,##0.00\\)' : '#,##0.00;[Red]\\(#,##0.00\\)';
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<numFmts count="5">' +
      '<numFmt numFmtId="164" formatCode="' + xmlEscape(money) + '"/>' +
      '<numFmt numFmtId="165" formatCode="0.0%"/>' +
      '<numFmt numFmtId="166" formatCode="+0.0&quot; p.p.&quot;;-0.0&quot; p.p.&quot;;0.0&quot; p.p.&quot;"/>' +
      '<numFmt numFmtId="167" formatCode="#,##0.00####"/>' +
      '<numFmt numFmtId="168" formatCode="' + xmlEscape(money2) + '"/>' +
    '</numFmts>' +
    '<fonts count="5">' +
      '<font><sz val="11"/><name val="Calibri"/></font>' +
      '<font><b/><sz val="11"/><name val="Calibri"/></font>' +
      '<font><b/><sz val="14"/><name val="Calibri"/></font>' +
      '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>' +
      '<font><sz val="10"/><name val="Consolas"/></font>' +
    '</fonts>' +
    '<fills count="3">' +
      '<fill><patternFill patternType="none"/></fill>' +
      '<fill><patternFill patternType="gray125"/></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FF1C5CAB"/><bgColor indexed="64"/></patternFill></fill>' +
    '</fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="12">' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
      '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
      '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
      '<xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>' +
      '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
      '<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
      '<xf numFmtId="167" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
      '<xf numFmtId="22" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
      '<xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
      '<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
      '<xf numFmtId="168" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '</cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>';
}

function indexToCol(n) {
  let s = "";
  n = n + 1;
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/** Date -> serial do Excel (dias desde 1899-12-30, com o bug de 1900). */
export function dateToExcelSerial(d) {
  const ms = d instanceof Date ? d.getTime() : Date.parse(d);
  if (!Number.isFinite(ms)) return null;
  return ms / 86400000 + 25569;
}

function cellXml(value, rowIdx, colIdx, style) {
  const ref = indexToCol(colIdx) + (rowIdx + 1);
  const st = style ? ' s="' + style + '"' : "";
  if (value instanceof Date) {
    const serial = dateToExcelSerial(value);
    return serial == null
      ? '<c r="' + ref + '"' + st + '/>'
      : '<c r="' + ref + '" s="' + (style || XLSX_STYLE.DATETIME) + '"><v>' + serial + '</v></c>';
  }
  if (value == null || value === "") return '<c r="' + ref + '"' + st + '/>';
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return '<c r="' + ref + '"' + st + '/>';
    return '<c r="' + ref + '"' + st + '><v>' + value + '</v></c>';
  }
  if (typeof value === "boolean") return '<c r="' + ref + '"' + st + ' t="b"><v>' + (value ? 1 : 0) + '</v></c>';
  return '<c r="' + ref + '"' + st + ' t="inlineStr"><is><t xml:space="preserve">' + xmlEscape(value) + '</t></is></c>';
}

/**
 * writeXlsx — gera um .xlsx a partir de abas declarativas.
 *
 * @param {Array<{name:string, rows:Array<Array<any>>, styles?:Array<Array<number>>, widths?:number[], freeze?:number}>} sheets
 * @param {{currencySymbol?:string, created?:Date}} [options]
 * @returns {Promise<Uint8Array>}
 */
export async function writeXlsx(sheets, options) {
  const opts = options || {};
  const enc = new TextEncoder();
  const list = sheets.filter(s => s && s.rows);
  if (!list.length) throw new Error("Nenhuma aba para exportar.");

  const files = [];
  const sheetPaths = list.map((s, i) => "xl/worksheets/sheet" + (i + 1) + ".xml");

  files.push({
    name: "[Content_Types].xml",
    data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      sheetPaths.map(p => '<Override PartName="/' + p + '" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join("") +
      '</Types>')
  });

  files.push({
    name: "_rels/.rels",
    data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>')
  });

  const usedNames = new Set();
  const sheetNames = list.map((s, i) => {
    let n = String(s.name || ("Sheet" + (i + 1))).replace(/[\\\/\?\*\[\]:]/g, "-").slice(0, 31) || ("Sheet" + (i + 1));
    let base = n, k = 2;
    while (usedNames.has(n.toLowerCase())) { n = (base.slice(0, 28) + "_" + k++); }
    usedNames.add(n.toLowerCase());
    return n;
  });

  files.push({
    name: "xl/workbook.xml",
    data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      sheetNames.map((n, i) => '<sheet name="' + xmlEscape(n) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join("") +
      '</sheets></workbook>')
  });

  files.push({
    name: "xl/_rels/workbook.xml.rels",
    data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      list.map((s, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join("") +
      '<Relationship Id="rId' + (list.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '</Relationships>')
  });

  files.push({ name: "xl/styles.xml", data: enc.encode(stylesXml(opts.currencySymbol)) });

  list.forEach((s, si) => {
    const rows = s.rows, styles = s.styles || [];
    const parts = [];
    parts.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">');
    if (s.freeze) {
      parts.push('<sheetViews><sheetView workbookViewId="0"><pane ySplit="' + s.freeze +
        '" topLeftCell="A' + (s.freeze + 1) + '" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>');
    }
    if (s.widths && s.widths.length) {
      parts.push("<cols>" + s.widths.map((w, i) =>
        '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + (w || 12) + '" customWidth="1"/>').join("") + "</cols>");
    }
    parts.push("<sheetData>");
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r] || [];
      const st = styles[r] || [];
      let cells = "";
      for (let c = 0; c < row.length; c++) cells += cellXml(row[c], r, c, st[c]);
      parts.push('<row r="' + (r + 1) + '">' + cells + "</row>");
    }
    parts.push("</sheetData></worksheet>");
    files.push({ name: sheetPaths[si], data: enc.encode(parts.join("")) });
  });

  return zip(files, opts.created);
}
