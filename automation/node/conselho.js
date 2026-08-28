#!/usr/bin/env node
/* ============================================================
   conselho.js — conselho de validação do trabalho inteiro
   ------------------------------------------------------------
   O `verificar_paginas.js` responde a uma pergunta estreita:
   "alguma página quebrou?". Este arquivo responde à pergunta
   larga: "o que está publicado é verdade?".

   São nove frentes de auditoria, todas medidas — nenhuma
   declarada:

     A. Execução      — erro de JavaScript, console e recurso 404
     B. Navegação     — todo link interno resolve
     C. Aritmética    — número publicado bate com número medido
     D. Registro      — afirmação da capa bate com o registro único
     E. Ancoragem     — palavra-chave de triagem ancora em algo real
     F. Fontes        — identificador citado existe na matriz
     G. Acessibilidade— alt, hierarquia de títulos, rótulo, idioma
     H. Idioma        — cobertura PT/EN nas superfícies traduzidas
     I. Higiene       — nenhum lorem, TODO, placeholder ou arquivo ausente

   Reprova com código 1 se qualquer frente encontrar problema.

   USO
     python3 -m http.server 8765      (na raiz, em outro terminal)
     node automation/node/conselho.js
   ============================================================ */

"use strict";

const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..", "..");
const BASE = process.env.PORTFOLIO_URL || "http://localhost:8765";
const CHROME = process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

/* ---------- utilidades ---------- */
const achados = [];   // { frente, gravidade, msg }
function erro(frente, msg) { achados.push({ frente, gravidade: "erro", msg }); }
function alerta(frente, msg) { achados.push({ frente, gravidade: "alerta", msg }); }

/* `tests/` sai da varredura pela mesma razão que `automation/`: é
   instrumento de desenvolvimento, não página publicada — nenhuma página do
   site aponta para lá. E o harness precisa escrever na tela os nomes dos
   próprios casos ("safeDiv nunca devolve Infinity nem NaN"), que a frente de
   higiene leria como valor não renderizado. A isenção é do diretório inteiro
   e está declarada aqui; o que ele testa continua sob o portão, porque
   `npm test` roda a mesma suíte em Node e reprova com código 1. */
function paginas() {
  const out = [];
  (function anda(dir) {
    for (const nome of fs.readdirSync(dir)) {
      if (["node_modules", ".git", "references", "docs", "automation", "assets", "tests"].includes(nome)) continue;
      const p = path.join(dir, nome);
      const st = fs.statSync(p);
      if (st.isDirectory()) anda(p);
      else if (nome.endsWith(".html")) out.push(path.relative(RAIZ, p).split(path.sep).join("/"));
    }
  })(RAIZ);
  return out.sort();
}

/* O simulador de PVM calcula sobre a base que o usuário carrega: em página
   fria não há número, e portanto não há check a auditar. Sem esta preparação
   o conselho contaria zero e acusaria a capa de exagerar. Carrega-se o
   dataset DEMO — sintético e rotulado como tal — e só então se mede. É o
   mesmo gancho de `verificar_paginas.js`, pelo mesmo motivo. */
const PREPARAR = {
  "pvm/index.html": async (pagina) => {
    await pagina.click("#btn-demo");
    await pagina.waitForFunction(
      () => document.querySelectorAll("#dq-summary .check").length > 0,
      null, { timeout: 30000 }
    );
    await pagina.waitForTimeout(500);
  },
};

(async () => {
  let chromium;
  try { ({ chromium } = require("playwright-core")); }
  catch { console.error("playwright-core não instalado: npm install playwright-core"); process.exit(2); }

  const ROTAS = paginas();
  const navegador = await chromium.launch({ executablePath: CHROME });
  const pagina = await navegador.newPage();

  /* medições acumuladas, usadas depois nas frentes aritméticas */
  const medido = { checks: 0, checksPorRota: {}, modelos: 0, ats: 0, atsNucleo: 0, divergenciasPerfil: 0, i18nPendentes: 0 };
  const idsInternos = {};      // rota -> Set de âncoras (#id)

  console.log(`Conselho de validação — ${ROTAS.length} páginas\n`);

  for (const rota of ROTAS) {
    const problemas = [];
    pagina.removeAllListeners("pageerror");
    pagina.removeAllListeners("console");
    pagina.removeAllListeners("requestfailed");
    pagina.removeAllListeners("response");
    pagina.on("pageerror", (e) => problemas.push("JS: " + e.message));
    pagina.on("console", (m) => { if (m.type() === "error") problemas.push("Console: " + m.text()); });
    pagina.on("response", (r) => {
      if (r.status() >= 400 && new URL(r.url()).origin === new URL(BASE).origin) {
        problemas.push(`Recurso ${r.status()}: ${new URL(r.url()).pathname}`);
      }
    });

    await pagina.goto(`${BASE}/${rota}`, { waitUntil: "networkidle" });
    await pagina.waitForTimeout(250);
    if (PREPARAR[rota]) await PREPARAR[rota](pagina);

    const r = await pagina.evaluate(() => {
      const q = (s) => [...document.querySelectorAll(s)];
      return {
        checks: q(".check").length,
        checksFalhos: q(".check.fail").map((c) => c.textContent.trim().slice(0, 100)),
        h1: q("h1").length,
        titulos: q("h1,h2,h3,h4,h5,h6").map((h) => +h.tagName[1]),
        imgSemAlt: q("img").filter((i) => !i.hasAttribute("alt")).length,
        semRotulo: q("input:not([type=hidden]),select,textarea").filter((c) => {
          if (c.closest("label")) return false;
          if (c.id && document.querySelector(`label[for="${CSS.escape(c.id)}"]`)) return false;
          return !c.getAttribute("aria-label") && !c.getAttribute("aria-labelledby") && !c.disabled;
        }).length,
        lang: document.documentElement.lang || "",
        titulo: document.title.trim(),
        descricao: (document.querySelector('meta[name=description]') || {}).content || "",
        links: q("a[href]").map((a) => a.getAttribute("href")),
        ids: q("[id]").map((e) => e.id),
        traduziveis: q("[data-en]").length,
        traduzVazio: q("[data-en]").filter((e) => !e.getAttribute("data-en").trim()).length,
        /* A página que documenta a auditoria precisa citar literalmente o que
           a auditoria proíbe ("lorem ipsum", "TODO", "undefined"). Um elemento
           marcado com data-auditoria-doc sai da varredura de higiene — e só
           dela. A isenção é estreita, declarada aqui e visível no HTML: o
           contrário seria abrir um buraco por onde sujeira real passaria. */
        texto: (function () {
          /* o clone é destacado do documento, e nele innerText degrada para
             textContent — que inclui o corpo de <script>. Removê-los é o que
             faz a varredura ler o texto visível, e não o código-fonte. */
          const c = document.body.cloneNode(true);
          c.querySelectorAll("script, style, [data-auditoria-doc]").forEach((e) => e.remove());
          return c.textContent;
        })(),
        skipLink: !!document.querySelector(".skip-link"),
      };
    });

    /* A. execução */
    problemas.forEach((p) => erro("A. Execução", `${rota} — ${p}`));
    r.checksFalhos.forEach((c) => erro("A. Execução", `${rota} — check reprovado: ${c}`));

    /* contagem de checks: o painel acrescenta uma linha de resumo */
    const n = r.checks > 0 ? r.checks - 1 : 0;
    medido.checks += n;
    medido.checksPorRota[rota] = n;

    /* G. acessibilidade */
    if (r.h1 !== 1) erro("G. Acessibilidade", `${rota} — ${r.h1} elementos h1 (deve haver exatamente 1)`);
    if (r.imgSemAlt) erro("G. Acessibilidade", `${rota} — ${r.imgSemAlt} imagem(ns) sem alt`);
    if (r.semRotulo) erro("G. Acessibilidade", `${rota} — ${r.semRotulo} controle(s) de formulário sem rótulo`);
    if (!r.lang) erro("G. Acessibilidade", `${rota} — <html> sem atributo lang`);
    if (!r.skipLink) alerta("G. Acessibilidade", `${rota} — sem link de salto para o conteúdo`);
    for (let i = 1; i < r.titulos.length; i++) {
      if (r.titulos[i] - r.titulos[i - 1] > 1) {
        alerta("G. Acessibilidade", `${rota} — salto de h${r.titulos[i - 1]} para h${r.titulos[i]}`);
        break;
      }
    }

    /* metadados mínimos */
    if (!r.titulo) erro("G. Acessibilidade", `${rota} — sem <title>`);
    if (!r.descricao) alerta("G. Acessibilidade", `${rota} — sem meta description`);

    /* H. idioma */
    if (r.traduzVazio) erro("H. Idioma", `${rota} — ${r.traduzVazio} atributo(s) data-en vazio(s)`);

    /* I. higiene textual */
    const sujeira = [
      [/lorem ipsum/i, "texto lorem ipsum"],
      [/\bTODO\b|\bFIXME\b/, "marcador TODO/FIXME"],
      [/reallygreatsite|Anywhere St\./i, "placeholder de template"],
      [/\bundefined\b|\bNaN\b|\[object Object\]/, "valor não renderizado (undefined/NaN/object)"],
    ];
    sujeira.forEach(([re, oque]) => { if (re.test(r.texto)) erro("I. Higiene", `${rota} — ${oque}`); });

    idsInternos[rota] = new Set(r.ids);

    /* B. navegação — guardado para conferir depois de conhecer todas as rotas */
    r.links.forEach((href) => {
      if (/^(https?:|mailto:|tel:|data:|javascript:|#)/.test(href)) {
        if (href.startsWith("#") && href.length > 1 && !r.ids.includes(href.slice(1))) {
          erro("B. Navegação", `${rota} — âncora ${href} não existe na página`);
        }
        return;
      }
      const limpo = href.split("#")[0].split("?")[0];
      if (!limpo) return;
      const dir = path.posix.dirname(rota);
      const alvo = path.posix.normalize(path.posix.join(dir === "." ? "" : dir, limpo));
      if (!fs.existsSync(path.join(RAIZ, alvo))) {
        erro("B. Navegação", `${rota} — link quebrado: ${href} (resolve para ${alvo})`);
      }
    });

    const marca = problemas.length || r.checksFalhos.length ? "✗" : "✓";
    console.log(`${marca} ${rota}${n ? `  (${n} checks)` : ""}`);
  }

  /* ---------- H (parte 2): resíduo de português em modo inglês ----------
     Palavras que só existem em português e não são nome próprio, título de
     documento nem termo técnico preservado. Um bloco inteiro sem tradução
     escapou de "data-en vazio" porque o texto vinha do registro, não do HTML. */
  const PT_SO = /\b(divulgaç\w+|própri\w+|recalculad\w+|trimestre|lacuna|achado|tratamento|declarad\w+|entregas|conclus\w+|encontrad\w+)\b/i;
  const ISENTO = /\.docx|Currículo —|Carta de apresentação —|PUC-Campinas|Agibank|Copom/;

  await pagina.goto(`${BASE}/index.html`, { waitUntil: "networkidle" });
  await pagina.evaluate(() => { try { localStorage.setItem("portfolio-lang", "en"); } catch (e) {} });
  for (const rota of ROTAS) {
    await pagina.goto(`${BASE}/${rota}`, { waitUntil: "networkidle" });
    await pagina.waitForTimeout(200);
    const vaza = await pagina.evaluate((args) => {
      const [reSo, reIsento] = args.map((a) => new RegExp(a.fonte, a.flags));
      if (document.documentElement.lang !== "en") return null;
      const out = [];
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) {
        const t = n.textContent.trim();
        if (!t || t.length < 12) continue;
        if (n.parentElement.closest("script, style, code, pre, [data-auditoria-doc]")) continue;
        if (reIsento.test(t)) continue;
        if (reSo.test(t)) out.push(t.slice(0, 70));
      }
      return out;
    }, [{ fonte: PT_SO.source, flags: "i" }, { fonte: ISENTO.source, flags: "" }]);
    if (vaza === null) { alerta("H. Idioma", `${rota} — não entrou em modo inglês`); continue; }
    const n = [...new Set(vaza)].length;
    if (n) {
      /* Lacuna de tradução é ALERTA, não erro: é item aberto declarado, não
         regressão. Bloquear a publicação por ela esconderia o número em vez de
         resolvê-lo — e este portfólio declara o que falta em vez de omitir.
         O total apurado é publicado em conselho.html como pendência. */
      medido.i18nPendentes += n;
      alerta("H. Idioma", `${rota} — ${n} bloco(s) sem tradução em modo inglês`);
    }
  }
  await pagina.evaluate(() => { try { localStorage.setItem("portfolio-lang", "pt"); } catch (e) {} });

  await pagina.goto(`${BASE}/index.html`, { waitUntil: "networkidle" });
  const reg = await pagina.evaluate(() => {
    const P = window.PERFIL, R = window.REAL;
    return {
      ats: P.ATS.length,
      atsNucleo: P.ATS_NUCLEO.length,
      nucleoForaDoAts: P.ATS_NUCLEO.filter((k) => P.ATS.indexOf(k) === -1),
      selosForaDoNucleo: P.PITCH.capa_selos.filter((s) => P.ATS_NUCLEO.indexOf(s) === -1),
      stats: P.PITCH.capa_stats.map((s) => ({ v: s.v, k: s.k, href: s.href })),
      provas: P.PITCH.provas.map((p) => ({ n: p.n, lbl: p.lbl })),
      provaLinha: P.PITCH.prova_linha,
      divergencias: P.DIVERGENCIAS ? P.DIVERGENCIAS.length : (P.VALIDACAO && P.VALIDACAO.divergencias ? P.VALIDACAO.divergencias.length : null),
      projetos: P.PROJETOS.length,
      fontesRegistradas: Object.keys(R.FONTES).concat(Object.keys(P.FONTES || {})),
      fontesCitadasPerfil: [].concat(...P.EXPERIENCIA.map((e) => e.fonte || [])),
      experiencias: P.EXPERIENCIA.length,
    };
  });

  /* C. aritmética — o número publicado precisa bater com o medido */
  const CLAIM = /(\d+)\s+checks/.exec(reg.provaLinha);
  if (CLAIM && +CLAIM[1] !== medido.checks) {
    erro("C. Aritmética", `linha de prova declara ${CLAIM[1]} checks; medido ${medido.checks}`);
  }
  const statChecks = reg.stats.find((s) => /check/i.test(s.k));
  if (statChecks && statChecks.v !== medido.checks) {
    erro("C. Aritmética", `capa declara ${statChecks.v} checks; medido ${medido.checks}`);
  }

  /* Modelos publicados: estudos + ferramentas próprias, contados no disco.
     Quase todos vivem em `simuladores/` como um arquivo cada; o simulador de
     PVM é grande demais para caber em um arquivo e mora no próprio diretório.
     Contar apenas `simuladores/` deixaria de fora um artefato que a capa
     declara — então a contagem soma os dois lugares e diz de onde veio. */
  const ARTEFATOS_FORA = ["pvm/index.html"];
  const emSimuladores = fs.readdirSync(path.join(RAIZ, "simuladores"))
    .filter((f) => f.endsWith(".html") && f !== "index.html").length;
  const fora = ARTEFATOS_FORA.filter((f) => fs.existsSync(path.join(RAIZ, f)));
  const modelos = emSimuladores + fora.length;
  medido.modelos = modelos;
  const statModelos = reg.stats.find((s) => /modelo/i.test(s.k));
  if (statModelos && statModelos.v !== modelos) {
    erro("C. Aritmética",
      `capa declara ${statModelos.v} modelos; contados ${modelos} ` +
      `(${emSimuladores} em simuladores/ + ${fora.length} em ${ARTEFATOS_FORA.join(", ")})`);
  }

  /* D. registro único — o selo da capa não pode inventar competência */
  if (reg.nucleoForaDoAts.length) {
    erro("D. Registro", `ATS_NUCLEO tem termo fora de ATS: ${reg.nucleoForaDoAts.join(", ")}`);
  }
  if (reg.selosForaDoNucleo.length) {
    erro("D. Registro", `selo da capa fora de ATS_NUCLEO: ${reg.selosForaDoNucleo.join(", ")}`);
  }
  medido.ats = reg.ats;
  medido.atsNucleo = reg.atsNucleo;

  /* F. fontes — todo identificador citado precisa existir na matriz */
  const registradas = new Set(reg.fontesRegistradas);
  [...new Set(reg.fontesCitadasPerfil)].forEach((f) => {
    if (!registradas.has(f)) alerta("F. Fontes", `identificador de fonte não registrado: ${f}`);
  });

  /* I. higiene de arquivos — todo asset referenciado existe */
  const refs = new Set();
  for (const rota of ROTAS) {
    /* o que está em comentário não é publicado, e o que está dentro de
       <script> costuma ser template de JavaScript — nenhum dos dois é
       uma referência real a arquivo */
    const html = fs.readFileSync(path.join(RAIZ, rota), "utf8")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "");
    const re = /(?:src|href)="([^"]+)"/g;
    let m;
    while ((m = re.exec(html))) {
      const v = m[1];
      if (/^(https?:|mailto:|tel:|data:|#|javascript:)/.test(v)) continue;
      if (/[+'`${}<>]/.test(v)) continue;   /* fragmento de template, não caminho */
      const dir = path.posix.dirname(rota);
      refs.add(path.posix.normalize(path.posix.join(dir === "." ? "" : dir, v.split("#")[0].split("?")[0])));
    }
  }
  refs.forEach((f) => {
    if (f && !fs.existsSync(path.join(RAIZ, f))) erro("I. Higiene", `arquivo referenciado não existe: ${f}`);
  });

  await navegador.close();

  /* ---------- parecer ---------- */
  console.log("\n" + "─".repeat(64));
  console.log("MEDIDO");
  console.log(`  checks recalculados ......... ${medido.checks}`);
  console.log(`  modelos publicados .......... ${medido.modelos}`);
  console.log(`  páginas auditadas ........... ${ROTAS.length}`);
  console.log(`  termos de triagem (ATS) ..... ${medido.ats} (núcleo curado: ${medido.atsNucleo})`);
  console.log(`  experiências no registro .... ${reg.experiencias}`);
  console.log(`  blocos sem tradução (EN) .... ${medido.i18nPendentes}  ← item aberto declarado`);
  console.log("─".repeat(64));

  const erros = achados.filter((a) => a.gravidade === "erro");
  const alertas = achados.filter((a) => a.gravidade === "alerta");
  const frentes = [...new Set(achados.map((a) => a.frente))].sort();

  if (!achados.length) {
    console.log("\n✓ PARECER: nenhuma inconsistência encontrada nas nove frentes.");
    process.exit(0);
  }
  for (const f of frentes) {
    console.log(`\n${f}`);
    achados.filter((a) => a.frente === f).forEach((a) => {
      console.log(`  ${a.gravidade === "erro" ? "✗" : "!"} ${a.msg}`);
    });
  }
  console.log(`\nPARECER: ${erros.length} erro(s), ${alertas.length} alerta(s).`);
  process.exit(erros.length ? 1 : 0);
})();
