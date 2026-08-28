# Thiago Teixeira Nascimento — Portfólio técnico de FP&A, Planejamento Financeiro e Risco de Crédito

**Economista pela PUC-Campinas.** Orçamento, forecast e análise de variações · Modelagem financeira ·
DRE, balanço e fluxo de caixa · IFRS e BR GAAP · Risco de crédito e IFRS 9 · Power BI (DAX), Excel avançado,
SQL e Python.

🔗 **Site:** https://thgteixeiranascimento-bit.github.io/Portf-lio/
📄 **Currículo (PDF, Word e HTML):** [`curriculo.html`](curriculo.html) · ✉️ **Carta:** [`carta-apresentacao.html`](carta-apresentacao.html)
💼 **LinkedIn:** [thiago-teixeira-nascimento-03a3961a3](https://www.linkedin.com/in/thiago-teixeira-nascimento-03a3961a3)

---

## O que este repositório é

Um portfólio técnico em formato de site estático que serve a dois leitores ao mesmo tempo:

| Se você é… | Comece por | Tempo |
|---|---|---|
| **Recrutador ou RH** | [Home](index.html) → [Currículo](curriculo.html) | 2 min |
| **Gestor técnico de finanças** | [Análise setorial](analises/bancos-2026.html) → [Análise de variações](simuladores/orcamento.html) | 10 min |
| **Quem quer ver código** | [`core.js`](assets/js/core.js) · [`perfil.js`](assets/js/perfil.js) · [`automation/`](automation/) | — |

**Conteúdo:** análise setorial de cinco instituições financeiras, **dez estudos interativos** sobre divulgações
oficiais, **quatro ferramentas próprias** — entre elas o simulador de [Price · Volume · Mix](pvm/index.html),
que roda sobre a base que o próprio visitante carrega —, dashboards executivos, biblioteca de KPIs bancários
e uma camada completa de governança analítica.

**199 checks recalculados no navegador** — 147 nos estudos sobre dados públicos, 28 nas ferramentas próprias,
12 na validação do próprio currículo e 12 na validação do trabalho como um todo. A contagem é medida por
[`automation/node/verificar_paginas.js`](automation/node/verificar_paginas.js), não escrita à mão, e o
[`conselho.js`](automation/node/conselho.js) reprova a publicação se o número publicado divergir do apurado.

> ⚖️ **Protocolo de integridade** — todos os estudos usam **dados públicos de fontes primárias datadas**:
> Nu Holdings (série completa de 1T25 a 2T26 — releases, reconciliações com asseguração KPMG, DFs IFRS e
> workbook oficial de dados históricos), Agi/Agibank, Itaú, Bradesco, Santander Brasil e as quatro atas do
> Copom. Fatos, premissas, estimativas e derivações são rotulados separadamente; **extração documental (nível 1) e
> informação relatada (nível 3) nunca se misturam**; lacunas são declaradas; **nada é recomendação de
> investimento**. Ver [`metodologia.html`](metodologia.html) e [`docs/`](docs/).
>
> ⚠️ **Conflito de interesse** — o autor é **colaborador do Agibank (vínculo atual)**, e a Agi/Agibank é uma das
> cinco instituições analisadas. Todo o conteúdo sobre a Agi vem de **documentos públicos**, com tratamento
> idêntico ao das demais e sujeito aos mesmos checks; nenhuma informação interna foi utilizada — inclusive nas
> ferramentas próprias, cujos parâmetros são ilustrativos e definidos pelo visitante.

---

## Ferramentas próprias — construídas do zero

Três modelos que não leem divulgação pública: resolvem uma classe de problema que custa dinheiro numa operação
real, com parâmetros que o visitante controla.

| Ferramenta | Problema que resolve |
|---|---|
| [`simuladores/calculadora-juros.html`](simuladores/calculadora-juros.html) | Conversão de taxas por equivalência e cronograma completo em Price, SAC e bullet — com o tamanho dos dois erros mais comuns quantificado |
| [`simuladores/antecipacao-parcelas.html`](simuladores/antecipacao-parcelas.html) | Quanto o cliente deve ao antecipar parcelas: valor presente por desconto racional × soma nominal × desconto linear, com o **erro evitado** em reais e em % |
| [`simuladores/rechamadas.html`](simuladores/rechamadas.html) | Volume, taxa de rechamada, TMO e custo/minuto convertidos em custo anual da Central de Atendimento, decompostos por causa-raiz e ordenados por retorno sobre esforço |

Nenhuma delas contém volume, custo, taxa, cliente ou qualquer dado operacional de empregador.

---

## Estudos sobre divulgação pública real

| Área | Página | O que entrega |
|---|---|---|
| Setorial | [`analises/bancos-2026.html`](analises/bancos-2026.html) | As cinco instituições no 2T26 + ciclo completo da Selic + múltiplos de mercado — 41 checks |
| FP&A | [`simuladores/orcamento.html`](simuladores/orcamento.html) | Ponte de resultado do Nu (t/t e a/a) sobre o P&L gerencial divulgado — 30 checks |
| FP&A | [`simuladores/rolling-forecast.html`](simuladores/rolling-forecast.html) | Forecast 12m por drivers ancorado no 2T26 real (estimativas rotuladas) |
| Caixa | [`simuladores/fluxo-de-caixa.html`](simuladores/fluxo-de-caixa.html) | DFC real da Agi (1T26) com IPO aberto item a item — reconciliação exata |
| Funding | [`simuladores/capital-de-giro.html`](simuladores/capital-de-giro.html) | Mix de depósitos, varejo × institucional, LDR, custo de captação |
| Modelagem | [`simuladores/tres-demonstracoes.html`](simuladores/tres-demonstracoes.html) | DRE + balanço + fluxo + mutação do PL da Agi amarrados (exato) |
| Valuation | [`simuladores/valuation.html`](simuladores/valuation.html) | P/VPA justificado (Gordon) × observado, com engenharia reversa das premissas implícitas |
| Corp. finance | [`simuladores/capex-evte.html`](simuladores/capex-evte.html) | Unit economics da expansão México do Nu (EVTE educacional) |
| Corp. finance | [`simuladores/ma.html`](simuladores/ma.html) | Anatomia do IPO real da Agi na NYSE: oferta, custos, capital, ROAE |
| Riscos | [`simuladores/riscos.html`](simuladores/riscos.html) | NPL, ECL por estágio (IFRS 9), cobertura, capital e stress declarado |
| Quant | [`simuladores/portfolio.html`](simuladores/portfolio.html) | Mix e concentração (HHI) das carteiras de crédito divulgadas |
| BI | [`dashboards.html`](dashboards.html) | 5 painéis: setorial, Nu, Agi, macro/Selic e mercado |
| KPIs | [`kpis.html`](kpis.html) | Biblioteca de KPIs bancários com exemplos reais calculados |

---

## Governança — aplicada também ao próprio currículo

| Página | O que faz |
|---|---|
| [`metodologia.html`](metodologia.html) | Protocolo antialucinação, rastreabilidade, 15 divergências documentadas, conflito de interesse, QC |
| [`validacao-perfil.html`](validacao-perfil.html) | **Conselho de validação do perfil**: 12 checks automáticos de rastreabilidade das afirmações biográficas, hierarquia de fontes, 8 divergências entre documentos-fonte e controles de privacidade |
| [`conselho.html`](conselho.html) | **Conselho de validação do trabalho**: nove frentes de auditoria medidas sobre o site inteiro — execução, navegação, aritmética, registro único, ancoragem, fontes, acessibilidade, idioma e higiene —, com os achados que reprovaram a primeira execução e as pendências que seguem abertas |

O mesmo protocolo aplicado às demonstrações financeiras é aplicado à biografia: cada afirmação de carreira
carrega documento-fonte nomeado, classe de confiabilidade (D1 a D4) e marca explícita onde **não** existe
resultado quantificado divulgável. Oito divergências encontradas ao cruzar o export do LinkedIn com os
currículos estão publicadas — **duas delas aguardando confirmação do titular**, em vez de resolvidas por
suposição.

**Registro único:** home, currículo, carta e página Sobre leem o mesmo arquivo
([`assets/js/perfil.js`](assets/js/perfil.js)). Uma correção ali corrige todas as superfícies ao mesmo tempo, e
os documentos baixados nunca saem de sincronia com o site.

---

## Estrutura do repositório

```
/                          páginas do site (GitHub Pages serve a raiz)
├── index.html             home — vitrine de recrutamento
├── curriculo.html         currículo em 3 versões por área-alvo, com download
├── carta-apresentacao.html carta personalizável por empresa e vaga
├── sobre.html             perfil, trajetória e conflito de interesse
├── validacao-perfil.html  conselho de validação do perfil
├── conselho.html          conselho de validação do trabalho (nove frentes)
├── dashboards.html        5 dashboards executivos
├── kpis.html              biblioteca de KPIs bancários
├── metodologia.html       governança e protocolo de integridade
├── analises/              análise setorial (5 instituições + Copom)
├── simuladores/           10 estudos + 3 ferramentas próprias
├── assets/
│   ├── css/style.css      tema editorial escuro (grafite + âmbar) e camadas
│   ├── fonts/             Lora, Inter e JetBrains Mono servidas pelo site
│   └── js/
│       ├── core.js        gráficos SVG, formatação pt-BR, checks, i18n, exportação
│       ├── data.js        dataset central de DADOS PÚBLICOS REAIS (fonte única)
│       └── perfil.js      REGISTRO DE FATOS DO TITULAR (fonte única da biografia)
├── docs/                  metodologia, fontes, validação e limitações (Markdown)
├── references/            submodules de referência de design e metodologia
└── automation/
    ├── python/cvm_dados_abertos.py    coleta real de dados abertos da CVM
    └── node/
        ├── verificar_paginas.js      QC automatizado: erros de JS e contagem de checks
        └── conselho.js               auditoria em nove frentes sobre o site inteiro
```

---

## Rodar e verificar localmente

```bash
# servir o site
python3 -m http.server 8765
# abrir http://localhost:8765

# suíte de testes do motor de PVM (sem dependência alguma)
node tests/run.mjs                          # 101 testes; a mesma suíte roda em tests/index.html

# controle de qualidade automatizado (dependência só de desenvolvimento)
npm install playwright-core
node automation/node/verificar_paginas.js   # erro de JS e contagem de checks
node automation/node/conselho.js            # as nove frentes de auditoria
```

O verificador abre cada página em um navegador real e reprova se encontrar erro de JavaScript, check de
integridade em estado "falhou" ou divergência entre a contagem apurada e a publicada. O conselho vai além:
confere link quebrado, número publicado contra número medido, ancoragem das palavras-chave, hierarquia de
títulos, rótulo de formulário, resíduo de português em modo inglês e arquivo referenciado que não existe.

---

## Fontes (resumo)

**Nível 1 — extração documental:** Nu Holdings (releases 1T26/2T26; Managerial P&L Reconciliation Reports
4T25/1T26/2T26 com asseguração limitada KPMG; DFs intermediárias IFRS; workbook oficial "Historical Data
3Q25"), Agi Inc/Banco Agibank (Earnings Release 1Q26 e 2Q26; DFs intermediárias IFRS com revisão limitada EY;
Pilar 3), Itaú Unibanco (apresentação 2T26; Rel. Administração IFRS 1S26), Banco Bradesco (Relatório de Análise
Econômica e Financeira 1T26 e 2T26; DFs IFRS 1S26), Banco Santander Brasil (apresentações 1T26/2T26) e Banco
Central do Brasil (atas 277ª, 278ª, 279ª e 280ª do Copom).

**Nível 3 — relatado, sem documento anexado:** cotações e múltiplos de agregadores de mercado (publicados
**em faixa**, porque divergem entre si); Basileia da Nu Pagamentos S.A. (entidade individual, não o
consolidado do grupo).

Matriz completa com datas, níveis e lacunas: [`docs/fontes.md`](docs/fontes.md).

**Ressalva:** a maior parte dos documentos foi recebida como conversões OCR/planilhas; o workbook XLSX do Nu
e a ata da 279ª vieram em formato nativo. A conferência contra os originais publicados permanece pendente e
declarada.

---

## Recursos da interface

- **Alternância de idioma (PT/EN)** — botão no cabeçalho, com preferência salva no navegador.
- **Exportação do relatório** — gera um HTML autocontido (pronto para imprimir em PDF) com o conteúdo da
  página, os checks, a matriz completa de fontes e a declaração de conflito de interesse.
- **Currículo e carta baixáveis** em PDF (via impressão), Word e HTML — montados no navegador a partir do
  registro de fatos, sem servidor e sem segunda cópia do conteúdo.
- **Acessibilidade** — link de salto para o conteúdo, foco visível, contraste validado, suporte a
  `prefers-reduced-motion` e tabela de dados equivalente em cada gráfico.

---

## Pendências declaradas

- [ ] Confirmar com o titular as **duas divergências abertas** listadas em [`validacao-perfil.html`](validacao-perfil.html)
      (data de início no Agibank e data de conclusão da graduação);
- [ ] Traduzir os **171 blocos de prosa** que ainda aparecem em português com a interface em inglês — medido a
      cada execução pela frente H do [`conselho.js`](automation/node/conselho.js) e publicado em
      [`conselho.html`](conselho.html);
- [ ] Incluir a **fotografia do titular** na capa (ver [`assets/img/LEIA-ME.md`](assets/img/LEIA-ME.md));
- [ ] Conferir os arquivos OCR contra os PDFs originais dos emissores;
- [ ] Obter o **índice de capital consolidado do Nu Holdings** no painel de Conglomerados Prudenciais do BCB;
- [ ] Personalizar o slug do LinkedIn (hoje é o numérico gerado automaticamente);
- [ ] (Roadmap) versões Excel/VBA e Power BI dos modelos publicadas como artefato.

---

## Stack

HTML/CSS/JavaScript puros — **sem nenhuma dependência externa em produção** (funciona offline e no GitHub
Pages; as três fontes são servidas do próprio repositório, em `assets/fonts/`). Gráficos SVG próprios com
tooltips e tabelas de dados acessíveis, em tema escuro editorial — o claro existe só na impressão. Python 3
(biblioteca padrão) para a automação de dados públicos da CVM; Node + playwright-core apenas no fluxo de
desenvolvimento, para o controle de qualidade.
