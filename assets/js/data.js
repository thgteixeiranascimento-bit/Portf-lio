/* ============================================================
   data.js — dataset central do estudo de caso
   ------------------------------------------------------------
   SIMULAÇÃO / ESTUDO DE CASO FICTÍCIO.
   "Aurora Industrial S.A." é uma empresa FICTÍCIA criada para
   demonstrar técnica de modelagem. Nenhum número abaixo é dado
   real de empresa existente e nada aqui representa experiência
   profissional real, recomendação ou projeção de mercado.
   Todo valor é DADO SIMULADO; parâmetros marcados PREMISSA são
   hipóteses de modelagem, ajustáveis nos simuladores.
   Unidade monetária: R$ milhões, salvo indicação.
   ============================================================ */
window.DATA = (function () {
  "use strict";

  const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  /* ---------- histórico anual (DADO SIMULADO) ---------- */
  const hist = {
    anos: [2023, 2024, 2025],
    receita: [850.0, 918.0, 991.4],
    cpv: [-563.6, -605.9, -654.3],
    sgna: [-140.3, -149.6, -158.6],
    da: [-36.0, -39.0, -42.0],
    resFin: [-24.2, -25.6, -26.4],
    aliqIR: 0.34, // PREMISSA: alíquota efetiva combinada IRPJ+CSLL
  };
  hist.lucroBruto = hist.receita.map((r, i) => r + hist.cpv[i]);
  hist.ebitda = hist.lucroBruto.map((lb, i) => lb + hist.sgna[i]);
  hist.ebit = hist.ebitda.map((e, i) => e + hist.da[i]);
  hist.lair = hist.ebit.map((e, i) => e + hist.resFin[i]);
  hist.ir = hist.lair.map(l => -(l * hist.aliqIR));
  hist.lucroLiq = hist.lair.map((l, i) => l + hist.ir[i]);

  /* ---------- balanço de abertura 31/12/2025 (DADO SIMULADO) ---------- */
  const bal2025 = {
    caixa: 82.0,
    contasReceber: 163.0,   // consistente com DSO ≈ 60 dias sobre a receita de 2025
    estoques: 118.0,        // consistente com DIO ≈ 66 dias sobre o CPV de 2025
    imobilizadoLiq: 420.0,
    fornecedores: 89.6,     // consistente com DPO ≈ 50 dias sobre o CPV de 2025
    impostosOutros: 25.0,
    divida: 240.0,
  };
  bal2025.ativoTotal = bal2025.caixa + bal2025.contasReceber + bal2025.estoques + bal2025.imobilizadoLiq;
  bal2025.pl = bal2025.ativoTotal - bal2025.fornecedores - bal2025.impostosOutros - bal2025.divida;

  /* ---------- orçamento 2026 (DADO SIMULADO) ---------- */
  const orc2026 = {
    receitaAno: 1090.0,
    margemEbitda: 0.19, // PREMISSA orçamentária
    // sazonalidade mensal (soma = 1,000)
    pesos: [0.070, 0.072, 0.082, 0.080, 0.084, 0.086, 0.088, 0.086, 0.088, 0.090, 0.088, 0.086],
  };
  orc2026.receitaMes = orc2026.pesos.map(p => +(orc2026.receitaAno * p).toFixed(2));
  orc2026.ebitdaMes = orc2026.receitaMes.map(r => r * orc2026.margemEbitda);

  /* ---------- realizado Jan–Jul/2026 (DADO SIMULADO) ---------- */
  const mesesReal = 7;
  const real2026 = {
    mesesFechados: mesesReal,
    receitaMes: [74.1, 75.9, 86.8, 84.9, 89.6, 92.3, 93.1],
    // EBITDA mensal realizado; o total YTD reconcilia com a ponte de EBITDA (ver orçamento)
    ebitdaMes: [12.2, 12.7, 14.9, 14.4, 15.4, 16.1, 16.386],
    caixaFimMes: [76.5, 72.8, 77.4, 74.9, 79.8, 84.2, 87.6], // saldo de caixa ao fim do mês
    dso: [60, 61, 61, 62, 63, 63, 64],  // dias — deterioração gradual de recebimento
    dio: [66, 67, 68, 69, 70, 70, 71],  // dias — acúmulo de estoque
    dpo: [50, 50, 49, 49, 48, 48, 48],  // dias — fornecedores encurtando prazo
  };

  /* ---------- abertura por linha de produto, acumulado Jan–Jul (DADO SIMULADO) ---------- */
  // preço médio em R$ mm por unidade; volume em unidades
  const pvm = {
    linhas: [
      { nome: "Linha Compacta", budVol: 5300, budPreco: 0.0460, actVol: 5050, actPreco: 0.0475 },
      { nome: "Linha Pesada",   budVol: 1160, budPreco: 0.2100, actVol: 1090, actPreco: 0.2140 },
    ],
    servicos: { nome: "Serviços & peças", bud: 125.18, act: 123.565 },
    // PREMISSAS de repasse à margem, usadas na ponte de EBITDA:
    mcEquipamentos: 0.36, // margem de contribuição das linhas de equipamentos
    mcServicos: 0.45,     // margem de contribuição de serviços
    // desvios de custo YTD identificados na análise (DADO SIMULADO):
    custosVariaveis: -8.90, // frete e insumos acima do orçado
    pessoal: -5.10,         // dissídio e horas extras acima do orçado
    outrasDespesas: -2.08,  // demais despesas operacionais
  };

  /* ---------- premissas financeiras de partida (PREMISSA — ajustáveis) ---------- */
  const premissas = {
    aliqIR: 0.34,
    custoDivida: 0.11,   // a.a., pré-fixado equivalente
    diasAno: 365,
    capexPctReceita: 0.045,
    dividendPayout: 0.25,
  };

  /* ---------- utilidades ---------- */
  const soma = a => a.reduce((x, y) => x + y, 0);
  const ytd = (arr, n) => soma(arr.slice(0, n == null ? mesesReal : n));

  return {
    MESES, hist, bal2025, orc2026, real2026, pvm, premissas, soma, ytd,
    rotulos: {
      simulacao: "SIMULAÇÃO / ESTUDO DE CASO FICTÍCIO — NÃO REPRESENTA EXPERIÊNCIA PROFISSIONAL REAL",
      empresa: "Aurora Industrial S.A. (empresa fictícia)",
      unidade: "R$ milhões",
    },
  };
})();
