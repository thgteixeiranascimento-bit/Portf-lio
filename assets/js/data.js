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
    fontes: ["copom"],
    decisoes: [
      { reuniao: "277ª", data: "17–18/03/2026", rotulo: "18/mar (277ª)", valor: 14.75 },
      { reuniao: "278ª", data: "28–29/04/2026", rotulo: "29/abr (278ª)", valor: 14.50 },
      { reuniao: "279ª", data: "jun/2026", rotulo: "jun (279ª)", valor: null, obs: "ata não fornecida — lacuna declarada" },
      { reuniao: "280ª", data: "04–05/08/2026", rotulo: "05/ago (280ª)", valor: 14.00 },
    ],
    nota280: { focus2026: 5.0, focus2027: 4.2, projCopom1T28: 3.2, balancoRiscos: "assimetria altista" },
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
    fontes: ["nu1T26", "nu2T26", "nuRec1T26", "nuRec2T26", "nuDF1T26", "nuDF2T26"],
    moeda: "US$ mm (US$ bi onde indicado)",
    periodos: NU_P,

    /* --- métricas operacionais e de desempenho (releases; % e US$) --- */
    op: {
      clientesMi:   [118.6, 122.7, null, 131.0, 135.2, 138.9],
      atividadePc:  [83.3, 83.2, null, 83.4, 83.4, 83.5],
      compraBi:     [30.4, 33.3, null, 41.6, 39.5, 43.4],
      arpac:        [11.6, 12.5, null, 15.0, 15.9, 17.1],
      custoServir:  [0.7, 0.8, null, 0.8, 1.0, 1.0],
      carteiraBi:   [24.1, 27.3, null, 32.7, 37.2, 39.4],
      depositosBi:  [31.6, 36.6, null, 41.9, 42.4, 45.3],
      eficienciaPc: [21.4, 21.3, null, 19.9, 17.6, 19.5],
      nimRiscoPc:   [9.3, 9.9, null, 10.5, 9.5, 12.4],
      roePc:        [27, 28, null, 33, 29, 33],
      npl1590:      [4.8, 4.5, null, 4.1, 5.0, 4.8],
      npl90:        [6.4, 6.5, null, 6.6, 6.5, 6.9],
      receita:      [3372.7, 3772.3, null, 4857.3, 5315.5, 5875.7],
      lucroBruto:   [1327.5, 1519.3, null, 1961.1, 1877.7, 2441.1],
      lucro:        [557.2, 637.0, null, 894.8, 871.4, 1061.1],
    },

    /* --- P&L gerencial completo (US$ mm) — releases + relatórios de reconciliação --- */
    plGer: {
      "1T25": { receita: 3372.7, credito: 1976.0, float: 880.1, tarifas: 516.6, custosDiretos: -2045.2, captacao: -841.1, custoCredito: -1041.8, transacao: -63.1, impostosReceita: -99.2, lucroBruto: 1327.5, despOper: -459.2, suporte: -151.5, ga: -283.8, marketing: -40.3, outras: 16.3, coligadas: -1.1, ebt: 867.2, ir: -310.0, lucro: 557.2 },
      "2T25": { receita: 3772.3, credito: 2239.8, float: 990.9, tarifas: 541.6, custosDiretos: -2253.0, captacao: -1007.3, custoCredito: -1051.1, transacao: -83.2, impostosReceita: -111.4, lucroBruto: 1519.3, despOper: -548.1, suporte: -161.4, ga: -318.7, marketing: -52.3, outras: -15.7, coligadas: -1.0, ebt: 970.2, ir: -333.2, lucro: 637.0 },
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
      "1T26": { contabil: { receita: 4968.0, lucroBruto: 1864.9, ebt: 954.3, ir: -82.9, lucro: 871.4 }, ajustes: { receita: 347.5, lucroBruto: 12.9, ebt: 274.8, ir: -274.8, lucro: 0.0 }, gerencial: { receita: 5315.5, lucroBruto: 1877.7, ebt: 1229.1, ir: -357.6, lucro: 871.4 } },
      "2T26": { contabil: { receita: 5513.2, lucroBruto: 2346.5, ebt: 1236.3, ir: -175.2, lucro: 1061.1 }, ajustes: { receita: 362.4, lucroBruto: 94.6, ebt: 393.9, ir: -393.9, lucro: 0.0 }, gerencial: { receita: 5875.7, lucroBruto: 2441.1, ebt: 1630.3, ir: -569.2, lucro: 1061.1 } },
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

    eclEstagios1T26: {
      exposicao: [32636.549, 1014.032, 1406.248], exposicaoTotal: 35056.829,
      provisao: [591.976, 388.950, 1135.158], provisaoTotal: 2116.084,
      movimento: { abertura: 2417.890, despesa: 498.982, writeoffs: -818.398, recuperacoes: 22.272, fechamento: 2120.746, limitesNaoUsados: 4.662 },
    },
  };

  /* ================= REGISTRO DE FONTES ================= */
  const FONTES = {
    copom:          { doc: "Atas da 277ª, 278ª e 280ª reuniões do Copom + nota da decisão da 280ª", emissor: "Banco Central do Brasil", data: "18/03, 29/04 e 05/08/2026", nivel: 1, obs: "ata da 279ª (jun/26) não fornecida" },
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
    nuCSV:          { doc: "Planilha \"Nu Holdings — Dados Históricos\" 1T26/2T26 (CSV)", emissor: "Nu Holdings Ltd. (Relações com Investidores)", data: "recebida 16/08/2026", nivel: 1, obs: "os CSVs recebidos contêm apenas a aba de índice do workbook — sem dados numéricos; lacuna declarada" },
    agiRel1T26:     { doc: "Earnings Release 1Q26", emissor: "Agi Inc. (NYSE: AGBK) / Banco Agibank S.A.", data: "05/05/2026", nivel: 1 },
    agiDF1T26:      { doc: "Demonstrações financeiras intermediárias condensadas consolidadas 1T26 (IFRS, revisão limitada EY — ISRE 2410)", emissor: "AGI Inc / Ernst & Young Auditores Independentes", data: "05/05/2026", nivel: 1 },
  };

  const META = {
    versao: "16/08/2026",
    recebimento: "Documentos recebidos como conversões OCR/planilhas fornecidas pelo titular em 13–16/08/2026.",
    avisos: [
      "Dados públicos das companhias citadas — nada aqui é recomendação de investimento, preço-alvo ou opinião sobre valor de ativos.",
      "Períodos assimétricos: Itaú/Santander/Nu com 2T26; Bradesco/Agi com 1T26 (documentos mais recentes não fornecidos).",
      "Nu reporta em US$; os demais em R$ — valores absolutos não são comparados entre moedas (sem taxa de câmbio nos documentos).",
      "Taxas de crescimento do Nu divulgadas em base neutra de câmbio (FXN); variações nominais recalculadas aqui diferem — documentado.",
    ],
  };

  const soma = a => a.reduce((x, y) => x + y, 0);

  return { selic, itau, bradesco, santander, nu, agi, FONTES, META, soma };
})();
