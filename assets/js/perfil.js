/* ============================================================
   perfil.js — REGISTRO DE FATOS DO TITULAR (fonte única)
   ------------------------------------------------------------
   Mesmo protocolo dos dados de mercado aplicado à biografia: toda
   afirmação publicada sobre a carreira tem (a) uma fonte nomeada,
   (b) um nível de confiabilidade e (c) uma marca explícita quando
   NÃO existe resultado quantificado divulgável.

   Nenhuma página deve escrever um fato de carreira "à mão": tudo
   sai daqui. Isso permite que validacao-perfil.html recalcule os
   checks e acuse qualquer afirmação órfã de fonte.

   HIERARQUIA DE FONTES (biografia)
   -------------------------------
   D1  Documento oficial exportado   — export do perfil LinkedIn do titular
   D2  Documento preparado pelo titular — currículos e cartas em .docx
   D3  Declaração direta do titular   — briefing ao construir este site
   D4  Verificável publicamente       — código e páginas neste repositório

   Níveis 1 e 4 são conferíveis por terceiros. Níveis 2 e 3 dependem
   de confirmação em entrevista ou de comprovante — e são marcados
   como tal na página de validação.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- controles de privacidade -------------------------------
     O site é público. Estes interruptores decidem o que aparece nas
     páginas e no material baixável. Mudar aqui muda em todo lugar.  */
  const PRIVACIDADE = {
    telefone: { publicar_site: false, publicar_curriculo: true },
    endereco: { publicar_site: false, publicar_curriculo: false },
    pcd:      { publicar_site: false, publicar_curriculo: true },
  };

  /* ---------- documentos-fonte ---------------------------------- */
  const FONTES = {
    LI: {
      id: "LI",
      doc: "Export do perfil do LinkedIn (PDF, 3 páginas)",
      origem: "LinkedIn — perfil do titular",
      data: "ago/2026",
      classe: "D1",
      nota: "Documento gerado pela própria plataforma a partir do perfil mantido pelo titular.",
    },
    CV_B3: {
      id: "CV_B3",
      doc: "Currículo — Analista de Produtos de Mercado de Capitais (.docx)",
      origem: "Titular",
      data: "ago/2026",
      classe: "D2",
      nota: "Currículo preparado pelo titular para candidatura real.",
    },
    CV_EY: {
      id: "CV_EY",
      doc: "Currículo — Consultor de Riscos Financeiros (.docx)",
      origem: "Titular",
      data: "ago/2026",
      classe: "D2",
      nota: "Currículo preparado pelo titular para candidatura real.",
    },
    CARTA_EY: {
      id: "CARTA_EY",
      doc: "Carta de apresentação — Consultor de Riscos Financeiros (.docx)",
      origem: "Titular",
      data: "10/08/2026",
      classe: "D2",
      nota: "Referência: req. 1732863, EY São Paulo JK.",
    },
    BRIEF: {
      id: "BRIEF",
      doc: "Briefing do titular para construção deste portfólio",
      origem: "Titular",
      data: "18/08/2026",
      classe: "D3",
      nota: "Declaração direta, sem documento comprobatório anexado.",
    },
    REPO: {
      id: "REPO",
      doc: "Código-fonte e páginas deste portfólio",
      origem: "github.com/thgteixeiranascimento-bit/Portf-lio",
      data: "18/08/2026",
      classe: "D4",
      nota: "Verificável por qualquer pessoa: o artefato é o próprio site.",
    },
    PARECER: {
      id: "PARECER",
      doc: "Parecer externo de avaliação do portfólio (PDF)",
      origem: "Avaliação independente contratada pelo titular",
      data: "ago/2026",
      classe: "D3",
      nota: "Usado para reestruturar a apresentação; não é fonte de fato biográfico.",
    },
  };

  /* ---------- identidade ---------------------------------------- */
  const IDENTIDADE = {
    nome: "Thiago Teixeira Nascimento",
    titulo: "Analista de FP&A e Planejamento Financeiro",
    tituloEn: "FP&A and Financial Planning Analyst",
    subtitulo: "Orçamento, Forecast e Análise de Variações · Modelagem Financeira · Risco de Crédito · Power BI, Excel Avançado, SQL e Python",
    subtituloEn: "Budgeting, Forecasting and Variance Analysis · Financial Modelling · Credit Risk · Power BI, Advanced Excel, SQL and Python",
    cidade: "Campinas, São Paulo, Brasil",
    email: "thgteixeiranascimento@gmail.com",
    telefone: "+55 (19) 98326-6110",
    linkedin: "https://www.linkedin.com/in/thiago-teixeira-nascimento-03a3961a3",
    linkedinLabel: "linkedin.com/in/thiago-teixeira-nascimento-03a3961a3",
    github: "https://github.com/thgteixeiranascimento-bit/Portf-lio",
    githubLabel: "github.com/thgteixeiranascimento-bit/Portf-lio",
    site: "https://thgteixeiranascimento-bit.github.io/Portf-lio/",
    pcd: "Pessoa com Deficiência (PcD)",
    fonte: ["LI", "CV_B3", "CV_EY"],
  };

  /* ---------- posicionamento (o pitch de 8 segundos) ------------- */
  const PITCH = {
    headline: "Economista que transforma divulgação financeira em decisão — com fonte, check aritmético e lacuna declarada.",
    headlineEn: "Economist who turns financial disclosure into decisions — with sourcing, arithmetic checks and declared gaps.",
    /* versão curta: primeira dobra da home, onde cada linha compete com o CTA */
    resumo_curto:
      "Economista pela PUC-Campinas. Base contábil construída auditando instituições financeiras na EY " +
      "(IFRS e BR GAAP); prática atual em modelagem estatística, indicadores e reporting gerencial no Agibank. " +
      "Abaixo, a prova executável — não a promessa.",
    resumo_curtoEn:
      "Economist (PUC-Campinas). Accounting foundation built auditing financial institutions at EY " +
      "(IFRS and BR GAAP); current practice in statistical modelling, KPIs and management reporting at Agibank. " +
      "Below, the executable proof — not the promise.",
    resumo:
      "Economista pela PUC-Campinas, atuo na interseção entre finanças, dados e planejamento. " +
      "Base contábil construída em auditoria externa de instituições financeiras na EY (IFRS e BR GAAP) e " +
      "prática atual em modelagem estatística, indicadores e reporting gerencial no Agibank. " +
      "Este portfólio é a prova executável: dez estudos sobre demonstrações públicas reais de cinco instituições, " +
      "três ferramentas de cálculo próprias e uma camada de governança com checks recalculados no navegador.",
    resumoEn:
      "Economist (PUC-Campinas) working at the intersection of finance, data and planning. " +
      "Accounting foundation built in external audit of financial institutions at EY (IFRS and BR GAAP), " +
      "with current practice in statistical modelling, KPIs and management reporting at Agibank. " +
      "This portfolio is the executable proof: ten studies on real public financial statements from five institutions, " +
      "three proprietary calculation tools and a governance layer with checks recalculated in the browser.",
    /* Três provas — cada uma com link verificável e sem número inventado. */
    provas: [
      {
        n: "5",
        lbl: "instituições financeiras analisadas",
        lblEn: "financial institutions analysed",
        sub: "Nu Holdings, Agibank, Itaú, Bradesco e Santander Brasil, sobre releases, DFs IFRS e atas do Copom.",
        subEn: "Nu Holdings, Agibank, Itaú, Bradesco and Santander Brasil, from releases, IFRS statements and Copom minutes.",
        href: "analises/bancos-2026.html",
        cta: "Ver análise setorial",
        ctaEn: "See sector analysis",
        fonte: "REPO",
      },
      {
        n: "182",
        lbl: "checks recalculados no navegador",
        lblEn: "checks recalculated in the browser",
        sub: "147 nos estudos sobre dados públicos, 23 nas ferramentas próprias e 12 na validação do meu próprio currículo — com as divergências documentadas, não escondidas.",
        subEn: "147 across the public-data studies, 23 in the proprietary tools and 12 validating my own résumé — with divergences documented, not hidden.",
        href: "metodologia.html",
        cta: "Ver protocolo",
        ctaEn: "See protocol",
        fonte: "REPO",
      },
      {
        n: "13",
        lbl: "modelos interativos publicados",
        lblEn: "interactive models published",
        sub: "Dez estudos sobre dados públicos e três ferramentas de cálculo construídas do zero, todas em JavaScript sem dependências.",
        subEn: "Ten studies on public data and three calculation tools built from scratch, all in dependency-free JavaScript.",
        href: "simuladores/index.html",
        cta: "Abrir estudos",
        ctaEn: "Open studies",
        fonte: "REPO",
      },
    ],
    /* Endereça proativamente a pergunta "por que júnior/pleno?" */
    nota_senioridade:
      "Busco posição estruturada em FP&A, Planejamento Financeiro, Controladoria ou Riscos no setor financeiro, " +
      "onde a profundidade analítica demonstrada aqui opere em ritmo e governança de time.",
    nota_senioridadeEn:
      "Seeking a structured position in FP&A, Financial Planning, Controllership or Risk in the financial sector, " +
      "where the analytical depth demonstrated here operates within a team's rhythm and governance.",
    fonte: ["LI", "CV_B3", "CV_EY", "REPO"],
  };

  /* ---------- experiência profissional ---------------------------
     `entregas` guarda a redação já validada dos currículos do titular.
     `metrica` é deliberadamente null onde não existe número divulgável:
     a página de validação verifica que nenhuma entrega publique
     percentual ou valor sem fonte.                                  */
  const EXPERIENCIA = [
    {
      id: "agibank",
      empresa: "Agibank",
      cargo: "Assistente Administrativo — Processos e Melhoria Contínua",
      cargoEn: "Administrative Assistant — Process and Continuous Improvement",
      local: "Campinas, SP",
      inicio: "jan/2026",
      fim: "atual",
      fimEn: "present",
      atual: true,
      setor: "Instituição financeira",
      resumo:
        "Análise de dados, modelagem estatística e melhoria contínua de processos em banco digital, " +
        "com reporte à liderança e atuação integrada com Produto, Operações e Atendimento.",
      resumoEn:
        "Data analysis, statistical modelling and continuous process improvement at a digital bank, " +
        "reporting to leadership and working across Product, Operations and Customer Service.",
      entregas: [
        {
          t: "Modelagem estatística aplicada a risco e comportamento",
          tEn: "Statistical modelling applied to risk and behaviour",
          d: "Antecipou comportamentos de inadimplência, churn e cancelamento de produto por meio de modelos de regressão linear e logística (Python: pandas, NumPy, scikit-learn), convertendo a saída dos modelos em ações recomendadas às áreas donas do processo.",
          dEn: "Anticipated default, churn and product-cancellation behaviour through linear and logistic regression models (Python: pandas, NumPy, scikit-learn), converting model output into recommended actions for the process-owning teams.",
          metrica: null,
          fonte: ["CV_B3", "CV_EY", "LI"],
        },
        {
          t: "Estudos técnicos que precificam decisões antes da execução",
          tEn: "Technical studies that price decisions before execution",
          d: "Estimou, em minutos por atendimento e no custo financeiro correspondente, o aumento do TMO (tempo médio de operação) decorrente do lançamento do produto AGI+, construindo simuladores de cálculo que projetavam o TMO futuro a partir do início das vendas — antecipando à liderança a exposição operacional de uma iniciativa antes de sua execução.",
          dEn: "Estimated, in minutes per contact and in the corresponding financial cost, the increase in average handling time (AHT) arising from the launch of the AGI+ product, building calculation simulators that projected future AHT from the start of sales — giving leadership the operational exposure of an initiative before it was executed.",
          metrica: null,
          fonte: ["CV_B3", "CV_EY"],
        },
        {
          t: "Redução de rechamadas e do custo da Central de Atendimento",
          tEn: "Reduction of repeat calls and of Contact Centre cost",
          d: "Direcionou correções de processo e comunicação junto às áreas responsáveis ao mapear os direcionadores de cancelamento de optantes e os pontos de atrito geradores de rechamadas, priorizando as causas-raiz de maior impacto por meio de planilhas e relatórios em HTML.",
          dEn: "Directed process and communication fixes with the responsible teams by mapping cancellation drivers and the friction points generating repeat calls, prioritising the highest-impact root causes through spreadsheets and HTML reports.",
          metrica: null,
          fonte: ["CV_B3", "CV_EY", "BRIEF"],
        },
        {
          t: "Reporting gerencial auditável para a liderança",
          tEn: "Auditable management reporting for leadership",
          d: "Reduziu o esforço e o tempo de consolidação do reporte recorrente ao padronizar fluxos auditáveis a partir de Salesforce e Birdie e mantê-los em modelos de Excel avançado (tabelas dinâmicas, macros, Solver) e dashboards de Power BI usados pela liderança.",
          dEn: "Reduced the effort and time to consolidate recurring reporting by standardising auditable flows from Salesforce and Birdie and maintaining them in advanced Excel models (pivot tables, macros, Solver) and Power BI dashboards used by leadership.",
          metrica: null,
          fonte: ["CV_B3", "CV_EY", "LI"],
        },
        {
          t: "Confiabilidade de indicadores e taxonomia de dados",
          tEn: "Indicator reliability and data taxonomy",
          d: "Elevou a confiabilidade dos indicadores da operação, medida pela eliminação de categorias ambíguas e sobrepostas, ao reestruturar a taxonomia de tabulações e padronizar a lógica de classificação que sustenta o reporte da área.",
          dEn: "Raised the reliability of the operation's indicators, measured by the elimination of ambiguous and overlapping categories, by restructuring the tabulation taxonomy and standardising the classification logic underpinning the area's reporting.",
          metrica: null,
          fonte: ["CV_B3", "CV_EY"],
        },
        {
          t: "IA generativa aplicada ao processo analítico",
          tEn: "Generative AI applied to the analytical process",
          d: "Reduziu a variabilidade de conduta entre operadores e o retrabalho no atendimento participando da produção de roteiros operacionais elaborados com apoio de IA generativa, padronizando a orientação das equipes de linha de frente.",
          dEn: "Reduced behavioural variability between agents and rework in service by contributing to operational scripts produced with generative AI support, standardising guidance for front-line teams.",
          metrica: null,
          fonte: ["CV_B3", "CV_EY", "LI"],
        },
      ],
      stack: ["Python", "SQL", "Power BI (DAX)", "Excel avançado", "Salesforce", "Birdie", "HTML"],
      fonte: ["LI", "CV_B3", "CV_EY"],
    },
    {
      id: "ey",
      empresa: "EY (Ernst & Young)",
      cargo: "Trainee de Auditoria Externa",
      cargoEn: "External Audit Trainee",
      local: "Campinas e Região, SP",
      inicio: "dez/2024",
      fim: "abr/2025",
      fimEn: "Apr/2025",
      atual: false,
      setor: "Auditoria — Big Four, clientes do setor financeiro",
      resumo:
        "Auditoria externa de instituições financeiras em uma das Big Four, com reporte a stakeholders globais em inglês.",
      resumoEn:
        "External audit of financial institutions at a Big Four firm, reporting to global stakeholders in English.",
      entregas: [
        {
          t: "Análise de demonstrações financeiras sob IFRS e BR GAAP",
          tEn: "Financial statement analysis under IFRS and BR GAAP",
          d: "Revisou e validou demonstrações de resultado, balanços patrimoniais e demonstrações de fluxo de caixa quanto à aderência a IFRS e BR GAAP, aplicando critérios normativos a documentos e registros da companhia auditada.",
          dEn: "Reviewed and validated income statements, balance sheets and cash flow statements for adherence to IFRS and BR GAAP, applying regulatory criteria to the audited company's documents and records.",
          metrica: null,
          fonte: ["CV_B3", "CV_EY", "LI"],
        },
        {
          t: "Identificação de inconsistências e exposição a risco",
          tEn: "Identification of inconsistencies and risk exposure",
          d: "Sinalizou inconsistências e exposições a risco em clientes do setor financeiro ao conciliar e cruzar bases financeiras extensas, sob prazos de fechamento e engajamentos simultâneos.",
          dEn: "Flagged inconsistencies and risk exposures at financial-sector clients by reconciling and cross-checking extensive financial datasets, under closing deadlines and simultaneous engagements.",
          metrica: null,
          fonte: ["CV_B3", "CV_EY", "LI"],
        },
        {
          t: "Comunicação técnica com stakeholders globais",
          tEn: "Technical communication with global stakeholders",
          d: "Reportou achados e recomendações em inglês a stakeholders globais, atuando em equipes multidisciplinares e traduzindo evidência técnica em ponto de atenção acionável para o cliente.",
          dEn: "Reported findings and recommendations in English to global stakeholders, working in multidisciplinary teams and translating technical evidence into actionable points of attention for the client.",
          metrica: null,
          fonte: ["CV_B3", "CV_EY", "LI"],
        },
      ],
      stack: ["IFRS", "BR GAAP", "Excel avançado", "Inglês profissional"],
      fonte: ["LI", "CV_B3", "CV_EY"],
    },
    {
      id: "autonomo",
      empresa: "Consultoria financeira autônoma",
      cargo: "Consultor Financeiro",
      cargoEn: "Financial Consultant",
      local: "Campinas, SP",
      inicio: "jan/2023",
      fim: "dez/2024",
      fimEn: "Dec/2024",
      atual: false,
      setor: "Consultoria independente",
      resumo:
        "Modelagem financeira, análise de investimentos em renda fixa e apoio quantitativo à decisão para clientes pessoa física.",
      resumoEn:
        "Financial modelling, fixed-income investment analysis and quantitative decision support for individual clients.",
      entregas: [
        {
          t: "Modelagem financeira e construção de cenários",
          tEn: "Financial modelling and scenario building",
          d: "Construiu modelos e cenários financeiros, business plans e análises de rentabilidade com Excel avançado (macros, Solver) e raciocínio quantitativo aplicado à decisão do cliente.",
          dEn: "Built financial models and scenarios, business plans and profitability analyses with advanced Excel (macros, Solver) and quantitative reasoning applied to the client's decision.",
          metrica: null,
          fonte: ["LI", "CV_B3"],
        },
        {
          t: "Análise de investimentos com risco versus retorno explícito",
          tEn: "Investment analysis with explicit risk versus return",
          d: "Avaliou carteiras de renda fixa (Tesouro Direto) acompanhando indicadores de mercado e métricas de retorno e risco, aplicando conceitos de risco de mercado e liquidez, e subsidiou decisões de alocação ponderando explicitamente retorno contra risco.",
          dEn: "Assessed fixed-income portfolios (Tesouro Direto) tracking market indicators and return and risk metrics, applying market risk and liquidity concepts, and supported allocation decisions explicitly weighing return against risk.",
          metrica: null,
          fonte: ["LI", "CV_B3", "CV_EY"],
        },
        {
          t: "Tradução de análise quantitativa para decisor não técnico",
          tEn: "Translating quantitative analysis for non-technical decision-makers",
          d: "Elaborou business plans, análises de rentabilidade e apresentações executivas, convertendo achados quantitativos em recomendações acionáveis para públicos não técnicos.",
          dEn: "Produced business plans, profitability analyses and executive presentations, converting quantitative findings into actionable recommendations for non-technical audiences.",
          metrica: null,
          fonte: ["LI", "CV_B3", "CV_EY"],
        },
      ],
      stack: ["Excel avançado", "Renda fixa", "Business plan"],
      fonte: ["LI", "CV_B3", "CV_EY"],
    },
    {
      id: "econotura",
      empresa: "Econotura",
      cargo: "Colunista",
      cargoEn: "Columnist",
      local: "Remoto",
      inicio: "fev/2023",
      fim: "fev/2024",
      fimEn: "Feb/2024",
      atual: false,
      setor: "Publicação de economia",
      resumo: "Produção de conteúdo analítico de economia para público não especialista.",
      resumoEn: "Analytical economics content for a non-specialist audience.",
      entregas: [],
      stack: [],
      fonte: ["LI"],
      secundaria: true,
    },
  ];

  /* ---------- formação ------------------------------------------ */
  const FORMACAO = [
    {
      instituicao: "Pontifícia Universidade Católica de Campinas (PUC-Campinas)",
      curso: "Bacharelado em Ciências Econômicas",
      cursoEn: "Bachelor's degree in Economics",
      periodo: "2018 – 2023",
      destaque:
        "1º lugar em competição universitária de simulação empresarial (2º semestre de 2022) — liderou a estratégia comercial e financeira e a tomada de decisão sob pressão de tempo.",
      destaqueEn:
        "1st place in a university business-simulation competition (2nd half of 2022) — led commercial and financial strategy and decision-making under time pressure.",
      destaqueFonte: ["CV_B3", "CV_EY"],
      destaqueNota: "Colocação declarada pelo titular; o export do LinkedIn registra a participação no torneio, não a classificação.",
      fonte: ["LI", "CV_B3", "CV_EY"],
    },
  ];

  const CERTIFICACOES = [
    {
      nome: "Fluency Academy — formação em idiomas",
      periodo: "—",
      fonte: ["LI"],
      nota: "Registrada no export do LinkedIn como \"Fluency Acabemy\" (grafia do documento-fonte); publicada aqui com a grafia corrigida do nome comercial.",
    },
  ];

  /* ---------- idiomas -------------------------------------------- */
  const IDIOMAS = [
    { lingua: "Português", nivel: "Nativo", nivelEn: "Native", fonte: ["CV_B3", "CV_EY"] },
    {
      lingua: "Inglês",
      nivel: "Fluente — uso profissional com stakeholders globais",
      nivelEn: "Fluent — professional use with global stakeholders",
      fonte: ["LI", "CV_B3", "CV_EY"],
      nota: "Registrado como \"Full Professional\" no export do LinkedIn e comprovado na prática pelo reporte em inglês na EY.",
    },
    { lingua: "Francês", nivel: "Intermediário", nivelEn: "Intermediate", fonte: ["LI", "CV_B3"] },
    { lingua: "Espanhol", nivel: "Básico", nivelEn: "Basic", fonte: ["LI", "CV_B3"] },
  ];

  /* ---------- competências técnicas ------------------------------
     `evidencia` aponta para onde a competência é demonstrável. Toda
     competência sem evidência é sinalizada pelo conselho de validação
     como "declarada, não demonstrada neste portfólio" — em vez de
     ser apresentada como se fosse comprovada.                       */
  const COMPETENCIAS = [
    {
      grupo: "FP&A e Planejamento Financeiro",
      grupoEn: "FP&A and Financial Planning",
      itens: [
        { k: "Orçamento (budget) e forecast", evidencia: "simuladores/orcamento.html" },
        { k: "Análise de variações — budget × realizado", evidencia: "simuladores/orcamento.html" },
        { k: "Rolling forecast por drivers", evidencia: "simuladores/rolling-forecast.html" },
        { k: "Modelagem financeira e construção de cenários", evidencia: "simuladores/tres-demonstracoes.html" },
        { k: "Análise de rentabilidade e unit economics", evidencia: "simuladores/capex-evte.html" },
        { k: "KPIs e reporting gerencial", evidencia: "kpis.html" },
        { k: "Business partnering com áreas de negócio", evidencia: null },
      ],
      fonte: ["LI", "CV_B3", "CV_EY"],
    },
    {
      grupo: "Contabilidade e demonstrações financeiras",
      grupoEn: "Accounting and financial statements",
      itens: [
        { k: "DRE, balanço patrimonial e demonstração dos fluxos de caixa (DFC)", evidencia: "simuladores/tres-demonstracoes.html" },
        { k: "IFRS", evidencia: "simuladores/fluxo-de-caixa.html" },
        { k: "BR GAAP", evidencia: null },
        { k: "Controladoria — reconciliação contábil × gerencial e padronização de fechamento", evidencia: "simuladores/orcamento.html" },
        { k: "IFRS 9 — perda esperada (ECL) por estágio", evidencia: "simuladores/riscos.html" },
      ],
      fonte: ["LI", "CV_B3", "CV_EY"],
    },
    {
      grupo: "Risco de crédito e regulatório",
      grupoEn: "Credit and regulatory risk",
      itens: [
        { k: "Modelagem preditiva de inadimplência e churn (regressão logística)", evidencia: null },
        { k: "Conformidade regulatória e compliance contábil — aderência a normativos", evidencia: null },
        { k: "NPL, cobertura e safras de crédito", evidencia: "simuladores/riscos.html" },
        { k: "Índice de Basileia e capital regulatório", evidencia: "simuladores/ma.html" },
        { k: "Concentração de carteira (HHI)", evidencia: "simuladores/portfolio.html" },
        { k: "Teste de estresse com premissas declaradas", evidencia: "simuladores/riscos.html" },
      ],
      fonte: ["CV_EY", "LI"],
    },
    {
      grupo: "Valuation e mercado de capitais",
      grupoEn: "Valuation and capital markets",
      itens: [
        { k: "P/VPA justificado (Gordon) e múltiplos de mercado", evidencia: "simuladores/valuation.html" },
        { k: "VPL, TIR e análise de sensibilidade", evidencia: "simuladores/capex-evte.html" },
        { k: "Estrutura de capital e operações societárias (IPO)", evidencia: "simuladores/ma.html" },
        { k: "Renda fixa e renda variável — Tesouro Direto, retorno e risco", evidencia: null },
        { k: "Funding, captação e liquidez (LDR)", evidencia: "simuladores/capital-de-giro.html" },
        { k: "Matemática financeira — juros compostos, Price e SAC", evidencia: "simuladores/calculadora-juros.html" },
      ],
      fonte: ["CV_B3", "REPO"],
    },
    {
      grupo: "Dados, BI e automação",
      grupoEn: "Data, BI and automation",
      itens: [
        { k: "Power BI (DAX, dashboards interativos)", evidencia: null },
        { k: "Excel avançado (tabelas dinâmicas, macros, Solver, PROCV/XLOOKUP)", evidencia: null },
        { k: "SQL", evidencia: null },
        { k: "Python (pandas, NumPy, scikit-learn)", evidencia: "automation/python/cvm_dados_abertos.py" },
        { k: "R", evidencia: null },
        { k: "JavaScript e visualização SVG própria", evidencia: "assets/js/core.js" },
        { k: "Salesforce e Birdie", evidencia: null },
        { k: "Automação de relatórios com IA generativa e simuladores de cálculo", evidencia: "simuladores/rechamadas.html" },
      ],
      fonte: ["LI", "CV_B3", "CV_EY"],
    },
    {
      grupo: "Governança analítica",
      grupoEn: "Analytical governance",
      itens: [
        { k: "Rastreabilidade de fontes por nível de confiabilidade", evidencia: "metodologia.html" },
        { k: "Protocolo antialucinação — fato × premissa × estimativa", evidencia: "metodologia.html" },
        { k: "Checks automáticos de integridade", evidencia: "metodologia.html" },
        { k: "Declaração de lacunas, divergências e conflito de interesse", evidencia: "validacao-perfil.html" },
      ],
      fonte: ["REPO"],
    },
  ];

  /* ---------- projetos próprios ---------------------------------
     Distinção essencial e declarada: o que é ARTEFATO PÚBLICO deste
     portfólio (verificável agora, no navegador) e o que é EXPERIÊNCIA
     PROFISSIONAL interna (declarada, sem dado da empresa aqui).     */
  const PROJETOS = [
    {
      id: "calc-juros",
      nome: "Calculadora de juros e amortização",
      nomeEn: "Interest and amortisation calculator",
      href: "simuladores/calculadora-juros.html",
      tipo: "Ferramenta própria",
      tipoEn: "Proprietary tool",
      problema:
        "Conversão de taxas e comparação entre sistemas de amortização são fonte recorrente de erro operacional — a taxa mensal não vira anual por multiplicação, e Price e SAC não produzem o mesmo custo total.",
      problemaEn:
        "Rate conversion and comparison between amortisation systems are a recurring source of operational error — a monthly rate does not become annual by multiplication, and Price and SAC do not produce the same total cost.",
      entrega:
        "Calculadora que resolve juros simples e compostos, converte taxas por equivalência, monta o cronograma completo em Price e SAC e verifica cada resultado contra identidades aritméticas independentes.",
      entregaEn:
        "A calculator that solves simple and compound interest, converts rates by equivalence, builds the full Price and SAC schedule and verifies each result against independent arithmetic identities.",
      competencias: ["Matemática financeira", "Amortização", "Modelagem", "JavaScript"],
      fonte: ["BRIEF", "REPO"],
      publico: true,
    },
    {
      id: "antecipacao",
      nome: "Calculadora de antecipação de parcelas",
      nomeEn: "Early installment settlement calculator",
      href: "simuladores/antecipacao-parcelas.html",
      tipo: "Ferramenta própria",
      tipoEn: "Proprietary tool",
      problema:
        "Ao antecipar parcelas, o valor devido é o valor presente das parcelas remanescentes — e não a soma nominal. Calcular pelo caminho errado cobra do cliente um valor que não corresponde ao contrato e gera retrabalho, contestação e rechamada.",
      problemaEn:
        "When settling installments early, the amount due is the present value of the remaining installments — not their nominal sum. Using the wrong method charges the customer an amount that does not match the contract and generates rework, disputes and repeat calls.",
      entrega:
        "Ferramenta que aplica o desconto racional exigido pela regulação de crédito, contrasta com os dois erros mais comuns (soma nominal e desconto comercial linear) e quantifica, em reais e em percentual, o erro evitado em cada cenário.",
      entregaEn:
        "A tool applying the rational discount required by credit regulation, contrasting it with the two most common errors (nominal sum and linear commercial discount) and quantifying, in currency and percentage, the error avoided in each scenario.",
      competencias: ["Valor presente", "Desconto racional", "Redução de erro operacional", "Experiência do cliente"],
      fonte: ["BRIEF", "REPO"],
      publico: true,
    },
    {
      id: "rechamadas",
      nome: "Modelo de custo de rechamadas na Central de Atendimento",
      nomeEn: "Contact Centre repeat-call cost model",
      href: "simuladores/rechamadas.html",
      tipo: "Ferramenta própria",
      tipoEn: "Proprietary tool",
      problema:
        "Rechamada é custo puro: o mesmo cliente volta porque a primeira interação não resolveu. O custo raramente é medido em reais, o que impede priorizar as causas-raiz por retorno financeiro.",
      problemaEn:
        "A repeat call is pure cost: the same customer returns because the first interaction did not resolve the issue. That cost is rarely measured in currency, which prevents prioritising root causes by financial return.",
      entrega:
        "Modelo que converte volume, taxa de rechamada, TMO e custo por minuto em custo anual da operação, decompõe o custo por causa-raiz e simula o retorno de cada iniciativa de correção — a lógica de priorização que sustenta um plano de redução.",
      entregaEn:
        "A model converting volume, repeat-call rate, AHT and cost per minute into the operation's annual cost, breaking the cost down by root cause and simulating the return of each corrective initiative — the prioritisation logic underpinning a reduction plan.",
      competencias: ["Modelagem de custo operacional", "Priorização por impacto", "Melhoria contínua", "Business case"],
      fonte: ["BRIEF", "REPO"],
      publico: true,
      nota_confidencialidade:
        "Modelo genérico com parâmetros de demonstração definidos pelo usuário. Não contém volume, custo, taxa ou qualquer dado operacional de empregador — nenhuma informação interna, confidencial ou não pública foi utilizada.",
    },
  ];

  /* ---------- divergências entre documentos-fonte ----------------
     O mesmo tratamento dado às divergências entre releases e DFs:
     registrar, não silenciar.                                       */
  const DIVERGENCIAS = [
    {
      n: 1,
      tema: "Data de início no Agibank",
      achado:
        "O export do LinkedIn registra “janeiro de 2026 – Present (8 meses)”, coerente com agosto de 2026, e os dois currículos preparados pelo titular registram “jan/2026 – atual”. Versões anteriores deste site declaravam “desde 2025”.",
      tratamento:
        "Adotado jan/2026 em todas as superfícies, por concordância de três documentos-fonte independentes contra uma redação anterior sem documento de apoio. A declaração de conflito de interesse passou a citar o vínculo como atual, sem afirmar ano contestado.",
      status: "Corrigido",
      fonte: ["LI", "CV_B3", "CV_EY"],
      confirmar: true,
    },
    {
      n: 2,
      tema: "Conclusão da graduação",
      achado:
        "O export do LinkedIn traz duas matrículas na PUC-Campinas para o mesmo curso: uma com término em março de 2023 e outra em dezembro de 2022.",
      tratamento:
        "Publicado como “2018 – 2023”, adotando a data mais tardia (colação/conclusão formal) e mantendo a divergência registrada em vez de escolher silenciosamente.",
      status: "Declarado",
      fonte: ["LI"],
      confirmar: true,
    },
    {
      n: 3,
      tema: "Período sem vínculo descrito (mai/2025 – dez/2025)",
      achado:
        "Entre o fim da EY (abr/2025) e o início registrado no Agibank (jan/2026) há oito meses não descritos em nenhum documento-fonte.",
      tratamento:
        "Lacuna declarada, não preenchida. Nenhuma atividade foi inventada para cobrir o intervalo; se houver vínculo, curso ou projeto no período, cabe ao titular informar para registro.",
      status: "Lacuna declarada",
      fonte: ["LI"],
      confirmar: true,
    },
    {
      n: 4,
      tema: "Classificação da competição universitária",
      achado:
        "Os currículos declaram 1º lugar em competição de simulação empresarial; o export do LinkedIn registra a participação no torneio (ago–dez/2022), sem citar classificação.",
      tratamento:
        "Publicado com atribuição explícita ao titular (nível D2) e nota indicando que a colocação não consta do documento da plataforma.",
      status: "Declarado",
      fonte: ["LI", "CV_B3", "CV_EY"],
      confirmar: false,
    },
    {
      n: 5,
      tema: "Grafia de certificação",
      achado: "O export do LinkedIn traz “Fluency Acabemy”, com erro de digitação evidente no nome comercial.",
      tratamento: "Publicado como “Fluency Academy”, com a grafia original registrada nesta tabela.",
      status: "Corrigido",
      fonte: ["LI"],
      confirmar: false,
    },
    {
      n: 6,
      tema: "Nomenclatura do cargo atual",
      achado:
        "O export do LinkedIn registra o cargo como “Assistente administrativo”; os currículos ampliam para “Assistente Administrativo — Processos e Melhoria Contínua”.",
      tratamento:
        "Adotada a forma dos currículos por descrever o escopo real das entregas, mantendo o título formal do documento da plataforma visível nesta tabela.",
      status: "Declarado",
      fonte: ["LI", "CV_B3", "CV_EY"],
      confirmar: false,
    },
    {
      n: 7,
      tema: "Ferramentas antes descritas como “em desenvolvimento”",
      achado:
        "Versões anteriores deste site declaravam Power BI, Excel/VBA, Power Query e Power Pivot como “ainda não incluídos”, o que um leitor podia interpretar como ausência de competência — enquanto os documentos-fonte registram uso profissional de Power BI (DAX) e Excel avançado.",
      tratamento:
        "Separadas duas coisas distintas: a competência profissional (declarada, com fonte) e o artefato publicado neste portfólio (ausente). O que falta é o artefato, não a competência.",
      status: "Corrigido",
      fonte: ["LI", "CV_B3", "CV_EY", "PARECER"],
      confirmar: false,
    },
  ];

  /* ---------- alvos de candidatura (variantes da carta) ---------- */
  const VAGAS = [
    {
      id: "fpa",
      rotulo: "FP&A / Planejamento Financeiro",
      rotuloEn: "FP&A / Financial Planning",
      titulo: "Analista de FP&A e Planejamento Financeiro",
      tituloEn: "FP&A and Financial Planning Analyst",
      foco: "orçamento, forecast, análise de variações e reporting gerencial",
      chaves: [
        "FP&A", "Orçamento", "Budget", "Forecast", "Rolling forecast", "Budget × realizado",
        "Análise de variações", "Modelagem financeira", "DRE", "Fluxo de caixa", "KPIs",
        "Power BI", "DAX", "Excel avançado", "SQL", "Python", "Controladoria",
      ],
    },
    {
      id: "riscos",
      rotulo: "Riscos Financeiros / Risco de Crédito",
      rotuloEn: "Financial Risk / Credit Risk",
      titulo: "Consultor de Riscos Financeiros",
      tituloEn: "Financial Risk Consultant",
      foco: "risco de crédito, modelagem regulatória e conformidade normativa",
      chaves: [
        "Risco de crédito", "Inadimplência", "NPL", "IFRS 9", "Perda esperada (ECL)",
        "Basileia", "Capital regulatório", "Regressão logística", "Modelagem econométrica",
        "Teste de estresse", "IFRS", "BR GAAP", "Auditoria", "Compliance", "Python", "SQL",
      ],
    },
    {
      id: "mercado",
      rotulo: "Mercado de Capitais / Produtos",
      rotuloEn: "Capital Markets / Products",
      titulo: "Analista de Produtos de Mercado de Capitais",
      tituloEn: "Capital Markets Products Analyst",
      foco: "análises quantitativas, estudos de mercado e produtos de renda fixa e variável",
      chaves: [
        "Mercado de capitais", "Renda fixa", "Renda variável", "Valuation", "Múltiplos",
        "P/VPA", "VPL", "TIR", "Risco versus retorno", "Estudos de mercado",
        "Análise quantitativa", "Power BI", "SQL", "Python", "Excel avançado",
      ],
    },
  ];

  /* ---------- palavras-chave para triagem (ATS) ------------------
     Vocabulário efetivamente usado em descrições de vaga do setor
     financeiro brasileiro. Cada termo só entra na lista se estiver
     ancorado em experiência declarada ou em artefato deste site.   */
  const ATS = [
    "FP&A", "Planejamento Financeiro", "Controladoria", "Orçamento", "Budget", "Forecast",
    "Rolling forecast", "Budget × Realizado", "Análise de Variações", "Modelagem Financeira",
    "Business Plan", "Valuation", "Múltiplos de mercado", "P/VPA", "VPL", "TIR", "Unit economics",
    "DRE", "Balanço Patrimonial", "Fluxo de Caixa", "DFC", "IFRS", "BR GAAP", "IFRS 9",
    "Perda Esperada (ECL)", "Risco de Crédito", "Inadimplência", "NPL", "Cobertura",
    "Índice de Basileia", "Capital Regulatório", "Teste de Estresse", "Funding", "LDR",
    "Auditoria Externa", "Compliance", "Governança", "Conciliação", "Rastreabilidade",
    "KPIs", "Reporting Gerencial", "Business Partner", "Power BI", "DAX", "Excel Avançado",
    "Tabelas Dinâmicas", "Macros", "Solver", "PROCV", "XLOOKUP", "SQL", "Python", "pandas",
    "NumPy", "scikit-learn", "R", "Regressão Linear", "Regressão Logística", "Churn",
    "Modelagem Preditiva", "Estatística", "Automação de Relatórios", "IA Generativa",
    "Salesforce", "Mercado de Capitais", "Renda Fixa", "Renda Variável", "Tesouro Direto",
    "Inglês Fluente", "Melhoria Contínua", "Causa-raiz", "TMO", "Central de Atendimento",
  ];

  window.PERFIL = {
    versao: "3.0",
    atualizado: "18/08/2026",
    PRIVACIDADE, FONTES, IDENTIDADE, PITCH, EXPERIENCIA, FORMACAO,
    CERTIFICACOES, IDIOMAS, COMPETENCIAS, PROJETOS, DIVERGENCIAS, VAGAS, ATS,
  };
})();
