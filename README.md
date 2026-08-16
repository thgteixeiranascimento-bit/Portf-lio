# Portfólio — Finanças Corporativas, FP&A, Valuation e BI · com dados públicos reais

Portfólio técnico em formato de site estático: **análise setorial de cinco instituições financeiras**,
**dez estudos interativos** construídos sobre divulgações oficiais, dashboards executivos, biblioteca de
KPIs bancários e uma camada completa de governança analítica (protocolo antialucinação, rastreabilidade,
divergências documentadas e **102 checks automáticos de integridade**).

> ⚖️ **Protocolo de integridade** — todos os estudos usam **dados públicos de fontes primárias datadas**:
> Nu Holdings (1T26/2T26, releases + reconciliações com asseguração KPMG + DFs IFRS), Agi/Agibank (1T26,
> release + DFs com revisão EY), Itaú (2T26), Bradesco (1T26), Santander Brasil (1T26/2T26) e atas do
> Copom. Fatos, premissas e estimativas são rotulados separadamente; **extração documental (nível 1) e
> informação relatada (nível 3) nunca se misturam**; lacunas são declaradas; **nada é recomendação de
> investimento**. Ver [`metodologia.html`](metodologia.html) e [`docs/`](docs/).

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

Para rodar localmente: `python3 -m http.server` na raiz do repositório e abra `http://localhost:8000`.

## Conteúdo

| Área | Página | O que entrega |
|---|---|---|
| Setorial | [`analises/bancos-2026.html`](analises/bancos-2026.html) | Itaú, Bradesco, Santander, Nu e Agi + ciclo completo da Selic + múltiplos de mercado — 30 checks |
| FP&A | [`simuladores/orcamento.html`](simuladores/orcamento.html) | Ponte de resultado do Nu (t/t e a/a) sobre o P&L gerencial divulgado |
| FP&A | [`simuladores/rolling-forecast.html`](simuladores/rolling-forecast.html) | Forecast 12m por drivers ancorado no 2T26 real (estimativas rotuladas) |
| Caixa | [`simuladores/fluxo-de-caixa.html`](simuladores/fluxo-de-caixa.html) | DFC real da Agi (1T26) com IPO aberto item a item — reconciliação exata |
| Funding | [`simuladores/capital-de-giro.html`](simuladores/capital-de-giro.html) | Mix de depósitos, varejo × institucional, LDR, custo de captação |
| Modelagem | [`simuladores/tres-demonstracoes.html`](simuladores/tres-demonstracoes.html) | DRE + balanço + fluxo + mutação do PL da Agi amarrados (exato) |
| Valuation | [`simuladores/valuation.html`](simuladores/valuation.html) | P/VPA justificado (Gordon) × observado no mercado, com engenharia reversa das premissas implícitas |
| Corp. finance | [`simuladores/capex-evte.html`](simuladores/capex-evte.html) | Unit economics da expansão México do Nu (EVTE educacional) |
| Corp. finance | [`simuladores/ma.html`](simuladores/ma.html) | Anatomia do IPO real da Agi na NYSE: oferta, custos, capital, ROAE |
| Riscos | [`simuladores/riscos.html`](simuladores/riscos.html) | NPL, ECL por estágio (IFRS 9), cobertura, capital e stress declarado |
| Quant | [`simuladores/portfolio.html`](simuladores/portfolio.html) | Mix e concentração (HHI) das carteiras de crédito divulgadas |
| BI | [`dashboards.html`](dashboards.html) | 4 painéis: setorial, Nu, Agi e macro/Selic |
| KPIs | [`kpis.html`](kpis.html) | Biblioteca de KPIs bancários com exemplos reais calculados |
| Governança | [`metodologia.html`](metodologia.html) | Protocolo, rastreabilidade, divergências documentadas, QC |

## Estrutura do repositório

```
/                       páginas do site (GitHub Pages serve a raiz)
├── index.html          home
├── sobre.html          perfil (lacunas marcadas "DADO NÃO INFORMADO")
├── dashboards.html     4 dashboards executivos
├── kpis.html           biblioteca de KPIs bancários
├── metodologia.html    governança e protocolo de integridade
├── analises/           análise setorial (5 instituições + Copom)
├── simuladores/        10 estudos interativos sobre dados reais
├── assets/
│   ├── css/style.css   tema executivo (claro/escuro)
│   └── js/
│       ├── core.js     gráficos SVG, formatação pt-BR, checks, fontes
│       └── data.js     dataset central de DADOS PÚBLICOS REAIS (fonte única, com registro de fontes)
├── docs/               metodologia, fontes, validação e limitações (Markdown)
└── automation/
    └── python/cvm_dados_abertos.py   coleta real de dados abertos da CVM
```

Arquitetura dos estudos: **Fatos (fonte citada) → Premissas explícitas → Cálculos → Outputs rotulados →
Checks**, com um único dataset versionado alimentando todos os módulos (sem números copiados à mão).
**136 checks de integridade** recalculados no navegador — somas, pontes e razões conferidas contra o
divulgado, incluindo verificações cruzadas entre documentos do mesmo emissor (release × DFs IFRS × workbook
de dados históricos) e a validação da derivação do 3T25 do Nu contra o exercício assegurado pela KPMG.

## Fontes (resumo)

**Nível 1 — extração documental:** Nu Holdings (releases 1T26/2T26; Managerial P&L Reconciliation Reports
4T25/1T26/2T26 com asseguração limitada KPMG; DFs intermediárias IFRS; workbook oficial "Historical Data
3Q25"), Agi Inc/Banco Agibank (Earnings Release 1Q26; DFs intermediárias IFRS com revisão limitada EY),
Itaú Unibanco (apresentação 2T26; Rel. Administração IFRS 1S26), Banco Bradesco (Relatório de Análise
Econômica e Financeira 1T26), Banco Santander Brasil (apresentações 1T26/2T26) e Banco Central do Brasil
(atas 277ª, 278ª, **279ª** e 280ª do Copom).

**Nível 3 — relatado, sem documento anexado:** resultados de Bradesco 2T26 e Agi 2T26; cotações e múltiplos
de agregadores de mercado (publicados **em faixa**, porque divergem entre si); Basileia da Nu Pagamentos
S.A. (entidade individual, não o consolidado do grupo).

Matriz completa com datas, níveis e lacunas: [`docs/fontes.md`](docs/fontes.md).

**Ressalva:** a maior parte dos documentos foi recebida como conversões OCR/planilhas; o workbook XLSX do Nu
e a ata da 279ª vieram em formato nativo. A conferência contra os originais publicados permanece pendente e
declarada.

## Personalização pendente (para o titular)

- [ ] Preencher experiência, formação, certificações e LinkedIn em `sobre.html`
      (hoje marcados **DADO NÃO INFORMADO**, por regra de integridade);
- [ ] Conferir os arquivos OCR contra os PDFs originais dos emissores;
- [ ] Anexar os documentos originais de **Bradesco 2T26 e Agi 2T26** para promovê-los de relato (nível 3)
      a extração documental (nível 1) e incluí-los nos checks;
- [ ] Obter o **índice de capital consolidado do Nu Holdings** no painel de Conglomerados Prudenciais do
      BCB (o disponível hoje é da Nu Pagamentos S.A., entidade individual);
- [ ] (Roadmap) versões Excel/VBA e Power BI dos modelos.

## Stack

HTML/CSS/JavaScript puros (sem dependências externas — funciona offline e no GitHub Pages), gráficos SVG
próprios com tooltips e tabelas de dados acessíveis, tema claro/escuro; Python 3 (biblioteca padrão) para
a automação de dados públicos da CVM.
