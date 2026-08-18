#!/usr/bin/env node
/* ============================================================
   verificar_paginas.js — controle de qualidade automatizado
   ------------------------------------------------------------
   Abre cada página do portfólio em um navegador real e reprova a
   execução se encontrar:

     · qualquer erro de JavaScript ou de console;
     · qualquer check de integridade em estado "falhou";
     · divergência entre a contagem de checks apurada e a
       contagem publicada no site.

   É o que sustenta a afirmação "147 checks" ser um número medido
   e não um número escrito: se um check quebrar, este script
   reprova antes do push.

   USO
     npm install playwright-core          (dependência só de teste)
     python3 -m http.server 8765          (em outro terminal, na raiz)
     node automation/node/verificar_paginas.js

   O site publicado continua sem nenhuma dependência externa —
   esta ferramenta existe apenas no fluxo de desenvolvimento.
   ============================================================ */

"use strict";

const BASE = process.env.PORTFOLIO_URL || "http://localhost:8765";
const CHROME = process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

/* Contagem esperada por página. Cada painel renderiza uma linha de
   resumo além dos checks, por isso o total do DOM é sempre N + 1. */
const ESPERADO = {
  "analises/bancos-2026.html": 41,
  "kpis.html": 10,
  "simuladores/orcamento.html": 30,
  "simuladores/rolling-forecast.html": 5,
  "simuladores/fluxo-de-caixa.html": 7,
  "simuladores/capital-de-giro.html": 6,
  "simuladores/tres-demonstracoes.html": 11,
  "simuladores/valuation.html": 9,
  "simuladores/capex-evte.html": 5,
  "simuladores/ma.html": 8,
  "simuladores/riscos.html": 7,
  "simuladores/portfolio.html": 8,
  "simuladores/calculadora-juros.html": 8,
  "simuladores/antecipacao-parcelas.html": 7,
  "simuladores/rechamadas.html": 8,
  "validacao-perfil.html": 12,
};

/* Grupos usados nas afirmações públicas do site. */
const GRUPOS = {
  "Estudos sobre dados públicos": [
    "analises/bancos-2026.html", "kpis.html", "simuladores/orcamento.html",
    "simuladores/rolling-forecast.html", "simuladores/fluxo-de-caixa.html",
    "simuladores/capital-de-giro.html", "simuladores/tres-demonstracoes.html",
    "simuladores/valuation.html", "simuladores/capex-evte.html", "simuladores/ma.html",
    "simuladores/riscos.html", "simuladores/portfolio.html",
  ],
  "Ferramentas próprias": [
    "simuladores/calculadora-juros.html", "simuladores/antecipacao-parcelas.html",
    "simuladores/rechamadas.html",
  ],
  "Validação do perfil": ["validacao-perfil.html"],
};

const SEM_CHECKS = [
  "index.html", "curriculo.html", "carta-apresentacao.html", "sobre.html",
  "metodologia.html", "dashboards.html", "simuladores/index.html",
];

const PAGINAS = SEM_CHECKS.concat(Object.keys(ESPERADO));

(async () => {
  let chromium;
  try {
    ({ chromium } = require("playwright-core"));
  } catch (e) {
    console.error("playwright-core não instalado. Rode: npm install playwright-core");
    process.exit(2);
  }

  const navegador = await chromium.launch({ executablePath: CHROME });
  const pagina = await navegador.newPage();
  const problemas = [];
  const apurado = {};

  for (const rota of PAGINAS) {
    const erros = [];
    pagina.removeAllListeners("pageerror");
    pagina.removeAllListeners("console");
    pagina.on("pageerror", (e) => erros.push("JS: " + e.message));
    pagina.on("console", (m) => { if (m.type() === "error") erros.push("Console: " + m.text()); });

    await pagina.goto(BASE + "/" + rota, { waitUntil: "networkidle" });
    await pagina.waitForTimeout(300);

    const r = await pagina.evaluate(() => {
      const todos = [...document.querySelectorAll(".check")];
      return {
        total: todos.length,
        falhas: todos.filter((c) => c.classList.contains("fail")).map((c) => c.textContent.trim().slice(0, 120)),
        titulo: document.title,
      };
    });

    /* o painel acrescenta uma linha de resumo ao final */
    const checks = r.total > 0 ? r.total - 1 : 0;
    apurado[rota] = checks;

    erros.forEach((e) => problemas.push(`${rota} — ${e}`));
    r.falhas.forEach((f) => problemas.push(`${rota} — check reprovado: ${f}`));

    if (ESPERADO[rota] != null && checks !== ESPERADO[rota]) {
      problemas.push(`${rota} — contagem de checks divergente: apurado ${checks}, esperado ${ESPERADO[rota]}`);
    }

    const marca = erros.length || r.falhas.length ? "✗" : "✓";
    console.log(`${marca} ${rota}${checks ? `  (${checks} checks)` : ""}`);
  }

  await navegador.close();

  console.log("\nContagem por grupo");
  let total = 0;
  for (const [nome, rotas] of Object.entries(GRUPOS)) {
    const n = rotas.reduce((s, r) => s + (apurado[r] || 0), 0);
    total += n;
    console.log(`  ${nome}: ${n}`);
  }
  console.log(`  TOTAL: ${total}`);

  if (problemas.length) {
    console.error(`\n${problemas.length} problema(s) encontrado(s):`);
    problemas.forEach((p) => console.error("  · " + p));
    process.exit(1);
  }
  console.log(`\n${PAGINAS.length}/${PAGINAS.length} páginas sem erro de JavaScript e sem check reprovado.`);
})();
