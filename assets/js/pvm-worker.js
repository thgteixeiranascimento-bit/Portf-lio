/* ============================================================================
   pvm-worker.js — trabalho pesado fora da thread da interface
   ----------------------------------------------------------------------------
   Objetivo (protocolos 62 e 63): manter a interface responsiva com bases
   grandes. O worker faz leitura do arquivo, tipagem das colunas, normalizacao
   e agregacao por item; a thread principal recebe apenas os ITENS agregados,
   que sao ordens de grandeza menores que as linhas de origem, e a partir dai
   filtra e recalcula instantaneamente.

   A tabela completa fica na memoria do worker entre as mensagens, para que
   trocar o mapeamento ou o periodo nao exija reler o arquivo.
   ========================================================================== */

"use strict";

import { readFileToTable, matrixToTable, suggestMapping, detectLayout, listPeriods, normalizeRows, DIMENSION_FIELDS } from "./pvm-parser.js";
import { aggregateItems } from "./pvm-engine.js";

let session = null;   // { tables: [{name, table}], fileName, fileSize, kind, delimiter }

function post(id, ok, payload) {
  self.postMessage(Object.assign({ id, ok }, payload));
}
function progress(id, stage, pct) {
  self.postMessage({ id, progress: true, stage, pct });
}

self.onmessage = async (ev) => {
  const msg = ev.data || {};
  const id = msg.id;
  try {
    switch (msg.type) {
      case "load": {
        progress(id, "Lendo o arquivo", 10);
        const blob = new File([msg.buffer], msg.fileName, { type: msg.fileType || "" });
        const raw = await readFileToTable(blob);
        progress(id, "Identificando colunas", 55);
        const tables = raw.sheets.map(s => ({ name: s.name, table: matrixToTable(s.matrix) }));
        session = {
          tables, fileName: raw.fileName, fileSize: raw.fileSize,
          kind: raw.kind, delimiter: raw.delimiter || null
        };
        progress(id, "Pronto", 100);
        post(id, true, {
          fileName: raw.fileName, fileSize: raw.fileSize, kind: raw.kind, delimiter: raw.delimiter || null,
          sheets: tables.map((t, i) => ({
            index: i, name: t.name,
            columns: t.table.columns,
            rowCount: t.table.records.length,
            conventions: t.table.conventions
          }))
        });
        break;
      }

      case "inspect": {
        requireSession();
        const t = session.tables[msg.sheetIndex || 0];
        const mapping = msg.mapping && Object.keys(msg.mapping).length
          ? msg.mapping
          : suggestMapping(t.table.columns, t.table.records);
        const layout = msg.layout || detectLayout(t.table.columns, mapping);
        const periods = layout === "long" ? listPeriods(t.table.records, mapping, msg.periodGranularity) : [];
        post(id, true, {
          mapping, layout, periods,
          columns: t.table.columns,
          conventions: t.table.conventions,
          rowCount: t.table.records.length,
          preview: t.table.records.slice(0, 50).map(r => t.table.columns.map(c => serialize(r[c])))
        });
        break;
      }

      case "build": {
        requireSession();
        progress(id, "Normalizando linhas", 20);
        const t = session.tables[msg.sheetIndex || 0];
        const table = msg.conventions
          ? Object.assign({}, t.table, { conventions: msg.conventions })
          : t.table;
        const norm = normalizeRows(table, msg.mapping, {
          layout: msg.layout,
          periodGranularity: msg.periodGranularity
        });
        progress(id, "Agregando por item", 65);
        const dims = [];
        for (const f of DIMENSION_FIELDS) if (msg.mapping[f]) dims.push(msg.mapping[f]);
        const agg = aggregateItems(norm.rows, {
          basePeriod: msg.basePeriod,
          currentPeriod: msg.currentPeriod,
          dimensions: dims
        });
        progress(id, "Pronto", 100);
        post(id, true, {
          items: agg.items,
          duplicates: agg.duplicates,
          skippedRows: agg.skippedRows,
          rows: norm.rows.length,
          rowsSample: norm.rows.slice(0, 5000),
          parseIssues: norm.issues,
          periods: norm.periods,
          layout: norm.layout,
          dimensionColumns: dims
        });
        break;
      }

      default:
        post(id, false, { error: 'Mensagem desconhecida: "' + msg.type + '"' });
    }
  } catch (e) {
    post(id, false, { error: e && e.message ? e.message : String(e) });
  }
};

function requireSession() {
  if (!session) throw new Error("Nenhum arquivo carregado no worker.");
}

function serialize(v) {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}
