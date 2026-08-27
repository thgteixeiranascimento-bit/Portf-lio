# Fontes e rastreabilidade

## Hierarquia de fontes

| Nível | Tipo | Exemplos |
|---|---|---|
| 1 | Primárias | CVM, Banco Central, IBGE, Receita Federal, Tesouro Nacional, B3, IFRS Foundation, SEC, demonstrações financeiras oficiais |
| 2 | Institucionais e técnicas | CFA Institute, universidades, organizações profissionais |
| 3 | Secundárias | Consultorias, portais e artigos especializados |

Fontes secundárias jamais prevalecem sobre dados oficiais disponíveis.

## Matriz de rastreabilidade (versão de 14/08/2026)

| Informação | Fonte | Nível | Utilização | Status |
|---|---|---|---|---|
| Números financeiros da Aurora Industrial e Vetra Componentes | Dataset próprio (`assets/js/data.js`) | — | Todos os módulos | **DADO SIMULADO** |
| Classificação de fluxos de caixa | IAS 7 (IFRS Foundation) / CPC 03 (R2) | 1 | Fluxo de caixa; 3 demonstrações | Referência metodológica |
| Metodologia FCFF / valor terminal | CFA Institute — free cash flow valuation | 2 | Valuation | Indicada pelo titular — **não verificada nesta versão** |
| Escopo de modelagem financeira | IBM — artigo sobre financial modeling | 2 | Arquitetura do portfólio | Indicada pelo titular — **não verificada nesta versão** |
| Práticas de análise de variações FP&A | Corporate Finance Institute | 3 | Real vs. Orçado; rolling forecast | Indicada pelo titular — **não verificada nesta versão** |
| Dados abertos de companhias (DFP/ITR) | CVM — dados.cvm.gov.br | 1 | Script `automation/python/cvm_dados_abertos.py` | Dado público consumido pelo script; nenhum número publicado no site |
| Resultados 2T26 (apresentação 05/08/2026) e Rel. da Administração IFRS 1S26 | Itaú Unibanco Holding S.A. | 1 | `analises/bancos-2026.html` | **DADO PÚBLICO** — OCR fornecido pelo titular; conferência contra o PDF original pendente |
| Resultados 1T26 (29/04/2026) e 2T26 (29/07/2026) | Banco Santander (Brasil) S.A. | 1 | `analises/bancos-2026.html` | **DADO PÚBLICO** — mesma ressalva de OCR |
| Relatório de Análise Econômica e Financeira 1T26 | Banco Bradesco S.A. | 1 | `analises/bancos-2026.html` | **DADO PÚBLICO** — mesma ressalva de OCR |
| Atas do Copom 277ª (18/03), 278ª (29/04) e 280ª (05/08/2026) + nota da decisão | Banco Central do Brasil | 1 | Contexto macro da análise setorial | **DADO PÚBLICO** — ata da 279ª não fornecida (lacuna declarada) |
| Conceito do efeito Mix (participação × volume implícito × diferencial de preço) | FTI Consulting — *A Quantifiable Approach to Price Volume Mix Analysis* | 3 | Metodologia padrão do simulador PVM | **REFERÊNCIA CONCEITUAL** — a fórmula implementada foi derivada algebricamente e demonstrada equivalente à descrição da fonte em [`pvm-metodologia.md`](pvm-metodologia.md) §4.1; nenhum número foi copiado |
| Fórmulas de PVM das abas *Basic*, *Advanced* e *New method* | Workbook `PVM_calculations.xlsx` do webinar, fornecido pelo titular | 3 | Confronto numérico do motor PVM | **LIDO CÉLULA A CÉLULA** — convergências e 2 divergências deliberadas documentadas em [`pvm-metodologia.md`](pvm-metodologia.md) §9.2 |
| Base de demonstração do webinar (15 produtos, 2019→2020) | `PVM_DATA.xlsx`, fornecido pelo titular | 3 | Teste de regressão do motor PVM (`tests/pvm-engine.test.js`) | **DADO DE TESTE** — não publicado no site |
| Layout e vocabulário de relatório PVM | Relatório Power BI indicado na especificação | 3 | Referência visual do simulador PVM | **REFERÊNCIA VISUAL** — nenhuma fórmula atribuída a esta fonte |
| Conteúdo do arquivo `PVM variance analysis webinar - upload.pbix` | Titular | — | — | **NÃO CONSULTADO** — não há leitor de `.pbix` no ambiente; transcrever DAX sem lê-lo violaria o protocolo antialucinação |
| Dataset DEMO do simulador PVM (15 produtos, 2024→2025) | Gerado em `assets/js/pvm-app.js` (`demoDataset()`) | — | Demonstração da ferramenta | **DADO SINTÉTICO** — rotulado como DEMO na interface; não representa empresa real |

Regra: nenhum número relevante aparece no portfólio sem que outra pessoa consiga rastrear sua
origem. Análises futuras com dados reais entram nesta matriz com URL, data de acesso, data da
informação, unidade, período, metodologia e grau de confiabilidade.
