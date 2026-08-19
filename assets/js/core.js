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

  /* ============================================================
     i18n — alternância português / inglês
     ------------------------------------------------------------
     Mecanismo simples e sem dependências: o texto em português é o
     conteúdo natural do HTML; a tradução vive no atributo data-en do
     próprio elemento. Ao alternar, o texto original é guardado em
     memória para permitir a volta. Conteúdo gerado por JavaScript usa
     o helper t(pt, en).
     ============================================================ */
  const LANG_KEY = "portfolio-lang";
  let LANG = (function () {
    try { return localStorage.getItem(LANG_KEY) === "en" ? "en" : "pt"; } catch (e) { return "pt"; }
  })();
  const isEn = () => LANG === "en";
  /* t(pt, en) — escolhe a string conforme o idioma corrente */
  function t(pt, en) { return isEn() && en != null ? en : pt; }

  function applyLang() {
    document.documentElement.setAttribute("lang", isEn() ? "en" : "pt-BR");
    document.querySelectorAll("[data-en]").forEach(el => {
      if (el._ptHTML === undefined) el._ptHTML = el.innerHTML;
      el.innerHTML = isEn() ? el.getAttribute("data-en") : el._ptHTML;
    });
    // título da aba
    const ttl = document.querySelector("title");
    if (ttl && ttl.dataset.en) {
      if (ttl._pt === undefined) ttl._pt = ttl.textContent;
      ttl.textContent = isEn() ? ttl.dataset.en : ttl._pt;
    }
    const btn = document.getElementById("langBtn");
    if (btn) {
      btn.textContent = isEn() ? "PT" : "EN";
      btn.setAttribute("aria-label", isEn() ? "Mudar para português" : "Switch to English");
      btn.title = isEn() ? "Ver em português" : "View in English";
    }
    // redesenha gráficos e blocos gerados por JS
    document.querySelectorAll("figure.chart").forEach(el => el._vizDraw && el._vizDraw());
    if (typeof window.onLangChange === "function") window.onLangChange(LANG);
  }

  function setLang(l) {
    LANG = l === "en" ? "en" : "pt";
    try { localStorage.setItem(LANG_KEY, LANG); } catch (e) { /* modo privado */ }
    applyLang();
  }

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
    usd: v => "US$ " + nf(1, 1).format(Math.abs(v) < 0.05 ? 0 : v),
    usd0: v => "US$ " + nf(0, 0).format(Math.round(v)),
    pcv: v => nf(1, 1).format(v) + "%",              // valor já em pontos percentuais (24,3 → "24,3%")
    pcv2: v => nf(2, 2).format(v) + "%",
    spcv: v => (v >= 0 ? "+" : "") + nf(1, 1).format(v) + "%",
    ppv: v => (v >= 0 ? "+" : "") + nf(1, 1).format(v) + " p.p.",
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
    // opts: title, sub, series [{name,color}], twin {head, rows}, legendToggle
    /* Cabeçalho em linha: títulos à esquerda, legenda alinhada à direita.
       Legenda no topo evita a viagem do olho até o rodapé do gráfico e não
       consome altura útil da área de plotagem. Com legendToggle, cada chave
       vira botão que liga/desliga a série — sempre mantendo ao menos uma. */
    function draw() {
      el.innerHTML = "";
      el.classList.add("chart");
      const temSerie = opts.series && opts.series.length > 1;
      if (opts.title || opts.sub || temSerie) {
        const head = document.createElement("div"); head.className = "c-head";
        const tt = document.createElement("div"); tt.className = "c-titles";
        if (opts.title) { const d = document.createElement("div"); d.className = "c-title"; d.textContent = opts.title; tt.appendChild(d); }
        if (opts.sub) { const d = document.createElement("div"); d.className = "c-sub"; d.textContent = opts.sub; tt.appendChild(d); }
        head.appendChild(tt);
        if (temSerie) {
          const lg = document.createElement("div");
          lg.className = "legend" + (opts.legendToggle ? " legend-pro" : "");
          if (opts.legendToggle) lg.setAttribute("role", "group");
          lg.setAttribute("aria-label", t("Séries do gráfico", "Chart series"));
          /* série com legenda:false não ganha chave própria — é o caso da
             companheira tracejada, que segue o interruptor da série de fato */
          opts.series.filter(s => s.legenda !== false).forEach(s => {
            const marca = `<span class="sw ${s.kind === "line" ? "line" : ""}" style="background:${col(s.color)}"></span>`;
            let k;
            if (opts.legendToggle) {
              k = document.createElement("button");
              k.type = "button"; k.className = "key";
              k.setAttribute("aria-pressed", s.off ? "false" : "true");
              if (s.off) k.classList.add("off");
              k.title = t(s.off ? "Mostrar série" : "Ocultar série", s.off ? "Show series" : "Hide series");
              k.addEventListener("click", () => {
                const visiveis = opts.series.filter(x => !x.off && x.legenda !== false).length;
                if (!s.off && visiveis <= 1) return;   /* nunca esconder a última */
                s.off = !s.off;
                if (typeof opts.onToggle === "function") opts.onToggle(s, opts.series);
                hideTip();
                el._vizDraw && el._vizDraw();
              });
            } else {
              k = document.createElement("span"); k.className = "key";
            }
            k.innerHTML = marca + s.name;
            lg.appendChild(k);
          });
          head.appendChild(lg);
        }
        el.appendChild(head);
      }
      const w = Math.max(300, el.clientWidth - 38);
      /* renderiza apenas as séries visíveis, sem que cada tipo de gráfico
         precise conhecer o estado da legenda */
      const todas = opts.series;
      if (todas) opts.series = todas.filter(s => !s.off);
      let svg;
      try { svg = render(w); } finally { if (todas) opts.series = todas; }
      el.appendChild(svg);
      if (opts.twin) {
        const d = document.createElement("details"); d.className = "tbl-twin";
        const rowsHtml = opts.twin.rows.map(r => "<tr>" + r.map((c, i) => i === 0 ? `<td>${c}</td>` : `<td>${c}</td>`).join("") + "</tr>").join("");
        d.innerHTML = `<summary>${t("Ver dados em tabela", "View data as table")}</summary><div class="tbl-scroll" style="margin:8px 0"><table class="tbl"><thead><tr>${opts.twin.head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
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
    const sVal = v => (opts.signed === false ? fmt(v) : F.smm(v));
    opts.twin = isRange
      ? { head: ["Item", "Mín.", "Máx."], rows: opts.items.map(it => [it.l, fmt(it.lo), fmt(it.hi)]) }
      : { head: ["Item", "Valor"], rows: opts.items.map(it => [it.l, sVal(it.v)]) };
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
        r.addEventListener("mousemove", ev => showTip(`<div class="t">${it.l}</div>` + (isRange ? tipRow("Faixa", c, fmt(it.lo) + " – " + fmt(it.hi)) : tipRow("Valor", c, sVal(it.v))), ev.clientX, ev.clientY));
        r.addEventListener("mouseleave", hideTip);
        svg.appendChild(r);
        const tv = svgEl("text", { x: xb + 6, y: y + bh / 2 + 4, "font-size": 10.5, "font-weight": 600, fill: tok("--ink-2") });
        tv.textContent = isRange ? fmt(it.hi) : sVal(it.v);
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
      const ink = idx >= 3 ? "#ffffff" : "#0b0b0b";
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
        html += `<td style="${cellStyle(v)}${hl ? ";outline:2px solid " + tok("--ink") + ";outline-offset:-2px;font-weight:700" : ""}">${fmt(v)}</td>`;
      });
      html += "</tr>";
    });
    html += "</tbody></table>";
    scroll.innerHTML = html;
    el.appendChild(scroll);
    const note = document.createElement("div");
    note.className = "c-sub"; note.style.marginTop = "6px";
    note.textContent = t("Escala de cor: azul mais escuro = valor mais alto. Célula destacada = premissa central.", "Colour scale: darker blue = higher value. Highlighted cell = central assumption.");
    el.appendChild(note);
  }

  /* ---------- painel de checks ---------- */
  function renderChecks(el, list) {
    el.innerHTML = "";
    el.classList.add("checks");
    list.forEach(c => {
      const d = document.createElement("div");
      d.className = "check " + (c.pass ? "pass" : "fail");
      d.innerHTML = `<span class="st">${c.pass ? t("✓ OK", "✓ PASS") : t("✗ FALHOU", "✗ FAILED")}</span><span class="d">${t(c.name, c.nameEn)}${c.detail ? " — <b>" + c.detail + "</b>" : ""}</span>${c.num ? `<span class="num">${c.num}</span>` : ""}`;
      el.appendChild(d);
    });
    const n = list.length, ok = list.filter(c => c.pass).length;
    const sum = document.createElement("div");
    sum.className = "check " + (ok === n ? "pass" : "fail");
    sum.innerHTML = `<span class="st">${ok}/${n}</span><span class="d">${t("<b>checks de integridade aprovados</b> — recalculados a cada alteração de premissa", "<b>integrity checks passed</b> — recalculated on every assumption change")}</span>`;
    el.appendChild(sum);
    return { total: n, ok };
  }

  /* ---------- bloco padrão "Fontes deste estudo" ---------- */
  function renderFontes(el, ids, notaExtra) {
    const R = window.REAL;
    if (!R || !el) return;
    const rows = ids.map(id => {
      const f = R.FONTES[id];
      if (!f) return "";
      return `<tr><td style="white-space:normal">${f.doc}</td><td style="white-space:normal">${f.emissor}</td><td>${f.data}</td><td style="text-align:center">${f.nivel}</td>${f.obs ? `<td style="white-space:normal">${f.obs}</td>` : "<td>—</td>"}</tr>`;
    }).join("");
    el.innerHTML = `<h2>${t("Fontes deste estudo", "Sources for this study")}</h2>
      <div class="tbl-scroll"><table class="tbl">
        <thead><tr><th>${t("Documento", "Document")}</th><th>${t("Emissor", "Issuer")}</th><th>${t("Data", "Date")}</th><th>${t("Nível", "Level")}</th><th>${t("Observação", "Note")}</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
      <p style="font-size:.83rem">${t("Conferência contra os originais publicados nos canais de relações com investidores dos emissores e em bcb.gov.br permanece <b>pendente e declarada</b> para os documentos recebidos como conversão OCR.", "Verification against the originals published on the issuers' investor relations channels and on bcb.gov.br remains <b>pending and declared</b> for documents received as OCR conversions.")} ${notaExtra || ""} ${t("Nada nesta página é recomendação de investimento.", "Nothing on this page is investment advice.")}</p>`;
  }

  /* ============================================================
     Exportação do relatório
     ------------------------------------------------------------
     Gera um arquivo HTML autocontido (abre em qualquer navegador e
     imprime em PDF) com o conteúdo da página, os checks de integridade
     e a matriz de fontes — incluindo o nível de cada documento e as
     ressalvas. Tudo é montado no navegador; nenhum dado sai da máquina.
     ============================================================ */
  function exportarRelatorio() {
    const main = document.querySelector("main.wrap");
    if (!main) return;
    const clone = main.cloneNode(true);

    // remove controles interativos e a barra de ações (não fazem sentido no arquivo)
    clone.querySelectorAll(".controls, .export-bar, .seg, button, input, select").forEach(e => e.remove());
    // abre os <details> para que o conteúdo apareça no export
    clone.querySelectorAll("details").forEach(d => d.setAttribute("open", ""));
    // converte SVG em bloco fixo (mantém o desenho) e preserva as tabelas de dados
    clone.querySelectorAll("figure.chart svg").forEach(svg => { svg.removeAttribute("style"); });

    const R = window.REAL;
    const titulo = document.title;
    const dataHora = new Date().toLocaleString("pt-BR");
    const pagina = location.pathname.split("/").filter(Boolean).slice(-2).join("/") || "index.html";

    let fontesHTML = "";
    if (R && R.FONTES) {
      const linhas = Object.keys(R.FONTES).map(id => {
        const f = R.FONTES[id];
        return `<tr><td>${f.doc}</td><td>${f.emissor}</td><td>${f.data}</td><td style="text-align:center">${f.nivel}</td><td>${f.obs || "—"}</td></tr>`;
      }).join("");
      fontesHTML = `<h2>${t("Matriz completa de fontes do portfólio", "Full source matrix of the portfolio")}</h2>
        <p class="nota">${t("Nível 1 = extração documental (documento em mãos, sujeito a checks aritméticos). Nível 2 = normas e referências técnicas. Nível 3 = fonte secundária ou informação relatada sem documento anexado — publicada marcada e fora dos checks.",
                            "Level 1 = document in hand, extracted and subject to arithmetic checks. Level 2 = standards and technical references. Level 3 = secondary source or relayed information without an attached document — published labelled and excluded from the checks.")}</p>
        <table><thead><tr>
          <th>${t("Documento", "Document")}</th><th>${t("Emissor", "Issuer")}</th>
          <th>${t("Data", "Date")}</th><th>${t("Nível", "Level")}</th><th>${t("Observação", "Note")}</th>
        </tr></thead><tbody>${linhas}</tbody></table>`;
    }

    const avisos = (R && R.META && R.META.avisos ? R.META.avisos : []).map(a => `<li>${a}</li>`).join("");

    const doc = `<!doctype html>
<html lang="${isEn() ? "en" : "pt-BR"}"><head><meta charset="utf-8">
<title>${titulo}</title>
<style>
  body{font-family:Georgia,'Times New Roman',serif;max-width:900px;margin:36px auto;padding:0 22px;color:#111;line-height:1.55}
  h1{font-size:1.7rem;line-height:1.2;margin:.2em 0 .3em}
  h2{font-size:1.15rem;margin:1.6em 0 .4em;border-bottom:1px solid #ddd;padding-bottom:4px}
  h3,h4{font-size:1rem;margin:1.1em 0 .3em}
  p,li{font-size:.94rem}
  table{border-collapse:collapse;width:100%;font-size:.82rem;margin:12px 0}
  th,td{border:1px solid #ccc;padding:5px 8px;text-align:left;vertical-align:top}
  th{background:#f2f2f0;font-size:.78rem}
  .cab{border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:18px}
  .cab .meta{font-size:.8rem;color:#555}
  .aviso{border:1px solid #999;border-left:4px solid #333;background:#fafaf8;padding:10px 14px;margin:16px 0;font-size:.85rem}
  .nota{font-size:.8rem;color:#444}
  figure{margin:14px 0;page-break-inside:avoid}
  svg{max-width:100%;height:auto}
  .tag{font-size:.7rem;border:1px solid #999;border-radius:9px;padding:1px 6px;white-space:nowrap}
  .check{border:1px solid #ddd;border-radius:6px;padding:5px 9px;margin:4px 0;font-size:.82rem}
  .rodape{margin-top:34px;border-top:1px solid #ccc;padding-top:12px;font-size:.78rem;color:#555}
  @media print{body{margin:0;max-width:none} h2{page-break-after:avoid}}
</style></head><body>
<div class="cab">
  <h1>${titulo}</h1>
  <div class="meta">
    ${t("Exportado do portfólio de", "Exported from the portfolio of")} <b>Thiago Teixeira Nascimento</b> ·
    ${t("página", "page")} <code>${pagina}</code> · ${t("exportado em", "exported on")} ${dataHora}<br>
    github.com/thgteixeiranascimento-bit/Portf-lio
  </div>
</div>
<div class="aviso">
  <b>${t("Protocolo de integridade", "Integrity protocol")}.</b>
  ${t("Este relatório usa dados públicos de fontes primárias datadas. Fato divulgado, premissa do autor, estimativa de modelo e derivação são rotulados separadamente; lacunas são declaradas. <b>Nada aqui é recomendação de investimento, preço-alvo ou opinião sobre valor de ativos.</b>",
      "This report uses public data from dated primary sources. Disclosed fact, author assumption, model estimate and derivation are labelled separately; gaps are declared. <b>Nothing here is investment advice, a price target or an opinion on asset value.</b>")}
  ${avisos ? `<ul>${avisos}</ul>` : ""}
  <b>${t("Conflito de interesse", "Conflict of interest")}:</b>
  ${t("o autor é colaborador do Agibank desde 2025, e a Agi/Agibank é uma das instituições analisadas. Todo o conteúdo sobre a Agi vem de documentos públicos; nenhuma informação interna foi utilizada.",
      "the author has been an employee of Agibank since 2025, and Agi/Agibank is one of the institutions analysed. All content about Agi comes from public documents; no internal information was used.")}
</div>
${clone.innerHTML}
${fontesHTML}
<div class="rodape">
  ${t("Documento gerado automaticamente pelo portfólio, sem intervenção manual nos números. Para conferir qualquer valor, consulte a matriz de fontes acima e os canais oficiais de relações com investidores dos emissores.",
      "Document generated automatically by the portfolio, with no manual intervention in the figures. To verify any value, consult the source matrix above and the issuers' official investor relations channels.")}
</div>
</body></html>`;

    const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const nome = (pagina.replace(/[\/.]/g, "-").replace(/-html$/, "")) + "-" +
      new Date().toISOString().slice(0, 10) + (isEn() ? "-en" : "-pt") + ".html";
    const a = document.createElement("a");
    a.href = url; a.download = nome;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1500);
  }

  /* ---------- navegação / rodapé ---------- */
  const NAV = [
    ["index.html", "Início", "Home", "home"],
    ["curriculo.html", "Currículo", "Résumé", "cv"],
    ["simuladores/index.html", "Estudos e ferramentas", "Studies & tools", "sim"],
    ["analises/bancos-2026.html", "Análise setorial", "Sector analysis", "ana"],
    ["dashboards.html", "Dashboards", "Dashboards", "dash"],
    ["kpis.html", "KPIs", "KPIs", "kpis"],
    ["metodologia.html", "Metodologia", "Methodology", "met"],
    ["sobre.html", "Sobre", "About", "sobre"],
  ];
  function initSite() {
    const body = document.body;
    const root = body.dataset.root || "";
    const page = body.dataset.page || "";
    const header = document.createElement("header");
    header.className = "site";
    header.innerHTML = `<div class="wrap bar">
      <a class="logo" href="${root}index.html">Portfólio <span data-en="Corporate Finance &amp; FP&amp;A">Finanças Corporativas &amp; FP&amp;A</span></a>
      <nav class="main">${NAV.map(([href, pt, en, id]) => `<a href="${root}${href}" class="${id === page ? "on" : ""}" data-en="${en}">${pt}</a>`).join("")}</nav>
      <div class="actions">
        <button type="button" id="exportBtn" class="ico" title="Exportar relatório com fontes">
          <span aria-hidden="true">⭳</span><span class="lbl" data-en="Export">Exportar</span>
        </button>
        <button type="button" id="langBtn" class="ico lang" title="View in English">EN</button>
      </div>
    </div>`;
    body.prepend(header);
    const footer = document.createElement("footer");
    footer.className = "site";
    footer.innerHTML = `<div class="wrap">
      <div data-en="Technical portfolio of Corporate Finance, FP&amp;A, Valuation and BI built on <b>public data from dated primary sources</b> (Nu, Agi/Agibank, Itaú, Bradesco, Santander Brasil and Copom).<br>Facts, assumptions, estimates and derivations are labelled separately. Nothing here is investment advice.<br><b>Conflict of interest:</b> the author is currently an employee of Agibank — see <a href='${root}sobre.html'>About</a>.">Portfólio técnico de Finanças Corporativas, FP&amp;A, Valuation e BI construído sobre
      <b>dados públicos de fontes primárias datadas</b> (Nu, Agi/Agibank, Itaú, Bradesco, Santander Brasil e Copom).<br>
      Fatos, premissas, estimativas e derivações são rotulados separadamente. Nada aqui é recomendação de investimento.<br>
      <b>Conflito de interesse:</b> o autor é colaborador do Agibank (vínculo atual) — ver <a href="${root}sobre.html">Sobre</a>.</div>
      <div data-en="Author: <b>Thiago Teixeira Nascimento</b><br>Source code: <a href='https://github.com/thgteixeiranascimento-bit/Portf-lio'>GitHub</a> · <a href='https://www.linkedin.com/in/thiago-teixeira-nascimento-03a3961a3'>LinkedIn</a><br>Methodology and governance: <a href='${root}metodologia.html'>see protocol</a>">Autor: <b>Thiago Teixeira Nascimento</b><br>
      Código-fonte: <a href="https://github.com/thgteixeiranascimento-bit/Portf-lio">GitHub</a> · <a href="https://www.linkedin.com/in/thiago-teixeira-nascimento-03a3961a3">LinkedIn</a><br>
      Metodologia e governança: <a href="${root}metodologia.html">ver protocolo</a></div>
    </div>`;
    body.appendChild(footer);

    document.getElementById("langBtn").addEventListener("click", () => setLang(isEn() ? "pt" : "en"));
    document.getElementById("exportBtn").addEventListener("click", exportarRelatorio);

    /* atalho de teclado: pular direto para o conteúdo */
    const skip = document.createElement("a");
    skip.className = "skip-link";
    skip.href = "#conteudo";
    skip.textContent = t("Pular para o conteúdo", "Skip to content");
    skip.setAttribute("data-en", "Skip to content");
    body.prepend(skip);
    const main = document.querySelector("main");
    if (main && !main.id) main.id = "conteudo";

    /* sombra do cabeçalho ao rolar */
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* entrada suave dos blocos (respeita prefers-reduced-motion via CSS) */
    const alvos = document.querySelectorAll(".reveal");
    if (alvos.length && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((ents) => {
        ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
      alvos.forEach(el => io.observe(el));
    } else {
      alvos.forEach(el => el.classList.add("in"));
    }

    applyLang();
  }
  document.addEventListener("DOMContentLoaded", initSite);

  /* ---------- download de arquivo montado no navegador ---------- */
  function baixarArquivo(nome, conteudo, mime) {
    const blob = new Blob([conteudo], { type: (mime || "text/plain") + ";charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = nome;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1500);
  }

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

  window.Viz = { line, bars, waterfall, hbars, scatter, heatTable, renderChecks, renderFontes, F, col, tok, irr, npv, near, niceTicks, t, isEn, setLang, exportarRelatorio, baixarArquivo };
})();
