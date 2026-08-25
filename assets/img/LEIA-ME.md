# Retrato da capa

A capa da home tem um lugar reservado para uma fotografia do titular. Enquanto o
arquivo não existe, a página desenha um retrato tipográfico com as iniciais — ela
nunca inventa uma imagem nem usa foto de banco de imagens no lugar de uma pessoa real.

## Como colocar a foto

**1.** Salve o arquivo exatamente como:

```
assets/img/retrato.jpg
```

**2.** Em `index.html`, na seção da capa, troque o retrato desenhado pela foto:
apague o bloco `<div class="vazio">…</div>` e descomente a linha `<img …>` logo
acima dele. O trecho está marcado com um comentário `═══ RETRATO ═══`.

> A troca é manual de propósito. A alternativa — a página procurar o arquivo
> sozinha — deixaria um erro 404 permanente no console enquanto a foto não
> existisse, e este site publica que **nenhuma** das 24 páginas produz erro de
> console. Um passo a mais na troca vale menos que uma promessa quebrada.

## O que a página faz com a imagem

O tratamento é feito em CSS, não no arquivo — então você pode trocar o arquivo a
qualquer momento sem reeditar nada:

- conversão para **preto e branco** com contraste elevado (`grayscale(1) contrast(1.06)`);
- o brilho baixa levemente (`brightness(.92)`), para a foto não brigar com o fundo grafite;
- ao passar o ponteiro, a cor volta parcialmente e a imagem faz um leve zoom;
- recorte `object-fit: cover` na proporção 4:5.

## O que faz uma boa foto aqui

| Critério | Recomendação |
|---|---|
| Enquadramento | Do peito para cima, olhos no terço superior |
| Proporção | Vertical, perto de 4:5 (ex.: 1200 × 1500 px) |
| Fundo | Liso e claro, ou desfocado — o tratamento P&B perdoa pouco fundo poluído |
| Luz | Frontal e suave; evite contraluz e sombra dura no rosto |
| Traje | Registro do setor financeiro |
| Peso | Até ~400 KB, para não atrasar a primeira dobra |

A foto do LinkedIn serve, desde que exportada no maior tamanho disponível. Baixe pelo
próprio perfil (foto → ver imagem → salvar) e renomeie para `retrato.jpg`.
