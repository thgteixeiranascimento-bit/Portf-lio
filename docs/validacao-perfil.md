# Validação do perfil — conselho aplicado à biografia do autor

Versão 3.0 (18/08/2026). Página navegável com os checks recalculados ao vivo:
[`validacao-perfil.html`](../validacao-perfil.html).

Um portfólio que audita demonstrações financeiras de terceiros precisa conseguir auditar o próprio currículo.
Este documento registra como as afirmações biográficas publicadas no site são fundamentadas, niveladas e
verificadas — e o que permanece em aberto.

---

## 1. Hierarquia de fontes da biografia

Os dados de mercado do portfólio usam níveis 1 a 3 (extração documental → relatado). Afirmações biográficas
precisam de escala própria, porque todas se originam da mesma pessoa: o que muda é se um terceiro consegue
conferi-las.

| Classe | Definição | Origem | Conferibilidade |
|---|---|---|---|
| **D1** | Documento oficial exportado | Export do perfil do LinkedIn (PDF, ago/2026) | Conferível no perfil público |
| **D2** | Documento preparado pelo titular | Currículos e carta em `.docx` usados em candidaturas reais | Depende de confirmação em entrevista |
| **D3** | Declaração direta do titular | Briefing para construção do site, sem documento anexado | Menor nível — sempre com atribuição explícita |
| **D4** | Verificável publicamente | Código e páginas deste repositório | Maior nível — o artefato é a própria prova |

Fonte única de todas as afirmações: [`assets/js/perfil.js`](../assets/js/perfil.js). Home, currículo, carta e
página Sobre leem esse mesmo registro — uma correção ali corrige todas as superfícies simultaneamente, e os
documentos baixados nunca saem de sincronia com o site.

---

## 2. Os 12 checks automáticos

Recalculados no navegador a cada carregamento de `validacao-perfil.html`:

| # | Check |
|---|---|
| 1 | Toda experiência profissional declara ao menos um documento-fonte |
| 2 | Toda entrega declarada aponta para documento-fonte |
| 3 | Todo identificador de fonte citado existe na matriz de fontes |
| 4 | Nenhum resultado quantificado é publicado sem métrica com fonte |
| 5 | Toda divergência entre documentos tem tratamento e status declarados |
| 6 | Competências separam **demonstrada** (artefato) de **declarada** (documento) |
| 7 | Toda palavra-chave publicada para triagem ancora em experiência, competência ou artefato |
| 8 | Todo projeto publicado tem artefato navegável |
| 9 | Cronologia consistente: sem data futura e sem fim anterior ao início |
| 10 | Controles de privacidade explícitos para dado sensível |
| 11 | Conflito de interesse declarado e vinculado ao emprego atual |
| 12 | Registro único: currículo, carta, home e Sobre leem a mesma fonte |

**Estado atual: 12/12 aprovados.** O check 7 é o mais incomum e o mais importante contra inflação de
currículo: os 73 termos publicados para triagem automatizada são procurados no texto da experiência declarada,
no registro de competências e nos artefatos publicados. Um termo que não ancora em lugar nenhum é reportado na
própria página, em vez de mantido silenciosamente.

---

## 3. Divergências entre documentos-fonte

Encontradas ao cruzar o export do LinkedIn com os dois currículos preparados pelo titular.

| # | Tema | Tratamento | Status |
|---|---|---|---|
| 1 | Data de início no Agibank | Adotado jan/2026, por concordância de três documentos contra redação anterior sem apoio documental | **Corrigido — confirmar** |
| 2 | Conclusão da graduação | Publicado 2018–2023, adotando a data mais tardia; divergência registrada | **Declarado — confirmar** |
| 3 | Período mai–dez/2025 sem vínculo descrito | Lacuna declarada, não preenchida; nada foi inventado para cobrir o intervalo | **Lacuna — confirmar** |
| 4 | Classificação na competição universitária | Publicado com atribuição ao titular (D2); o LinkedIn registra a participação, não a colocação | Declarado |
| 5 | Grafia de certificação | "Fluency Acabemy" no documento-fonte → publicado "Fluency Academy" | Corrigido |
| 6 | Nomenclatura do cargo atual | Adotada a forma dos currículos, que descreve o escopo; título formal mantido nesta tabela | Declarado |
| 7 | Ferramentas antes descritas como "em desenvolvimento" | Separada a competência profissional (declarada, com fonte) do artefato publicado (ausente) | Corrigido |

**Três itens aguardam confirmação do titular** e permanecem publicados como divergência aberta, não como fato.

### Sobre a divergência 1

Versões anteriores do site declaravam "colaborador do Agibank desde 2025". O export do LinkedIn registra
"janeiro de 2026 – Present (8 meses)" — internamente coerente com agosto de 2026 — e os dois currículos
preparados pelo titular registram "jan/2026 – atual". Três documentos concordam contra uma redação sem
documento de apoio, então jan/2026 foi adotado.

Como consequência, a **declaração de conflito de interesse** passou a citar o vínculo como atual, sem afirmar
um ano contestado: a divulgação permanece integral, sem apoiar-se em uma data em disputa.

### Sobre a divergência 7

O site anterior listava Power BI, Excel/VBA, Power Query e Power Pivot como "ainda não incluídos nesta
versão". Um leitor podia interpretar isso como ausência de competência — enquanto os documentos-fonte
registram uso profissional de Power BI (DAX) e Excel avançado. O que faltava era o **artefato publicado**, não
a competência. As duas coisas agora aparecem separadas e rotuladas em toda parte.

---

## 4. Resultados quantificados — por que não existem

Nenhum percentual de economia, redução de erro ou ganho de produtividade obtido dentro de um empregador é
publicado, aqui ou no currículo. Não é modéstia: resultado operacional interno não é divulgável, e um número
sem fonte conferível é exatamente o tipo de afirmação que o protocolo do portfólio existe para impedir.

O que se publica no lugar é o **método** — e as três ferramentas próprias, que demonstram a classe de cálculo
com parâmetros que o visitante controla, sem nenhum dado de empregador. Um recrutador confere a afirmação em
um clique; um número inventado não seria conferível de forma alguma.

---

## 5. Controles de privacidade

| Dado | Página pública | Currículo baixável | Razão |
|---|---|---|---|
| Telefone | não | sim | Fora da página indexável para reduzir coleta automatizada |
| Endereço residencial | não | não | Nunca publicado, em nenhuma superfície |
| Condição de PcD | não | sim | Consta dos currículos do titular; a decisão de divulgar cabe a ele em cada candidatura |

Definidos em `PRIVACIDADE`, no topo de [`perfil.js`](../assets/js/perfil.js). Alterar ali altera todas as
superfícies.

---

## 6. Parecer consolidado

**⚠️ VALIDADO COM RESSALVAS.**

1. **O histórico de emprego depende do titular.** Nenhum terceiro consegue verificar data de início, cargo ou
   entrega apenas a partir deste site. O que o portfólio garante é consistência interna e que nada foi
   inventado para preencher lacuna — não que um empregador confirmaria cada linha.
2. **Nenhum resultado profissional quantificado é publicado**, pelas razões da seção 4.
3. **Três divergências aguardam confirmação**, listadas na seção 3.
4. **As ferramentas próprias são reconstruções públicas** — demonstram o raciocínio, não reproduzem artefatos
   internos e não contêm dado operacional.

O conselho de validação dos dados financeiros públicos é outro, e está em [`validacao.md`](validacao.md) e em
[`metodologia.html`](../metodologia.html).
