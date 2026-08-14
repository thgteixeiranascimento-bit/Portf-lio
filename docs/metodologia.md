# Metodologia

Este documento resume o protocolo que governa todo o material publicado no portfólio.
A versão completa e navegável está em [`metodologia.html`](../metodologia.html).

## Princípios

1. **Veracidade acima de estética.** Nenhum dado, empresa, resultado, cargo, certificação,
   cliente, fonte ou métrica é inventado. Lacunas são declaradas como **DADO NÃO INFORMADO**.
2. **Separação entre fato e simulação.** Todo número carrega etiqueta: DADO REAL, DADO PÚBLICO,
   DADO INFORMADO PELO USUÁRIO, DADO ESTIMADO, **DADO SIMULADO**, PREMISSA, HIPÓTESE ou INTERPRETAÇÃO.
3. **Simulações identificadas.** A Aurora Industrial S.A. e a Vetra Componentes S.A. são empresas
   fictícias. Rótulo padrão: *"SIMULAÇÃO / ESTUDO DE CASO FICTÍCIO — NÃO REPRESENTA EXPERIÊNCIA
   PROFISSIONAL REAL"*.
4. **Resultados condicionados.** Nenhum valuation ou projeção é apresentado como "correto" — sempre
   *"valor estimado pelo modelo sob as premissas adotadas"*.
5. **Erros visíveis.** Cada simulador publica checks aritméticos recalculados a cada mudança de
   premissa; falhas aparecem em vermelho na própria página.

## Arquitetura dos modelos

Todos os modelos seguem a separação **Inputs → Cálculos → Outputs → Checks**, implementada em
JavaScript aberto no navegador (sem cálculo oculto). O dataset central único
(`assets/js/data.js`) alimenta simuladores e dashboards — sem cópias manuais de números.

## Padrão de cada estudo de caso

Contexto → Problema → Dados → Fontes → Premissas → Metodologia → Modelo → Cenários →
Resultado → Insights → Impacto potencial → Limitações → Validação (ficha de 13 seções em
cada simulador).

## Ordem de construção (fases)

1. Modelo de três demonstrações; 2. Budget + Real vs. Orçado + Forecast; 3. Rolling forecast;
4. Fluxo de caixa + capital de giro; 5. Dashboards FP&A/CFO; 6. CAPEX/EVTE; 7. DCF + valuation;
8. M&A; 9. Riscos; 10. Portfólio educacional; 11. Automação (Python/CVM). Excel/VBA e Power BI:
roadmap declarado, ainda não entregue.
