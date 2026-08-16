# Fontes e rastreabilidade

## Hierarquia de fontes

| Nível | Tipo | Exemplos |
|---|---|---|
| 1 | Primárias — **documento em mãos** | Divulgações oficiais dos emissores (releases, demonstrações financeiras, workbook de dados históricos), Banco Central do Brasil, CVM, IFRS Foundation, SEC |
| 2 | Institucionais e técnicas | Normas IFRS/IAS, CFA Institute, universidades, organizações profissionais |
| 3 | Secundárias e **relatadas** | Agregadores de mercado; informação de fonte pública relatada pelo titular sem documento anexado |

Fontes secundárias jamais prevalecem sobre dados oficiais disponíveis.

**Distinção operacional desta versão:** nível 1 = o documento está em mãos e o número foi extraído dele,
podendo ser verificado por checks aritméticos. Nível 3 = relato de fonte pública sem documento anexado —
pode estar correto, mas não é verificável aqui, e por isso fica fora dos checks e marcado em cada página.

## Matriz de rastreabilidade (versão de 16/08/2026)

Todos os documentos abaixo foram **recebidos como conversões OCR/planilhas fornecidas pelo titular**
em 13–16/08/2026; a conferência contra os originais publicados nos canais de RI dos emissores
permanece **pendente e declarada**.

| Informação | Fonte / documento | Emissor | Data | Nível | Utilização |
|---|---|---|---|---|---|
| Resultados 2T26 (apresentação) e Rel. Administração IFRS 1S26 | Apresentação 2T26 (05/08/2026) + DFs IFRS 1S26 | Itaú Unibanco Holding S.A. | 05/08/2026 · 30/06/2026 | 1 | Análise setorial, dashboards, KPIs, valuation (ROE) |
| Resultados 1T26 e 2T26 (BRGAAP) | Apresentações de resultados | Banco Santander (Brasil) S.A. | 29/04 e 29/07/2026 | 1 | Análise setorial, riscos (NPL/custo de crédito), carteiras |
| Relatório de Análise Econômica e Financeira 1T26 | Relatório trimestral | Banco Bradesco S.A. | 1T26 | 1 | Análise setorial, dashboards, riscos |
| Atas 277ª/278ª/280ª do Copom + nota da decisão da 280ª | Atas e comunicado | Banco Central do Brasil | 18/03, 29/04, 05/08/2026 | 1 | Contexto macro (Selic) |
| **Ata da 279ª reunião do Copom** | Ata (PDF nativo) | Banco Central do Brasil | 17/06/2026 | 1 | Selic a 14,25%; projeções 5,2% (2026) e 3,7% (4T27); debate sobre trajetórias alternativas — **encerra a lacuna anterior** |
| Nu: resultados 1T26 e 2T26 | Releases de resultados | Nu Holdings Ltd. (NYSE: NU) | 14/05 e 13/08/2026 | 1 | Séries operacionais/financeiras, variações, forecast, dashboards |
| Nu: reconciliação P&L gerencial × IFRS 1T26 e 2T26 | Managerial P&L Reconciliation Reports (asseguração limitada KPMG, ISAE 3000 rev.) | Nu Holdings / KPMG | 14/05 e 13/08/2026 | 1 | Reconciliação contábil→gerencial, checks de neutralidade no lucro |
| Nu: demonstrações financeiras intermediárias IFRS 1T26 e 2T26 | DFs condensadas consolidadas (US$ mil) | Nu Holdings Ltd. | 31/03 e 30/06/2026 | 1 | Balanço (A=P+PL), mutação do PL 1S26, recálculo de ROE |
| Nu: **workbook "Historical Data 3Q25"** | XLSX nativo, 13 abas (resultado, balanço, fluxo, NPLs, operações de crédito, indicadores) | Nu Holdings (RI) | 30/09/2025 · recebido 16/08/2026 | 1 | Encerra a lacuna do 3T25: P&L IFRS, balanço, NPLs, clientes por país e série histórica desde 2022 |
| Nu: reconciliação do P&L gerencial 4T25 e exercício de 2025 | Relatório com asseguração limitada KPMG (ISAE 3000) | Nu Holdings / KPMG | 25/02/2026 | 1 | 4T25 completo e base da derivação do 3T25 gerencial |
| Nu: planilhas "Dados Históricos" em CSV (1T26, 2T26, 3T25, 4T25) | CSVs do workbook de RI | Nu Holdings (RI) | recebidos 16/08/2026 | 1 | **Contêm apenas a aba de índice (zero dados numéricos)** — substituídos pelo XLSX, que veio completo |
| Bradesco 2T26 e Agi 2T26 | Resultados **relatados** pelo titular a partir de divulgação pública | Bradesco / Agi (via relato) | 4–5/08/2026 | 3 | Publicados marcados como relato; fora dos checks aritméticos; conferência pendente |
| Cotações e múltiplos (P/L, P/VPA, dividend yield) | Agregadores de mercado (Investing.com, Status Invest, Investidor10) e imprensa, via relato | Agregadores | 08–16/08/2026 | 3 | Análise setorial e estudo de valuation — **sempre em faixa**, porque os agregadores divergem entre si |
| IF.data — Basileia da Nu Pagamentos S.A. | Painel do BCB, via relato | Banco Central (via relato) | set/2025 | 3 | **Entidade individual, não o consolidado Nu Holdings** — mantido fora do comparativo de capital |
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
5. Divergências entre documentos do mesmo emissor são **documentadas** (ver `metodologia.html`, seção 5) —
   são onze casos nesta versão, incluindo a divergência do ARPAC (base contábil × gerencial), cuja causa foi
   identificada e verificada aritmeticamente;
6. Números **derivados** pelo autor (não extraídos de documento) são listados à parte em `metodologia.html`,
   seção 5b, com o método e a validação de cada um;
7. Números **relatados** (nível 3) nunca se misturam aos extraídos e não entram nos checks.

Endereços oficiais para conferência: investidores.nu · ri.agibank.com.br · itau.com.br/relacoes-com-investidores ·
bradescori.com.br · ri.santander.com.br · bcb.gov.br
