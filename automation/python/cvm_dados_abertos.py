#!/usr/bin/env python3
"""Coleta de demonstrações financeiras públicas — Portal de Dados Abertos da CVM.

Baixa o pacote anual de DFPs (Demonstrações Financeiras Padronizadas) consolidadas
publicado pela CVM em https://dados.cvm.gov.br, filtra a DRE de uma companhia pelo
nome (ou parte dele) e exporta as linhas em CSV, prontas para alimentar um modelo
financeiro.

Uso:
    python cvm_dados_abertos.py --ano 2024 --empresa "WEG" --saida dre_weg_2024.csv

Notas de conformidade:
    - A CVM disponibiliza estes arquivos como DADO PÚBLICO (dados abertos), sem
      autenticação; o script acessa apenas URLs oficiais e identifica-se via
      User-Agent. Não há burla de autenticação nem acesso a dados privados.
    - O script coleta e organiza; ele não emite opinião nem recomendação.
    - Valores no arquivo da CVM estão em milhares de reais (coluna VL_CONTA),
      salvo indicação da própria CVM na coluna ESCALA_MOEDA.

Dependências: apenas biblioteca padrão do Python 3.9+.
"""

from __future__ import annotations

import argparse
import csv
import io
import sys
import urllib.request
import zipfile

BASE_URL = "https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/DFP/DADOS"
USER_AGENT = "portfolio-financas-educacional/1.0 (coleta de dados abertos)"

# Demonstração de resultado consolidada; troque para "DRE_ind" p/ individual,
# "BPA_con"/"BPP_con" para balanço, "DFC_MI_con" para fluxo de caixa indireto.
DOCUMENTO = "DRE_con"


def baixar_pacote(ano: int) -> bytes:
    """Baixa o ZIP anual de DFPs da CVM e retorna os bytes."""
    url = f"{BASE_URL}/dfp_cia_aberta_{ano}.zip"
    print(f"[1/3] Baixando {url} …", file=sys.stderr)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.read()


def extrair_dre(pacote: bytes, ano: int) -> list[dict]:
    """Extrai o CSV da DRE consolidada de dentro do ZIP e devolve as linhas como dicts."""
    nome_arquivo = f"dfp_cia_aberta_{DOCUMENTO}_{ano}.csv"
    print(f"[2/3] Lendo {nome_arquivo} …", file=sys.stderr)
    with zipfile.ZipFile(io.BytesIO(pacote)) as z:
        with z.open(nome_arquivo) as f:
            texto = io.TextIOWrapper(f, encoding="latin-1")
            leitor = csv.DictReader(texto, delimiter=";")
            return list(leitor)


def filtrar_empresa(linhas: list[dict], termo: str) -> list[dict]:
    """Filtra pelo nome da companhia (busca por substring, sem diferenciar maiúsculas).

    Mantém apenas o exercício mais recente do arquivo (ORDEM_EXERC = 'ÚLTIMO'),
    que é a coluna comparável entre companhias.
    """
    termo_up = termo.upper()
    return [
        ln for ln in linhas
        if termo_up in ln.get("DENOM_CIA", "").upper()
        and ln.get("ORDEM_EXERC", "").upper().startswith("ÚLT")
    ]


def salvar_csv(linhas: list[dict], caminho: str) -> None:
    """Grava as colunas úteis para modelagem em um CSV em UTF-8."""
    colunas = [
        "DENOM_CIA", "CD_CVM", "CNPJ_CIA", "DT_INI_EXERC", "DT_FIM_EXERC",
        "CD_CONTA", "DS_CONTA", "VL_CONTA", "MOEDA", "ESCALA_MOEDA",
    ]
    with open(caminho, "w", newline="", encoding="utf-8") as f:
        escritor = csv.DictWriter(f, fieldnames=colunas, extrasaction="ignore")
        escritor.writeheader()
        escritor.writerows(linhas)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--ano", type=int, required=True, help="ano-base da DFP (ex.: 2024)")
    parser.add_argument("--empresa", required=True, help="nome (ou parte) da companhia")
    parser.add_argument("--saida", default="dre_cvm.csv", help="arquivo CSV de saída")
    args = parser.parse_args()

    try:
        pacote = baixar_pacote(args.ano)
    except Exception as exc:  # rede/HTTP: reportar e sair com erro, sem inventar dados
        print(f"ERRO ao baixar o pacote da CVM: {exc}", file=sys.stderr)
        return 1

    linhas = extrair_dre(pacote, args.ano)
    selecao = filtrar_empresa(linhas, args.empresa)
    if not selecao:
        empresas = sorted({ln["DENOM_CIA"] for ln in linhas})
        print(
            f"Nenhuma linha encontrada para '{args.empresa}'. "
            f"O arquivo contém {len(empresas)} companhias.",
            file=sys.stderr,
        )
        return 2

    salvar_csv(selecao, args.saida)
    contas = len(selecao)
    cia = selecao[0]["DENOM_CIA"]
    print(f"[3/3] OK — {contas} contas da DRE de '{cia}' gravadas em {args.saida}", file=sys.stderr)
    print(
        "Lembrete: valores em milhares de R$ (VL_CONTA), conforme convenção do arquivo da CVM.",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
