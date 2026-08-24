# 📚 Referências Externas — Portfólio Finanças Corporativas

Este diretório contém **Git submodules** com referências de código, design e metodologia para melhorias contínuas do portfólio.

**Importante:** Estes são repositórios de **referência apenas** — não são dependências de produção. O portfólio continua 100% vanilla (HTML/CSS/JavaScript puro, sem frameworks).

---

## 📦 Submodules

### 1. **gstack** — Metodologia de Desenvolvimento
```
references/gstack/
```

**Autor:** [Garry Tan](https://github.com/garrytan) (Y Combinator)

**O que oferece:**
- Metodologia para desenvolvimento de software com AI agents
- Padrões de arquitetura e organização de código
- Estratégias de automação e orquestração

**Por que usar:**
- Inspirar a estrutura de automação Python do portfólio
- Aplicar padrões de qualidade e testing

**Link:** https://github.com/garrytan/gstack

---

### 2. **shadcn-ui-mcp-server** — Design System & UI Components
```
references/shadcn-ui-mcp/
```

**Autor:** [Janardhan Polle](https://github.com/Jpisnice)

**O que oferece:**
- Componentes React/Vue/Svelte/React Native do shadcn/ui v4
- Design tokens (cores, tipografia, espaçamento)
- Padrões de acessibilidade (WCAG 2.1 AA)
- Exemplos de interatividade e animações

**Por que usar:**
- Consultar **design tokens** para melhorar CSS do portfólio:
  - Escala de cores (primário, secundário, sucesso, erro, aviso)
  - Sistema tipográfico (tamanhos, pesos, alturas de linha)
  - Espaçamento consistente (8px grid)
- Inspirar **padrões de componentes** (buttons, cards, tables, inputs)
- Referência de **animações e transições** (fade, slide, scale)
- Verificar **acessibilidade** (focus states, ARIA, contrast)

**Como explorar:**
```bash
cd references/shadcn-ui-mcp
# Ver documentação de design tokens:
ls -la docs/

# Exemplos de componentes:
find . -name "*.tsx" | grep -E "Button|Card|Input" | head -5
```

**Link:** https://github.com/Jpisnice/shadcn-ui-mcp-server

---

### 3. **magic-mcp** — Automação Avançada
```
references/magic-mcp/
```

**Autor:** [21st-dev](https://github.com/21st-dev)

**O que oferece:**
- MCP (Model Context Protocol) server para automação
- Padrões de integração com sistemas externos
- Estratégias de orquestração de tarefas

**Por que usar:**
- Inspirar melhorias na automação Python (`automation/python/`)
- Considerar MCP para integrações futuras (CVM, cotações, etc.)

**Link:** https://github.com/21st-dev/magic-mcp

---

### 4. **agent-skills** — Skills de Agentes
```
references/agent-skills/
```

**Autor:** [Vercel Labs](https://github.com/vercel-labs)

**O que oferece:**
- Padrões de skills (tarefas repetíveis para Claude Code)
- Estrutura de prompts e instruções
- Automação de workflows comuns

**Por que usar:**
- Expandir o `CLAUDE.md` com skills adicionais
- Criar skills para:
  - Validação automática de integridade (147 checks)
  - Publicação no GitHub Pages
  - Atualização de dados da CVM

**Link:** https://github.com/vercel-labs/agent-skills

---

## 🎯 Como Usar Estas Referências

### 1. Design Tokens (shadcn-ui)
```bash
# Consultar paleta de cores
cd references/shadcn-ui-mcp
grep -r "color:" docs/ | grep -E "primary|secondary|success"

# Ver escalas de tipografia
grep -r "font-size\|line-height" docs/
```

**Aplicar no portfólio (`assets/css/style.css`):**
```css
:root {
  /* Inspirado em shadcn */
  --color-primary: #3b82f6;
  --color-secondary: #6366f1;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
}
```

### 2. Componentes UI (shadcn-ui)
```bash
# Ver exemplo de Button component
find references/shadcn-ui-mcp -name "*button*" -type f | head -3

# Ver exemplo de Card
find references/shadcn-ui-mcp -name "*card*" -type f | head -3
```

**Padrão a replicar em CSS vanilla:**
- Variantes (primary, secondary, outline, ghost)
- Estados (hover, active, disabled, loading)
- Tamanhos (sm, md, lg)
- Transições suaves (200ms)

### 3. Animações (shadcn-ui)
**Padrões comuns:**
- Fade in/out: `opacity` + `transition`
- Slide: `transform: translateX/Y` + `transition`
- Scale: `transform: scale()` + `transition`
- Spring: `cubic-bezier(0.34, 1.56, 0.64, 1)`

```css
/* Inspirado em shadcn */
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.component {
  animation: fadeIn 200ms ease-out;
}
```

### 4. Acessibilidade (shadcn-ui + WCAG)
**Checklist:**
- [ ] Contrast ratio >= 4.5:1 para texto
- [ ] Focus states visíveis (outline: 3px)
- [ ] ARIA labels onde necessário
- [ ] Semântica HTML correta (`<button>`, `<nav>`, `<table>`)
- [ ] Suporte a `prefers-reduced-motion`

### 5. Automação (magic-mcp, agent-skills)
**Aplicar ao `CLAUDE.md`:**
```markdown
### `auto-publish-pages`
**Publica site no GitHub Pages automaticamente**
1. Copia arquivos para `gh-pages` branch
2. Configura `_config.yml` (Jekyll)
3. Valida links e screenshots
```

---

## 📖 Documentação Recomendada

| Tópico | Recurso | Link |
|--------|---------|------|
| **Design Tokens** | shadcn/ui docs | `references/shadcn-ui-mcp/docs/` |
| **CSS Moderno** | MDN Web Docs | https://developer.mozilla.org/en-US/docs/Web/CSS |
| **Acessibilidade** | WCAG 2.1 | https://www.w3.org/WAI/WCAG21/quickref/ |
| **Metodologia** | gstack | `references/gstack/README.md` |
| **Web Performance** | Web.dev | https://web.dev/learn/css/ |

---

## 🔄 Atualizar Submodules

```bash
# Atualizar todos os submodules para versão mais recente
git submodule update --remote

# Atualizar submodule específico
git submodule update --remote references/shadcn-ui-mcp

# Clonar com todos os submodules
git clone --recurse-submodules https://github.com/thgteixeiranascimento-bit/Portf-lio.git
```

---

## 📝 Notas Importantes

1. **Não copie código diretamente.** Use como inspiração e adapte para vanilla JavaScript.
2. **Verifique licenças.** Todos os repositórios de referência são open-source (MIT/Apache 2.0).
3. **Mantenha vanilla.** O portfólio não usa React, Vue, ou qualquer framework externo.
4. **Documente mudanças.** Ao aplicar referências, cite no commit message.

Exemplo de commit bem documentado:
```
Improve button styles inspired by shadcn design tokens

- Added primary/secondary/outline/ghost variants
- Implemented hover/active/disabled/loading states
- Used 200ms ease-out transitions
- Validated WCAG AA contrast (4.5:1)

Reference: shadcn-ui Button component pattern
```

---

## 🚀 Próximos Passos

1. **Revisar** `docs/ui-ux-roadmap.md` para prioridades
2. **Consultar** cada submodule conforme necessário
3. **Citar** referências em commits e PRs
4. **Evoluir** o portfólio mantendo simplicidade vanilla

---

**Última atualização:** 18/08/2026
**Responsável:** Claude Code
**Status:** 🟢 Ativo — Referências prontas para consulta
