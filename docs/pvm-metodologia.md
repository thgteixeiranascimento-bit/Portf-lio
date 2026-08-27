# Metodologia do simulador Price · Volume · Mix

**Motor:** `PVM_ENGINE_VERSION = 1.0.0` · **Código:** [`assets/js/pvm-engine.js`](../assets/js/pvm-engine.js)
· **Ferramenta:** [`pvm/index.html`](../pvm/index.html) · **Testes:** [`tests/`](../tests/)

Este documento é a especificação matemática do simulador. Toda fórmula aqui está
implementada no motor e coberta por teste automatizado; nenhum número deste
documento foi transcrito de uma fonte sem ser derivado e verificado.

---

## 1. Notação

| Símbolo | Significado |
|---|---|
| `i` | um item (SKU, ou o menor nível economicamente válido disponível) |
| `Q0_i`, `Q1_i` | quantidade do item `i` no período base e no período atual |
| `R0_i`, `R1_i` | receita do item `i` no período base e no período atual |
| `P0_i`, `P1_i` | preço unitário = `R_i / Q_i` (indefinido quando `Q_i = 0`) |
| `C0_i`, `C1_i` | custo unitário = `COGS_i / Q_i` |
| `Pm0` | preço médio ponderado do portfólio no período base = `Σ R0_i / Σ Q0_i` |
| `Cm0` | custo médio ponderado do portfólio no período base = `Σ COGS0_i / Σ Q0_i` |
| `g` | fator de crescimento de quantidade = `Σ Q1_i / Σ Q0_i` |

**`Pm0`, `Cm0` e `g` são calculados exclusivamente sobre a população comparável**
(itens presentes nos dois períodos com quantidade positiva). Incluir produtos
novos ou descontinuados contaminaria o fator de crescimento com itens que não
possuem par de comparação — o efeito Volume passaria a medir renovação de
portfólio, não variação de volume.

---

## 2. Classificação de itens

Executada antes de qualquer cálculo, em `classifySku()`.

| Status | Regra | Tratamento na ponte |
|---|---|---|
| **Active** | presente nos dois períodos **e** `Q0 > 0` **e** `Q1 > 0` | entra em Price, Volume e Mix |
| **New** | ausente no período base | efeito = `R1_i`, isolado no balde *New* |
| **Discontinued** | ausente no período atual | efeito = `−R0_i`, isolado no balde *Discontinued* |
| **Non-comparable** | presente nos dois períodos, mas com quantidade nula ou negativa em algum deles | efeito = `R1_i − R0_i`, isolado no balde *Other* |
| **Empty** | sem movimento em nenhum período | excluído |

"Presente" significa quantidade **ou** receita diferente de zero no período.

O status *Non-comparable* existe porque `P = R / Q` é indefinido quando `Q = 0`.
A alternativa comum — forçar esses itens para dentro de Price ou Mix — produz
`Infinity`/`NaN`, ou os esconde atrás de um preço arbitrado. Aqui a variação
inteira vai para um balde nomeado e visível na ponte, e o painel de qualidade
lista os itens afetados.

---

## 3. Estrutura comum das convenções

Para todo item **Active**, a variação de receita é uma identidade:

```
ΔR_i = P1_i·Q1_i − P0_i·Q0_i
```

Toda convenção decompõe essa identidade em um **efeito preço** mais um
**balde de quantidade** avaliado a um preço de referência `u`:

```
ΔR_i = Price_i + u·(Q1_i − Q0_i) [+ Cross_i]
```

O balde de quantidade é então repartido em Volume e Mix por uma regra
algébrica explícita, de modo que

```
Volume_i + Mix_i = u·(Q1_i − Q0_i)
```

**por construção, nunca por diferença.** É isso que atende à exigência de que
Mix não seja um *plug*: nenhuma das quatro convenções calcula Mix como
`ΔR − Price − Volume`. O resíduo existe apenas como controle (seção 7).

---

## 4. As quatro convenções

### 4.1 FTI-style PVM — **padrão do simulador**

```
Price_i  = (P1_i − P0_i) · Q1_i
Volume_i = P0_i · Q0_i · (g − 1)
Mix_i    = P0_i · (Q1_i − g · Q0_i)
```

**Derivação da identidade** (item Active):

```
Price_i + Volume_i + Mix_i
= (P1_i − P0_i)·Q1_i  +  P0_i·Q0_i·g − P0_i·Q0_i  +  P0_i·Q1_i − g·P0_i·Q0_i
= P1_i·Q1_i − P0_i·Q1_i  −  P0_i·Q0_i  +  P0_i·Q1_i
= P1_i·Q1_i − P0_i·Q0_i
= ΔR_i                                                            ∎
```

**Leitura econômica.** `Volume_i` é o que o item teria contribuído se crescesse
exatamente à taxa do portfólio, ao seu próprio preço base. `Mix_i` é o desvio do
item em relação a esse crescimento proporcional, também ao preço base.

**Por que isto é a formulação da FTI.** Como `Σ (Q1_i − g·Q0_i) = Σ Q1 − g·Σ Q0 = 0`
na população comparável, subtrair `Pm0` de cada `P0_i` não altera o total:

```
Σ Mix_i = Σ P0_i·(Q1_i − g·Q0_i)
        = Σ (P0_i − Pm0)·(Q1_i − g·Q0_i)  +  Pm0 · Σ (Q1_i − g·Q0_i)
        = Σ (P0_i − Pm0)·(Q1_i − g·Q0_i)  +  0
```

E `Q1_i − g·Q0_i = ΣQ1 · (share1_i − share0_i)`, onde `share_i = Q_i / ΣQ`. Logo:

```
Mix_i ≡ ΣQ1 · Δparticipação_i · (P0_i − Pm0)
```

que é exatamente a descrição conceitual da FTI Consulting: **diferença entre a
participação atual e a participação base**, multiplicada pela **mudança implícita
de volume decorrente da composição**, multiplicada pelo **diferencial entre o
preço do item e o preço médio do portfólio**. As duas escritas são a mesma
fórmula; a implementada é a numericamente mais estável (não subtrai duas médias
de grandezas próximas). Verificado em teste
(*"Formulação centrada da FTI (P0 − Pm0) dá o mesmo total de Mix"*).

**Propriedade que justifica ser o padrão:** sob crescimento estritamente
proporcional (`Q1_i = g·Q0_i` para todo `i`), `Mix_i = 0` **item a item** — não
apenas no total. É a definição mais pura de mix disponível entre as quatro.

A interação `ΔP·ΔQ` fica **dentro de Price** (convenção de volume atual).

### 4.2 Volume ao preço médio do portfólio

```
Price_i  = (P1_i − P0_i) · Q1_i
Volume_i = Pm0 · (Q1_i − Q0_i)
Mix_i    = (P0_i − Pm0) · (Q1_i − Q0_i)
```

Identidade: `Volume_i + Mix_i = P0_i·(Q1_i − Q0_i)`, e o resto segue como em 4.1.

**Leitura econômica.** Volume = unidades incrementais avaliadas ao preço médio
do portfólio. Mix = as mesmas unidades avaliadas ao **prêmio ou desconto** do
item contra esse preço médio.

**Relação com a 4.1.** Os *totais* são idênticos:

```
Σ Volume^{4.2} = Pm0 · (ΣQ1 − ΣQ0) = (ΣR0 / ΣQ0) · ΣQ0 · (g − 1) = ΣR0 · (g − 1) = Σ Volume^{4.1}
```

e, como as duas fecham a mesma ponte, `Σ Mix` também coincide. A diferença está
apenas na **atribuição por item**. Verificado em teste
(*"FTI-style e a convenção de preço médio dão os MESMOS totais de Volume e Mix"*).

Esta é a convenção da aba **"New method"** do workbook de referência (seção 9).

### 4.3 Prior Volume Convention

```
Price_i  = (P1_i − P0_i) · Q0_i
Volume_i = P1_i · Q0_i · (g − 1)
Mix_i    = P1_i · (Q1_i − g · Q0_i)
```

Identidade:

```
(P1−P0)Q0 + P1·Q0·g − P1·Q0 + P1·Q1 − g·P1·Q0 = P1·Q0 − P0·Q0 − P1·Q0 + P1·Q1 = ΔR_i  ∎
```

Preço medido sobre o volume do período **base**; o balde de quantidade é
avaliado a preços **atuais**, o que faz a interação `ΔP·ΔQ` cair em Volume/Mix.

### 4.4 Price / Volume / Mix / Cross

```
Price_i  = (P1_i − P0_i) · Q0_i
Volume_i = P0_i · Q0_i · (g − 1)
Mix_i    = P0_i · (Q1_i − g · Q0_i)
Cross_i  = (P1_i − P0_i) · (Q1_i − Q0_i)
```

Identidade:

```
(P1−P0)Q0 + P0·Q1 − P0·Q0 + (P1−P0)(Q1−Q0)
= P1Q0 − P0Q0 + P0Q1 − P0Q0 + P1Q1 − P1Q0 − P0Q1 + P0Q0
= P1Q1 − P0Q0 = ΔR_i                                                ∎
```

A interação **não é atribuída a ninguém**: vira um balde próprio. É a convenção
mais honesta quando preço e volume mudam muito ao mesmo tempo e a alocação da
interação seria arbitrária.

### 4.5 Como escolher

| Situação | Convenção |
|---|---|
| Uso geral, comunicação executiva | **4.1 FTI-style** (padrão) |
| Comparar com o workbook do webinar | 4.2 Preço médio |
| Preço apurado sobre o volume do ano anterior (prática de alguns controllers) | 4.3 Prior Volume |
| Preço e volume mudaram muito e a alocação da interação seria discutível | 4.4 Cross explícito |

**Não misture convenções na mesma análise.** O simulador aplica uma única
convenção por análise, ela viaja no arquivo exportado e aparece no rodapé de
todo gráfico. O painel *Comparação de metodologias* mostra as quatro lado a
lado, mas apenas como material educacional.

---

## 5. Ponte de receita

```
Receita base
+ Price
+ Volume
+ Mix
[+ Cross]
+ New products
+ Discontinued
+ Other / não comparável
= Receita atual
```

A ponte fecha por soma de identidades: cada item Active contribui com
`ΔR_i` exato via Price+Volume+Mix; cada New com `R1_i`; cada Discontinued com
`−R0_i`; cada Non-comparable com `R1_i − R0_i`. A soma sobre todos os itens é
`ΣR1 − ΣR0` por construção.

---

## 6. Ponte de COGS e de Margem Bruta

O lado do custo usa **exatamente a mesma álgebra**, com `C` no lugar de `P`:

```
Cost_i       = (C1_i − C0_i) · Q1_i          (convenção 4.1)
CostVolume_i = C0_i · Q0_i · (g − 1)
CostMix_i    = C0_i · (Q1_i − g · Q0_i)
```

A ponte de margem bruta é a **diferença exata, item a item**, entre a ponte de
receita e a ponte de custo:

```
GM base
+ Selling price          =  Σ (P1_i − P0_i)·Q1_i
− Unit cost / inflation  = −Σ (C1_i − C0_i)·Q1_i
+ Volume                 =  Σ (P0_i − C0_i)·Q0_i·(g − 1)     ← margem unitária base
+ Sales mix              =  Σ P0_i·(Q1_i − g·Q0_i)
− Cost mix               = −Σ C0_i·(Q1_i − g·Q0_i)
[+ Cross]
+ New products           =  Σ (R1_i − COGS1_i) dos novos
+ Discontinued           = −Σ (R0_i − COGS0_i) dos descontinuados
+ Other
= GM atual
```

Como cada lado fecha por identidade, a diferença também fecha. Note que
`Volume` aparece à **margem unitária base** (`P0 − C0`) e que
`Sales mix − Cost mix = (P0_i − C0_i)·(Q1_i − g·Q0_i)`, ou seja, o mix de margem
é o mix de receita líquido do mix de custo.

**Escopo.** A análise de margem cobre apenas itens com COGS informado nos
períodos em que existem. Itens sem COGS ficam **fora** — o simulador nunca
arbitra custo zero para fechar a ponte. A cobertura (nº de itens e % da receita
base) é exibida no painel e na exportação.

### Margem percentual

```
GM% = GM / Receita        (sobre a população coberta)
Δ GM% = GM%_atual − GM%_base, apresentado em pontos percentuais (p.p.)
```

---

## 7. Reconciliação e tolerância

```
ExpectedRevenue = Receita base + Σ (efeitos)
Residual        = Receita atual − ExpectedRevenue
Tolerância      = max(0,01 ; |Receita atual| × 1e-9)
Status          = PASS se |Residual| ≤ Tolerância, senão FAIL
```

O resíduo é exibido **sempre**, inclusive quando é zero, no subtítulo do
waterfall, no painel *Model integrity* e na aba *Executive Summary* do Excel.
Um `FAIL` nunca é escondido nem absorvido por arredondamento visual.

**Precisão numérica.** Nenhum arredondamento em etapa intermediária. Todos os
totais usam somatório compensado (Neumaier), o que mantém o resíduo na ordem de
`1e-11` mesmo com 100 mil itens — verificado em teste. O arredondamento acontece
somente na apresentação e na exportação.

---

## 8. Granularidade e unidades de medida

**Granularidade.** O cálculo ocorre sempre no nível do item; a agregação por
categoria, região, canal ou cliente é feita **somando efeitos já calculados**.
Recalcular PVM sobre médias agregadas destrói o mix interno ao grupo — o teste
*"Agregar ANTES de calcular produziria um Mix diferente"* demonstra e quantifica
essa diferença.

**Unidades de medida.** Volume e Mix pressupõem quantidades somáveis entre si.
O simulador verifica a coluna UOM:

- **UOM diferente dentro do mesmo SKU** → erro crítico; o cálculo é bloqueado.
- **UOM heterogênea entre SKUs** → aviso persistente com o texto exigido pelo
  protocolo (*"Mix analysis requires comparable units of measure. Select a
  homogeneous UOM or use an alternative decomposition."*), selo nos KPIs de
  Volume e Mix, e filtro por UOM em destaque. A ponte continua fechando —
  aritmeticamente ela sempre fecha — mas a **interpretação** dos efeitos deixa
  de ser válida, e isso é dito.
- **UOM não informada** → registrado como limitação: sem a coluna, não há como
  verificar comparabilidade.

---

## 9. Confronto com as fontes

### 9.1 FTI Consulting

> *A Quantifiable Approach to Price Volume Mix Analysis* —
> <https://www.fticonsulting.com/insights/white-papers/quantifiable-approach-price-volume-mix-analysis>

Usada como **referência conceitual** do efeito Mix: diferença de participação ×
mudança implícita de volume × diferencial entre o preço do item e o preço médio
do portfólio. A seção 4.1 mostra que a fórmula implementada é algebricamente
idêntica a essa descrição. Nenhum número foi copiado da fonte.

### 9.2 Workbook do webinar (`PVM_calculations.xlsx`)

Três abas foram examinadas. O motor **converge** com o workbook em:

| Grandeza | Workbook | Motor | Situação |
|---|---|---|---|
| Receita base (2019) | 799.424 | 799.424 | idêntico |
| Receita atual (2020) | 888.721 | 888.721 | idêntico |
| Efeito Price | 15.289,408112425059 | 15.289,408112425 | idêntico até o limite do float64 |
| New products | 82.866 | 82.866 | idêntico |
| Discontinued | −55.104 | −55.104 | idêntico |
| Volume + Mix | 46.245,591888 | 46.245,591888 | idêntico |
| Classificação Active/New/Discontinued | 10 / 2 / 3 | 10 / 2 / 3 | idêntico |

E **diverge** em dois pontos, ambos deliberados:

**Divergência 1 — repartição interna de Volume e Mix.**
Na aba *Advanced*, o Volume total é recalculado na linha de totais como
`(ΣQ1_todas − ΣQ0_todas) × (ΣR0_todas / ΣQ0_todas)`, usando **todas as linhas**,
inclusive produtos novos e descontinuados; o Mix total é então obtido por
diferença (`N17 = ΔR − Price − Vol − New − Disc`). Isso produz
Volume = 41.747,61 e Mix = 4.497,98.

O motor restringe `g` e `Pm0` à população comparável e calcula o Mix por
fórmula, obtendo Volume = 100.180,86 e Mix = −53.935,26. **A soma é a mesma**
(46.245,59) e as duas pontes fecham; o que muda é a fronteira entre os dois
efeitos.

*Por que a escolha do motor:* incluir produtos novos e descontinuados no fator
de crescimento faz o efeito Volume absorver a renovação do portfólio, que já
está isolada nos baldes New e Discontinued — o mesmo fenômeno seria contado
duas vezes, com sinais que se compensam apenas no total. Além disso, obter Mix
por diferença é precisamente o *plug* que o protocolo deste projeto proíbe.

**Divergência 2 — fórmula de Mix da aba *Basic*.**
A célula `M2` da aba *Basic* é:

```
= SUM([Quantity AC]) / ([Price PY] − SUM([Revenue PY])/SUM([Quantity PY])) * [Mix change]
```

com uma **divisão** onde a formulação da FTI requer uma multiplicação. As
unidades resultantes (`quantidade² / moeda`) não correspondem a um valor
monetário. A identidade da aba continua fechando porque, ali, `Vol` é definido
como `(ΔQ)·P0 − Mix`, ou seja, o Volume absorve qualquer valor que o Mix assuma —
o que também caracteriza um *plug*, agora no Volume. O motor implementa a versão
multiplicativa, dimensionalmente correta, derivada na seção 4.1.

### 9.3 Relatório Power BI

O relatório indicado na especificação foi usado como referência de **layout e
vocabulário** (nomes dos efeitos, ordem do waterfall, ideia da matriz de mix).
Nenhuma fórmula foi atribuída a ele.

### 9.4 `PVM variance analysis webinar - upload.pbix`

Arquivo binário do Power BI. **Não foi aberto nem interpretado** neste projeto —
não há leitor de `.pbix` disponível no ambiente de desenvolvimento, e transcrever
DAX "de memória" violaria a regra antialucinação. As fórmulas do workbook
`.xlsx` que o acompanha foram lidas diretamente das células e estão confrontadas
acima.

---

## 10. Regra antialucinação da narrativa

O painel *Executive Insights* monta cada frase a partir de um número que já
existe no resultado. Cada frase carrega proveniência (`Why?`): fórmula aplicada,
valores de origem, período, filtro ativo, metodologia e versão do motor.

Um verificador automático (`auditNarrative`) roda em tempo de execução e nos
testes, rejeitando vocabulário causal que os dados não sustentam — *demanda*,
*preferência*, *estratégia bem-sucedida*, *expansão de mercado*, *inflação*,
*elasticidade*. O simulador diz **"o volume aumentou"**, nunca **"a demanda
aumentou"**: quantidade vendida não prova demanda.

Nenhum modelo de linguagem participa do cálculo. O motor é determinístico.

---

## 11. Limitações declaradas

1. O resultado depende inteiramente da **qualidade e da comparabilidade** da base
   enviada. O simulador diagnostica problemas; não os corrige.
2. O preço unitário é derivado de `Receita / Quantidade`. Descontos, devoluções,
   bonificações e diferenças de política de reconhecimento de receita entram
   nesse preço médio e aparecem como "efeito preço".
3. Produtos novos e descontinuados **não têm par de comparação** e por isso não
   geram efeito de preço nem de mix. Quem quiser tratá-los de outra forma
   (por exemplo, um produto substituto herdando o histórico do antecessor)
   precisa fazer esse mapeamento na base, antes do upload.
4. A fronteira entre Volume e Mix depende da granularidade: mix interno a um
   grupo desaparece se a base já vier agregada. O simulador calcula no menor
   nível disponível **na base recebida** — se a base já vier por categoria, o mix
   entre SKUs daquela categoria é irrecuperável.
5. Com UOM heterogênea, a ponte fecha mas a leitura de Volume e Mix não é
   economicamente válida (seção 8).
6. A análise de margem cobre apenas a população com COGS informado.
7. O simulador não explica **por que** preço ou volume mudaram — essa informação
   não está na base.

---

## 12. Verificação

| Camada | O que valida | Como rodar |
|---|---|---|
| `tests/pvm-engine.test.js` | casos A–I do protocolo, identidade da ponte nas quatro convenções, edge cases, 100 mil itens, reprodução do workbook | `node tests/run.mjs` |
| `tests/pvm-validator.test.js` | três camadas de validação, Data Quality Score, leitura de números e períodos, regra antialucinação | idem |
| `tests/index.html` | a mesma suíte, no navegador, contra os mesmos módulos que a página carrega | abrir `tests/index.html` |
| Painel *Model integrity* | reconciliação em tempo real, a cada filtro e troca de metodologia | na própria ferramenta |
| Aba *Methodology* do Excel exportado | fórmulas, tolerância, resíduo observado e limitações, fora do navegador | exportar e abrir |

---

## 13. Privacidade

O site é estático e **não possui backend**. Leitura do arquivo, cálculo,
visualização e exportação acontecem inteiramente no navegador do usuário; o
armazenamento de análises usa IndexedDB local. Nenhum dado é transmitido. Isso é
verificável no código: não há `fetch`, `XMLHttpRequest`, `WebSocket` nem
`sendBeacon` em nenhum módulo `pvm-*.js`. A única ocorrência de `new Response(...)`
está em `pvm-xlsx.js` e serve para drenar um `DecompressionStream`/`CompressionStream`
local em memória — é a API de streams do navegador, não uma requisição de rede.
