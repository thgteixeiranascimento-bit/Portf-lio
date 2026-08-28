# Automação

Scripts de coleta e preparação de dados para alimentar os modelos do portfólio.

## `python/cvm_dados_abertos.py`

Baixa o pacote anual de **DFPs (Demonstrações Financeiras Padronizadas)** do
[Portal de Dados Abertos da CVM](https://dados.cvm.gov.br), filtra a DRE consolidada de uma
companhia pelo nome e exporta um CSV pronto para modelagem.

```bash
python automation/python/cvm_dados_abertos.py --ano 2024 --empresa "WEG" --saida dre_weg_2024.csv
```

- **Dependências:** apenas a biblioteca padrão do Python 3.9+.
- **Fonte (nível 1):** CVM — dados abertos, acesso público e sem autenticação.
- **Conformidade:** o script acessa somente URLs oficiais, identifica-se via User-Agent e
  não burla qualquer controle de acesso. Em caso de erro de rede, ele reporta e encerra —
  nunca inventa dados.
- **Unidade:** valores em milhares de reais (`VL_CONTA`), conforme convenção do arquivo da CVM.
- **Escopo honesto:** este script **coleta** dado público e é uma via complementar de obtenção de
  fontes primárias — as análises publicadas no site partem das divulgações oficiais dos emissores
  (releases e demonstrações financeiras), listadas em [`docs/fontes.md`](../docs/fontes.md). Para
  trocar o documento extraído, ajuste a constante `DOCUMENTO` (`BPA_con`, `BPP_con`, `DFC_MI_con`,
  `DRE_ind`, …).

## Roadmap (declarado, ainda não entregue)

- Conector do CSV da CVM para o estudo de três demonstrações;
- Versões em Excel/VBA (Power Query) dos estudos interativos;
- Dashboards em Power BI com modelo dimensional equivalente.
