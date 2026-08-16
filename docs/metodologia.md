# Metodologia (resumo)

Versão 2.0 — 16/08/2026. A versão completa e navegável está em [`metodologia.html`](../metodologia.html).

## Arquitetura de cada estudo

```
FATOS (dado público, fonte citada)
  → PREMISSAS (explícitas, ajustáveis, rotuladas)
    → CÁLCULOS (reproduzíveis no código da página)
      → OUTPUTS (rotulados: fato · estimativa · interpretação)
        → CHECKS (aritmética recalculada no navegador contra o divulgado)
```

## Princípios

1. **Rótulos obrigatórios** — DADO PÚBLICO/FATO, PREMISSA, ESTIMATIVA, INTERPRETAÇÃO, DADO NÃO INFORMADO;
2. **Fonte em toda página** — bloco "Fontes deste estudo" com documento, emissor, data e nível;
3. **Moedas e definições não se misturam** — Nu em US$, demais em R$; métricas próprias de cada emissor
   comparadas somente com ressalva;
4. **Lacuna é lacuna** — períodos/documentos ausentes aparecem como ausentes (3T25 do Nu, 279ª ata do
   Copom, Bradesco/Agi 2T26, abas de dados dos CSVs do Nu);
5. **Divergências documentadas** — diferenças entre documentos do mesmo emissor são tabeladas
   (perímetro Agi 4T25; FXN × nominal no Nu; competência × caixa nos custos do IPO; arredondamentos);
6. **Sem recomendação de investimento** — nenhuma página opina sobre valor ou preço de ativos;
7. **QC público** — 102 checks de integridade autorais recalculados no navegador; falha aparece em vermelho.

## Estudo de caso fictício (descontinuado)

A versão 1.0 usava a "Aurora Industrial S.A." (empresa fictícia) para demonstrar técnica. A versão 2.0
substituiu integralmente o dataset fictício por dados públicos reais; o histórico permanece no Git.
