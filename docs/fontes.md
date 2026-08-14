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

Regra: nenhum número relevante aparece no portfólio sem que outra pessoa consiga rastrear sua
origem. Análises futuras com dados reais entram nesta matriz com URL, data de acesso, data da
informação, unidade, período, metodologia e grau de confiabilidade.
