/* ============================================================
   core.js — utilidades compartilhadas do portfólio
   - navegação/rodapé
   - formatação pt-BR
   - mini-biblioteca de gráficos SVG (linha, barras, waterfall,
     tornado, faixa, dispersão, matriz de calor)
   Todos os gráficos têm: legenda, tooltip ao passar o mouse e
   tabela de dados equivalente (acessibilidade).
   ============================================================ */
(function () {
  "use strict";

  /* ---------- tokens de cor (lidos do CSS, reagem ao tema) ---------- */
  function tok(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  const COLORS = { s1: "--s1", s2: "--s2", s3: "--s3", s4: "--s4", ok: "--ok", bad: "--bad", muted: "--muted", baseline: "--baseline" };
  function col(c) { return COLORS[c] ? tok(COLORS[c]) : c; }

  /* ---------- formatação pt-BR ---------- */
  const nf = (min, max) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: min, maximumFractionDigits: max });
  const F = {
    mm:  v => nf(1, 1).format(Math.abs(v) < 0.05 ? 0 : v), // 1.090,0 (evita "-0,0")
    mm0: v => nf(0, 0).format(Math.round(v)),           // 1.090
    x2:  v => nf(2, 2).format(v),
    pc:  v => nf(1, 1).format(v * 100) + "%",
    pc0: v => nf(0, 0).format(v * 100) + "%",
    pp:  v => (v >= 0 ? "+" : "") + nf(1, 1).format(v * 100) + " p.p.",
    smm: v => (v >= 0 ? "+" : "") + nf(1, 1).format(v),
    spc: v => (v >= 0 ? "+" : "") + nf(1, 1).format(v * 100) + "%",
    dias: v => nf(0, 0).format(Math.round(v)) + " d",
    brl: v => "R$ " + nf(1, 1).format(v) + " mm",
  };

  /* ---------- ticks "bonitos" ---------- */
  function niceTicks(lo, hi, n) {
    if (lo === hi) { hi = lo + 1; }
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

  /* ---------- tooltip único ---------- */
  let tipEl = null;
  function tip() {
    if (!tipEl) { tipEl = document.createElement("div"); tipEl.className = "viz-tip"; document.body.appendChild(tipEl); }
    return tipEl;
  }
  function showTip(html, x, y) {
    const t = tip();
    t.innerHTML = html;
    t.style.opacity = "1";
    const w = t.offsetWidth, h = t.offsetHeight;
    let left = x + 14, top = y - h - 10;
    if (left + w > window.innerWidth - 8) left = x - w - 14;
    if (top < 8) top = y + 14;
    t.style.left = left + "px";
    t.style.top = top + "px";
  }
  function hideTip() { if (tipEl) tipEl.style.opacity = "0"; }
  function tipRow(name, color, val) {
    return `<div class="r"><span style="display:flex;align-items:center;gap:6px"><span class="sw" style="background:${color}"></span>${name}</span><span class="v">${val}</span></div>`;
  }

  /* ---------- infraestrutura comum de um gráfico ---------- */
  const registry = [];
  function svgEl(tag, attrs) {
    const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function scaffold(el, opts, render) {
    // opts: title, sub, series [{name,color}], twin {head, rows}
    function draw() {
      el.innerHTML = "";
      el.classList.add("chart");
      if (opts.title) { const d = document.createElement("div"); d.className = "c-title"; d.textContent = opts.title; el.appendChild(d); }
      if (opts.sub) { const d = document.createElement("div"); d.className = "c-sub"; d.textContent = opts.sub; el.appendChild(d); }
      if (opts.series && opts.series.length > 1) {
        const lg = document.createElement("div"); lg.className = "legend";
        opts.series.forEach(s => {
          const k = document.createElement("span"); k.className = "key";
          k.innerHTML = `<span class="sw ${s.kind === "line" ? "line" : ""}" style="background:${col(s.color)}"></span>${s.name}`;
          lg.appendChild(k);
        });
        el.appendChild(lg);
      }
      const w = Math.max(300, el.clientWidth - 38);
      const svg = render(w);
      el.appendChild(svg);
      if (opts.twin) {
        const d = document.createElement("details"); d.className = "tbl-twin";
        const rowsHtml = opts.twin.rows.map(r => "<tr>" + r.map((c, i) => i === 0 ? `<td>${c}</td>` : `<td>${c}</td>`).join("") + "</tr>").join("");
        d.innerHTML = `<summary>Ver dados em tabela</summary><div class="tbl-scroll" style="margin:8px 0"><table class="tbl"><thead><tr>${opts.twin.head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
        el.appendChild(d);
      }
    }
    draw();
    if (!el._vizObserved) {
      el._vizObserved = true;
      let tw = el.clientWidth;
      new ResizeObserver(() => { if (Math.abs(el.clientWidth - tw) > 24) { tw = el.clientWidth; el._vizDraw && el._vizDraw(); } }).observe(el);
      if (window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => el._vizDraw && el._vizDraw());
    }
    el._vizDraw = draw;
  }

  function axisAndGrid(svg, ticks, x0, x1, yOf, fmt) {
    ticks.forEach(t => {
      const y = yOf(t);
      svg.appendChild(svgEl("line", { x1: x0, x2: x1, y1: y, y2: y, stroke: tok("--grid"), "stroke-width": 1 }));
      const lab = svgEl("text", { x: x0 - 8, y: y + 4, "text-anchor": "end", "font-size": 11, fill: tok("--muted") });
      lab.textContent = fmt(t);
      svg.appendChild(lab);
    });
  }
  function xLabels(svg, labels, xOf, yBase, maxW) {
    const every = Math.ceil(labels.length / Math.max(3, Math.floor(maxW / 62)));
    labels.forEach((l, i) => {
      if (i % every !== 0 && i !== labels.length - 1) return;
      const t = svgEl("text", { x: xOf(i), y: yBase + 18, "text-anchor": "middle", "font-size": 11, fill: tok("--muted") });
      t.textContent = l;
      svg.appendChild(t);
    });
  }

  /* ---------- gráfico de linhas ---------- */
  function line(el, opts) {
    // opts: labels, series [{name, values, color, dash?}], fmt, title, sub, yZero, band? {from,to,label} (área sombreada p/ forecast)
    const fmt = opts.fmt || F.mm;
    opts.twin = opts.twin !== false ? {
      head: [""].concat(opts.series.map(s => s.name)),
      rows: opts.labels.map((l, i) => [l].concat(opts.series.map(s => s.values[i] == null ? "—" : fmt(s.values[i])))),
    } : null;
    scaffold(el, opts, (w) => {
      const h = opts.height || 250, ml = 52, mr = 14, mt = 12, mb = 28;
      const svg = svgEl("svg", { viewBox: `0 0 ${w} ${h}`, role: "img" });
      const all = opts.series.flatMap(s => s.values).filter(v => v != null);
      let lo = Math.min(...all), hi = Math.max(...all);
      if (opts.yZero !== false) lo = Math.min(0, lo);
      const ticks = niceTicks(lo, hi, 5);
      lo = ticks[0]; hi = ticks[ticks.length - 1];
      const x0 = ml, x1 = w - mr, y0 = h - mb, y1 = mt;
      const n = opts.labels.length;
      const xOf = i => x0 + (n === 1 ? 0.5 : i / (n - 1)) * (x1 - x0);
      const yOf = v => y0 - (v - lo) / (hi - lo) * (y0 - y1);
      if (opts.band) {
        const bx0 = xOf(opts.band.from), bx1 = xOf(opts.band.to);
        svg.appendChild(svgEl("rect", { x: bx0, y: y1, width: bx1 - bx0, height: y0 - y1, fill: tok("--surface-2"), opacity: .7 }));
        const t = svgEl("text", { x: bx0 + 6, y: y1 + 12, "font-size": 10, fill: tok("--muted") });
        t.textContent = opts.band.label || "";
        svg.appendChild(t);
      }
      axisAndGrid(svg, ticks, x0, x1, yOf, fmt);
      svg.appendChild(svgEl("line", { x1: x0, x2: x1, y1: yOf(Math.max(lo, 0)), y2: yOf(Math.max(lo, 0)), stroke: tok("--baseline"), "stroke-width": 1 }));
      xLabels(svg, opts.labels, xOf, y0, w);
      opts.series.forEach(s => {
        const c = col(s.color);
        let d = "", started = false;
        s.values.forEach((v, i) => { if (v == null) { started = false; return; } d += (started ? "L" : "M") + xOf(i) + " " + yOf(v); started = true; });
        const attrs = { d, fill: "none", stroke: c, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" };
        if (s.dash) attrs["stroke-dasharray"] = "5 4";
        svg.appendChild(svgEl("path", attrs));
        // marcador no último ponto com anel de superfície
        for (let i = s.values.length - 1; i >= 0; i--) if (s.values[i] != null) {
          svg.appendChild(svgEl("circle", { cx: xOf(i), cy: yOf(s.values[i]), r: 4.5, fill: c, stroke: tok("--surface"), "stroke-width": 2 }));
          break;
        }
      });
      // camada de hover: índice mais próximo + crosshair
      const cross = svgEl("line", { x1: 0, x2: 0, y1: y1, y2: y0, stroke: tok("--baseline"), "stroke-width": 1, opacity: 0 });
      svg.appendChild(cross);
      const overlay = svgEl("rect", { x: x0, y: y1, width: x1 - x0, height: y0 - y1, fill: "transparent" });
      overlay.addEventListener("mousemove", ev => {
        const r = svg.getBoundingClientRect();
        const px = (ev.clientX - r.left) / r.width * w;
        const i = Math.max(0, Math.min(n - 1, Math.round((px - x0) / ((x1 - x0) / Math.max(1, n - 1)))));
        cross.setAttribute("x1", xOf(i)); cross.setAttribute("x2", xOf(i)); cross.setAttribute("opacity", 1);
        let html = `<div class="t">${opts.labels[i]}</div>`;
        opts.series.forEach(s => { if (s.values[i] != null) html += tipRow(s.name, col(s.color), fmt(s.values[i])); });
        showTip(html, ev.clientX, ev.clientY);
      });
      overlay.addEventListener("mouseleave", () => { cross.setAttribute("opacity", 0); hideTip(); });
      svg.appendChild(overlay);
      return svg;
    });
  }

  /* ---------- barras (agrupadas) ---------- */
  function bars(el, opts) {
    // opts: labels, series [{name, values, color}], fmt, title, sub
    const fmt = opts.fmt || F.mm;
    opts.twin = {
      head: [""].concat(opts.series.map(s => s.name)),
      rows: opts.labels.map((l, i) => [l].concat(opts.series.map(s => s.values[i] == null ? "—" : fmt(s.values[i])))),
    };
    scaffold(el, opts, (w) => {
      const h = opts.height || 250, ml = 52, mr = 10, mt = 12, mb = 28;
      const svg = svgEl("svg", { viewBox: `0 0 ${w} ${h}` });
      const all = opts.series.flatMap(s => s.values).filter(v => v != null);
      let lo = Math.min(0, ...all), hi = Math.max(0, ...all);
      const ticks = niceTicks(lo, hi, 5);
      lo = ticks[0]; hi = ticks[ticks.length - 1];
      const x0 = ml, x1 = w - mr, y0 = h - mb, y1 = mt;
      const yOf = v => y0 - (v - lo) / (hi - lo) * (y0 - y1);
      axisAndGrid(svg, ticks, x0, x1, yOf, fmt);
      const n = opts.labels.length, ns = opts.series.length;
      const slot = (x1 - x0) / n;
      const bw = Math.min(24, (slot * 0.72 - 2 * (ns - 1)) / ns);
      const groupW = bw * ns + 2 * (ns - 1);
      const yZero = yOf(Math.max(0, lo));
      opts.labels.forEach((lab, i) => {
        const gx = x0 + slot * i + (slot - groupW) / 2;
        opts.series.forEach((s, j) => {
          const v = s.values[i], c = col(s.color);
          if (v == null) return; // valor ausente: sem barra (lacuna explícita)
          const yv = yOf(v);
          const top = Math.min(yv, yZero), bh = Math.max(1, Math.abs(yv - yZero));
          const rx = Math.min(4, bw / 2);
          const x = gx + j * (bw + 2);
          const p = v >= 0
            ? `M${x} ${top + bh} L${x} ${top + rx} Q${x} ${top} ${x + rx} ${top} L${x + bw - rx} ${top} Q${x + bw} ${top} ${x + bw} ${top + rx} L${x + bw} ${top + bh} Z`
            : `M${x} ${top} L${x + bw} ${top} L${x + bw} ${top + bh - rx} Q${x + bw} ${top + bh} ${x + bw - rx} ${top + bh} L${x + rx} ${top + bh} Q${x} ${top + bh} ${x} ${top + bh - rx} Z`;
          const path = svgEl("path", { d: p, fill: c });
          path.addEventListener("mousemove", ev => {
            let html = `<div class="t">${lab}</div>`;
            opts.series.forEach(ss => html += tipRow(ss.name, col(ss.color), ss.values[i] == null ? "—" : fmt(ss.values[i])));
            showTip(html, ev.clientX, ev.clientY);
          });
          path.addEventListener("mouseleave", hideTip);
          svg.appendChild(path);
        });
      });
      svg.appendChild(svgEl("line", { x1: x0, x2: x1, y1: yZero, y2: yZero, stroke: tok("--baseline"), "stroke-width": 1 }));
      xLabels(svg, opts.labels, i => x0 + slot * i + slot / 2, y0, w);
      return svg;
    });
  }

  /* ---------- waterfall / ponte ---------- */
  function waterfall(el, opts) {
    // opts: items [{l, v, k: 'start'|'d'|'end'}], fmt
    const fmt = opts.fmt || F.mm;
    const items = opts.items;
    // acumulado
    let acc = 0;
    const bars_ = items.map(it => {
      if (it.k === "start" || it.k === "end") { const b = { ...it, from: 0, to: it.v }; acc = it.v; return b; }
      const b = { ...it, from: acc, to: acc + it.v }; acc += it.v; return b;
    });
    opts.twin = { head: ["Item", "Valor"], rows: items.map(it => [it.l, (it.k === "d" ? F.smm(it.v) : fmt(it.v))]) };
    opts.series = null;
    scaffold(el, opts, (w) => {
      const h = opts.height || 260, ml = 52, mr = 10, mt = 14, mb = 44;
      const svg = svgEl("svg", { viewBox: `0 0 ${w} ${h}` });
      const allVals = bars_.flatMap(b => [b.from, b.to]);
      let lo = Math.min(0, ...allVals), hi = Math.max(...allVals);
      const ticks = niceTicks(lo, hi, 4);
      lo = ticks[0]; hi = ticks[ticks.length - 1];
      const x0 = ml, x1 = w - mr, y0 = h - mb, y1 = mt;
      const yOf = v => y0 - (v - lo) / (hi - lo) * (y0 - y1);
      axisAndGrid(svg, ticks, x0, x1, yOf, fmt);
      const n = bars_.length, slot = (x1 - x0) / n, bw = Math.min(38, slot * 0.62);
      bars_.forEach((b, i) => {
        const x = x0 + slot * i + (slot - bw) / 2;
        const yA = yOf(b.from), yB = yOf(b.to);
        const top = Math.min(yA, yB), bh = Math.max(1.5, Math.abs(yA - yB));
        const fav = opts.invert ? -b.v : b.v; // invert: delta positivo é desfavorável (ex.: aumento de NWC)
        const c = b.k === "d" ? (fav >= 0 ? col("s1") : col("s4")) : tok("--baseline");
        const r = svgEl("rect", { x, y: top, width: bw, height: bh, rx: 3, fill: c });
        r.addEventListener("mousemove", ev => showTip(`<div class="t">${b.l}</div>` + tipRow(b.k === "d" ? "Variação" : "Total", c, b.k === "d" ? F.smm(b.v) : fmt(b.v)), ev.clientX, ev.clientY));
        r.addEventListener("mouseleave", hideTip);
        svg.appendChild(r);
        if (i < n - 1 && b.k !== "end") {
          svg.appendChild(svgEl("line", { x1: x + bw, x2: x0 + slot * (i + 1) + (slot - bw) / 2, y1: yOf(b.to), y2: yOf(b.to), stroke: tok("--grid"), "stroke-width": 1 }));
        }
        // rótulo do valor
        const t = svgEl("text", { x: x + bw / 2, y: top - 5, "text-anchor": "middle", "font-size": 10.5, "font-weight": 600, fill: tok("--ink-2") });
        t.textContent = b.k === "d" ? F.smm(b.v) : fmt(b.v);
        svg.appendChild(t);
        // rótulo do item (2 linhas se preciso)
        const words = b.l.split(" ");
        const l1 = words.slice(0, Math.ceil(words.length / 2)).join(" ");
        const l2 = words.slice(Math.ceil(words.length / 2)).join(" ");
        const short = b.l.length <= 10;
        const tx = svgEl("text", { x: x + bw / 2, y: y0 + 14, "text-anchor": "middle", "font-size": 10, fill: tok("--muted") });
        if (short || slot > 90) { tx.textContent = b.l; }
        else {
          const s1 = svgEl("tspan", { x: x + bw / 2, dy: 0 }); s1.textContent = l1;
          const s2 = svgEl("tspan", { x: x + bw / 2, dy: 12 }); s2.textContent = l2;
          tx.appendChild(s1); tx.appendChild(s2);
        }
        svg.appendChild(tx);
      });
      svg.appendChild(svgEl("line", { x1: x0, x2: x1, y1: yOf(Math.max(0, lo)), y2: yOf(Math.max(0, lo)), stroke: tok("--baseline"), "stroke-width": 1 }));
      return svg;
    });
  }

  /* ---------- barras horizontais (tornado / contribuição) ---------- */
  function hbars(el, opts) {
    // opts: items [{l, v}] (em torno de 0) ou tornado {l, lo, hi}; fmt
    const fmt = opts.fmt || F.mm;
    const isRange = opts.items.length && opts.items[0].lo !== undefined;
    opts.twin = isRange
      ? { head: ["Item", "Mín.", "Máx."], rows: opts.items.map(it => [it.l, fmt(it.lo), fmt(it.hi)]) }
      : { head: ["Item", "Valor"], rows: opts.items.map(it => [it.l, F.smm(it.v)]) };
    opts.series = null;
    scaffold(el, opts, (w) => {
      const rowH = 30, mt = 8, mb = 24, ml = opts.labelW || 190, mr = 60;
      const h = mt + mb + rowH * opts.items.length + 12;
      const svg = svgEl("svg", { viewBox: `0 0 ${w} ${h}` });
      const vals = isRange ? opts.items.flatMap(i => [i.lo, i.hi]) : opts.items.map(i => i.v);
      let lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
      if (opts.center !== undefined) { lo = Math.min(lo, opts.center); hi = Math.max(hi, opts.center); }
      const pad = (hi - lo) * 0.06; lo -= pad; hi += pad;
      const x0 = ml, x1 = w - mr;
      const xOf = v => x0 + (v - lo) / (hi - lo) * (x1 - x0);
      const zero = xOf(opts.center !== undefined ? opts.center : 0);
      opts.items.forEach((it, i) => {
        const y = mt + rowH * i + 6, bh = Math.min(18, rowH - 10);
        const lab = svgEl("text", { x: ml - 10, y: y + bh / 2 + 4, "text-anchor": "end", "font-size": 11.5, fill: tok("--ink-2") });
        lab.textContent = it.l; svg.appendChild(lab);
        let xa, xb, c;
        if (isRange) { xa = xOf(it.lo); xb = xOf(it.hi); c = col(it.color || "s1"); }
        else { xa = Math.min(zero, xOf(it.v)); xb = Math.max(zero, xOf(it.v)); c = it.v >= 0 ? col("s1") : col("s4"); }
        const r = svgEl("rect", { x: xa, y, width: Math.max(2, xb - xa), height: bh, rx: 3, fill: c, opacity: isRange ? 0.85 : 1 });
        r.addEventListener("mousemove", ev => showTip(`<div class="t">${it.l}</div>` + (isRange ? tipRow("Faixa", c, fmt(it.lo) + " – " + fmt(it.hi)) : tipRow("Valor", c, F.smm(it.v))), ev.clientX, ev.clientY));
        r.addEventListener("mouseleave", hideTip);
        svg.appendChild(r);
        const tv = svgEl("text", { x: xb + 6, y: y + bh / 2 + 4, "font-size": 10.5, "font-weight": 600, fill: tok("--ink-2") });
        tv.textContent = isRange ? fmt(it.hi) : F.smm(it.v);
        svg.appendChild(tv);
        if (isRange) {
          const tv2 = svgEl("text", { x: xa - 6, y: y + bh / 2 + 4, "font-size": 10.5, "font-weight": 600, fill: tok("--ink-2"), "text-anchor": "end" });
          tv2.textContent = fmt(it.lo); svg.appendChild(tv2);
        }
        if (isRange && it.mark != null) {
          svg.appendChild(svgEl("line", { x1: xOf(it.mark), x2: xOf(it.mark), y1: y - 3, y2: y + bh + 3, stroke: tok("--ink"), "stroke-width": 2 }));
        }
      });
      svg.appendChild(svgEl("line", { x1: zero, x2: zero, y1: mt, y2: mt + rowH * opts.items.length, stroke: tok("--baseline"), "stroke-width": 1 }));
      if (opts.markLabel && opts.markValue != null) {
        const t = svgEl("text", { x: xOf(opts.markValue), y: mt + rowH * opts.items.length + 16, "font-size": 10.5, fill: tok("--muted"), "text-anchor": "middle" });
        t.textContent = opts.markLabel + ": " + fmt(opts.markValue);
        svg.appendChild(t);
        svg.appendChild(svgEl("line", { x1: xOf(opts.markValue), x2: xOf(opts.markValue), y1: mt, y2: mt + rowH * opts.items.length, stroke: tok("--ink"), "stroke-width": 1.5, "stroke-dasharray": "4 3" }));
      }
      return svg;
    });
  }

  /* ---------- dispersão (fronteira eficiente) ---------- */
  function scatter(el, opts) {
    // opts: points [{x,y,small}], marks [{x,y,l,color}], xFmt, yFmt, xLab, yLab
    const xF = opts.xFmt || F.pc, yF = opts.yFmt || F.pc;
    opts.twin = opts.marks ? { head: ["Carteira", opts.xLab || "Risco", opts.yLab || "Retorno"], rows: opts.marks.map(m => [m.l, xF(m.x), yF(m.y)]) } : null;
    scaffold(el, opts, (w) => {
      const h = opts.height || 300, ml = 56, mr = 14, mt = 12, mb = 40;
      const svg = svgEl("svg", { viewBox: `0 0 ${w} ${h}` });
      const xs = opts.points.map(p => p.x).concat((opts.marks || []).map(m => m.x));
      const ys = opts.points.map(p => p.y).concat((opts.marks || []).map(m => m.y));
      let xlo = Math.min(...xs), xhi = Math.max(...xs), ylo = Math.min(...ys), yhi = Math.max(...ys);
      const xt = niceTicks(xlo, xhi, 5), yt = niceTicks(ylo, yhi, 5);
      xlo = xt[0]; xhi = xt[xt.length - 1]; ylo = yt[0]; yhi = yt[yt.length - 1];
      const x0 = ml, x1 = w - mr, y0 = h - mb, y1 = mt;
      const xOf = v => x0 + (v - xlo) / (xhi - xlo) * (x1 - x0);
      const yOf = v => y0 - (v - ylo) / (yhi - ylo) * (y0 - y1);
      axisAndGrid(svg, yt, x0, x1, yOf, yF);
      xt.forEach(t => {
        const lab = svgEl("text", { x: xOf(t), y: y0 + 16, "text-anchor": "middle", "font-size": 11, fill: tok("--muted") });
        lab.textContent = xF(t); svg.appendChild(lab);
      });
      const xa = svgEl("text", { x: (x0 + x1) / 2, y: h - 4, "text-anchor": "middle", "font-size": 11, fill: tok("--ink-2") });
      xa.textContent = opts.xLab || ""; svg.appendChild(xa);
      opts.points.forEach(p => {
        svg.appendChild(svgEl("circle", { cx: xOf(p.x), cy: yOf(p.y), r: 2.4, fill: col("s1"), opacity: 0.28 }));
      });
      (opts.marks || []).forEach(m => {
        const c = col(m.color || "s2");
        const dot = svgEl("circle", { cx: xOf(m.x), cy: yOf(m.y), r: 6, fill: c, stroke: tok("--surface"), "stroke-width": 2 });
        dot.addEventListener("mousemove", ev => showTip(`<div class="t">${m.l}</div>` + tipRow(opts.xLab || "x", c, xF(m.x)) + tipRow(opts.yLab || "y", c, yF(m.y)), ev.clientX, ev.clientY));
        dot.addEventListener("mouseleave", hideTip);
        svg.appendChild(dot);
        const t = svgEl("text", { x: xOf(m.x) + 9, y: yOf(m.y) + 4, "font-size": 11, "font-weight": 600, fill: tok("--ink-2") });
        t.textContent = m.l; svg.appendChild(t);
      });
      return svg;
    });
  }

  /* ---------- matriz de calor (sensibilidade) ---------- */
  // luminância relativa (WCAG) de uma cor hex — escolhe tinta legível sobre o fundo
  function lum(hex) {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim());
    if (!m) return .5;
    let h = m[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const c = [0, 2, 4].map(i => {
      const v = parseInt(h.slice(i, i + 2), 16) / 255;
      return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);
    });
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
  }
  // ponto de cruzamento WCAG: acima disto o preto contrasta mais que o branco
  const INK_FLIP = .179;

  function heatTable(el, opts) {
    // opts: rowLab, colLab, rows [labels], cols [labels], values [i][j], fmt, highlight {i,j}
    const fmt = opts.fmt || F.mm;
    const flat = opts.values.flat();
    const lo = Math.min(...flat), hi = Math.max(...flat);
    const seq = ["--seq-100", "--seq-200", "--seq-300", "--seq-400", "--seq-500", "--seq-600", "--seq-700"];
    function cellStyle(v) {
      const t = hi === lo ? 0 : (v - lo) / (hi - lo);
      const idx = Math.min(seq.length - 1, Math.floor(t * seq.length));
      const bg = tok(seq[idx]);
      const ink = lum(bg) > INK_FLIP ? "#0b0b0b" : "#ffffff";
      return `background:${bg};color:${ink}`;
    }
    el.innerHTML = "";
    el.classList.add("chart");
    if (opts.title) { const d = document.createElement("div"); d.className = "c-title"; d.textContent = opts.title; el.appendChild(d); }
    if (opts.sub) { const d = document.createElement("div"); d.className = "c-sub"; d.textContent = opts.sub; el.appendChild(d); }
    const scroll = document.createElement("div"); scroll.style.overflowX = "auto";
    let html = `<table class="heat"><thead><tr><th>${opts.rowLab || ""} \\ ${opts.colLab || ""}</th>${opts.cols.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>`;
    opts.rows.forEach((r, i) => {
      html += `<tr><th style="text-align:right">${r}</th>`;
      opts.cols.forEach((c, j) => {
        const v = opts.values[i][j];
        const hl = opts.highlight && opts.highlight.i === i && opts.highlight.j === j;
        html += `<td style="${cellStyle(v)}${hl ? ";outline:2px solid " + tok("--accent") + ";outline-offset:-2px;font-weight:700" : ""}">${fmt(v)}</td>`;
      });
      html += "</tr>";
    });
    html += "</tbody></table>";
    scroll.innerHTML = html;
    el.appendChild(scroll);
    const note = document.createElement("div");
    note.className = "c-sub"; note.style.marginTop = "6px";
    const claroAlto = lum(tok(seq[seq.length - 1])) > lum(tok(seq[0]));
    note.textContent = `Escala de cor: tom mais ${claroAlto ? "claro" : "escuro"} = valor mais alto. Célula destacada = premissa central.`;
    el.appendChild(note);
  }

  /* ---------- painel de checks ---------- */
  function renderChecks(el, list) {
    el.innerHTML = "";
    el.classList.add("checks");
    list.forEach(c => {
      const d = document.createElement("div");
      d.className = "check " + (c.pass ? "pass" : "fail");
      d.innerHTML = `<span class="st">${c.pass ? "✓ OK" : "✗ FALHOU"}</span><span class="d">${c.name}${c.detail ? " — <b>" + c.detail + "</b>" : ""}</span>${c.num ? `<span class="num">${c.num}</span>` : ""}`;
      el.appendChild(d);
    });
    const n = list.length, ok = list.filter(c => c.pass).length;
    const sum = document.createElement("div");
    sum.className = "check " + (ok === n ? "pass" : "fail");
    sum.innerHTML = `<span class="st">${ok}/${n}</span><span class="d"><b>checks de integridade aprovados</b> — recalculados a cada alteração de premissa</span>`;
    el.appendChild(sum);
    return { total: n, ok };
  }

  /* ---------- navegação / rodapé ---------- */
  const NAV = [
    ["index.html", "Início", "home"],
    ["simuladores/index.html", "Simuladores", "sim"],
    ["analises/bancos-2026.html", "Análises", "ana"],
    ["dashboards.html", "Dashboards", "dash"],
    ["kpis.html", "KPIs", "kpis"],
    ["metodologia.html", "Metodologia", "met"],
    ["sobre.html", "Sobre", "sobre"],
  ];
  function initSite() {
    const body = document.body;
    const root = body.dataset.root || "";
    const page = body.dataset.page || "";
    const header = document.createElement("header");
    header.className = "site";
    header.innerHTML = `<div class="wrap bar">
      <a class="logo" href="${root}index.html">Portfólio <span>Finanças Corporativas &amp; FP&amp;A</span></a>
      <nav class="main">${NAV.map(([href, lab, id]) => `<a href="${root}${href}" class="${id === page ? "on" : ""}">${lab}</a>`).join("")}</nav>
    </div>`;
    body.prepend(header);
    const footer = document.createElement("footer");
    footer.className = "site";
    footer.innerHTML = `<div class="wrap">
      <div>Portfólio técnico de Finanças Corporativas, FP&amp;A, Valuation e BI.<br>
      Simuladores usam <b>empresa fictícia (simulações identificadas)</b>; análises com dados públicos citam fonte e data.
      Nada aqui representa experiência profissional real nem recomendação de investimento.</div>
      <div>Código-fonte: <a href="https://github.com/thgteixeiranascimento-bit/Portf-lio">GitHub</a><br>
      Metodologia e governança: <a href="${root}metodologia.html">ver protocolo</a></div>
    </div>`;
    body.appendChild(footer);
  }
  document.addEventListener("DOMContentLoaded", initSite);

  /* ---------- utilidades numéricas ---------- */
  function irr(cashflows, guess) {
    // TIR por bissecção em [-0.99, 10]; retorna null se não houver mudança de sinal
    const npvAt = r => cashflows.reduce((a, cf, t) => a + cf / Math.pow(1 + r, t), 0);
    let lo = -0.99, hi = 10;
    let flo = npvAt(lo), fhi = npvAt(hi);
    if (flo * fhi > 0) return null;
    for (let k = 0; k < 200; k++) {
      const mid = (lo + hi) / 2, fm = npvAt(mid);
      if (Math.abs(fm) < 1e-9) return mid;
      if (flo * fm < 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
    }
    return (lo + hi) / 2;
  }
  function npv(rate, cashflows) {
    return cashflows.reduce((a, cf, t) => a + cf / Math.pow(1 + rate, t), 0);
  }
  const near = (a, b, tol) => Math.abs(a - b) <= (tol == null ? 0.05 : tol);

  window.Viz = { line, bars, waterfall, hbars, scatter, heatTable, renderChecks, F, col, tok, irr, npv, near, niceTicks };
})();
