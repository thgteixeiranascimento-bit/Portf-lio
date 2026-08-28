# Limitações

Declaração honesta do que este portfólio **não** é e do que os modelos **não** respondem.

## Limitações gerais

- **Os dados financeiros dos simuladores são simulados.** A Aurora Industrial S.A. e a Vetra
  Componentes S.A. são fictícias; nenhum resultado demonstra desempenho real de empresa ou do
  titular. **Exceção:** o [simulador de Price · Volume · Mix](../pvm/index.html) é uma ferramenta —
  calcula sobre a base que o usuário carregar, e seu dataset DEMO é sintético e rotulado.
- **Nada aqui é recomendação de investimento**, proposta de negócio ou opinião sobre ativos reais.
- **Parâmetros de mercado** (taxa livre de risco, prêmios, betas, múltiplos) são hipóteses de
  estudo, não dados atuais — num caso real seriam extraídos de fontes primárias datadas.
- O perfil profissional permanece com lacunas declaradas ("DADO NÃO INFORMADO") até o titular
  fornecer informações verificáveis.

## Limitações por módulo

- **Price · Volume · Mix (ferramenta):** o resultado depende inteiramente da qualidade e da
  comparabilidade da base enviada — o simulador diagnostica problemas, não os corrige. O preço
  unitário é derivado de `Receita / Quantidade`, então descontos e devoluções aparecem como efeito
  preço. Produtos novos e descontinuados não têm par de comparação e por isso não geram efeito de
  preço nem de mix. A fronteira entre Volume e Mix depende da granularidade da base recebida. Com
  unidades de medida heterogêneas a ponte fecha, mas a leitura de Volume e Mix deixa de ser válida.
  A análise de margem cobre apenas a população com COGS informado. O simulador **não explica por
  que** preço ou volume mudaram: isso não está nos dados. Em bases muito grandes, alguns elementos
  visuais têm teto de exibição (500 bolhas na matriz de mix, 1.000 linhas na tabela) para não
  congelar o navegador — o cálculo continua sobre a população inteira, e o teto é declarado na
  tela. Lista completa em [`pvm-metodologia.md`](pvm-metodologia.md) §11 e §13.
- **Real vs. Orçado:** decomposição PVM assume efeitos independentes; margens de contribuição
  são premissas, não custeio apurado.
- **Rolling forecast:** drivers lineares e independentes; sem elasticidade preço-volume nem
  restrição de capacidade.
- **Fluxo de caixa:** defasagens fixas por bucket; sem linhas compromissadas nem aplicações.
- **Capital de giro:** conversão linear dias→saldo; ignora sazonalidade intra-mês e mix.
- **Três demonstrações:** um segmento; sem inflação explícita; IR linear; sem diferidos.
- **Valuation:** projeção explícita curta (valor dominado pelo terminal); sem painel real de
  comparáveis; sem ajustes de itens fora do balanço.
- **CAPEX/EVTE:** sem opções reais (adiar/expandir/abandonar); sem canibalização.
- **M&A:** sem alocação de preço de compra (PPA), earn-outs ou sinergias de receita.
- **Riscos:** choques lineares sem correlação modelada; classificação qualitativa; não é VaR.
- **Portfólio:** média-variância com parâmetros didáticos; fronteira aproximada por amostragem;
  estritamente educacional.
- **Automação:** o script CVM coleta dados públicos e não publica análise; qualidade dos dados
  depende do arquivo original da CVM.
