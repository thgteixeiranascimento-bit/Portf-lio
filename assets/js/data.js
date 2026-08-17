/* ============================================================
   data.js — dataset central de DADOS PÚBLICOS REAIS
   ------------------------------------------------------------
   Todos os números abaixo foram extraídos de divulgações
   oficiais das próprias companhias e do Banco Central do Brasil
   (fontes primárias, identificadas e datadas no registro FONTES
   ao final). Nenhum número é inventado; lacunas são declaradas
   como null / "não fornecido".

   Convenções de unidade:
   - Nu Holdings: US$ milhões (US$ bi onde indicado) — a companhia
     reporta em dólares; valores do balanço IFRS convertidos de
     US$ mil para US$ milhões preservando 3 casas decimais.
   - Agi (Agibank): R$ milhões; valores das demonstrações IFRS
     convertidos de R$ mil para R$ milhões com 3 casas decimais.
   - Itaú / Bradesco / Santander Brasil: R$ milhões (R$ bi onde
     indicado), bases gerenciais divulgadas por cada banco.

   Ressalva de integridade: os documentos foram recebidos como
   conversões OCR/planilhas fornecidas pelo titular; a conferência
   contra os PDFs originais publicados permanece pendente e está
   declarada em metodologia.html e docs/fontes.md.
   ============================================================ */
window.REAL = (function () {
  "use strict";

  /* ================= COPOM / SELIC (Banco Central) ================= */
  const selic = {
    fontes: ["copom", "copom279"],
    decisoes: [
      { reuniao: "277ª", data: "17–18/03/2026", rotulo: "18/mar (277ª)", valor: 14.75 },
      { reuniao: "278ª", data: "28–29/04/2026", rotulo: "29/abr (278ª)", valor: 14.50 },
      { reuniao: "279ª", data: "16–17/06/2026", rotulo: "17/jun (279ª)", valor: 14.25 },
      { reuniao: "280ª", data: "04–05/08/2026", rotulo: "05/ago (280ª)", valor: 14.00 },
    ],
    nota280: { focus2026: 5.0, focus2027: 4.2, projCopom1T28: 3.2, balancoRiscos: "assimetria altista" },
    // Ata da 279ª reunião — fonte primária (PDF do BCB)
    ata279: {
      focus2026: 5.30, focus2027: 4.10,
      projRef2026: 5.2, projRef4T27: 3.7, projAnterior4T27: 3.5,
      ipcaLivres2026: 5.3, ipcaAdmin2026: 4.7,
      cambioRef: 5.10,
      balancoRiscos: "assimetria altista",
      convergenciaMeta: "1º trimestre de 2028 nas trajetórias julgadas mais adequadas",
      votacao: "unânime (7 membros)",
      trajetoriasAlternativas: "O Comitê debateu trajetórias com convergência no horizonte relevante, mas as descartou por exigirem variações abruptas e de grande magnitude na Selic, ausentes da Focus, do QPC e da precificação de mercado; preferiu trajetórias com pausa e retomada do ciclo, com convergência no 1T28.",
    },
  };

  /* ================= ITAÚ UNIBANCO (2T26) ================= */
  const itau = {
    fontes: ["itau2T26", "itauIFRS1S26"],
    moeda: "R$ mm (gerencial recorrente)",
    lucro1T: 12282, lucro2T: 12407, lucro1S: 24689,
    roe2T: 24.3, roeBrasil2T: 25.7,
    carteiraTotalBi: 1522.4, carteiraBrasilBi: 1269.4, carteiraLatamBi: 253.0, carteiraYoY: 9.6,
    margemClientes2T: 32557, custoCredito2T: 10139, dndj2T: 16728,
    cet1: 12.3, nivel1: 13.8,
    eficiencia1S: 37.3,
  };

  /* ================= BRADESCO (1T26) ================= */
  const bradesco = {
    fontes: ["bradesco1T26"],
    moeda: "R$ mm (recorrente)",
    lucro1T25: 5864, lucro4T25: 6516, lucro1T: 6811, deltaTt: 4.5,
    roae1T: 15.8, ieo1T: 46.9,
    margem1T: 20051, margemClientes: 19498, margemMercado: 553,
    pddExp1T: 9667, pddDeltaTt: 9.5,
    carteiraBi: 1090, carteiraYoY: 8.4,
    npl90: 4.2,
    cet1: 10.2, nivel1: 12.0, basileia: 14.9,
    /* --- 2T26: EXTRAÇÃO DOCUMENTAL (Relatório de Análise Econômica e Financeira 2T26) ---
       Promovido de relato (nível 3) para nível 1 em 16/08/2026, com duas correções
       relevantes em relação ao que havia sido relatado — ver metodologia, seção 5. */
    t2_26: {
      relatado: false, nivel: 1,
      lucroRecorrente: 7050, lucro1T26: 6811, lucro2T25: 6067, lucro1S26: 13861, lucro1S25: 11931,
      lucroDeltaTt: 3.5, lucroDeltaAa: 16.2,
      lucroContabil: 5030, // 1T26 contábil, após R$ 1.781 mm de eventos não recorrentes (PTI)
      roae: 16.2, roaeAnterior: 15.8,
      receitasTotaisBi: 37.6, receitasDeltaTt: 2.1, receitasDeltaAa: 10.3,
      margem: 20872, margemClientes: 20199, margemMercado: 673,
      margem1T26: 20051, margemClientes1T26: 19498, margemMercado1T26: 553,
      pddExp: 9985, pddDeltaTt: 3.3, pddDeltaAa: 22.6, // corrigido: 22,6% é a/a, não t/t
      margemLiquida: 10887,
      servicos: 10486, despOper: 16436, resultadoOper: 8929, irCs: 1734,
      carteiraExpandida: 1136640, carteiraDeltaTt: 4.3, carteiraDeltaAa: 11.6, // R$ mm
      guidance: "8,5% a 10,5% para 2026 (mantido)",
      npl90: 4.3, npl90PF: 5.5,
      ieo: 46.5,
      cet1: 11.3, nivel1: 12.8, complementar: 1.5, nivel2: 2.7, // Basileia total = 15,5%
      pr: 185665, plContabil: 175230,
      seguros: { lucro1S26Bi: 5.7, lucro1S26DeltaAa: 20.4, roae1S26: 22.1, lucro2T26Bi: 2.9, lucro2T26DeltaAa: 28.3, roae2T26: 22.8 },
      divulgacao: "2T26",
    },
  };

  /* ================= SANTANDER BRASIL (1T26 e 2T26) ================= */
  const santander = {
    fontes: ["santander1T26", "santander2T26"],
    moeda: "R$ mm (BRGAAP gerencial)",
    lucro1T: 3788, lucro2T: 3014,
    roae1T: 16.0, roae2T: 12.5,
    efic1T: 37.7, efic2T: 39.3,
    pdd2T25: 6862, pdd1T: 6344, pdd2T: 7654,
    nplLabels: ["Jun/25", "Set/25", "Dez/25", "Mar/26", "Jun/26"],
    npl90: [3.3, 3.1, 3.3, 3.4, 3.3],
    custoCredito12m: [3.90, 3.86, 3.76, 3.73, 3.81],
    carteiraBi: 714.769, carteiraYoY: 5.8,
    cartPF: 263.424, cartConsumo: 100.766, cartPME: 95.957, cartGrandes: 254.623, // R$ bi
    margem2T: 15341, comissoes2T: 5334, receita2T: 20675,
    cet1: 11.2, basileia: 15.3,
  };

  /* ================= NU HOLDINGS ================= */
  // Rótulos dos períodos divulgados nos documentos fornecidos.
  // 3T25 não consta de nenhum documento fornecido → lacuna declarada (null).
  const NU_P = ["1T25", "2T25", "3T25", "4T25", "1T26", "2T26"];
  const nu = {
    fontes: ["nu1T26", "nu2T26", "nuRec1T26", "nuRec2T26", "nuRec4T25", "nuHist3T25", "nuDF1T26", "nuDF2T26"],
    moeda: "US$ mm (US$ bi onde indicado)",
    periodos: NU_P,

    /* --- métricas operacionais e de desempenho (releases; % e US$) ---
       3T25 agora preenchido pelo workbook "Historical Data 3Q25" (RI do Nu) e
       pela derivação do P&L gerencial descrita em plGer. */
    op: {
      clientesMi:   [118.6, 122.7, 127.0, 131.0, 135.2, 138.9],
      atividadePc:  [83.3, 83.2, null, 83.4, 83.4, 83.5],
      compraBi:     [30.4, 33.3, 36.5, 41.6, 39.5, 43.4],
      arpac:        [11.6, 12.5, 13.9, 15.0, 15.9, 17.1], // 3T25 em base gerencial (derivado — ver divergência ARPAC)
      custoServir:  [0.7, 0.8, 0.9, 0.8, 1.0, 1.0],
      carteiraBi:   [24.1, 27.3, null, 32.7, 37.2, 39.4],  // carteira total do release; workbook divulga IEP (17,7 bi), base distinta
      depositosBi:  [31.6, 36.6, 38.8, 41.9, 42.4, 45.3],
      eficienciaPc: [21.4, 21.3, null, 19.9, 17.6, 19.5],
      nimRiscoPc:   [9.3, 9.9, null, 10.5, 9.5, 12.4],
      roePc:        [27, 28, 31, 33, 29, 33],
      npl1590:      [4.8, 4.5, 4.2, 4.1, 5.0, 4.8],
      npl90:        [6.4, 6.5, 6.8, 6.6, 6.5, 6.9],
      receita:      [3372.7, 3772.3, 4317.3, 4857.3, 5315.5, 5875.7], // 3T25 derivado do FY25 assegurado
      lucroBruto:   [1327.5, 1519.3, 1811.2, 1961.1, 1877.7, 2441.1],
      lucro:        [557.2, 637.0, 782.7, 894.8, 871.4, 1061.1],
    },

    /* --- 3T25: valores contábeis IFRS do workbook oficial (US$ mm, de US$ mil) --- */
    cont3T25: {
      receitaJuros: 3577.478, tarifas: 595.238, receita: 4172.716,
      despFin: -1275.711, transac: -104.990, ecl: -977.483, custoTotal: -2358.184,
      lucroBruto: 1814.532, despOper: -697.073, coligadas: -1.170,
      lair: 1116.289, ir: -333.611, lucro: 782.678, lucroControladores: 782.473,
      epsBasico: 0.1617, epsDiluido: 0.1595, acoesMedias: 4838814, // milhares
      ativos: 68362.816, passivos: 57809.276, pl: 10553.540, plControladores: 10551.991,
      depositos: 38775.929, caixaEquiv: 12895.785, iepBi: 17.7,
      arpacContabil: 13.4,
      clientesBrasilMi: 110.1, clientesMexicoMi: 13.1, clientesColombiaMi: 3.8,
      funcionariosMil: 9.6,
    },

    /* --- 4T25 e exercício de 2025 (relatório de reconciliação com asseguração KPMG) --- */
    fy25: {
      gerencial: { receita: 16319.6, credito: 9483.0, float: 4505.3, tarifas: 2331.3, custosDiretos: -9700.5, captacao: -4435.5, custoCredito: -4441.9, transacao: -353.6, impostosReceita: -469.5, lucroBruto: 6619.1, despOper: -2237.1, coligadas: -3.7, ebt: 4378.3, ir: -1506.6, lucro: 2871.7 },
      contabil:  { receita: 15774.7, lucroBruto: 6625.0, ebt: 3868.4, ir: -996.7, lucro: 2871.7 },
      fy24Gerencial: { receita: 11671.1, lucroBruto: 5025.5, ebt: 2972.9, ir: -1000.8, lucro: 1972.1 },
    },

    /* --- P&L gerencial completo (US$ mm) — releases + relatórios de reconciliação --- */
    plGer: {
      "1T25": { receita: 3372.7, credito: 1976.0, float: 880.1, tarifas: 516.6, custosDiretos: -2045.2, captacao: -841.1, custoCredito: -1041.8, transacao: -63.1, impostosReceita: -99.2, lucroBruto: 1327.5, despOper: -459.2, suporte: -151.5, ga: -283.8, marketing: -40.3, outras: 16.3, coligadas: -1.1, ebt: 867.2, ir: -310.0, lucro: 557.2 },
      "2T25": { receita: 3772.3, credito: 2239.8, float: 990.9, tarifas: 541.6, custosDiretos: -2253.0, captacao: -1007.3, custoCredito: -1051.1, transacao: -83.2, impostosReceita: -111.4, lucroBruto: 1519.3, despOper: -548.1, suporte: -161.4, ga: -318.7, marketing: -52.3, outras: -15.7, coligadas: -1.0, ebt: 970.2, ir: -333.2, lucro: 637.0 },
      // 3T25 DERIVADO: FY25 assegurado (KPMG) menos os três trimestres divulgados.
      // Não é um valor publicado como tal pela companhia — é cálculo do autor, com
      // todas as identidades internas verificadas nos checks (componentes somam, EBT − IR = lucro).
      "3T25": { receita: 4317.3, credito: 2489.2, float: 1225.4, tarifas: 602.7, custosDiretos: -2506.1, captacao: -1237.1, custoCredito: -1035.8, transacao: -108.3, impostosReceita: -124.9, lucroBruto: 1811.2, despOper: -577.2, suporte: null, ga: null, marketing: null, outras: null, coligadas: -1.2, ebt: 1232.8, ir: -450.1, lucro: 782.7, derivado: true },
      "4T25": { receita: 4857.3, credito: 2778.0, float: 1408.9, tarifas: 670.4, custosDiretos: -2896.2, captacao: -1350.0, custoCredito: -1313.2, transacao: -99.0, impostosReceita: -134.0, lucroBruto: 1961.1, despOper: -652.6, suporte: -164.0, ga: -364.9, marketing: -94.2, outras: -29.5, coligadas: -0.4, ebt: 1308.1, ir: -413.3, lucro: 894.8 },
      "1T26": { receita: 5315.5, credito: 3173.3, float: 1383.0, tarifas: 759.1, custosDiretos: -3437.7, captacao: -1305.0, custoCredito: -1794.2, transacao: -120.7, impostosReceita: -217.9, lucroBruto: 1877.7, despOper: -647.6, suporte: -204.9, ga: -371.8, marketing: -62.9, outras: -8.1, coligadas: -1.0, ebt: 1229.1, ir: -357.6, lucro: 871.4 },
      "2T26": { receita: 5875.7, credito: 3604.8, float: 1454.4, tarifas: 816.4, custosDiretos: -3434.6, captacao: -1372.1, custoCredito: -1690.8, transacao: -130.8, impostosReceita: -240.9, lucroBruto: 2441.1, despOper: -806.2, suporte: -226.2, ga: -463.6, marketing: -103.6, outras: -12.8, coligadas: -4.7, ebt: 1630.3, ir: -569.2, lucro: 1061.1 },
    },

    /* --- P&L contábil IFRS (US$ mm) — releases --- */
    plCont: {
      "1T26": { receita: 4968.0, juros: 4275.3, tarifas: 692.7, despFin: -1269.2, transac: -115.9, ecl: -1718.0, custoTotal: -3103.1, lucroBruto: 1864.9, suporte: -204.9, ga: -492.0, marketing: -62.9, outrasDesp: -169.8, outrasRec: 20.0, totalDesp: -909.5, coligadas: -1.0, lair: 954.3, ir: -82.9, lucro: 871.4 },
      "2T26": { receita: 5513.2, juros: 4760.6, tarifas: 752.6, despFin: -1556.7, transac: -127.8, ecl: -1482.2, custoTotal: -3166.7, lucroBruto: 2346.5, suporte: -226.2, ga: -599.8, marketing: -103.4, outrasDesp: -201.0, outrasRec: 25.0, totalDesp: -1105.6, coligadas: -4.7, lair: 1236.3, ir: -175.2, lucro: 1061.1 },
    },

    /* --- reconciliação contábil → gerencial (US$ mm) — relatórios com asseguração
           limitada da KPMG (ISAE 3000 revisado) --- */
    reconc: {
      "4T25": { contabil: { receita: 4685.9, lucroBruto: 1943.0, ebt: 1077.7, ir: -182.9, lucro: 894.8 }, ajustes: { receita: 171.4, lucroBruto: 18.0, ebt: 230.4, ir: -230.4, lucro: 0.0 }, gerencial: { receita: 4857.3, lucroBruto: 1961.1, ebt: 1308.1, ir: -413.3, lucro: 894.8 } },
      "FY25": { contabil: { receita: 15774.7, lucroBruto: 6625.0, ebt: 3868.4, ir: -996.7, lucro: 2871.7 }, ajustes: { receita: 544.8, lucroBruto: -5.9, ebt: 509.9, ir: -509.9, lucro: 0.0 }, gerencial: { receita: 16319.6, lucroBruto: 6619.1, ebt: 4378.3, ir: -1506.6, lucro: 2871.7 } },
      "1T26": { contabil: { receita: 4968.0, lucroBruto: 1864.9, ebt: 954.3, ir: -82.9, lucro: 871.4 }, ajustes: { receita: 347.5, lucroBruto: 12.9, ebt: 274.8, ir: -274.8, lucro: 0.0 }, gerencial: { receita: 5315.5, lucroBruto: 1877.7, ebt: 1229.1, ir: -357.6, lucro: 871.4 } },
      "2T26": { contabil: { receita: 5513.2, lucroBruto: 2346.5, ebt: 1236.3, ir: -175.2, lucro: 1061.1 }, ajustes: { receita: 362.4, lucroBruto: 94.6, ebt: 393.9, ir: -393.9, lucro: 0.0 }, gerencial: { receita: 5875.7, lucroBruto: 2441.1, ebt: 1630.3, ir: -569.2, lucro: 1061.1 } },
    },

    /* --- série longa de clientes por país (workbook 3T25; milhões) --- */
    histClientes: {
      rotulos: ["4T23", "1T24", "2T24", "3T24", "4T24", "1T25", "2T25", "3T25"],
      brasil:   [87.9, 91.8, 95.5, 98.8, 101.8, 104.6, 107.3, 110.1],
      mexico:   [5.2, 6.6, 7.8, 8.9, 10.0, 11.0, 12.0, 13.1],
      colombia: [0.8, 0.9, 1.3, 2.0, 2.5, 2.9, 3.4, 3.8],
    },

    /* --- capital regulatório: NÃO é o consolidado da Nu Holdings --- */
    capitalNuPagamentos: {
      entidade: "Nu Pagamentos S.A.", data: "set/2025", basileia: 14.6, nivel1: 13.0,
      comparacao: { bradesco: 15.9, itau: 16.4 },
      variacaoAa: { basileia: -1.2, nivel1: -1.5 },
      ressalva: "Entidade individual do conglomerado, não o índice consolidado do grupo Nu Holdings — o consolidado não consta de fonte aberta agregada nem dos releases; exigiria consulta ao painel de Conglomerados Prudenciais do BCB.",
    },

    /* --- carteira por produto e depósitos por país (US$ bi, releases) --- */
    carteiraMix2T26: { cartoes: 26.0, semGarantia: 10.3, comGarantia: 3.1, total: 39.4 },
    depositosPais2T26: { brasil: 36.4, mexico: 5.7, colombia: 3.3, total: 45.3, obs: "componentes divulgados arredondados somam 45,4" },
    custoDepositosPcCDI: 88, // % das taxas interbancárias (2T26; −3 p.p. a/a)
    ldrDivulgado: { "1T25": 48.5, "4T25": 49.1, "1T26": 58.3, obs: "definição própria da companhia; não recalculado" },

    /* --- balanço IFRS (US$ mm, convertido de US$ mil) — DFs intermediárias --- */
    balanco: {
      "4T25": { ativos: 74893.877, passivos: 63572.315, pl: 11321.562, plControladores: 11290.948, caixa: 15003.643 },
      "1T26": { ativos: 77456.407, passivos: 64864.581, pl: 12591.826, plControladores: 12588.777, caixa: 13920.432 },
      "2T26": { ativos: 82753.414, passivos: 69501.693, pl: 13251.721, plControladores: 13249.670, caixa: 13551.611 },
    },

    /* --- mutação do PL no 1S26 (US$ mm) — DF 2T26 --- */
    mutacaoPl1S26: {
      abertura: 11321.562, lucro: 1932.520, sbc: 151.277, emissaoAquisicoes: 0.853,
      opcoes: 3.981, recompra: -500.393, nci: -28.828, hedgeFluxo: -4.803,
      hedgeInvestimento: -120.645, vjora: 3.472, conversao: 492.725, fechamento: 13251.721,
    },
    recompra1S26: { acoes: 40659600, custo: 500.393 }, // ações Classe A em tesouraria (NE 31)

    /* --- México (destaques de negócio, releases) --- */
    mexico: { clientesMi2T26: 15.8, clientesMiJul26: 16.0, arpac: 12.3, arpacBrasilMesmoEstagio: 5.6, popAdultaPc: 16.5, depositosBi: 5.7, ldrPc: 35, breakeven: "1T26" },
  };

  /* ================= AGI / AGIBANK ================= */
  const AGI_P = ["1T25", "4T25", "1T26"];
  const agi = {
    fontes: ["agiRel1T26", "agiDF1T26"],
    moeda: "R$ mm",
    periodos: AGI_P,

    /* --- indicadores-chave (release 1T26; R$ mm e %) --- */
    kpis: {
      clientesMil:  [4631.7, 6715.4, 7069.9],
      receitas:     [2424.9, 2958.5, 2996.6],
      nii:          [1158.9, 1220.1, 1268.6],
      ebt:          [511.7, 238.1, 216.1],
      lucro:        [356.5, 214.9, 186.5],
      lucroRec:     [356.5, 161.8, 186.5],   // recorrente (ajuste 4T25 divulgado)
      carteira:     [27239.6, 34855.0, 35498.5],
      ativosRemun:  [30759.7, 41420.7, 43238.5],
      pl:           [2846.1, 3276.9, 4655.0],
      roaeLTM:      [45.0, 35.8, 26.1],
      nimLTM:       [16.9, 13.7, 12.8],
      nimTri:       [15.9, 12.2, 12.0],
      nimAposProv:  [11.0, 6.8, 7.3],
      eficienciaRec:[34.2, 45.7, 43.2],
      npl90:        [2.9, 3.7, 3.6],
      basileia:     [15.3, 15.5, 19.3],
      tier1:        [13.5, 14.2, 18.1],
      smartHubs:    [1016, 1111, 1115],
      headcount:    [4661, 5001, 5010],
    },
    cobertura1T26: 164.9,
    carteiraMix1T26: { securedBi: 30.7, unsecuredBi: 4.8, securedPc: 87, unsecuredPc: 13, payrollPrivadoBi: 1.0, payrollPublicoBi: 0.3, shareINSS: 9.0 },
    originacao: { "1T26": 7100, deltaTt: 36.3, deltaAa: -30.9 },

    /* --- depósitos por instrumento (release; R$ mm) --- */
    depositos: {
      linhas: ["Depósitos à vista", "CDB", "DPGE", "Letras financeiras e CDI", "Emissões colateralizadas", "Bonds no exterior"],
      "1T25": [367.3, 16899.3, 1752.2, 5347.2, 3771.3, 445.6],
      "4T25": [345.8, 17961.2, 2531.9, 6941.6, 9378.1, 667.1],
      "1T26": [456.5, 17154.6, 2812.4, 8556.0, 9422.6, 890.6],
      total: { "1T25": 28582.8, "4T25": 37825.8, "1T26": 39292.8 },
      shareVarejo: { "1T25": 60.4, "4T25": 48.4, "1T26": 44.8 },
      ldr: { "1T25": 95.3, "4T25": 92.1, "1T26": 90.3 },
    },

    /* --- NIM (release; R$ mm) --- */
    nimTabela: {
      jurosCarteira: [1931.2, 2286.3, 2212.3],
      jurosCaixa:    [177.8, 514.1, 683.6],
      despJuros:     [-950.1, -1580.3, -1627.3],
      nii:           [1158.9, 1220.1, 1268.6],
      avgIBA:        [29118.6, 39862.2, 42329.6],
      provisoes:     [-361.5, -544.5, -499.0],
    },

    /* --- eficiência (release 1T26; R$ mm) --- */
    eficiencia1T26: { pessoal: -90.6, sga: -381.8, da: -53.7, outras: -17.1, totalDespesas: -543.2, operIncome: 1369.3, taxExp: -111.0, base: 1258.2, ratio: 43.2 },

    /* --- capital (release; R$ mm) --- */
    capital: { re: [3067.2, 3876.9, 5213.7], reTier1: [2695.0, 3549.4, 4881.3], rwa: [20034.0, 25008.4, 26951.7], rban: [430.0, 699.5, 646.3] },

    /* --- IPO (release + DFs; NYSE: AGBK, 11/02/2026) --- */
    ipo: {
      data: "11/02/2026", ticker: "AGBK", acoesMi: 20.0, precoUSD: 12.00,
      brutoUSD: 240.0, liquidoUSD: 226.7, liquidoBRL: 1239.6,
      underwritingUSD: 13.3, underwritingBRL: 68.7, outrasDespUSD: 11.3, outrasDespBRL: 58.7,
      custosTransacaoBRL: 127.387, // reconhecidos no PL (DF, R$ mm)
    },

    /* --- demonstrações IFRS 1T26 (R$ mm, de R$ mil; revisão limitada EY, ISRE 2410) --- */
    balancoDF: {
      "4T25": { ativos: 47737.352, passivos: 44563.744, pl: 3173.608, caixaBancos: 327.293, fvtpl: 3102.639, custoAmortizado: 41258.221, loans: 34855.041, provisao: -2413.641 },
      "1T26": { ativos: 50193.382, passivos: 45538.392, pl: 4654.990, caixaBancos: 1002.419, fvtpl: 2115.403, custoAmortizado: 43897.350, loans: 35498.518, provisao: -2116.084 },
    },
    obsPerimetro4T25: "O release apresenta 4T25 na base Agi Financial Holding (PL R$ 3.276,9 mm); as DFs do AGI Inc em base predecessora apresentam PL de R$ 3.173,6 mm em 31/12/2025 — divergência de perímetro documentada.",

    dreDF: {
      "1T26": { jurosReceita: 2710.119, jurosDespesa: -1627.311, nii: 1082.808, ganhoFVTPL: 185.748, comissoes: 100.715, operIncome: 1369.271, ecl: -498.981, pessoal: -90.570, sga: -381.830, taxExp: -111.046, da: -53.687, netOper: 233.157, outras: -17.085, lair: 216.072, irCorrente: -179.683, irDiferido: 150.146, lucro: 186.535, eps: 1.39 },
      "1T25": { jurosReceita: 2065.110, jurosDespesa: -950.086, nii: 1115.024, ganhoFVTPL: 43.872, comissoes: 315.895, operIncome: 1474.791, ecl: -361.454, pessoal: -87.569, sga: -317.829, taxExp: -147.860, da: -46.929, netOper: 513.150, outras: -1.480, lair: 511.670, irCorrente: -234.109, irDiferido: 78.908, lucro: 356.469, eps: 2.78 },
    },

    fluxoDF: {
      "1T26": { oper: 29.302, inv: -89.689, fin: 1234.848, delta: 1174.461, caixaIni: 853.279, caixaFim: 2027.740,
        invItens: { imobilizado: -15.841, intangivel: -73.848 },
        finItens: { ipo: 1239.648, custosIpo: -89.684, treasury: -11.055, borrowings: -97.995, loanProceeds: 422.262, pagtoEmprestimos: -204.826, leases: -23.502 } },
      "1T25": { oper: -37.685, inv: -51.179, fin: -167.565, delta: -256.429, caixaIni: 1405.410, caixaFim: 1148.981 },
    },
    caixaEquivalentes1T26: { bancos: 1002.419, interbancarios: 1025.321, total: 2027.740 },

    mutacaoPl1T26: { abertura: 3173.608, reestruturacao: 199.746, emissaoIpo: 1239.648, custosIpo: -127.387, lucro: 186.535, hedge: -0.195, treasury: -16.965, fechamento: 4654.990 },

    carteiraProdutoDF: { personal: 5953.924, payroll: 26566.337, payrollCard: 2433.616, creditCard: 12.030, outros: 90.922, exposicao: 35056.829, premio: 602.713, ajusteHedge: -161.024, loans: 35498.518 },

    /* --- 2T26: EXTRAÇÃO DOCUMENTAL (Earnings Release 2Q26 + DFs IFRS com revisão EY) ---
       Promovido de relato (nível 3) para nível 1 em 16/08/2026. O relato anterior
       não trazia ROAE, eficiência nem Basileia do trimestre — agora documentados. */
    t2_26: {
      relatado: false, nivel: 1,
      lucro: 200.3, lucroDeltaTt: 7.4, lucroDeltaAa: -24.4, lucro1S26: 386.8, lucro1S25: 621.3,
      receita: 3171.0, receitaDeltaTt: 5.8, receitaDeltaAa: 26.3, receita1S26: 6167.6,
      nii: 1300.9, niiDeltaTt: 2.5, niiDeltaAa: 10.9,
      ebt: 115.0, ebtDeltaTt: -46.8, ebtDeltaAa: -68.7,
      clientesMil: 7589.0, clientesDeltaTt: 7.3, clientesDeltaAa: 36.4,
      carteira: 37075.8, carteiraDeltaTt: 4.4, carteiraDeltaAa: 21.2,
      ativosRemun: 43998.6, pl: 4799.2,
      roaeLTM: 21.6, nimLTM: 11.9, nimTri: 11.9, nimAposProv: 6.8,
      eficienciaRec: 48.9, npl90: 3.3, cobertura: 182.6, custoRiscoLTM: 5.9,
      basileia: 18.7, tier1: 17.6, re: 5250.6, rwa: 28035.8,
      smartHubs: 1115, headcount: 5068,
      // carteira por produto (R$ mm)
      securedTotal: 32599.5, unsecuredTotal: 4476.3,
      inss: 27154.4, privado: 1406.8, publico: 344.4, cartaoConsignado: 2490.1, fgts: 1203.8,
      pessoal: 4431.2, cartaoCredito: 45.1,
      payrollTotal: 28905.6,
      provisao: 2226.7,
      shareINSS: 9.60, shareINSSGanhoTri: 0.60,
      originacaoBruta: 7100, originacaoLiquida: 2800, originacaoLiquidaDeltaTt: 15.0,
      tarifas: 135.6, tarifasDeltaTt: 34.6,
      // funding (R$ mm)
      depositos: { vista: 566.2, cdb: 14788.1, dpge: 2332.2, lfCdi: 8336.1, colateralizadas: 12372.7, bonds: 1502.5, total: 39897.8 },
      shareVarejo: 38.5, ldr: 92.9,
      lcr: 731.9,
      agiMais: { assinaturas: 250000, prazoDias: 45 },
      ratings: "Fitch elevou de AA-(br) para AA(bra) em julho; Moody's Local de AA-.br para AA.br em junho",
      divulgacao: "05/08/2026",
    },

    /* --- DFs IFRS 2T26 (R$ mm, de R$ mil; revisão limitada EY) --- */
    balancoDF2T26: { ativos: 51109.048, passivos: 46309.833, pl: 4799.215, lucro2T26: 200.276, lucro1S26: 386.811, lucro2T25: 263.936, lucro1S25: 620.405 },
    obsDivergencia2T26: "O release apresenta ativos de R$ 51.105,8 mm e passivos de R$ 46.306,6 mm; as DFs revisadas trazem R$ 51.109,048 mm e R$ 46.309,833 mm — diferença de R$ 3,2 mm no par ativo/passivo, com patrimônio idêntico. Ambos fecham A = P + PL internamente.",

    eclEstagios1T26: {
      exposicao: [32636.549, 1014.032, 1406.248], exposicaoTotal: 35056.829,
      provisao: [591.976, 388.950, 1135.158], provisaoTotal: 2116.084,
      movimento: { abertura: 2417.890, despesa: 498.982, writeoffs: -818.398, recuperacoes: 22.272, fechamento: 2120.746, limitesNaoUsados: 4.662 },
    },
  };

  /* ================= DADOS DE MERCADO =================
     ATENÇÃO — classe de fonte distinta do restante deste dataset.
     Estes números vêm de AGREGADORES DE MERCADO (nível 3), relatados pelo
     titular a partir de consulta pública, e NÃO de documentos dos emissores.
     Os agregadores divergem entre si para o mesmo papel e a mesma data-base;
     por isso tudo aqui é armazenado como FAIXA (min/max), nunca como ponto.
     Cotações são de 08–16/08/2026 e mudam a cada pregão: são fotografia, não
     série. Nenhuma leitura de compra, venda ou preço-alvo é feita a partir
     destes dados em qualquer página do portfólio. */
  const mercado = {
    fontes: ["mercadoAgregadores"],
    dataConsulta: "08–16/08/2026",
    classe: "nível 3 — agregadores de mercado, relatado",
    ativos: [
      { id: "nu", nome: "Nu Holdings", ticker: "NYSE: NU (BDR ROXO34)", moeda: "US$",
        precoMin: 13.84, precoMax: 13.84, precoNota: "fechamento de 08/08/2026 (anterior: 14,12)",
        plMin: 18.2, plMax: 21.6, pvpaMin: 5.1, pvpaMax: 5.5, dy: 0,
        roeRef: 33.0, roeNota: "ROE 2T26 divulgado",
        divergencia: "P/L de 18,2× (base TTM, um agregador; média setorial citada ~12,6×) a 21,6× (outros dois agregadores)" },
      { id: "bradesco", nome: "Bradesco", ticker: "B3: BBDC4", moeda: "R$",
        precoMin: 16.66, precoMax: 17.47, precoNota: "faixa observada ao longo de agosto/2026",
        plMin: 7.3, plMax: 8.0, pvpaMin: 1.10, pvpaMax: 1.10, dyMin: 5.7, dyMax: 9.5,
        roeRef: 16.2, roeNota: "ROAE 2T26 divulgado (nível 1)",
        divergencia: "Dividend yield de 5,7% a 9,5% para janelas praticamente idênticas — diferença de metodologia entre agregadores" },
      { id: "agi", nome: "Agi (Agibank)", ticker: "NYSE: AGBK", moeda: "US$",
        precoMin: 7.16, precoMax: 7.19, precoNota: "vs. US$ 12,00 do IPO (fev/2026)",
        plMin: 6.2, plMax: 29.7, pvpaMin: 1.05, pvpaMax: 1.05, dy: 0,
        roeRef: 21.6, roeNota: "ROAE LTM 2T26 divulgado (nível 1)",
        divergencia: "P/L de 6,2× (sobre lucro projetado para 2026, citado em reportagem) a 29,7× (trailing, agregador) — bases de lucro diferentes; histórico curto de negociação desde a estreia em fevereiro" },
    ],
    avisoObrigatorio: "Preços e múltiplos de mercado são apresentados como contexto factual e como insumo de um exercício técnico de valuation. Não constituem recomendação, preço-alvo, opinião sobre valor justo ou sugestão de compra ou venda.",
  };

  /* ================= REGISTRO DE FONTES ================= */
  const FONTES = {
    copom:          { doc: "Atas da 277ª, 278ª e 280ª reuniões do Copom + nota da decisão da 280ª", emissor: "Banco Central do Brasil", data: "18/03, 29/04 e 05/08/2026", nivel: 1 },
    copom279:       { doc: "Ata da 279ª reunião do Copom (16–17/06/2026)", emissor: "Banco Central do Brasil", data: "17/06/2026", nivel: 1, obs: "PDF do BCB — completa a série da Selic; lacuna anterior encerrada" },
    itau2T26:       { doc: "Apresentação de resultados 2T26", emissor: "Itaú Unibanco Holding S.A.", data: "05/08/2026", nivel: 1 },
    itauIFRS1S26:   { doc: "Demonstrações contábeis IFRS + Relatório da Administração 1S26", emissor: "Itaú Unibanco Holding S.A.", data: "30/06/2026", nivel: 1 },
    bradesco1T26:   { doc: "Relatório de Análise Econômica e Financeira 1T26", emissor: "Banco Bradesco S.A.", data: "1T26 (divulgação do trimestre)", nivel: 1 },
    santander1T26:  { doc: "Apresentação de resultados 1T26 (BRGAAP)", emissor: "Banco Santander (Brasil) S.A.", data: "29/04/2026", nivel: 1 },
    santander2T26:  { doc: "Apresentação de resultados 2T26 (BRGAAP)", emissor: "Banco Santander (Brasil) S.A.", data: "29/07/2026", nivel: 1 },
    nu1T26:         { doc: "Divulgação de resultados 1T26 (release)", emissor: "Nu Holdings Ltd. (NYSE: NU)", data: "14/05/2026", nivel: 1 },
    nu2T26:         { doc: "Divulgação de resultados 2T26 (release)", emissor: "Nu Holdings Ltd. (NYSE: NU)", data: "13/08/2026", nivel: 1 },
    nuRec1T26:      { doc: "Managerial P&L Reconciliation Report 1T26 (asseguração limitada KPMG, ISAE 3000)", emissor: "Nu Holdings Ltd. / KPMG Auditores Independentes", data: "14/05/2026", nivel: 1 },
    nuRec2T26:      { doc: "Managerial P&L Reconciliation Report 2T26 (asseguração limitada KPMG, ISAE 3000)", emissor: "Nu Holdings Ltd. / KPMG Auditores Independentes", data: "13/08/2026", nivel: 1 },
    nuDF1T26:       { doc: "Demonstrações financeiras intermediárias condensadas consolidadas 1T26 (IFRS)", emissor: "Nu Holdings Ltd.", data: "31/03/2026", nivel: 1 },
    nuDF2T26:       { doc: "Demonstrações financeiras intermediárias condensadas consolidadas 2T26 (IFRS)", emissor: "Nu Holdings Ltd.", data: "30/06/2026", nivel: 1 },
    nuCSV:          { doc: "Planilha \"Nu Holdings — Dados Históricos\" 1T26/2T26/3T25/4T25 (CSV)", emissor: "Nu Holdings Ltd. (Relações com Investidores)", data: "recebidas 16/08/2026", nivel: 1, obs: "todos os CSVs recebidos contêm apenas a aba de índice do workbook — sem dados numéricos; substituídos pelo arquivo XLSX, que veio completo" },
    nuHist3T25:     { doc: "Workbook \"Historical Data 3Q25\" (XLSX, 13 abas: resultado, balanço, fluxo de caixa, NPLs, operações de crédito, indicadores gerenciais)", emissor: "Nu Holdings Ltd. (Relações com Investidores)", data: "30/09/2025 · recebido 16/08/2026", nivel: 1, obs: "fonte primária que encerra a lacuna do 3T25 e traz série histórica desde 2022" },
    nuRec4T25:      { doc: "Managerial P&L Reconciliation Report 4T25 e exercício de 2025 (asseguração limitada KPMG, ISAE 3000)", emissor: "Nu Holdings Ltd. / KPMG Auditores Independentes", data: "25/02/2026", nivel: 1, obs: "base da derivação do 3T25 gerencial por diferença" },
    agiRel1T26:     { doc: "Earnings Release 1Q26", emissor: "Agi Inc. (NYSE: AGBK) / Banco Agibank S.A.", data: "05/05/2026", nivel: 1 },
    agiDF1T26:      { doc: "Demonstrações financeiras intermediárias condensadas consolidadas 1T26 (IFRS, revisão limitada EY — ISRE 2410)", emissor: "AGI Inc / Ernst & Young Auditores Independentes", data: "05/05/2026", nivel: 1 },
    bradesco2T26:   { doc: "Relatório de Análise Econômica e Financeira 2T26", emissor: "Banco Bradesco S.A.", data: "2T26", nivel: 1, obs: "promovido de relato para extração documental em 16/08/2026 — duas correções aplicadas (ver metodologia, seção 5)" },
    bradescoIFRS1S26: { doc: "Demonstrações Financeiras Consolidadas em IFRS + Relatório da Administração 1S26", emissor: "Banco Bradesco S.A.", data: "30/06/2026", nivel: 1 },
    agi2T26:        { doc: "Earnings Release 2Q26", emissor: "Agi Inc. (NYSE: AGBK) / Banco Agibank S.A.", data: "05/08/2026", nivel: 1, obs: "promovido de relato para extração documental em 16/08/2026 — ROAE LTM corrigido de 26,1% para 21,6%" },
    agiDF2T26:      { doc: "Demonstrações financeiras intermediárias condensadas consolidadas 2T26 (IFRS, revisão limitada EY — ISRE 2410)", emissor: "AGI Inc / Ernst & Young Auditores Independentes", data: "30/06/2026", nivel: 1 },
    agiPilar3:      { doc: "Relatório de Gerenciamento de Riscos — Pilar 3", emissor: "Banco Agibank S.A.", data: "2026", nivel: 1, obs: "recebido; capital regulatório e gestão de riscos" },
    mercadoAgregadores: { doc: "Cotações e múltiplos (P/L, P/VPA, dividend yield) de agregadores de mercado — Investing.com, Status Invest, Investidor10 e cobertura de imprensa", emissor: "Agregadores de mercado (via relato do titular)", data: "08–16/08/2026", nivel: 3, obs: "os agregadores divergem entre si; armazenado como faixa, nunca como ponto. Não são dados dos emissores nem base para recomendação" },
    ifdataBCB:      { doc: "IF.data — Basileia e Capital Nível I da Nu Pagamentos S.A. (set/2025), RELATADO", emissor: "Banco Central do Brasil (via relato)", data: "set/2025", nivel: 3, obs: "entidade individual, não o consolidado da Nu Holdings; consolidado exigiria o painel de Conglomerados Prudenciais do BCB" },
  };

  const META = {
    versao: "16/08/2026 (rev. 2.1)",
    recebimento: "Documentos recebidos como conversões OCR/planilhas fornecidas pelo titular em 13–16/08/2026; o workbook XLSX do Nu (3T25) e a ata da 279ª reunião do Copom vieram em formato nativo.",
    avisos: [
      "Dados públicos das companhias citadas — nada aqui é recomendação de investimento, preço-alvo ou opinião sobre valor de ativos.",
      "Duas classes de fonte convivem: extração documental (nível 1, documento em mãos) e relato do titular a partir de fonte pública (nível 3, documento não anexado). Cada número carrega sua classe.",
      "Nu reporta em US$; os demais em R$ — valores absolutos não são comparados entre moedas (sem taxa de câmbio nos documentos).",
      "Taxas de crescimento do Nu divulgadas em base neutra de câmbio (FXN); variações nominais recalculadas aqui diferem — documentado.",
      "Preços e múltiplos de mercado são fotografia de agosto/2026 e mudam a cada pregão; agregadores divergem entre si e os valores são guardados como faixa.",
    ],
  };

  const soma = a => a.reduce((x, y) => x + y, 0);
  // Faixa formatada "a – b" (ou valor único quando min = max)
  const faixa = (min, max, fmt) => (min === max ? fmt(min) : fmt(min) + " – " + fmt(max));
  const meio = (min, max) => (min + max) / 2;

  return { selic, itau, bradesco, santander, nu, agi, mercado, FONTES, META, soma, faixa, meio };
})();
