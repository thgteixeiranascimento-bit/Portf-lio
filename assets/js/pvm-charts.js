/* ============================================================================
   pvm-charts.js — visualizacao (SVG puro)
   ----------------------------------------------------------------------------
   RESPONSABILIDADE UNICA: desenhar. Nao calcula nenhum efeito; recebe numeros
   ja prontos do motor.

   Reutiliza os tokens de cor e as classes do portfolio (.chart, .c-title,
   .legend, .viz-tip, .tbl-twin), de modo que os graficos ficam identicos aos
   dos outros simuladores e respondem a troca de tema claro/escuro.

   Acessibilidade (protocolo 64)
   - todo grafico tem role="img" + aria-label descritivo;
   - toda barra e focavel por teclado e anuncia seu valor;
   - todo grafico traz a tabela de dados equivalente em <details>;
   - o sinal do efeito nunca depende apenas da cor: ha rotulo com sinal e
     hachura diagonal nas barras negativas.
   ========================================================================== */

"use strict";

export const PVM_CHARTS_VERSION = "1.0.0";

const NS = "http://www.w3.org/2000/svg";

function el(tag, attrs) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  return e;
}
export function token(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/* ------------------------------------------------------------------ tooltip */

let tipEl = null;
function tip() {
  if (!tipEl) {
    tipEl = document.createElement("div");
    tipEl.className = "viz-tip";
    tipEl.setAttribute("role", "status");
    document.body.appendChild(tipEl);
  }
  return tipEl;
}
export function showTip(html, x, y) {
  const t = tip();
  t.innerHTML = html;
  t.style.opacity = "1";
  const w = t.offsetWidth, h = t.offsetHeight;
  let left = x + 14, top = y - h - 10;
  if (left + w > window.innerWidth - 8) left = Math.max(8, x - w - 14);
  if (top < 8) top = y + 16;
  t.style.left = left + "px";
  t.style.top = top + "px";
}
export function hideTip() { if (tipEl) tipEl.style.opacity = "0"; }

function tipRow(name, value, color) {
  return '<div class="r"><span style="display:flex;align-items:center;gap:6px">' +
    (color ? '<span class="sw" style="background:' + color + '"></span>' : "") +
    escapeHtml(name) + '</span><span class="v">' + escapeHtml(value) + "</span></div>";
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* --------------------------------------------------------------- utilitarios */

export function niceTicks(lo, hi, n) {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1];
  if (lo === hi) { hi = lo + Math.abs(lo || 1) * 0.1 + 1; }
  const span = hi - lo;
  const step0 = span / Math.max(2, n);
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const cand = [1, 2, 2.5, 5, 10].map(m => m * mag);
  const step = cand.find(s => span / s <= n + 1) || cand[cand.length - 1];
  const start = Math.floor(lo / step) * step;
  const ticks = [];
  for (let v = start; v <= hi + step * 0.51; v += step) ticks.push(Math.abs(v) < step * 1e-6 ? 0 : v);
  return ticks;
}

/**
 * scaffold — moldura comum: titulo, subtitulo, legenda, SVG responsivo e
 * tabela gemea. Redesenha ao mudar a largura ou o tema.
 */
function scaffold(host, opts, render) {
  function draw() {
    host.innerHTML = "";
    host.classList.add("chart");
    if (opts.title) {
      const d = document.createElement("div"); d.className = "c-title"; d.textContent = opts.title;
      host.appendChild(d);
    }
    if (opts.sub) {
      const d = document.createElement("div"); d.className = "c-sub"; d.textContent = opts.sub;
      host.appendChild(d);
    }
    if (opts.legend && opts.legend.length) {
      const lg = document.createElement("div"); lg.className = "legend";
      for (const k of opts.legend) {
        const s = document.createElement("span"); s.className = "key";
        s.innerHTML = '<span class="sw" style="background:' + k.color + '"></span>' + escapeHtml(k.name);
        lg.appendChild(s);
      }
      host.appendChild(lg);
    }
    const w = Math.max(320, host.clientWidth || 720);
    const svg = render(w);
    svg.setAttribute("role", "img");
    if (opts.ariaLabel) svg.setAttribute("aria-label", opts.ariaLabel);
    host.appendChild(svg);
    if (opts.twin) {
      const d = document.createElement("details");
      d.className = "tbl-twin";
      d.innerHTML = "<summary>" + (opts.twinLabel || "Ver dados em tabela") + "</summary>" +
        '<div class="tbl-scroll" style="margin:8px 0"><table class="tbl"><thead><tr>' +
        opts.twin.head.map(h => "<th>" + escapeHtml(h) + "</th>").join("") +
        "</tr></thead><tbody>" +
        opts.twin.rows.map(r => "<tr>" + r.map(c => "<td>" + escapeHtml(c) + "</td>").join("") + "</tr>").join("") +
        "</tbody></table></div>";
      host.appendChild(d);
    }
    if (opts.note) {
      const d = document.createElement("div"); d.className = "c-sub"; d.style.marginTop = "6px";
      d.textContent = opts.note;
      host.appendChild(d);
    }
  }
  draw();
  host._pvmDraw = draw;
  // core.js redesenha todo `figure.chart` que exponha _vizDraw ao trocar o
  // idioma; expor o mesmo desenhador mantém os gráficos em sincronia com o
  // alternador PT/EN do portfólio.
  host._vizDraw = draw;
  if (!host._pvmObserved) {
    host._pvmObserved = true;
    let lastW = host.clientWidth;
    if (typeof ResizeObserver === "function") {
      new ResizeObserver(() => {
        if (Math.abs(host.clientWidth - lastW) > 24) { lastW = host.clientWidth; host._pvmDraw && host._pvmDraw(); }
      }).observe(host);
    }
    if (window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const h = () => host._pvmDraw && host._pvmDraw();
      if (mq.addEventListener) mq.addEventListener("change", h);
    }
  }
}

/** Padrao de hachura para barras negativas (nao depender so de cor). */
function ensureHatch(svg, id, color) {
  const defs = el("defs", {});
  const p = el("pattern", { id, width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" });
  p.appendChild(el("rect", { width: 6, height: 6, fill: color }));
  p.appendChild(el("line", { x1: 0, y1: 0, x2: 0, y2: 6, stroke: "rgba(255,255,255,.42)", "stroke-width": 2.4 }));
  defs.appendChild(p);
  svg.appendChild(defs);
}

function axisGrid(svg, ticks, x0, x1, yOf, fmt) {
  for (const t of ticks) {
    const y = yOf(t);
    svg.appendChild(el("line", {
      x1: x0, x2: x1, y1: y, y2: y,
      stroke: Math.abs(t) < 1e-9 ? token("--baseline") : token("--grid"), "stroke-width": 1
    }));
    const lab = el("text", { x: x0 - 8, y: y + 4, "text-anchor": "end", "font-size": 11, fill: token("--muted") });
    lab.textContent = fmt(t);
    svg.appendChild(lab);
  }
}

function wrapLabel(svg, text, cx, y, maxChars) {
  const t = el("text", { x: cx, y, "text-anchor": "middle", "font-size": 10, fill: token("--muted") });
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; }
    else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  lines.slice(0, 2).forEach((ln, i) => {
    const ts = el("tspan", { x: cx, dy: i === 0 ? 0 : 11 });
    ts.textContent = lines.length > 2 && i === 1 ? ln.slice(0, maxChars - 1) + "…" : ln;
    t.appendChild(ts);
  });
  svg.appendChild(t);
  return lines.length;
}

/* -------------------------------------------------------------- 1. WATERFALL */

/**
 * waterfall — ponte Base -> efeitos -> Atual.
 *
 * @param {HTMLElement} host
 * @param {Object} opts
 * @param {Array<{key:string,label:string,value:number,kind:'total'|'effect'}>} opts.steps
 * @param {number} opts.base
 * @param {number} opts.current
 * @param {(v:number)=>string} opts.fmt
 * @param {(v:number)=>string} opts.fmtSigned
 * @param {(v:number)=>string} opts.fmtPct
 * @param {Object.<string,string>} [opts.formulas] formula por chave de efeito (tooltip)
 */
export function waterfall(host, opts) {
  const fmt = opts.fmt, fmtS = opts.fmtSigned, fmtP = opts.fmtPct;
  const delta = opts.current - opts.base;

  const bars = [];
  let acc = opts.base;
  bars.push({ label: opts.baseLabel || "Base", value: opts.base, from: 0, to: opts.base, kind: "total" });
  for (const s of opts.steps) {
    bars.push({ label: s.label, key: s.key, value: s.value, from: acc, to: acc + s.value, kind: "effect" });
    acc += s.value;
  }
  bars.push({ label: opts.currentLabel || "Atual", value: opts.current, from: 0, to: opts.current, kind: "total" });

  opts.twin = {
    head: ["Componente", "Valor", "% da variacao", "% da base"],
    rows: bars.map(b => [
      b.label,
      b.kind === "effect" ? fmtS(b.value) : fmt(b.value),
      b.kind === "effect" && delta !== 0 ? fmtP(b.value / Math.abs(delta)) : "—",
      opts.base !== 0 ? fmtP(b.value / Math.abs(opts.base)) : "—"
    ])
  };
  opts.ariaLabel = (opts.title || "Ponte") + ": de " + fmt(opts.base) + " para " + fmt(opts.current) +
    ", decomposta em " + opts.steps.map(s => s.label + " " + fmtS(s.value)).join(", ") + ".";

  scaffold(host, opts, (w) => {
    const n = bars.length;
    const h = opts.height || (n > 8 ? 330 : 300);
    // A margem esquerda tem de caber o maior rotulo do eixo: com valores em
    // unidades ("R$ 8.750.000") 66 px nao bastam e o texto sai do quadro.
    const probe = Math.max(fmt(opts.base).length, fmt(opts.current).length);
    const ml = Math.min(w * 0.28, Math.max(56, probe * 6.4 + 14));
    const mr = 14, mt = 26, mb = 52;
    const svg = el("svg", { viewBox: "0 0 " + w + " " + h, preserveAspectRatio: "xMidYMid meet" });
    /* s1 (âmbar) = favorável, s4 (violeta) = desfavorável, baseline = total.
       É a mesma atribuição do waterfall de core.js: neste sistema o vermelho
       fica reservado a FALHA (--bad), não a "número negativo" — por isso um
       efeito desfavorável é violeta, e não vermelho. */
    const pos = token("--s1"), neg = token("--s4"), tot = token("--baseline");
    ensureHatch(svg, "pvmHatchNeg", neg);

    /* ------------------------------------------------------------------
       Escala do eixo Y.

       Numa ponte de receita, a base costuma ser uma ordem de grandeza maior
       que os efeitos (8,2 mi de base contra 200 mil de preco). Forcando o eixo
       a comecar em zero, os efeitos viram fios de 3 px empilhados e o grafico
       deixa de informar. A pratica usual em pontes financeiras e truncar o
       eixo — e DIZER que ele foi truncado.

       Regra: se todos os valores forem positivos e a amplitude da ponte for
       menor que 35% do nivel, o eixo passa a comecar abaixo do menor valor
       acumulado, com aviso no rodape do grafico e marca de corte na base das
       barras de total. Fora disso, o eixo comeca em zero.
       ------------------------------------------------------------------ */
    // Os NIVEIS da ponte sao o que importa para a escala. As barras de total
    // carregam from = 0 por construcao; incluir esse zero aqui impediria
    // qualquer truncamento.
    const vals = bars.flatMap(b => (b.kind === "total" ? [b.to] : [b.from, b.to]));
    const minV = Math.min(...vals), maxV = Math.max(...vals);
    const span = maxV - minV;
    const truncate = opts.zeroBased !== true && minV > 0 && maxV > 0 && span > 0 && span / maxV < 0.35;

    let lo, hi;
    if (truncate) {
      const pad = span * 0.35;
      const ticks0 = niceTicks(minV - pad, maxV + span * 0.18, 4);
      lo = ticks0[0]; hi = ticks0[ticks0.length - 1];
      var ticks = ticks0;
    } else {
      const ticks0 = niceTicks(Math.min(0, minV), Math.max(0, maxV), 4);
      lo = ticks0[0]; hi = ticks0[ticks0.length - 1];
      var ticks = ticks0;
    }
    const x0 = ml, x1 = w - mr, y0 = h - mb, y1 = mt;
    const yOf = v => y0 - (v - lo) / (hi - lo || 1) * (y0 - y1);
    axisGrid(svg, ticks, x0, x1, yOf, fmt);

    const slot = (x1 - x0) / n;
    const bw = Math.max(8, Math.min(46, slot * 0.62));
    let lastLabel = null;

    bars.forEach((b, i) => {
      const x = x0 + slot * i + (slot - bw) / 2;
      // Com eixo truncado, a barra de total nasce no piso do eixo, e nao em zero
      const from = (truncate && b.kind === "total") ? lo : b.from;
      const yA = yOf(from), yB = yOf(b.to);
      // Um efeito pequeno diante de uma base grande vira um fio de 1px; a altura
      // minima de 3px garante que ele continue clicavel e visivel sem distorcer
      // a escala (o valor exato esta no rotulo, no tooltip e na tabela gemea).
      const raw = Math.abs(yA - yB);
      const hgt = b.kind === "effect" ? Math.max(3, raw) : Math.max(2, raw);
      const top = Math.min(yA, yB) - (hgt > raw ? (hgt - raw) / 2 : 0);
      const color = b.kind === "total" ? tot : (b.value >= 0 ? pos : "url(#pvmHatchNeg)");
      const solid = b.kind === "total" ? tot : (b.value >= 0 ? pos : neg);

      const rect = el("rect", {
        x, y: top, width: bw, height: hgt, rx: 3, fill: color,
        stroke: b.kind === "effect" ? solid : "none", "stroke-width": b.kind === "effect" ? 0.75 : 0,
        tabindex: 0, role: "listitem"
      });
      if (truncate && b.kind === "total") {
        // marca de corte: sinaliza que a barra nao comeca em zero
        const yb = y0 - 4;
        svg.appendChild(el("path", {
          d: "M" + x + " " + yb + " l" + (bw / 4) + " -5 l" + (bw / 4) + " 10 l" + (bw / 4) + " -10 l" + (bw / 4) + " 5",
          fill: "none", stroke: token("--page"), "stroke-width": 3.5
        }));
        svg.appendChild(el("path", {
          d: "M" + x + " " + yb + " l" + (bw / 4) + " -5 l" + (bw / 4) + " 10 l" + (bw / 4) + " -10 l" + (bw / 4) + " 5",
          fill: "none", stroke: token("--muted"), "stroke-width": 1
        }));
      }
      const pctVar = b.kind === "effect" && delta !== 0 ? fmtP(b.value / Math.abs(delta)) : "—";
      const pctBase = opts.base !== 0 ? fmtP(b.value / Math.abs(opts.base)) : "—";
      const formula = (opts.formulas && b.key && opts.formulas[b.key]) || null;
      const html = '<div class="t">' + escapeHtml(b.label) + "</div>" +
        tipRow(b.kind === "effect" ? "Efeito" : "Total", b.kind === "effect" ? fmtS(b.value) : fmt(b.value), solid) +
        tipRow("% da variacao", pctVar) +
        tipRow("% da base", pctBase) +
        (formula ? '<div style="margin-top:6px;font-size:.72rem;opacity:.85;max-width:280px">' + escapeHtml(formula) + "</div>" : "");
      rect.setAttribute("aria-label", b.label + ": " + (b.kind === "effect" ? fmtS(b.value) : fmt(b.value)) +
        (pctVar !== "—" ? ", " + pctVar + " da variacao" : ""));
      const show = ev => showTip(html, ev.clientX || (x + bw / 2), ev.clientY || top);
      rect.addEventListener("mousemove", show);
      rect.addEventListener("mouseleave", hideTip);
      rect.addEventListener("focus", () => {
        const r = rect.getBoundingClientRect();
        showTip(html, r.left + r.width / 2, r.top);
      });
      rect.addEventListener("blur", hideTip);
      svg.appendChild(rect);

      if (i < n - 1) {
        const nx = x0 + slot * (i + 1) + (slot - bw) / 2;
        const yc = yOf(b.kind === "total" && i === n - 1 ? b.to : b.to);
        svg.appendChild(el("line", {
          x1: x + bw, x2: nx, y1: yc, y2: yc,
          stroke: token("--grid"), "stroke-width": 1, "stroke-dasharray": "3 3"
        }));
      }

      // Rotulo do valor. Com uma base grande e efeitos pequenos, varios rotulos
      // caem quase na mesma altura e colidem; por isso eles sobem em degraus
      // quando o rotulo anterior ainda ocupa aquele espaco horizontal.
      const text = b.kind === "effect" ? fmtS(b.value) : fmt(b.value);
      const halfW = text.length * 2.9 + 3;
      const cx = x + bw / 2;
      let ly = top - 9;
      while (lastLabel && cx - halfW < lastLabel.right + 4 && Math.abs(ly - lastLabel.y) < 12 && ly > mt - 8) {
        ly -= 13;
      }
      lastLabel = { right: cx + halfW, y: ly };
      // Perto das bordas o rotulo passa a ser ancorado pela ponta, senao a
      // metade dele sai do quadro em telas estreitas.
      let anchor = "middle", lx = cx;
      if (cx - halfW < 2) { anchor = "start"; lx = Math.max(2, x); }
      else if (cx + halfW > w - 2) { anchor = "end"; lx = Math.min(w - 2, x + bw); }
      const lbl = el("text", {
        x: lx, y: Math.max(11, ly), "text-anchor": anchor,
        "font-size": 10.5, "font-weight": 600, fill: token("--ink-2")
      });
      lbl.textContent = text;
      svg.appendChild(lbl);
      if (ly < top - 17) {
        // fio ligando o rotulo deslocado ao topo da sua barra
        svg.appendChild(el("line", {
          x1: cx, x2: cx, y1: Math.max(13, ly) + 3, y2: top - 2,
          stroke: token("--grid"), "stroke-width": 1
        }));
      }

      wrapLabel(svg, b.label, cx, y0 + 16, Math.max(7, Math.floor(slot / 6.2)));
    });

    if (lo <= 0 && hi >= 0) {
      svg.appendChild(el("line", { x1: x0, x2: x1, y1: yOf(0), y2: yOf(0), stroke: token("--baseline"), "stroke-width": 1.2 }));
    }
    if (truncate) {
      const n2 = el("text", { x: x1, y: h - 6, "text-anchor": "end", "font-size": 10, fill: token("--muted") });
      n2.textContent = w < 640
        ? "Eixo truncado (nao comeca em zero)."
        : ("Eixo truncado: nao comeca em zero (a variacao e " + fmtP(span / maxV) +
           " do nivel). Alturas comparam efeitos entre si, nao contra a base.");
      svg.appendChild(n2);
    }
    return svg;
  });
}

/* --------------------------------------------------- 2. BARRAS DE CONTRIBUICAO */

/**
 * contributionBars — barras horizontais de contribuicao por efeito ou por grupo.
 * @param {Object} opts  { rows:[{label,value}], fmt, fmtPct, mode:'abs'|'pct', total }
 */
export function contributionBars(host, opts) {
  const rows = opts.rows.filter(r => Number.isFinite(r.value));
  const mode = opts.mode === "pct" ? "pct" : "abs";
  const totalAbs = opts.total != null ? Math.abs(opts.total) : rows.reduce((a, r) => a + Math.abs(r.value), 0);
  const val = r => mode === "pct" ? (totalAbs ? r.value / totalAbs : 0) : r.value;
  const fmtV = v => mode === "pct" ? opts.fmtPct(v) : opts.fmtSigned(v);

  opts.twin = {
    head: ["Item", mode === "pct" ? "% do total" : "Contribuicao"],
    rows: rows.map(r => [r.label, fmtV(val(r))])
  };
  opts.ariaLabel = (opts.title || "Contribuicao") + ": " +
    rows.map(r => r.label + " " + fmtV(val(r))).join("; ") + ".";

  scaffold(host, opts, (w) => {
    // A margem direita precisa caber o maior rotulo de valor; caso contrario
    // "+R$ 244.045" sai cortado como "+R$ 244.04".
    const widest = rows.reduce((m, r) => Math.max(m, fmtV(val(r)).length), 4);
    const rowH = 30, mt = 12, mb = 30;
    const ml = Math.min(190, Math.max(96, w * 0.26));
    const mr = Math.min(w * 0.42, Math.max(58, widest * 7.3 + 14));
    const h = mt + mb + rows.length * rowH;
    const svg = el("svg", { viewBox: "0 0 " + w + " " + h, preserveAspectRatio: "xMidYMid meet" });
    const pos = token("--s1"), neg = token("--s4");   /* mesma convenção do waterfall */
    ensureHatch(svg, "pvmHatchNeg2", neg);

    const values = rows.map(val);
    const maxAbs = Math.max(1e-9, ...values.map(Math.abs));
    const x0 = ml, x1 = w - mr;
    const zero = x0 + (x1 - x0) / 2;
    const scale = (x1 - x0) / 2 / maxAbs;

    svg.appendChild(el("line", { x1: zero, x2: zero, y1: mt, y2: h - mb, stroke: token("--baseline"), "stroke-width": 1 }));

    rows.forEach((r, i) => {
      const v = values[i];
      const y = mt + i * rowH + 5;
      const bh = rowH - 12;
      const len = Math.abs(v) * scale;
      const x = v >= 0 ? zero : zero - len;

      const rect = el("rect", {
        x, y, width: Math.max(1.5, len), height: bh, rx: 3,
        fill: v >= 0 ? pos : "url(#pvmHatchNeg2)", tabindex: 0
      });
      rect.setAttribute("aria-label", r.label + ": " + fmtV(v));
      const html = '<div class="t">' + escapeHtml(r.label) + "</div>" +
        tipRow(mode === "pct" ? "% do total" : "Contribuicao", fmtV(v), v >= 0 ? pos : neg) +
        (r.detail ? '<div style="margin-top:5px;font-size:.72rem;opacity:.85">' + escapeHtml(r.detail) + "</div>" : "");
      rect.addEventListener("mousemove", ev => showTip(html, ev.clientX, ev.clientY));
      rect.addEventListener("mouseleave", hideTip);
      rect.addEventListener("focus", () => { const b = rect.getBoundingClientRect(); showTip(html, b.left + b.width / 2, b.top); });
      rect.addEventListener("blur", hideTip);
      svg.appendChild(rect);

      const lab = el("text", { x: x0 - 10, y: y + bh / 2 + 4, "text-anchor": "end", "font-size": 11.5, fill: token("--ink") });
      const maxChars = Math.max(8, Math.floor((ml - 14) / 6.2));
      lab.textContent = r.label.length > maxChars ? r.label.slice(0, maxChars - 1) + "…" : r.label;
      svg.appendChild(lab);

      const vlab = el("text", {
        x: v >= 0 ? x + len + 7 : x - 7, y: y + bh / 2 + 4,
        "text-anchor": v >= 0 ? "start" : "end", "font-size": 11, "font-weight": 600, fill: token("--ink-2")
      });
      vlab.textContent = fmtV(v);
      svg.appendChild(vlab);
    });
    return svg;
  });
}

/* ------------------------------------------------------------ 3. MATRIZ DE MIX */

/**
 * mixScatter — diferencial de preco (X) x variacao de participacao (Y),
 * bolha proporcional a receita atual.
 *
 * Quadrantes:
 *   direita+cima  ganho de share em item mais caro -> mix favoravel
 *   esquerda+cima ganho de share em item mais barato -> mix desfavoravel
 */
export function mixScatter(host, opts) {
  const all = opts.points.filter(p => Number.isFinite(p.priceDifferential) && Number.isFinite(p.shareChange));

  /* --------------------------------------------------------------------
     Limite de pontos plotados.

     Uma bolha por item vira uma bolha por SKU: com 50 mil SKUs isso são
     50 mil nós de SVG, mais de 10 s de thread principal bloqueada e um
     gráfico ilegível (tudo sobreposto). O corte é por MATERIALIDADE — os
     itens de maior |efeito Mix|, que é justamente o que o gráfico existe
     para explicar — e a cobertura resultante é declarada no rodapé, nunca
     escondida. A lista completa continua na tabela de drivers e no CSV.
     -------------------------------------------------------------------- */
  const cap = opts.maxPoints || 500;
  let pts = all, truncatedPoints = false, coverage = 1;
  if (all.length > cap) {
    truncatedPoints = true;
    const totalAbs = all.reduce((a, p) => a + Math.abs(p.mixEffect || 0), 0);
    pts = all.slice().sort((a, b) => Math.abs(b.mixEffect || 0) - Math.abs(a.mixEffect || 0)).slice(0, cap);
    const shownAbs = pts.reduce((a, p) => a + Math.abs(p.mixEffect || 0), 0);
    coverage = totalAbs > 0 ? shownAbs / totalAbs : 1;
  }

  opts.twin = {
    head: ["Item", "Preco base vs. media", "Var. de participacao", "Receita atual", "Efeito Mix"],
    rows: pts.slice(0, 200).map(p => [
      p.label, opts.fmtSigned(p.priceDifferential), opts.fmtPP(p.shareChange),
      opts.fmt(p.revenueCurrent), opts.fmtSigned(p.mixEffect)
    ])
  };
  if (truncatedPoints) {
    const base = opts.note ? opts.note + " " : "";
    opts.note = base + "Exibindo os " + pts.length + " itens de maior efeito Mix, de " + all.length +
      " comparaveis — eles respondem por " + opts.fmtPct(coverage) +
      " do modulo do efeito Mix total. A lista completa esta na tabela de drivers e na exportacao.";
  }
  opts.ariaLabel = "Matriz de mix com " + pts.length + " itens" +
    (truncatedPoints ? " (os de maior efeito Mix, de " + all.length + " comparaveis)" : "") +
    ". Eixo horizontal: diferenca entre o preco base do item e o preco medio do portfolio. Eixo vertical: variacao da participacao em quantidade. Tamanho da bolha: receita do periodo atual.";

  scaffold(host, opts, (w) => {
    const h = opts.height || 340;
    const widestY = pts.length ? Math.max(...pts.map(q => opts.fmtPP(q.shareChange).length)) : 6;
    const widestX = pts.length ? Math.max(...pts.map(q => opts.fmtSigned(q.priceDifferential).length)) : 6;
    const ml = Math.min(w * 0.26, Math.max(58, widestY * 6.3 + 20));
    const mr = Math.min(w * 0.18, Math.max(18, widestX * 3.4));
    const mt = 34, mb = 52;
    const svg = el("svg", { viewBox: "0 0 " + w + " " + h, preserveAspectRatio: "xMidYMid meet" });
    if (!pts.length) {
      const t = el("text", { x: w / 2, y: h / 2, "text-anchor": "middle", "font-size": 12, fill: token("--muted") });
      t.textContent = "Sem itens comparaveis para a matriz de mix.";
      svg.appendChild(t);
      return svg;
    }
    const xs = pts.map(p => p.priceDifferential), ys = pts.map(p => p.shareChange);
    // Folga no dominio: a bolha tem raio, entao um item no valor maximo
    // encostaria (e passaria) da borda superior do grafico.
    const xPad = (Math.max(...xs) - Math.min(...xs)) * 0.08 || 1;
    const yPad = (Math.max(...ys) - Math.min(...ys)) * 0.14 || 0.001;
    const xTicks = niceTicks(Math.min(0, ...xs) - xPad, Math.max(0, ...xs) + xPad, 5);
    const yTicks = niceTicks(Math.min(0, ...ys) - yPad, Math.max(0, ...ys) + yPad, 4);
    const xlo = xTicks[0], xhi = xTicks[xTicks.length - 1];
    const ylo = yTicks[0], yhi = yTicks[yTicks.length - 1];

    /* Casas decimais do eixo de participacao vindas do PASSO do eixo. Numa base
       com 50 mil SKUs cada participacao e da ordem de 0,002%, e uma casa
       decimal fixa transformaria todos os rotulos em "+0,0 p.p.". */
    const yStep = yTicks.length > 1 ? Math.abs(yTicks[1] - yTicks[0]) : 0.01;
    const ppDec = yStep >= 0.01 ? 1 : yStep >= 0.001 ? 2 : yStep >= 0.0001 ? 3 : yStep >= 0.00001 ? 4 : 5;
    const ppFmt = opts.fmtPPN ? (v) => opts.fmtPPN(v, ppDec) : opts.fmtPP;
    const x0 = ml, x1 = w - mr, y0 = h - mb, y1 = mt;
    const xOf = v => x0 + (v - xlo) / (xhi - xlo || 1) * (x1 - x0);
    const yOf = v => y0 - (v - ylo) / (yhi - ylo || 1) * (y0 - y1);

    for (const t of yTicks) {
      const y = yOf(t);
      svg.appendChild(el("line", { x1: x0, x2: x1, y1: y, y2: y, stroke: token("--grid"), "stroke-width": 1 }));
      const lab = el("text", { x: x0 - 8, y: y + 4, "text-anchor": "end", "font-size": 11, fill: token("--muted") });
      lab.textContent = ppFmt(t);
      svg.appendChild(lab);
    }
    xTicks.forEach((t, i) => {
      const x = xOf(t);
      const anchor = i === 0 ? "start" : (i === xTicks.length - 1 ? "end" : "middle");
      const lab = el("text", { x, y: y0 + 17, "text-anchor": anchor, "font-size": 11, fill: token("--muted") });
      lab.textContent = opts.fmtSigned(t);
      svg.appendChild(lab);
    });
    svg.appendChild(el("line", { x1: xOf(0), x2: xOf(0), y1: y1, y2: y0, stroke: token("--baseline"), "stroke-width": 1.2 }));
    svg.appendChild(el("line", { x1: x0, x2: x1, y1: yOf(0), y2: yOf(0), stroke: token("--baseline"), "stroke-width": 1.2 }));

    const quad = (tx, ty, txt, anchor) => {
      // contorno na cor do fundo: mantem o rotulo legivel por cima das bolhas
      const t = el("text", {
        x: tx, y: ty, "text-anchor": anchor, "font-size": 10, fill: token("--muted"),
        "font-weight": 600, stroke: token("--surface"), "stroke-width": 3,
        "paint-order": "stroke", "stroke-linejoin": "round"
      });
      t.textContent = txt;
      svg.appendChild(t);
    };
    // Acima da area de dados (y1 - 8), para nunca cobrir uma bolha
    const qy = y1 - 8;
    if (w >= 560) {
      quad(x1 - 2, qy, "Mix favoravel: ganha share em item mais caro →", "end");
      quad(x0 + 2, qy, "← Mix desfavoravel: ganha share em item mais barato", "start");
    } else {
      quad(x1 - 2, qy, "Mix favoravel →", "end");
      quad(x0 + 2, qy, "← Mix desfavoravel", "start");
    }

    const maxRev = Math.max(1, ...pts.map(p => Math.abs(p.revenueCurrent)));
    const pos = token("--s1"), neg = token("--s4");   /* mesma convenção do waterfall */
    for (const p of pts) {
      const r = 4 + 14 * Math.sqrt(Math.abs(p.revenueCurrent) / maxRev);
      const c = el("circle", {
        cx: xOf(Math.max(xlo, Math.min(xhi, p.priceDifferential))),
        cy: yOf(Math.max(ylo, Math.min(yhi, p.shareChange))),
        r, tabindex: 0,
        fill: p.mixEffect >= 0 ? pos : neg, "fill-opacity": 0.45,
        stroke: p.mixEffect >= 0 ? pos : neg, "stroke-width": 1.4
      });
      const html = '<div class="t">' + escapeHtml(p.label) + "</div>" +
        tipRow("Preco base vs. media", opts.fmtSigned(p.priceDifferential)) +
        tipRow("Var. participacao", ppFmt(p.shareChange)) +
        tipRow("Receita atual", opts.fmt(p.revenueCurrent)) +
        tipRow("Efeito Mix", opts.fmtSigned(p.mixEffect), p.mixEffect >= 0 ? pos : neg);
      c.setAttribute("aria-label", p.label + ": diferencial de preco " + opts.fmtSigned(p.priceDifferential) +
        ", variacao de participacao " + ppFmt(p.shareChange) + ", efeito mix " + opts.fmtSigned(p.mixEffect));
      c.addEventListener("mousemove", ev => showTip(html, ev.clientX, ev.clientY));
      c.addEventListener("mouseleave", hideTip);
      c.addEventListener("focus", () => { const b = c.getBoundingClientRect(); showTip(html, b.left + b.width / 2, b.top); });
      c.addEventListener("blur", hideTip);
      svg.appendChild(c);
    }

    const xt = el("text", { x: (x0 + x1) / 2, y: h - 8, "text-anchor": "middle", "font-size": 11, fill: token("--ink-2") });
    xt.textContent = w >= 560
      ? "Preco base do item menos o preco medio do portfolio"
      : "Preco base vs. media do portfolio";
    svg.appendChild(xt);
    const yt = el("text", {
      x: 14, y: (y0 + y1) / 2, "text-anchor": "middle", "font-size": 11, fill: token("--ink-2"),
      transform: "rotate(-90 14 " + ((y0 + y1) / 2) + ")"
    });
    yt.textContent = w >= 560 ? "Variacao de participacao em quantidade" : "Var. de participacao";
    svg.appendChild(yt);
    return svg;
  });
}

/** Redesenha todos os graficos ja montados (usado ao trocar moeda/escala). */
export function redrawAll(root) {
  const scope = root || document;
  scope.querySelectorAll(".chart").forEach(c => { if (c._pvmDraw) c._pvmDraw(); });
}
