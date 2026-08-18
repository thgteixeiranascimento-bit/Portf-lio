# Portf-lio — contexto para agentes

Site estático de portfólio (Finanças Corporativas, FP&A, Valuation, BI) servido pelo
GitHub Pages a partir da raiz do repositório. **Sem build e sem dependências externas**:
HTML/CSS/JavaScript puros, gráficos SVG próprios; Python 3 (biblioteca padrão) apenas em
`automation/`.

- Rodar localmente: `python3 -m http.server` na raiz → `http://localhost:8000`.
- Fonte única de dados: `assets/js/data.js` — os simuladores nunca trazem números
  digitados à mão; toda mudança de premissa passa por ali.
- Regra de integridade do projeto: os estudos usam a **Aurora Industrial S.A.**, empresa
  fictícia. Fato, premissa, estimativa e simulação são rotulados separadamente, e nenhum
  número entra sem fonte ou sem check. Ver `metodologia.html` e `docs/`.

## gstack (recommended)

This project uses [gstack](https://github.com/garrytan/gstack) for AI-assisted workflows.
Install it for the best experience:

```bash
git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup --team
```

Skills like /qa, /ship, /review, /investigate, and /browse become available after install.
Use /browse for all web browsing. Use ~/.claude/skills/gstack/... for gstack file paths.

## MCP Servers

### shadcn-ui-mcp-server

[shadcn-ui-mcp-server](https://github.com/Jpisnice/shadcn-ui-mcp-server) (MIT, by Jpisnice) —
Model Context Protocol server providing AI assistants with access to shadcn/ui v4 components,
blocks, demos, and source code (React, Svelte, Vue, React Native). Useful for rapid component
integration in design-heavy projects.

Quick start (requires Claude Code with MCP support):
```bash
# With GitHub token (recommended for higher rate limits)
npx @jpisnice/shadcn-ui-mcp-server --github-api-key ghp_your_token_here

# Or install via .mcpb file in Claude Desktop
# Download from: https://github.com/Jpisnice/shadcn-ui-mcp-server/releases
```

### 21st MCP (magic-mcp compatibility proxy)

[21st MCP](https://21st.dev/mcp) / [magic-mcp](https://github.com/21st-dev/magic-mcp) (ISC, by 21st) —
Model Context Protocol server for UI component generation, discovery, and refinement. Tools include
catalog search (components/themes/templates), UI generation with variants, and logo search. The
`magic-mcp` package is a compatibility proxy for the unified 21st MCP server.

Quick start:
```bash
# Install the 21st CLI (recommended)
npx @21st-dev/cli@latest init --client claude

# Or use the compatibility proxy
npx @21st-dev/magic API_KEY="your_api_key"

# Get an API key at https://21st.dev/mcp
```

## Skills & AI Agent Collections

### Vercel Agent Skills

[Agent Skills](https://github.com/vercel-labs/agent-skills) (by Vercel Labs) —
A curated collection of skills for AI coding agents covering performance optimization, React/Next.js best practices,
web design guidelines, writing handbook compliance, React Native patterns, and view transitions.
Packaged using the [Agent Skills](https://agentskills.io/) format.

Available skills:
- `vercel-optimize` — audit deployed Vercel projects for cost and performance
- `react-best-practices` — 40+ performance rules for React and Next.js (from Vercel Engineering)
- `web-design-guidelines` — 100+ accessibility, performance, and UX rules
- `writing-guidelines` — Vercel writing handbook with 80+ prose and docs rules
- `react-native-guidelines` — React Native and Expo best practices
- `react-view-transitions` — smooth animations using React View Transition API

Installation and usage via [skills.sh](https://skills.sh/) (Agent Skills registry).
