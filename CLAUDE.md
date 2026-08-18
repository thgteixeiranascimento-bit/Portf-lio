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
