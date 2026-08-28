# UI/UX Roadmap — Portfólio Finanças Corporativas

**Versão:** 1.0 | **Data:** 18/08/2026 | **Status:** Planejado

Este documento descreve melhorias visuais e de experiência do usuário, inspiradas em padrões modernos de design (shadcn/ui, gstack, agent-skills).

---

## 📐 Design System & Tokens

### Cores (tema escuro único)
- ✅ **Implementado (v6.0):** tema editorial escuro — grafite `#09090f`, acento âmbar `#d4a843`, séries âmbar/vermelho/teal/violeta. Não há mais ramo `prefers-color-scheme`: a folha declara `color-scheme: dark` e o claro existe só em `@media print`. Ver `DESIGN.md`.
- 🔄 **Refinável:**
  - Tokens de cor mais explícitos em CSS (variáveis nomeadas semanticamente)
  - Paleta expandida: sucesso, aviso, erro, informação
  - Contrast ratio mínimo WCAG AA (4.5:1 para texto pequeno)

**Exemplo de melhoria:**
```css
:root {
  /* Semanticamente explícito */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}
```

### Tipografia
- ✅ **Implementado (v6.0):** Lora (títulos e algarismo de display), Inter (texto) e JetBrains Mono (rótulo, coluna e algarismo de grade) — woff2 variáveis servidas de `assets/fonts/`, sem requisição externa
- 🎯 **Melhorias:**
  - Escala de tamanhos consistente (16px base, escala de ouro 1.125)
  - Altura de linha otimizada por tipo (heading vs body)
  - Line-height e letter-spacing responsivos

**Exemplo:**
```css
/* Heading */
h1 { font-size: 2.488rem; line-height: 1.1; letter-spacing: -0.02em; }

/* Body */
p  { font-size: 1rem; line-height: 1.6; letter-spacing: 0; }
```

### Espaçamento (8px grid)
- ✅ **Base existe**
- 🔄 **Padronizar:**
  - Espaçamento consistente: 8px, 16px, 24px, 32px, 48px, 64px
  - Margens/paddings uniformes

---

## 🎨 Componentes Reutilizáveis

### Botões
- ✅ **Básico:** Classes `.btn`, `.btn-primary`
- 🎯 **Expandir:**
  - Variantes: primary, secondary, outline, ghost, danger
  - Estados: hover, active, disabled, loading
  - Tamanhos: sm, md (default), lg
  - Transições suaves (200ms)

```html
<!-- Antes -->
<button>Clique</button>

<!-- Depois -->
<button class="btn btn-primary btn-md">
  <span class="btn-text">Clique</span>
  <span class="btn-icon" aria-hidden="true">→</span>
</button>
```

### Cards
- ✅ **Existe:** `.card` com borders e padding
- 🎯 **Melhorar:**
  - Sombra elevada (box-shadow com Z-depth)
  - Hover states animados
  - Borders suaves com border-radius consistente
  - Transições de scale/shadow

```css
.card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: all 200ms ease-out;
}

.card:hover {
  box-shadow: 0 12px 24px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}
```

### Tabelas
- ✅ **Básico:** Tabelas com `.tbl`
- 🎯 **Enhance:**
  - Alternância de linhas (zebra striping sutil)
  - Hover state em rows
  - Sticky headers
  - Horizontal scroll em mobile

```css
.tbl tbody tr:nth-child(odd) {
  background-color: rgba(0,0,0,0.02); /* light mode */
}

.tbl tbody tr:hover {
  background-color: rgba(0,0,0,0.04);
}
```

### Inputs & Formulários
- ❌ **Ausente:** Inputs customizados
- 🎯 **Implementar:**
  - Text inputs, textareas, select, checkbox, radio
  - Focus states com outline customizado
  - Labels explícitos com acessibilidade
  - Feedback visual (válido/inválido)

```html
<div class="form-group">
  <label for="input-name" class="form-label">Nome</label>
  <input id="input-name" type="text" class="form-input" />
  <span class="form-error" role="alert">Campo obrigatório</span>
</div>
```

### Modais & Overlays
- ❌ **Ausente:** Sistema de modais
- 🎯 **Adicionar:**
  - Backdrop com fade-in
  - Modal com slide-up animation
  - Close button com ESC key handling
  - Focus trap (acessibilidade)

```html
<dialog class="modal" open>
  <div class="modal-backdrop"></div>
  <div class="modal-content">
    <button class="modal-close" aria-label="Fechar">✕</button>
    <h2>Título</h2>
    <p>Conteúdo</p>
  </div>
</dialog>
```

### Toasts & Notificações
- ❌ **Ausente:** Sistema de notificações
- 🎯 **Implementar:**
  - Toast messages (top-right, bottom-left, etc.)
  - Tipos: success, error, warning, info
  - Auto-dismiss com progress bar
  - Stack automático

---

## 🎬 Animações & Transições

### Princípios
- ✅ **Velocidade:** 200ms default, 400ms para modals
- 🎯 **Easing:** 
  - `ease-out` para entrada (rápido no início)
  - `ease-in` para saída (lento no final)
  - `cubic-bezier(0.34, 1.56, 0.64, 1)` para spring-like

### Exemplos
```css
/* Fade + Scale */
.card {
  animation: fadeInScale 200ms ease-out;
}

@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

/* Slide + Fade */
.modal-content {
  animation: slideUp 300ms ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## 🎛️ Interatividade & Estados

### Hover States
- ✅ **Parcial:** Alguns elementos
- 🎯 **Padronizar:**
  - Feedback visual imediato (< 200ms)
  - Mudanças de cor, sombra, ou scale
  - Cursor apropriado (pointer, wait, etc.)

### Focus States
- ✅ **Existe:** Focus ring genérico
- 🎯 **Melhorar:**
  - Focus visible para keyboard navigation
  - Outline com 3px offset
  - Cores acessíveis (contrast >= 3:1)

```css
button:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Loading States
- ❌ **Ausente:** Spinners, skeletons
- 🎯 **Adicionar:**
  - SVG spinner animado
  - Skeleton screens para dados async
  - Button loading state (texto + spinner)

---

## 📱 Responsividade

### Breakpoints (Mobile-First)
```css
/* Mobile: 0–480px (default) */
/* Tablet: 480px–768px */
@media (min-width: 480px) { ... }

/* Desktop: 768px+ */
@media (min-width: 768px) { ... }
```

### Tipografia Responsiva
```css
/* Mobile: 18px */
h1 { font-size: 1.5rem; }

/* Desktop: 32px */
@media (min-width: 768px) {
  h1 { font-size: 2rem; }
}
```

### Layout Grid
- ✅ **Existe:** `.grid.c2`, `.grid.c3`
- 🎯 **Expandir:**
  - Auto-layout responsivo (gap dinâmico)
  - Subgrid support
  - 12-column grid option

```css
.grid {
  display: grid;
  gap: clamp(16px, 4vw, 32px);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
```

---

## ♿ Acessibilidade (WCAG 2.1 AA)

### Já Implementado
- ✅ Semântica HTML (`<button>`, `<table>`, `<nav>`)
- ✅ Alt text em imagens
- ✅ Estrutura de heading lógica
- ✅ Dark mode support

### Melhorias Necessárias
- 🎯 **ARIA labels:** `aria-label`, `aria-describedby` onde necessário
- 🎯 **Focus management:** Tab order lógico, focus traps em modais
- 🎯 **Contraste:** Validar todos os textos (4.5:1 mínimo)
- 🎯 **Redução de movimento:** `prefers-reduced-motion`
- 🎯 **Skip links:** Link para pular header/nav

```html
<a href="#main-content" class="skip-link">Pular para conteúdo principal</a>
```

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0s !important; transition-duration: 0s !important; }
}
```

---

## 📊 Visualizações (Gráficos SVG)

### Já Implementado
- ✅ Gráficos SVG customizados no `core.js`
- ✅ Tooltips ao hover
- ✅ Formatação brasileira (pontos/vírgulas)

### Melhorias
- 🎯 **Legends interativas:** Click para filtrar séries
- 🎯 **Zoom/Pan:** Para gráficos densos
- 🎯 **Exportação:** PNG/SVG do gráfico
- 🎯 **Animação de entrada:** Linhas/barras appear com easing
- 🎯 **Cores customizáveis:** Por papel/instituição

```javascript
// Exemplo de animação de entrada
chart.animate = {
  duration: 600,
  easing: 'easeOut',
  delay: 0
};
```

---

## 🔍 Performance & Otimizações

### Atualmente
- ✅ Nenhuma dependência externa (offline-ready)
- ✅ Arquivo CSS único (~50KB)
- ✅ JavaScript modular em `core.js`

### Melhorias
- 🎯 **CSS minificado:** Reduzir para ~30KB
- 🎯 **Lazy loading:** Gráficos renderizados on-scroll
- 🎯 **Font optimization:** `font-display: swap`
- 🎯 **Critical CSS:** Inline styles para above-the-fold

### Métricas
- Core Web Vitals target:
  - **LCP (Largest Contentful Paint):** < 2.5s
  - **FID (First Input Delay):** < 100ms
  - **CLS (Cumulative Layout Shift):** < 0.1

---

## 🗺️ Roadmap Priorizado

### Fase 1 (v2.3) — Design System
1. CSS tokens explícitos (cores, tipografia, espaçamento)
2. Variantes de botão (primary, secondary, outline, ghost)
3. Tabela com zebra striping + hover
4. **Esforço:** 4h | **Impacto:** Alto

### Fase 2 (v2.4) — Componentes
1. Inputs & formulários
2. Modais/overlays
3. Toasts & notificações
4. **Esforço:** 8h | **Impacto:** Médio-Alto

### Fase 3 (v2.5) — Interatividade
1. Animações (fade, slide, scale)
2. Loading states & skeletons
3. Focus management & ARIA
4. **Esforço:** 6h | **Impacto:** Médio

### Fase 4 (v2.6+) — Avançado
1. Gráficos interativos (zoom/pan)
2. Responsividade refinada (mobile-first)
3. Performance (lazy loading, minificação)
4. **Esforço:** 10h+ | **Impacto:** Médio

---

## 📚 Referências

- **shadcn/ui:** [ui.shadcn.com](https://ui.shadcn.com/) — Design tokens, componentes
- **Web.dev:** [web.dev/learn/css](https://web.dev/learn/css/) — CSS moderno
- **WCAG 2.1:** [w3.org/WAI/WCAG21](https://www.w3.org/WAI/WCAG21/quickref/) — Acessibilidade
- **MDN:** [mdn.web.docs](https://mdn.web.docs) — Referência técnica
- **Material Design:** [material.io/design](https://material.io/design/) — Princípios

---

## 🎯 Próximos Passos

1. **Revisar** este roadmap com time
2. **Priorizar** por impacto/esforço
3. **Clonar issues** para cada feature (GitHub)
4. **Criar branch** por feature (`feature/design-tokens`, etc.)
5. **Iterar** com feedback visual

---

**Último update:** 18/08/2026 · Autor: Claude Code · Status: 🟢 Ativo
