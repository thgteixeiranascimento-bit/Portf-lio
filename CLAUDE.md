# Portfólio Finanças Corporativas — Configuração Claude Code

## Sobre este projeto

Portfólio técnico de **Finanças Corporativas, FP&A, Valuation e BI** construído com:
- **Stack:** HTML/CSS/JavaScript puro (sem dependências externas; fontes servidas de `assets/fonts/`)
- **Dados:** Públicos de fontes primárias datadas (Nu Holdings, Agi/Agibank, Itaú, Bradesco, Santander Brasil, Copom)
- **Integridade:** 147 checks automáticos recalculados no navegador
- **Publicação:** GitHub Pages estático

---

## 🎯 Skills personalizadas

### `ui-design-reference`
**Melhoria de UI/UX orientada a componentes**

Consulta dos padrões de design em **shadcn-ui** para elevar a qualidade visual do portfólio:
- Tokens de design (cores, tipografia, espaçamento)
- Componentes acessíveis (botões, cards, navegação, tabelas)
- Tema escuro editorial único (grafite #09090f, acento âmbar) — sem tema claro
- Padrões de interação responsivos

**Quando usar:** Refatorações de CSS, novos componentes, melhorias de acessibilidade, temas.

---

### `financial-modeling-integrity`
**Protocolo de integridade analítica**

Validação das 147 checks automáticas e rastreabilidade de dados:
- Verificações aritméticas (somas, pontes, reconciliações)
- Hierarquia de fontes (extração documental nível 1 vs relato nível 3)
- Declaração de lacunas e divergências documentadas
- Protocolo antialucinação: fato ≠ premissa ≠ estimativa

**Quando usar:** Novos simuladores, adição de dados, validação de cálculos.

---

### `component-library-expansion`
**Biblioteca de componentes reutilizáveis**

Extensão do `core.js` com novos componentes:
- Gráficos SVG customizados (já 90% pronto)
- Tabelas interativas com sorting/filtering
- Formulários para entrada de premissas (inputs, sliders, checkboxes)
- Painéis de validação (checks, warnings, errors)

**Quando usar:** Novos estudos, modernização de UI, reutilização de código.

---

### `performance-optimization`
**Otimização de carregamento e renderização**

Garantir que o site permaneça rápido mesmo com 147 checks:
- Lazy loading de gráficos
- Compressão de dados
- Cache estratégico
- Métricas de performance

**Quando usar:** Adição de funcionalidades pesadas, manutenção de velocidade.

---

## 📁 Referências externas (submodules)

```
references/
├── gstack/              # Metodologia de desenvolvimento para agentes
├── shadcn-ui-mcp/       # Componentes UI — design tokens e padrões
├── magic-mcp/           # MCP para automação avançada
└── agent-skills/        # Skills de agentes Vercel
```

**Como usar:** Consultar como referência de código e design, não como dependências diretas.

---

## 🛠 Stack e ferramenta

| Componente | Tecnologia |
|---|---|
| **HTML/CSS** | Vanilla + tema escuro editorial (claro apenas em impressão) |
| **JavaScript** | `core.js` (gráficos SVG, checks, formatação pt-BR) |
| **Dados** | `data.js` (dataset central, fonte única) |
| **Servidor** | GitHub Pages (estático) |
| **Automação** | Python 3 (CVM Dados Abertos) |
| **Versionamento** | Git (commits descritivos) |

---

## ✅ Checklist de qualidade

Antes de fazer push:

- [ ] Verificar se os 147 checks passam (console do navegador)
- [ ] Testar em tela e em impressão (`@media print`: currículo e carta em papel)
- [ ] Validar responsividade (mobile, tablet, desktop)
- [ ] Revisar acessibilidade (contrast, alt text, ARIA)
- [ ] Conferir links internos e externos
- [ ] Atualizar `docs/fontes.md` se dados mudaram
- [ ] Validar git commit message com contexto

---

## 🚀 Publicação

1. Merge desta branch em `main`
2. GitHub: **Settings → Pages → Build and deployment**
3. Source: `Deploy from a branch` + `main` + `/ (root)`
4. Site ao vivo em: https://thgteixeiranascimento-bit.github.io/Portf-lio/

---

## 📞 Contato

- **Email:** thgteixeiranascimento@gmail.com
- **GitHub:** https://github.com/thgteixeiranascimento-bit/Portf-lio
- **LinkedIn:** linkedin.com/in/thiago-teixeira-nascimento-03a3961a3

---

**Última atualização:** 18/08/2026
