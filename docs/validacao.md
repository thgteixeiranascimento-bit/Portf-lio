# Validação

## Conselho de validação

Banca interna de sete perspectivas: CFO/Head of Finance, Especialista FP&A, Controller,
Especialista em Valuation/Corporate Finance, Especialista em BI/Data Analytics, Especialista em
Risk Management e Auditor/QA. O papel do auditor materializa-se nos **44 checks automáticos**
publicados nos simuladores (somas, reconciliações, identidades contábeis, definições),
recalculados a cada mudança de premissa.

## Regra de aprovação

- ✅ **VALIDADO** — consistência interna verificada e dados/fontes reais confirmados;
- ⚠️ **VALIDADO COM RESSALVAS** — consistência interna verificada, com ressalvas declaradas;
- ❌ **NÃO VALIDADO** — qualquer teste do protocolo de auditoria reprovado.

Divergências entre conselheiros são registradas, explicadas e mantêm o material como
"não validado" até haver evidência suficiente.

## Verificação automatizada do simulador PVM

Além dos checks recalculados na tela, o simulador de Price · Volume · Mix tem uma **suíte de
testes executável** (`npm test`, ou `tests/index.html` no navegador) que roda contra os mesmos
módulos que a página carrega:

| Camada | O que é verificado |
|---|---|
| Casos de sanidade | só preço · só volume · só mix · nenhuma mudança · SKU novo · SKU descontinuado · preço e volume juntos · mix favorável · mix desfavorável — nas **quatro** convenções metodológicas |
| Identidade da ponte | `base + Σ efeitos = atual` para receita, COGS e margem bruta, com verificação independente (`reconcileBridge`) |
| Mix não é plug | o efeito Mix é recalculado fora do motor, pela fórmula, e comparado ao total produzido |
| Casos de borda | quantidade zero, receita zero, negativos, COGS parcial, SKU duplicado, UOM divergente, base vazia, uma linha, 100 mil itens, acentuação, vírgula e ponto decimais |
| Regressão contra o workbook | receita base/atual, efeito Price, New, Discontinued e Volume+Mix reproduzidos a partir de `PVM_DATA.xlsx` |
| Antialucinação | nenhuma frase da narrativa executiva usa vocabulário causal que os dados não sustentam (verificador roda também em produção) |

O arquivo Excel exportado é reaberto e **recalculado por leitor independente** (Python/openpyxl)
na verificação de release: soma dos efeitos linha a linha contra a variação declarada, e total da
aba detalhada contra a ponte do *Executive Summary*.

## Status desta versão (14/08/2026)

| Projeto | Consistência interna | Status |
|---|---|---|
| Real vs. Orçado vs. Forecast | checks 5/5 | ⚠️ Validado com ressalvas (dados simulados) |
| Rolling forecast 12m | checks 4/4 | ⚠️ Validado com ressalvas (dados simulados) |
| Fluxo de caixa & liquidez | checks 4/4 | ⚠️ Validado com ressalvas (dados simulados) |
| Capital de giro | checks 3/3 | ⚠️ Validado com ressalvas (dados simulados) |
| Três demonstrações | checks 6/6 | ⚠️ Validado com ressalvas (dados simulados) |
| Valuation — DCF e múltiplos | checks 5/5 | ⚠️ Validado com ressalvas (premissas de mercado hipotéticas) |
| CAPEX / EVTE | checks 4/4 | ⚠️ Validado com ressalvas (dados simulados) |
| M&A — accretion/dilution | checks 5/5 | ⚠️ Validado com ressalvas (dados simulados) |
| Riscos & stress testing | checks 4/4 | ⚠️ Validado com ressalvas (dados simulados) |
| Portfólio — fronteira eficiente | checks 4/4 | ⚠️ Validado com ressalvas (uso educacional) |
| Dashboards e KPIs | derivados do dataset central | ⚠️ Validado com ressalvas (dados simulados) |
| Perfil profissional (Sobre) | — | ❌ Não validado — aguarda dados verificáveis do titular |

Resultado do protocolo final de auditoria (10 testes): 9 aprovados; 1 parcial — o *source check*
aponta 3 referências metodológicas indicadas pelo titular ainda não conferidas contra o conteúdo
original (pendência declarada na matriz de rastreabilidade).
