# Portfólio — Finanças Corporativas, FP&A, Valuation e BI

Portfólio técnico em formato de site estático: **10 simuladores financeiros interativos**,
dashboards executivos, biblioteca de KPIs e uma camada completa de governança analítica
(protocolo antialucinação, rastreabilidade e checks automáticos de integridade).

> ⚖️ **Protocolo de integridade** — todos os estudos usam a *Aurora Industrial S.A.*, empresa
> **fictícia** criada para demonstrar técnica. São simulações identificadas, não experiência
> profissional real nem recomendação de investimento. Ver [`metodologia.html`](metodologia.html)
> e [`docs/`](docs/).

## 🌐 Publicar o site (link para o LinkedIn)

O site é 100% estático — basta ativar o **GitHub Pages**:

1. Faça o merge desta branch na `main`;
2. No GitHub: **Settings → Pages → Build and deployment**;
3. Em *Source*, escolha **Deploy from a branch**; selecione `main` e a pasta `/ (root)`; salve.

Em 1–2 minutos o portfólio estará no ar em:

```
https://thgteixeiranascimento-bit.github.io/Portf-lio/
```

Esse é o link para colocar no LinkedIn (seção *Destaques* ou no campo *Site* do perfil).

Para rodar localmente: `python3 -m http.server` na raiz do repositório e abra
`http://localhost:8000`.

## Conteúdo

| Área | Página | Decisão que suporta |
|---|---|---|
| FP&A | [`simuladores/orcamento.html`](simuladores/orcamento.html) | Real × Orçado × Forecast, variações preço/volume/mix, ponte de EBITDA |
| FP&A | [`simuladores/rolling-forecast.html`](simuladores/rolling-forecast.html) | Rolling forecast 12m com cenários Base/Upside/Downside/Stress |
| Caixa | [`simuladores/fluxo-de-caixa.html`](simuladores/fluxo-de-caixa.html) | Fluxo direto mensal (IAS 7/CPC 03), runway, necessidade de captação |
| Caixa | [`simuladores/capital-de-giro.html`](simuladores/capital-de-giro.html) | DSO/DIO/DPO/CCC e o valor de cada dia de prazo |
| Modelagem | [`simuladores/tres-demonstracoes.html`](simuladores/tres-demonstracoes.html) | DRE + Balanço + Caixa integrados, com painel de integridade |
| Valuation | [`simuladores/valuation.html`](simuladores/valuation.html) | DCF (FCFF/WACC), sensibilidade WACC×g, football field |
| Corp. finance | [`simuladores/capex-evte.html`](simuladores/capex-evte.html) | EVTE: VPL, TIR, paybacks, equilíbrio, tornado |
| Corp. finance | [`simuladores/ma.html`](simuladores/ma.html) | M&A: pro forma, accretion/dilution, preço máximo |
| Riscos | [`simuladores/riscos.html`](simuladores/riscos.html) | Heatmap de riscos, stress combinado, covenant |
| Quant | [`simuladores/portfolio.html`](simuladores/portfolio.html) | Fronteira eficiente (educacional) |
| Dados reais | [`analises/bancos-2026.html`](analises/bancos-2026.html) | Itaú, Bradesco e Santander (1T26/2T26) + ciclo da Selic nas atas do Copom — fontes primárias datadas |
| BI | [`dashboards.html`](dashboards.html) | Painéis CFO, FP&A, capital de giro e liquidez |
| KPIs | [`kpis.html`](kpis.html) | Biblioteca documentada com exemplos calculados |
| Governança | [`metodologia.html`](metodologia.html) | Protocolo, conselho de validação, rastreabilidade, QC |

## Estrutura do repositório

```
/                       páginas do site (GitHub Pages serve a raiz)
├── index.html          home
├── sobre.html          perfil (lacunas marcadas "DADO NÃO INFORMADO")
├── dashboards.html     4 dashboards executivos
├── kpis.html           biblioteca de KPIs
├── metodologia.html    governança e protocolo de integridade
├── simuladores/        10 simuladores interativos
├── assets/
│   ├── css/style.css   tema executivo (claro/escuro)
│   └── js/
│       ├── core.js     gráficos SVG, formatação pt-BR, checks
│       └── data.js     dataset central da empresa fictícia (fonte única)
├── docs/               metodologia, fontes, validação e limitações (Markdown)
└── automation/
    └── python/cvm_dados_abertos.py   coleta real de dados abertos da CVM
```

Arquitetura dos modelos: **Inputs → Cálculos → Outputs → Checks**, com um único dataset
versionado alimentando todos os módulos (sem números copiados à mão). Ao todo, **44 checks
automáticos** de consistência são recalculados no navegador a cada mudança de premissa.

## Personalização pendente (para o titular)

- [ ] Preencher experiência, formação, certificações e LinkedIn em `sobre.html`
      (hoje marcados **DADO NÃO INFORMADO**, por regra de integridade);
- [ ] Conferir as 3 referências metodológicas marcadas "não verificadas" em
      [`docs/fontes.md`](docs/fontes.md);
- [ ] (Roadmap) versões Excel/VBA e Power BI dos modelos.

## Stack

HTML/CSS/JavaScript puros (sem dependências externas — funciona offline e no GitHub Pages),
gráficos SVG próprios com tooltips, tema claro/escuro e tabelas de dados acessíveis;
Python 3 (biblioteca padrão) para a automação de dados públicos da CVM.
