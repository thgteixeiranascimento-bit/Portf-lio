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
- **Escopo honesto:** este script **coleta** dado público; nenhuma análise sobre empresa real
  é publicada no site do portfólio. Para trocar o documento extraído, ajuste a constante
  `DOCUMENTO` (`BPA_con`, `BPP_con`, `DFC_MI_con`, `DRE_ind`, …).

## `python/kfinance_dados.py`

Busca dados financeiros reais (DRE anual ou histórico de preços) de um ticker via
[kFinance](https://github.com/kensho-technologies/kfinance), a biblioteca Python da
Kensho/S&P Global Market Intelligence para a LLM-ready API, e exporta um CSV pronto
para modelagem.

```bash
pip install kensho-kfinance
export KFINANCE_REFRESH_TOKEN="..."   # ou KFINANCE_CLIENT_ID + KFINANCE_PRIVATE_KEY

python automation/python/kfinance_dados.py --ticker AAPL --tipo dre \
  --ano-inicio 2020 --ano-fim 2024 --saida dre_aapl.csv

python automation/python/kfinance_dados.py --ticker AAPL --tipo precos \
  --data-inicio 2024-01-01 --data-fim 2024-12-31 --saida precos_aapl.csv
```

- **Dependências:** `kensho-kfinance` (pacote externo) + `pandas` (dependência transitiva).
- **Fonte (nível 1):** kFinance/Kensho — serviço **comercial**, requer credenciais
  próprias obtidas junto à Kensho/S&P Global Market Intelligence (não incluídas neste
  repositório); ver [instruções oficiais](https://github.com/kensho-technologies/kfinance).
- **Conformidade:** autenticação somente via variáveis de ambiente
  (`KFINANCE_REFRESH_TOKEN` ou `KFINANCE_CLIENT_ID`/`KFINANCE_PRIVATE_KEY`); o script
  nunca embute, gera ou tenta contornar credenciais. Sem credenciais configuradas, ele
  reporta o problema e encerra — nunca inventa dados. Em caso de erro de rede,
  autenticação ou da API, reporta e encerra.
- **Escopo honesto:** assim como o coletor da CVM, este script apenas **coleta** dado
  de terceiros para uso em modelagem; nenhuma análise sobre empresa real obtida por ele
  é publicada no site do portfólio sem passar pelo protocolo de validação descrito em
  [`metodologia.html`](../metodologia.html).

## Roadmap (declarado, ainda não entregue)

- Conector do CSV da CVM para o modelo de três demonstrações;
- Versões em Excel/VBA (Power Query) dos simuladores;
- Dashboards em Power BI com modelo dimensional equivalente.
