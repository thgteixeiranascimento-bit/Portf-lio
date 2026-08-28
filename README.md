# Portfólio — Finanças Corporativas, FP&A, Valuation e BI

Portfólio técnico em formato de site estático: **10 simuladores financeiros interativos**,
uma **ferramenta de FP&A que roda sobre a base do próprio usuário**
([Price · Volume · Mix](pvm/index.html)), dashboards executivos, biblioteca de KPIs e uma camada
completa de governança analítica (protocolo antialucinação, rastreabilidade e checks automáticos
de integridade).

> ⚖️ **Protocolo de integridade** — os estudos usam a *Aurora Industrial S.A.*, empresa
> **fictícia** criada para demonstrar técnica. São simulações identificadas, não experiência
> profissional real nem recomendação de investimento. A exceção é o **simulador de Price · Volume ·
> Mix**, que é uma ferramenta: ele calcula sobre a base que o usuário carregar, processada
> integralmente no navegador. Ver [`metodologia.html`](metodologia.html) e [`docs/`](docs/).

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
| **Ferramenta** | [`pvm/index.html`](pvm/index.html) | **Price · Volume · Mix sobre a sua base**: o que moveu receita e margem — preço, volume, mix, produtos novos e descontinuados |
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
├── pvm/index.html      ferramenta Price · Volume · Mix (carrega a base do usuário)
├── assets/
│   ├── css/
│   │   ├── style.css   tema executivo (claro/escuro) — tokens compartilhados
│   │   └── pvm.css     estilos do simulador PVM (usa os mesmos tokens)
│   └── js/
│       ├── core.js     gráficos SVG, formatação pt-BR, navegação, checks
│       ├── data.js     dataset central da empresa fictícia (fonte única)
│       ├── pvm-engine.js     matemática do PVM — funções puras, sem DOM
│       ├── pvm-parser.js     leitura de CSV/TSV/XLSX e mapeamento de colunas
│       ├── pvm-xlsx.js       codec XLSX próprio (ZIP + SpreadsheetML)
│       ├── pvm-validator.js  qualidade de dados e Data Quality Score
│       ├── pvm-charts.js     waterfall, barras e matriz de mix (SVG)
│       ├── pvm-insights.js   narrativa derivada só dos números calculados
│       ├── pvm-storage.js    persistência local (IndexedDB)
│       ├── pvm-export.js     Excel (6 abas), CSV e JSON
│       ├── pvm-worker.js     leitura e agregação fora da thread da interface
│       └── pvm-app.js        estado e renderização da tela
├── tests/              suíte de testes do PVM (Node e navegador)
├── docs/               metodologia, fontes, validação e limitações (Markdown)
└── automation/
    └── python/cvm_dados_abertos.py   coleta real de dados abertos da CVM
```

Arquitetura dos modelos: **Inputs → Cálculos → Outputs → Checks**, com um único dataset
versionado alimentando todos os módulos (sem números copiados à mão). Ao todo, **44 checks
automáticos** de consistência são recalculados no navegador a cada mudança de premissa.

## Price · Volume · Mix — a ferramenta

**[Abrir o simulador](pvm/index.html)** · **[Metodologia completa](docs/pvm-metodologia.md)**

### O que é PVM

Quando a receita muda entre dois períodos, três coisas podem ter acontecido ao mesmo tempo:
os **preços** mudaram, a **quantidade** vendida mudou, e a **composição** do que foi vendido
mudou (vender mais do produto caro e menos do barato altera a receita mesmo com preço e volume
total constantes). *Price · Volume · Mix* é a decomposição que separa esses três efeitos — e,
neste simulador, também os efeitos de **produtos novos** e **descontinuados**.

### Como funciona

```
Upload → Map → Validate → Analyze → Export
```

1. **Upload** — `.xlsx`, `.csv` ou `.tsv`, nos formatos LONG (uma linha por item × período) ou
   WIDE (colunas base/atual na mesma linha). Detecção automática de delimitador, separador
   decimal e formato. Há um dataset **DEMO** sintético e rotulado, e um template para download.
2. **Map** — nenhum nome de coluna é obrigatório: o simulador propõe um mapeamento e você ajusta.
3. **Validate** — escolha dos dois períodos, painel de qualidade com Data Quality Score em cinco
   componentes e bloqueio do cálculo em erro crítico.
4. **Analyze** — KPIs, waterfall interativo, contribuição por efeito e por dimensão, matriz de mix,
   tabela de drivers com drill-down, filtros que recalculam tudo, insights com proveniência e
   painel *Model integrity*.
5. **Export** — Excel com seis abas, CSV, JSON, e gravação da análise no navegador.

### Base de dados exigida

| Análise | Campos mínimos |
|---|---|
| PVM de Receita | `SKU` · `Period` · `Quantity` · `Revenue` (ou `Unit Price` no lugar de `Revenue`) |
| PVM de Margem Bruta | os acima + `COGS` (ou custo unitário) |
| Dimensões opcionais | `Category`, `Customer`, `Channel`, `Region`, `UOM`, vendedor, unidade de negócio |

### Metodologia de cálculo

Quatro convenções, todas **exatamente aditivas** e derivadas algebricamente em
[`docs/pvm-metodologia.md`](docs/pvm-metodologia.md). A padrão é a **FTI-style**:

```
Price_i  = (P1_i − P0_i) × Q1_i
Volume_i = P0_i × Q0_i × (g − 1)
Mix_i    = P0_i × (Q1_i − g × Q0_i)        onde g = ΣQ1 / ΣQ0
```

**Mix nunca é um plug.** Nenhuma das quatro convenções obtém Mix por diferença; o resíduo existe
apenas como controle de reconciliação, e é exibido sempre — inclusive quando é zero.

Produtos novos e descontinuados ficam em baldes próprios (`New = ΣR1`, `Discontinued = −ΣR0`) e
**não entram** no fator de crescimento nem no preço médio do portfólio. Itens presentes nos dois
períodos mas sem preço calculável (quantidade zero ou negativa) vão para um balde `Other` visível,
em vez de gerar `NaN`.

### Metodologia de Margem Bruta

A ponte de margem é a diferença exata, item a item, entre a ponte de receita e a ponte de COGS:

```
GM base + Selling price − Unit cost + Volume + Sales mix − Cost mix + New + Discontinued = GM atual
```

Itens sem COGS ficam **fora** da análise de margem — nenhum custo é arbitrado para fechar a ponte —
e a cobertura é reportada em itens e em % da receita base.

### Privacidade dos dados

O site é estático e **não possui backend**. Leitura, cálculo, gráficos e exportação acontecem
inteiramente no navegador; as análises salvas ficam em IndexedDB local. Não há `fetch`,
`XMLHttpRequest`, `WebSocket` nem `sendBeacon` em nenhum módulo `pvm-*.js`.

### Verificações automáticas

Antes do cálculo: campos obrigatórios, tipos, duplicidade `SKU + período`, quantidade zero ou
negativa, receita zero ou negativa, cobertura de COGS e conflito de unidade de medida.
Durante o cálculo: reconciliação da ponte de receita, de COGS e de margem, com tolerância
`max(0,01 ; |valor| × 1e-9)` e status `PASS`/`FAIL` sempre visível.

### Desempenho

Medido em Chromium com uma base real de **99.900 linhas / 50.000 SKUs** (CSV de 8,8 MB, com COGS
e quatro dimensões): leitura + tipagem em **0,85 s**, agregação + validação em **1,9 s**, RUN PVM
com renderização completa em **1,8 s**, e recálculo ao aplicar filtro em **1,7 s** — com bloqueio
máximo da thread principal de **959 ms** no pico. Pontes de receita e de margem: **PASS**, resíduo `0`.

Leitura, tipagem e agregação rodam em Web Worker. Alguns limites de **exibição** (500 bolhas na
matriz de mix, 1.000 linhas na tabela, dimensões com até 300 valores como filtro) impedem que a
aba congele — nenhum deles altera um número, e todos são declarados na tela. Detalhes e medições
em [`docs/pvm-metodologia.md`](docs/pvm-metodologia.md) §13.

### Stack

HTML/CSS/JavaScript puros, ES Modules, gráficos SVG próprios e um **codec XLSX próprio**
(ZIP + SpreadsheetML sobre `DecompressionStream`/`CompressionStream`) — nenhuma biblioteca
externa, nenhum CDN, funciona offline e no GitHub Pages. Web Worker para leitura e agregação
de bases grandes.

### Como rodar localmente

```bash
python3 -m http.server        # na raiz do repositório
# abra http://localhost:8000/pvm/index.html
```

### Como testar

```bash
npm test                      # 100 testes: motor, parser, validador e narrativa
# equivalente a: node tests/run.mjs
```

Ou abra `http://localhost:8000/tests/index.html` para rodar a mesma suíte no navegador.
A suíte cobre os casos de sanidade (só preço, só volume, só mix, nenhuma mudança, SKU novo,
SKU descontinuado, mix favorável e desfavorável), a identidade da ponte nas quatro convenções,
casos de borda (quantidade zero, negativos, duplicidade, UOM divergente, base vazia, 100 mil
itens, acentuação, vírgula decimal) e a reprodução dos números do workbook de referência.

### Referências

- **FTI Consulting**, *A Quantifiable Approach to Price Volume Mix Analysis* —
  <https://www.fticonsulting.com/insights/white-papers/quantifiable-approach-price-volume-mix-analysis>
  (origem conceitual da metodologia padrão).
- **Workbook do webinar de PVM** fornecido pelo titular (`PVM_DATA.xlsx`, `PVM_calculations.xlsx`) —
  abas *Basic*, *Advanced* e *New method*. Convergências e divergências estão confrontadas número a
  número na seção 9 de [`docs/pvm-metodologia.md`](docs/pvm-metodologia.md).
- **Relatório Power BI** indicado na especificação — referência de layout e vocabulário, não de fórmula.
- O arquivo `.pbix` do webinar **não foi aberto**: não há leitor de `.pbix` no ambiente, e transcrever
  DAX sem lê-lo violaria a regra antialucinação. Isso está declarado na documentação.

### Limitações

O resultado depende da qualidade e da comparabilidade da base. O preço unitário é derivado de
`Receita / Quantidade`, então descontos e devoluções aparecem como efeito preço. Produtos novos e
descontinuados não têm par de comparação e por isso não geram efeito de preço nem de mix. A
fronteira entre Volume e Mix depende da granularidade da base recebida. Com unidades de medida
heterogêneas a ponte fecha, mas a leitura de Volume e Mix deixa de ser válida — e o simulador avisa.
O simulador **não explica por que** preço ou volume mudaram: isso não está nos dados.

> *This tool is intended for financial planning and analytical purposes. Results depend on the
> quality and comparability of the uploaded data. Users should validate accounting definitions and
> business-specific classifications before relying on the analysis.*

## Personalização pendente (para o titular)

- [ ] Preencher experiência, formação, certificações e LinkedIn em `sobre.html`
      (hoje marcados **DADO NÃO INFORMADO**, por regra de integridade);
- [ ] Conferir as 3 referências metodológicas marcadas "não verificadas" em
      [`docs/fontes.md`](docs/fontes.md);
- [ ] (Roadmap) versões Excel/VBA e Power BI dos modelos.

## Stack

HTML/CSS/JavaScript puros (sem dependências externas — funciona offline e no GitHub Pages),
gráficos SVG próprios com tooltips, tema claro/escuro e tabelas de dados acessíveis;
ES Modules, Web Worker e um codec XLSX próprio no simulador de PVM;
Python 3 (biblioteca padrão) para a automação de dados públicos da CVM.
