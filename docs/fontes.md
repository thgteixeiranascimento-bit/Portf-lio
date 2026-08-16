# Fontes e rastreabilidade

## Hierarquia de fontes

| Nível | Tipo | Exemplos |
|---|---|---|
| 1 | Primárias | Divulgações oficiais dos emissores (releases, demonstrações financeiras), Banco Central do Brasil, CVM, IFRS Foundation, SEC |
| 2 | Institucionais e técnicas | Normas IFRS/IAS, CFA Institute, universidades, organizações profissionais |
| 3 | Secundárias | Consultorias, portais e artigos especializados |

Fontes secundárias jamais prevalecem sobre dados oficiais disponíveis.

## Matriz de rastreabilidade (versão de 16/08/2026)

Todos os documentos abaixo foram **recebidos como conversões OCR/planilhas fornecidas pelo titular**
em 13–16/08/2026; a conferência contra os originais publicados nos canais de RI dos emissores
permanece **pendente e declarada**.

| Informação | Fonte / documento | Emissor | Data | Nível | Utilização |
|---|---|---|---|---|---|
| Resultados 2T26 (apresentação) e Rel. Administração IFRS 1S26 | Apresentação 2T26 (05/08/2026) + DFs IFRS 1S26 | Itaú Unibanco Holding S.A. | 05/08/2026 · 30/06/2026 | 1 | Análise setorial, dashboards, KPIs, valuation (ROE) |
| Resultados 1T26 e 2T26 (BRGAAP) | Apresentações de resultados | Banco Santander (Brasil) S.A. | 29/04 e 29/07/2026 | 1 | Análise setorial, riscos (NPL/custo de crédito), carteiras |
| Relatório de Análise Econômica e Financeira 1T26 | Relatório trimestral | Banco Bradesco S.A. | 1T26 | 1 | Análise setorial, dashboards, riscos |
| Atas 277ª/278ª/280ª do Copom + nota da decisão da 280ª | Atas e comunicado | Banco Central do Brasil | 18/03, 29/04, 05/08/2026 | 1 | Contexto macro (Selic); **ata da 279ª não fornecida — lacuna declarada** |
| Nu: resultados 1T26 e 2T26 | Releases de resultados | Nu Holdings Ltd. (NYSE: NU) | 14/05 e 13/08/2026 | 1 | Séries operacionais/financeiras, variações, forecast, dashboards |
| Nu: reconciliação P&L gerencial × IFRS 1T26 e 2T26 | Managerial P&L Reconciliation Reports (asseguração limitada KPMG, ISAE 3000 rev.) | Nu Holdings / KPMG | 14/05 e 13/08/2026 | 1 | Reconciliação contábil→gerencial, checks de neutralidade no lucro |
| Nu: demonstrações financeiras intermediárias IFRS 1T26 e 2T26 | DFs condensadas consolidadas (US$ mil) | Nu Holdings Ltd. | 31/03 e 30/06/2026 | 1 | Balanço (A=P+PL), mutação do PL 1S26, recálculo de ROE |
| Nu: planilha "Dados Históricos" 1T26/2T26 | CSVs do workbook de RI | Nu Holdings (RI) | recebidos 16/08/2026 | 1 | **Contêm apenas a aba de índice (zero dados numéricos) — lacuna declarada; nenhuma análise de série de mercado realizada** |
| Agi: Earnings Release 1Q26 | Release de resultados | Agi Inc. (NYSE: AGBK) / Banco Agibank S.A. | 05/05/2026 | 1 | KPIs, depósitos, NIM, capital, IPO, dashboards |
| Agi: DFs intermediárias IFRS 1T26 | DFs condensadas consolidadas (R$ mil; revisão limitada EY, ISRE 2410) | AGI Inc / EY | 05/05/2026 | 1 | Três demonstrações integradas, fluxo de caixa, ECL por estágio, mutação do PL |
| Classificação de fluxos de caixa | IAS 7 (IFRS Foundation) / CPC 03 (R2) | IFRS Foundation / CPC | — | 2 | Estudo de fluxo de caixa |
| Provisionamento por estágios | IFRS 9 | IFRS Foundation | — | 2 | Estudo de riscos (ECL) |
| Metodologia FCFF / valor terminal | CFA Institute — free cash flow valuation | CFA Institute | — | 2 | Referência metodológica — **indicada pelo titular, não verificada nesta versão** |
| Escopo de modelagem financeira | IBM — artigo sobre financial modeling | IBM | — | 2 | Referência metodológica — **não verificada nesta versão** |
| Práticas de análise de variações FP&A | Corporate Finance Institute | CFI | — | 3 | Referência metodológica — **não verificada nesta versão** |
| Dados abertos de companhias (DFP/ITR) | dados.cvm.gov.br | CVM | — | 1 | Consumido apenas pelo script `automation/python/cvm_dados_abertos.py`; nenhum número publicado no site |

## Regras

1. Nenhum número relevante aparece no portfólio sem que outra pessoa consiga rastrear sua origem;
2. Moedas não se misturam (Nu em US$; demais em R$) — nenhuma taxa de câmbio é inventada;
3. Métricas com definição própria de cada emissor (ROE/ROAE, carteiras, eficiência, NPL) são comparadas
   apenas com rótulo e ressalva;
4. Lacunas (períodos, métricas, documentos ausentes) são declaradas — nunca interpoladas;
5. Divergências entre documentos do mesmo emissor são **documentadas** (ver `metodologia.html`, seção 5).

Endereços oficiais para conferência: investidores.nu · ri.agibank.com.br · itau.com.br/relacoes-com-investidores ·
bradescori.com.br · ri.santander.com.br · bcb.gov.br
