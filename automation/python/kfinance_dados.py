#!/usr/bin/env python3
"""Coleta de dados financeiros reais via kFinance (Kensho / S&P Global Market Intelligence).

Usa a biblioteca `kensho-kfinance` para buscar, para um ticker informado, a
demonstração de resultado (DRE) anual ou o histórico de preços, e exporta o
resultado em CSV pronto para alimentar um modelo financeiro.

Uso:
    python kfinance_dados.py --ticker AAPL --tipo dre --ano-inicio 2020 --ano-fim 2024 \
        --saida dre_aapl.csv
    python kfinance_dados.py --ticker AAPL --tipo precos --data-inicio 2024-01-01 \
        --data-fim 2024-12-31 --saida precos_aapl.csv

Notas de conformidade:
    - A API da kFinance é um serviço comercial da Kensho/S&P Global Market
      Intelligence: requer credenciais próprias (não incluídas neste repositório)
      obtidas junto à Kensho — ver https://github.com/kensho-technologies/kfinance.
      Este script nunca embute, gera ou tenta contornar credenciais.
    - Autenticação via variáveis de ambiente, na seguinte ordem de precedência:
        1. KFINANCE_REFRESH_TOKEN
        2. KFINANCE_CLIENT_ID + KFINANCE_PRIVATE_KEY
      Sem nenhuma delas configurada, o script reporta o problema e encerra —
      nunca inventa dados nem usa um valor de exemplo.
    - O script apenas coleta e organiza dados retornados pela API; não emite
      opinião nem recomendação. Qualquer erro de rede, autenticação ou da API
      é reportado em stderr e o processo encerra com código de erro.

Dependências: `pip install kensho-kfinance` (não incluída na biblioteca padrão).
"""

from __future__ import annotations

import argparse
import os
import sys


def obter_cliente():
    """Instancia o Client da kFinance a partir de credenciais em variáveis de ambiente."""
    try:
        from kfinance.client.kfinance import Client
    except ImportError as exc:
        print(
            "ERRO: pacote 'kensho-kfinance' não instalado. "
            "Instale com: pip install kensho-kfinance",
            file=sys.stderr,
        )
        raise SystemExit(1) from exc

    refresh_token = os.environ.get("KFINANCE_REFRESH_TOKEN")
    client_id = os.environ.get("KFINANCE_CLIENT_ID")
    private_key = os.environ.get("KFINANCE_PRIVATE_KEY")

    if refresh_token:
        return Client(refresh_token=refresh_token)
    if client_id and private_key:
        return Client(client_id=client_id, private_key=private_key)

    print(
        "ERRO: credenciais da kFinance não encontradas. Defina KFINANCE_REFRESH_TOKEN "
        "ou KFINANCE_CLIENT_ID + KFINANCE_PRIVATE_KEY nas variáveis de ambiente. "
        "Credenciais são obtidas junto à Kensho/S&P Global Market Intelligence.",
        file=sys.stderr,
    )
    raise SystemExit(1)


def coletar_dre(ticker: str, ano_inicio: int | None, ano_fim: int | None):
    """Busca a DRE anual do ticker informado como DataFrame do pandas."""
    from kfinance.client.models.date_and_period_models import PeriodType

    cliente = obter_cliente()
    ativo = cliente.ticker(ticker)
    print(f"[1/2] Buscando DRE de {ticker} …", file=sys.stderr)
    return ativo.income_statement(
        period_type=PeriodType.annual, start_year=ano_inicio, end_year=ano_fim
    )


def coletar_precos(ticker: str, data_inicio: str | None, data_fim: str | None):
    """Busca o histórico diário de preços ajustados do ticker informado."""
    cliente = obter_cliente()
    ativo = cliente.ticker(ticker)
    print(f"[1/2] Buscando histórico de preços de {ticker} …", file=sys.stderr)
    return ativo.history(start_date=data_inicio, end_date=data_fim)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--ticker", required=True, help="ticker do ativo (ex.: AAPL, SPGI)")
    parser.add_argument(
        "--tipo", choices=["dre", "precos"], required=True, help="tipo de dado a coletar"
    )
    parser.add_argument("--ano-inicio", type=int, default=None, help="[dre] ano inicial")
    parser.add_argument("--ano-fim", type=int, default=None, help="[dre] ano final")
    parser.add_argument("--data-inicio", default=None, help="[precos] data inicial (AAAA-MM-DD)")
    parser.add_argument("--data-fim", default=None, help="[precos] data final (AAAA-MM-DD)")
    parser.add_argument("--saida", default="kfinance_dados.csv", help="arquivo CSV de saída")
    args = parser.parse_args()

    try:
        if args.tipo == "dre":
            tabela = coletar_dre(args.ticker, args.ano_inicio, args.ano_fim)
        else:
            tabela = coletar_precos(args.ticker, args.data_inicio, args.data_fim)
    except SystemExit:
        raise
    except Exception as exc:  # autenticação/rede/API: reportar e sair, sem inventar dados
        print(f"ERRO ao consultar a API da kFinance: {exc}", file=sys.stderr)
        return 1

    if tabela is None or tabela.empty:
        print(f"Nenhum dado retornado para '{args.ticker}'.", file=sys.stderr)
        return 2

    tabela.to_csv(args.saida, encoding="utf-8")
    print(f"[2/2] OK — {len(tabela)} linhas gravadas em {args.saida}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
