/* ============================================================================
   pvm-engine.js — motor deterministico de Price · Volume · Mix
   ----------------------------------------------------------------------------
   RESPONSABILIDADE UNICA: matematica financeira. Nenhum acesso ao DOM,
   nenhuma formatacao, nenhuma leitura de arquivo, nenhuma heuristica de UI.
   Todas as funcoes exportadas sao puras (mesma entrada -> mesma saida).

   REGRAS DE OURO
   1. Nenhum arredondamento em etapa intermediaria. Arredondar e tarefa da UI.
   2. Nenhum efeito e calculado como "resto" (plug): Price, Volume e Mix tem
      definicao algebrica propria em todas as convencoes oferecidas.
      O residuo existe apenas como CONTROLE de reconciliacao.
   3. Divisao por zero nunca produz Infinity/NaN: retorna null e o item e
      reclassificado como nao comparavel, com o efeito integral roteado para
      um balde explicito ("other").
   4. A identidade da ponte e verificada numericamente, nao assumida.

   NOTACAO usada nos comentarios:
      P0_i, P1_i  preco unitario do item i no periodo base / atual
      Q0_i, Q1_i  quantidade do item i no periodo base / atual
      Pm0         preco medio ponderado do portfolio no periodo base
                  = soma(Receita0) / soma(Q0)   (populacao comparavel)
      g           fator de crescimento de quantidade = soma(Q1) / soma(Q0)
      C0_i, C1_i  custo unitario do item i; Cm0 = custo medio ponderado base

   Convencao de sinais: todo efeito e expresso em unidades de RECEITA (ou de
   MARGEM, na ponte de GM) e somado. Um efeito negativo reduz o indicador.
   ========================================================================== */

"use strict";

export const PVM_ENGINE_VERSION = "1.0.0";

/* ---------------------------------------------------------------------------
   1. SOMATORIO COMPENSADO (Neumaier)
   Somas de 100k parcelas em float64 acumulam erro de arredondamento. O motor
   usa somatorio compensado em todos os totais para que o residuo da ponte
   reflita a metodologia, e nao a ordem das parcelas.
   ------------------------------------------------------------------------ */
export function kahanSum(values) {
  let sum = 0, c = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v)) continue;
    const t = sum + v;
    c += Math.abs(sum) >= Math.abs(v) ? (sum - t) + v : (v - t) + sum;
    sum = t;
  }
  return sum + c;
}

/** Acumulador compensado para lacos de uma passada. */
export function makeAccumulator() {
  let sum = 0, c = 0;
  return {
    add(v) {
      if (!Number.isFinite(v)) return;
      const t = sum + v;
      c += Math.abs(sum) >= Math.abs(v) ? (sum - t) + v : (v - t) + sum;
      sum = t;
    },
    get value() { return sum + c; }
  };
}

/* ---------------------------------------------------------------------------
   2. UTILITARIOS NUMERICOS SEGUROS
   ------------------------------------------------------------------------ */

/** Divisao protegida: retorna null (nunca Infinity/NaN) quando indefinida. */
export function safeDiv(numerator, denominator) {
  if (numerator == null || denominator == null) return null;
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;
  if (denominator === 0) return null;
  const r = numerator / denominator;
  return Number.isFinite(r) ? r : null;
}

/**
 * Preco medio unitario ponderado = receita total / quantidade total.
 * NAO e a media aritmetica dos precos unitarios — essa seria enviesada por
 * itens de baixo volume. Retorna null se a quantidade total for 0.
 */
export function calculateWeightedAveragePrice(revenue, quantity) {
  return safeDiv(revenue, quantity);
}

/** Tolerancia de reconciliacao: max(0.01, |referencia| * 1e-9). */
export function reconciliationTolerance(reference) {
  return Math.max(0.01, Math.abs(reference || 0) * 1e-9);
}

/* ---------------------------------------------------------------------------
   3. CLASSIFICACAO DE ITENS
   ------------------------------------------------------------------------ */

export const STATUS = {
  ACTIVE: "active",                 // existe nos dois periodos, com preco calculavel
  NEW: "new",                       // so no periodo atual
  DISCONTINUED: "discontinued",     // so no periodo base
  NON_COMPARABLE: "non-comparable", // existe nos dois, mas sem preco calculavel
  EMPTY: "empty"                    // sem movimento em nenhum periodo
};

function present(quantity, revenue) {
  const q = Number.isFinite(quantity) ? quantity : 0;
  const r = Number.isFinite(revenue) ? revenue : 0;
  return q !== 0 || r !== 0;
}

/**
 * classifySku — regra deterministica de status.
 *
 * Active         : presente nos dois periodos E Q0 > 0 E Q1 > 0 (preco definido).
 * New            : ausente no base, presente no atual.
 * Discontinued   : presente no base, ausente no atual.
 * Non-comparable : presente nos dois periodos mas com quantidade nula ou
 *                  negativa em algum deles — preco unitario indefinido. O item
 *                  NAO e forcado para Price/Volume/Mix (proibido por
 *                  metodologia); sua variacao vai integralmente para "other".
 * Empty          : sem movimento — excluido de todos os baldes.
 *
 * @param {{q0:number,q1:number,rev0:number,rev1:number}} item
 * @returns {string} um valor de STATUS
 */
export function classifySku(item) {
  const p0 = present(item.q0, item.rev0);
  const p1 = present(item.q1, item.rev1);
  if (!p0 && !p1) return STATUS.EMPTY;
  if (!p0 && p1) return STATUS.NEW;
  if (p0 && !p1) return STATUS.DISCONTINUED;
  const priceable = Number.isFinite(item.q0) && item.q0 > 0
                 && Number.isFinite(item.q1) && item.q1 > 0;
  return priceable ? STATUS.ACTIVE : STATUS.NON_COMPARABLE;
}

/* ---------------------------------------------------------------------------
   4. METODOLOGIAS
   ----------------------------------------------------------------------------
   Toda convencao parte da mesma identidade exata, item a item, para a
   populacao comparavel (Active):

        dReceita_i = P1*Q1 - P0*Q0

   e a decompoe em um EFEITO PRECO e um BALDE DE QUANTIDADE avaliado a um
   preco de referencia u (base ou atual, conforme a convencao):

        dReceita_i = Price_i + u*(Q1 - Q0) [+ Cross_i]

   O balde de quantidade e entao dividido em Volume + Mix por uma regra
   explicita `split`, com Volume + Mix = u*(Q1 - Q0) por construcao algebrica
   — nunca por diferenca.
   ------------------------------------------------------------------------ */

/**
 * @typedef {Object} Methodology
 * @property {string} id
 * @property {string} label
 * @property {string} priceFormula
 * @property {string} volumeFormula
 * @property {string} mixFormula
 * @property {string} crossFormula
 * @property {boolean} hasCross
 * @property {'base'|'current'} bucketPrice  qual preco avalia o balde de quantidade
 * @property {(p0:number,p1:number,q0:number,q1:number)=>number} price
 * @property {(p0:number,p1:number,q0:number,q1:number)=>number} cross
 * @property {(u:number,uRef:number,q0:number,q1:number,g:number)=>{volume:number,mix:number}} split
 */

/** @type {Object.<string, Methodology>} */
export const METHODOLOGIES = {
  /* ---- M1 — FTI-style (padrao) -------------------------------------------
     Preco a volume atual (a interacao dP*dQ fica dentro de Price).
     Volume  = item cresce a taxa do portfolio, ao seu proprio preco base.
     Mix     = desvio do item em relacao ao crescimento proporcional,
               avaliado ao preco base do item.
     Identidade: (P1-P0)Q1 + P0*Q0*(g-1) + P0*(Q1 - g*Q0) = P1*Q1 - P0*Q0  OK

     Propriedade: sob crescimento estritamente proporcional (Q1 = g*Q0 para
     todo i) o Mix e zero ITEM A ITEM — e a definicao mais "pura" de mix.
     Equivalencia com a formulacao da FTI: soma(Mix) = soma((P0_i - Pm0) *
     (Q1_i - g*Q0_i)), porque soma(Q1_i - g*Q0_i) = 0 na populacao comparavel.
     Ou seja, o Mix mede o diferencial de preco do item contra a media do
     portfolio aplicado ao desvio de participacao, exatamente como descrito
     conceitualmente pela FTI Consulting.                                   */
  fti: {
    id: "fti",
    label: "FTI-style PVM (padrao)",
    short: "FTI-style",
    bucketPrice: "base",
    hasCross: false,
    priceFormula: "Price_i = (P1_i - P0_i) x Q1_i",
    volumeFormula: "Volume_i = P0_i x Q0_i x (g - 1)",
    mixFormula: "Mix_i = P0_i x (Q1_i - g x Q0_i)  ==  (P0_i - Pm0) x (Q1_i - g x Q0_i)",
    crossFormula: "-- (interacao dP x dQ incorporada em Price)",
    note: "Interacao preco x quantidade incorporada ao efeito Preco (convencao de volume atual). Mix zera item a item sob crescimento proporcional.",
    price: (p0, p1, q0, q1) => (p1 - p0) * q1,
    cross: () => 0,
    split: (u, uRef, q0, q1, g) => ({
      volume: u * q0 * (g - 1),
      mix: u * (q1 - g * q0)
    })
  },

  /* ---- M2 — Volume ao preco medio do portfolio ----------------------------
     Convencao do workbook de referencia do webinar (aba "New method"):
     Volume = variacao de unidades avaliada ao preco medio base do portfolio.
     Mix    = variacao de unidades avaliada ao PREMIO/DESCONTO do item contra
              esse preco medio.
     Identidade: (P1-P0)Q1 + Pm0*(Q1-Q0) + (P0-Pm0)*(Q1-Q0) = P1*Q1 - P0*Q0 OK

     Os TOTAIS de Volume e Mix coincidem com os da M1
     (soma(Volume) = Receita0 * (g-1) nas duas convencoes). A diferenca esta
     apenas na atribuicao por item: aqui o mix de um item nao zera sob
     crescimento proporcional, mas o mix TOTAL zera.                        */
  portfolioAvg: {
    id: "portfolioAvg",
    label: "Volume ao preco medio do portfolio",
    short: "Preco medio",
    bucketPrice: "base",
    hasCross: false,
    priceFormula: "Price_i = (P1_i - P0_i) x Q1_i",
    volumeFormula: "Volume_i = Pm0 x (Q1_i - Q0_i)",
    mixFormula: "Mix_i = (P0_i - Pm0) x (Q1_i - Q0_i)",
    crossFormula: "-- (interacao dP x dQ incorporada em Price)",
    note: "Convencao do workbook de referencia do webinar (aba \"New method\"). Mesmos totais da FTI-style; atribuicao por item diferente.",
    price: (p0, p1, q0, q1) => (p1 - p0) * q1,
    cross: () => 0,
    split: (u, uRef, q0, q1) => ({
      volume: uRef * (q1 - q0),
      mix: (u - uRef) * (q1 - q0)
    })
  },

  /* ---- M3 — Preco a volume base, interacao no balde de quantidade ---------
     Price avaliado a Q0; o balde de quantidade e avaliado ao preco ATUAL,
     o que absorve a interacao em Volume/Mix.
     Identidade: (P1-P0)Q0 + P1*Q0*(g-1) + P1*(Q1 - g*Q0) = P1*Q1 - P0*Q0 OK */
  priorVolume: {
    id: "priorVolume",
    label: "Prior Volume Convention",
    short: "Volume base",
    bucketPrice: "current",
    hasCross: false,
    priceFormula: "Price_i = (P1_i - P0_i) x Q0_i",
    volumeFormula: "Volume_i = P1_i x Q0_i x (g - 1)",
    mixFormula: "Mix_i = P1_i x (Q1_i - g x Q0_i)",
    crossFormula: "-- (interacao dP x dQ incorporada no balde de quantidade)",
    note: "Preco medido sobre o volume do periodo base; a interacao preco x quantidade fica em Volume/Mix.",
    price: (p0, p1, q0) => (p1 - p0) * q0,
    cross: () => 0,
    split: (u, uRef, q0, q1, g) => ({
      volume: u * q0 * (g - 1),
      mix: u * (q1 - g * q0)
    })
  },

  /* ---- M4 — Price / Volume / Mix / Cross ----------------------------------
     A interacao NAO e atribuida a ninguem: vira um balde proprio.
     Identidade: (P1-P0)Q0 + P0*Q0*(g-1) + P0*(Q1-g*Q0) + (P1-P0)*(Q1-Q0)
                 = P1*Q1 - P0*Q0  OK                                        */
  cross: {
    id: "cross",
    label: "Price / Volume / Mix / Cross",
    short: "Cross explicito",
    bucketPrice: "base",
    hasCross: true,
    priceFormula: "Price_i = (P1_i - P0_i) x Q0_i",
    volumeFormula: "Volume_i = P0_i x Q0_i x (g - 1)",
    mixFormula: "Mix_i = P0_i x (Q1_i - g x Q0_i)",
    crossFormula: "Cross_i = (P1_i - P0_i) x (Q1_i - Q0_i)",
    note: "A interacao preco x quantidade e isolada em um balde proprio, sem ser alocada a Price nem a Volume.",
    price: (p0, p1, q0) => (p1 - p0) * q0,
    cross: (p0, p1, q0, q1) => (p1 - p0) * (q1 - q0),
    split: (u, uRef, q0, q1, g) => ({
      volume: u * q0 * (g - 1),
      mix: u * (q1 - g * q0)
    })
  }
};

export const DEFAULT_METHODOLOGY = "fti";

export function getMethodology(id) {
  const m = METHODOLOGIES[id || DEFAULT_METHODOLOGY];
  if (!m) throw new Error('Metodologia PVM desconhecida: "' + id + '"');
  return m;
}

/* ---------------------------------------------------------------------------
   5. AGREGACAO — linhas -> itens comparaveis
   ------------------------------------------------------------------------ */

/**
 * aggregateItems — consolida linhas em itens (uma linha por chave), somando
 * quantidade, receita e COGS dentro de cada periodo.
 *
 * Linhas duplicadas (mesma chave + mesmo periodo) sao SOMADAS, e a ocorrencia
 * e reportada em `duplicates` para que o validador possa expo-la. O motor
 * nunca descarta nem "corrige" silenciosamente uma linha.
 *
 * @param {Array<Object>} rows linhas normalizadas pelo parser
 * @param {Object} opts
 * @param {string} opts.basePeriod
 * @param {string} opts.currentPeriod
 * @param {string[]} [opts.dimensions] dimensoes carregadas junto do item
 * @returns {{items:Array, duplicates:Array, skippedRows:number}}
 */
export function aggregateItems(rows, opts) {
  const basePeriod = String(opts.basePeriod);
  const currentPeriod = String(opts.currentPeriod);
  const dims = opts.dimensions || [];
  const map = new Map();
  const seen = new Map();       // chave+periodo -> contagem, para duplicidade
  const duplicates = [];
  let skippedRows = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const period = r.period == null ? "" : String(r.period);
    const side = period === basePeriod ? 0 : (period === currentPeriod ? 1 : -1);
    if (side < 0) { skippedRows++; continue; }

    const key = r.key;
    if (key == null || key === "") { skippedRows++; continue; }

    let it = map.get(key);
    if (!it) {
      it = {
        key,
        label: (r.label != null && r.label !== "") ? String(r.label) : String(key),
        dims: {},
        uom: null,
        uomSet: new Set(),
        q0: 0, q1: 0, rev0: 0, rev1: 0,
        cogs0: null, cogs1: null,
        rows0: 0, rows1: 0
      };
      for (const d of dims) it.dims[d] = (r.dims && r.dims[d] != null) ? String(r.dims[d]) : "";
      map.set(key, it);
    }
    if (r.uom != null && r.uom !== "") { it.uomSet.add(String(r.uom)); it.uom = String(r.uom); }

    // \u0000 nunca ocorre em um identificador vindo de planilha, entao serve de
    // separador seguro: com um espaco, a chave "A B" no periodo "C" colidiria
    // com a chave "A" no periodo "B C".
    const sk = key + "\u0000" + period;
    const n = (seen.get(sk) || 0) + 1;
    seen.set(sk, n);
    if (n === 2) duplicates.push({ key, period, label: it.label });

    const q = Number.isFinite(r.quantity) ? r.quantity : 0;
    const rev = Number.isFinite(r.revenue) ? r.revenue : 0;
    const hasCogs = Number.isFinite(r.cogs);

    if (side === 0) {
      it.q0 += q; it.rev0 += rev; it.rows0++;
      if (hasCogs) it.cogs0 = (it.cogs0 == null ? 0 : it.cogs0) + r.cogs;
    } else {
      it.q1 += q; it.rev1 += rev; it.rows1++;
      if (hasCogs) it.cogs1 = (it.cogs1 == null ? 0 : it.cogs1) + r.cogs;
    }
  }

  const items = [];
  for (const it of map.values()) {
    it.uomConflict = it.uomSet.size > 1;
    it.uomList = Array.from(it.uomSet);
    delete it.uomSet;
    it.status = classifySku(it);
    it.p0 = it.q0 > 0 ? it.rev0 / it.q0 : null;
    it.p1 = it.q1 > 0 ? it.rev1 / it.q1 : null;
    it.c0 = (it.cogs0 != null && it.q0 > 0) ? it.cogs0 / it.q0 : null;
    it.c1 = (it.cogs1 != null && it.q1 > 0) ? it.cogs1 / it.q1 : null;
    if (it.status !== STATUS.EMPTY) items.push(it);
  }
  return { items, duplicates, skippedRows };
}

/* ---------------------------------------------------------------------------
   6. PARAMETROS DE POPULACAO (g e preco/custo medio base)
   ------------------------------------------------------------------------ */

/**
 * populationStats — parametros calculados SOMENTE sobre a populacao comparavel
 * (status Active). Novos e descontinuados nao entram em g nem em Pm0: se
 * entrassem, o crescimento do portfolio seria contaminado por itens que nao
 * tem par de comparacao, e Volume/Mix deixariam de ser interpretaveis.
 */
export function populationStats(items) {
  const q0 = makeAccumulator(), q1 = makeAccumulator();
  const rev0 = makeAccumulator(), rev1 = makeAccumulator();
  const cogs0 = makeAccumulator(), cogs1 = makeAccumulator();
  const cogsQ0 = makeAccumulator(), cogsQ1 = makeAccumulator();
  let cogsItems = 0, activeItems = 0;

  for (const it of items) {
    if (it.status !== STATUS.ACTIVE) continue;
    activeItems++;
    q0.add(it.q0); q1.add(it.q1);
    rev0.add(it.rev0); rev1.add(it.rev1);
    if (it.c0 != null && it.c1 != null) {
      cogs0.add(it.cogs0); cogs1.add(it.cogs1);
      cogsQ0.add(it.q0); cogsQ1.add(it.q1);
      cogsItems++;
    }
  }
  const Q0 = q0.value, Q1 = q1.value;
  return {
    activeItems,
    quantityBase: Q0,
    quantityCurrent: Q1,
    revenueBase: rev0.value,
    revenueCurrent: rev1.value,
    growthFactor: Q0 > 0 ? Q1 / Q0 : 1,
    avgPriceBase: safeDiv(rev0.value, Q0),
    avgPriceCurrent: safeDiv(rev1.value, Q1),
    // Custo medio ponderado calculado sobre a MESMA populacao que tem COGS,
    // para que Cm0 seja consistente com o total de COGS que ele pondera.
    avgCostBase: cogsItems > 0 ? safeDiv(cogs0.value, cogsQ0.value) : null,
    avgCostCurrent: cogsItems > 0 ? safeDiv(cogs1.value, cogsQ1.value) : null,
    cogsItems
  };
}

/* ---------------------------------------------------------------------------
   7. EFEITOS ELEMENTARES (funcoes puras, testaveis isoladamente)
   ------------------------------------------------------------------------ */

/** Efeito Preco de um item, na convencao escolhida. */
export function calculatePriceEffect(p0, p1, q0, q1, methodology) {
  return getMethodology(methodology).price(p0, p1, q0, q1);
}

/** Efeito Volume de um item, na convencao escolhida. */
export function calculateVolumeEffect(unitBase, unitRef, q0, q1, g, methodology) {
  return getMethodology(methodology).split(unitBase, unitRef, q0, q1, g).volume;
}

/** Efeito Mix de um item, na convencao escolhida. */
export function calculateMixEffect(unitBase, unitRef, q0, q1, g, methodology) {
  return getMethodology(methodology).split(unitBase, unitRef, q0, q1, g).mix;
}

/** Efeito de interacao (Cross) — zero em todas as convencoes exceto "cross". */
export function calculateCrossEffect(p0, p1, q0, q1, methodology) {
  return getMethodology(methodology).cross(p0, p1, q0, q1);
}

/* ---------------------------------------------------------------------------
   8. DECOMPOSICAO DE UM LADO (receita OU custo)
   ----------------------------------------------------------------------------
   `decomposeSide` e o nucleo compartilhado: recebe os campos de um lado
   (valor total e unitario por periodo) e devolve os efeitos por item.
   Receita e COGS usam exatamente a mesma algebra — e isso que garante que a
   ponte de Margem Bruta seja a diferenca exata das duas.
   ------------------------------------------------------------------------ */

function decomposeSide(items, stats, method, side) {
  const m = method;
  const g = stats.growthFactor;

  const out = new Map();
  for (const it of items) {
    const s = side.get(it);
    const e = {
      price: 0, volume: 0, mix: 0, cross: 0,
      new: 0, discontinued: 0, other: 0,
      delta: 0, inScope: !!(s && s.ok)
    };
    if (!e.inScope) { out.set(it.key, e); continue; }

    e.delta = s.v1 - s.v0;

    switch (it.status) {
      case STATUS.ACTIVE: {
        const p0 = s.u0, p1 = s.u1, q0 = it.q0, q1 = it.q1;
        e.price = m.price(p0, p1, q0, q1);
        e.cross = m.cross(p0, p1, q0, q1);
        const u = m.bucketPrice === "current" ? p1 : p0;
        const uRefRaw = m.bucketPrice === "current" ? side.avgCurrent : side.avgBase;
        const uRef = uRefRaw == null ? u : uRefRaw;
        const sp = m.split(u, uRef, q0, q1, g);
        e.volume = sp.volume;
        e.mix = sp.mix;
        break;
      }
      case STATUS.NEW:
        e.new = s.v1;
        break;
      case STATUS.DISCONTINUED:
        e.discontinued = -s.v0;
        break;
      case STATUS.NON_COMPARABLE:
        // Preco unitario indefinido em algum periodo: a variacao inteira vai
        // para um balde explicito, sem contaminar Price/Volume/Mix.
        e.other = s.v1 - s.v0;
        break;
      default:
        break;
    }
    out.set(it.key, e);
  }
  return out;
}

function emptyBuckets() {
  return { price: 0, volume: 0, mix: 0, cross: 0, new: 0, discontinued: 0, other: 0 };
}

function sumBuckets(effectsByKey) {
  const acc = {
    price: makeAccumulator(), volume: makeAccumulator(), mix: makeAccumulator(),
    cross: makeAccumulator(), new: makeAccumulator(), discontinued: makeAccumulator(),
    other: makeAccumulator()
  };
  for (const e of effectsByKey.values()) {
    acc.price.add(e.price); acc.volume.add(e.volume); acc.mix.add(e.mix);
    acc.cross.add(e.cross); acc.new.add(e.new); acc.discontinued.add(e.discontinued);
    acc.other.add(e.other);
  }
  const out = emptyBuckets();
  for (const k of Object.keys(out)) out[k] = acc[k].value;
  return out;
}

/* ---------------------------------------------------------------------------
   9. PVM DE RECEITA
   ------------------------------------------------------------------------ */

/**
 * calculateRevenuePVM — decomposicao completa da variacao de receita.
 *
 * Ponte: Receita_base + Price + Volume + Mix [+ Cross] + New + Discontinued
 *        + Other = Receita_atual
 */
export function calculateRevenuePVM(items, options) {
  const opts = options || {};
  const method = getMethodology(opts.methodology);
  const stats = populationStats(items);

  const side = {
    avgBase: stats.avgPriceBase,
    avgCurrent: stats.avgPriceCurrent,
    get: (it) => ({ v0: it.rev0, v1: it.rev1, u0: it.p0, u1: it.p1, ok: it.status !== STATUS.EMPTY })
  };
  const effects = decomposeSide(items, stats, method, side);
  const buckets = sumBuckets(effects);

  const base = makeAccumulator(), current = makeAccumulator();
  const qBase = makeAccumulator(), qCurrent = makeAccumulator();
  for (const it of items) {
    base.add(it.rev0); current.add(it.rev1);
    qBase.add(it.q0); qCurrent.add(it.q1);
  }
  const revenueBase = base.value, revenueCurrent = current.value;

  const bridge = buildBridge({
    label: "Receita",
    base: revenueBase,
    current: revenueCurrent,
    buckets,
    hasCross: method.hasCross
  });

  return {
    kind: "revenue",
    methodology: method.id,
    methodologyLabel: method.label,
    engineVersion: PVM_ENGINE_VERSION,
    stats,
    base: revenueBase,
    current: revenueCurrent,
    delta: revenueCurrent - revenueBase,
    deltaPct: safeDiv(revenueCurrent - revenueBase, Math.abs(revenueBase)),
    quantityBase: qBase.value,
    quantityCurrent: qCurrent.value,
    quantityDeltaPct: safeDiv(qCurrent.value - qBase.value, Math.abs(qBase.value)),
    avgPriceBase: safeDiv(revenueBase, qBase.value),
    avgPriceCurrent: safeDiv(revenueCurrent, qCurrent.value),
    buckets,
    bridge,
    effects,
    counts: countStatuses(items)
  };
}

/* ---------------------------------------------------------------------------
   10. PVM DE COGS
   ------------------------------------------------------------------------ */

/** Item elegivel a analise de custo: tem COGS nos periodos em que existe. */
export function cogsInScope(it) {
  switch (it.status) {
    case STATUS.ACTIVE:
    case STATUS.NON_COMPARABLE: return it.cogs0 != null && it.cogs1 != null;
    case STATUS.NEW: return it.cogs1 != null;
    case STATUS.DISCONTINUED: return it.cogs0 != null;
    default: return false;
  }
}

/**
 * calculateCostPVM — mesma algebra da receita aplicada ao custo.
 * Escopo: apenas itens com COGS disponivel nos periodos em que o item existe.
 * Itens sem COGS ficam FORA (inScope=false) e sao reportados em `coverage` —
 * o motor jamais assume COGS = 0 para completar a ponte.
 */
export function calculateCostPVM(items, options) {
  const opts = options || {};
  const method = getMethodology(opts.methodology);
  const stats = populationStats(items);

  const side = {
    avgBase: stats.avgCostBase,
    avgCurrent: stats.avgCostCurrent,
    get: (it) => ({
      v0: it.cogs0 == null ? 0 : it.cogs0,
      v1: it.cogs1 == null ? 0 : it.cogs1,
      u0: it.c0, u1: it.c1,
      ok: cogsInScope(it)
    })
  };
  const effects = decomposeSide(items, stats, method, side);
  const buckets = sumBuckets(effects);

  const base = makeAccumulator(), current = makeAccumulator();
  let covered = 0, total = 0;
  const coveredRevBase = makeAccumulator(), totalRevBase = makeAccumulator();
  for (const it of items) {
    total++; totalRevBase.add(it.rev0);
    if (!cogsInScope(it)) continue;
    covered++; coveredRevBase.add(it.rev0);
    base.add(it.cogs0 == null ? 0 : it.cogs0);
    current.add(it.cogs1 == null ? 0 : it.cogs1);
  }
  const cogsBase = base.value, cogsCurrent = current.value;

  const bridge = buildBridge({
    label: "COGS",
    base: cogsBase,
    current: cogsCurrent,
    buckets,
    hasCross: method.hasCross
  });

  return {
    kind: "cogs",
    methodology: method.id,
    engineVersion: PVM_ENGINE_VERSION,
    base: cogsBase,
    current: cogsCurrent,
    delta: cogsCurrent - cogsBase,
    buckets,
    bridge,
    effects,
    coverage: {
      items: covered,
      totalItems: total,
      itemShare: safeDiv(covered, total),
      revenueShare: safeDiv(coveredRevBase.value, totalRevBase.value),
      complete: covered === total
    }
  };
}

/* ---------------------------------------------------------------------------
   11. PVM DE MARGEM BRUTA
   ----------------------------------------------------------------------------
   A ponte de GM e construida como a DIFERENCA EXATA entre a ponte de receita
   e a ponte de custo, restrita a populacao com COGS disponivel.

     GM Base
     + Selling Price          =  soma(Price^receita)
     - Unit Cost / Inflation  = -soma(Price^custo)
     + Volume                 =  soma(Volume^receita - Volume^custo)
     + Sales Mix              =  soma(Mix^receita)
     - Cost Mix               = -soma(Mix^custo)
     [+ Cross                 =  soma(Cross^receita - Cross^custo)]
     + New products           =  soma(Receita1 - COGS1) dos novos
     + Discontinued           = -soma(Receita0 - COGS0) dos descontinuados
     + Other                  =  soma(dGM) dos nao comparaveis
     = GM Atual

   Como cada lado fecha exatamente item a item, a diferenca tambem fecha.
   Na convencao FTI-style isso equivale a:
     Volume_i    = (P0_i - C0_i) x Q0_i x (g - 1)   -> margem unitaria base
     SalesMix_i  =  P0_i x (Q1_i - g x Q0_i)
     CostMix_i   = -C0_i x (Q1_i - g x Q0_i)
   ------------------------------------------------------------------------ */

export function calculateGrossMarginPVM(items, options) {
  const opts = options || {};
  const method = getMethodology(opts.methodology);
  const revenue = calculateRevenuePVM(items, { methodology: method.id });
  const cost = calculateCostPVM(items, { methodology: method.id });

  const effects = new Map();
  const acc = {
    sellingPrice: makeAccumulator(), unitCost: makeAccumulator(),
    volume: makeAccumulator(), salesMix: makeAccumulator(), costMix: makeAccumulator(),
    cross: makeAccumulator(), new: makeAccumulator(), discontinued: makeAccumulator(),
    other: makeAccumulator()
  };
  const gmBase = makeAccumulator(), gmCurrent = makeAccumulator();
  const revBaseScoped = makeAccumulator(), revCurScoped = makeAccumulator();

  for (const it of items) {
    const r = revenue.effects.get(it.key);
    const c = cost.effects.get(it.key);
    const ok = !!(c && c.inScope);
    const e = {
      sellingPrice: 0, unitCost: 0, volume: 0, salesMix: 0, costMix: 0,
      cross: 0, new: 0, discontinued: 0, other: 0, delta: 0, inScope: ok
    };
    if (ok) {
      e.sellingPrice = r.price;
      e.unitCost = -c.price;
      e.volume = r.volume - c.volume;
      e.salesMix = r.mix;
      e.costMix = -c.mix;
      e.cross = r.cross - c.cross;
      e.new = r.new - c.new;
      e.discontinued = r.discontinued - c.discontinued;
      e.other = r.other - c.other;
      e.delta = r.delta - c.delta;

      acc.sellingPrice.add(e.sellingPrice); acc.unitCost.add(e.unitCost);
      acc.volume.add(e.volume); acc.salesMix.add(e.salesMix); acc.costMix.add(e.costMix);
      acc.cross.add(e.cross); acc.new.add(e.new);
      acc.discontinued.add(e.discontinued); acc.other.add(e.other);

      gmBase.add(it.rev0 - (it.cogs0 == null ? 0 : it.cogs0));
      gmCurrent.add(it.rev1 - (it.cogs1 == null ? 0 : it.cogs1));
      revBaseScoped.add(it.rev0); revCurScoped.add(it.rev1);
    }
    effects.set(it.key, e);
  }

  const buckets = {
    sellingPrice: acc.sellingPrice.value,
    unitCost: acc.unitCost.value,
    volume: acc.volume.value,
    salesMix: acc.salesMix.value,
    costMix: acc.costMix.value,
    cross: acc.cross.value,
    new: acc.new.value,
    discontinued: acc.discontinued.value,
    other: acc.other.value
  };

  const base = gmBase.value, current = gmCurrent.value;
  const gmPctBase = safeDiv(base, revBaseScoped.value);
  const gmPctCurrent = safeDiv(current, revCurScoped.value);

  const order = ["sellingPrice", "unitCost", "volume", "salesMix", "costMix"];
  if (method.hasCross) order.push("cross");
  order.push("new", "discontinued", "other");

  const bridge = buildBridgeFromOrder({
    label: "Margem Bruta", base, current, buckets, order, labels: GM_BUCKET_LABELS
  });

  return {
    kind: "grossMargin",
    methodology: method.id,
    methodologyLabel: method.label,
    engineVersion: PVM_ENGINE_VERSION,
    base, current,
    delta: current - base,
    revenueBase: revBaseScoped.value,
    revenueCurrent: revCurScoped.value,
    gmPctBase, gmPctCurrent,
    gmPctDeltaPP: (gmPctBase == null || gmPctCurrent == null) ? null : (gmPctCurrent - gmPctBase),
    buckets, bridge, effects,
    coverage: cost.coverage,
    revenue, cost
  };
}

/* ---------------------------------------------------------------------------
   12. PONTE E RECONCILIACAO
   ------------------------------------------------------------------------ */

export const REVENUE_BUCKET_LABELS = {
  price: "Price", volume: "Volume", mix: "Mix", cross: "Cross",
  new: "New products", discontinued: "Discontinued", other: "Other / nao comparavel"
};
export const GM_BUCKET_LABELS = {
  sellingPrice: "Selling price", unitCost: "Unit cost / inflation",
  volume: "Volume", salesMix: "Sales mix", costMix: "Cost mix", cross: "Cross",
  new: "New products", discontinued: "Discontinued", other: "Other / nao comparavel"
};

function buildBridge({ label, base, current, buckets, hasCross }) {
  const order = ["price", "volume", "mix"];
  if (hasCross) order.push("cross");
  order.push("new", "discontinued", "other");
  return buildBridgeFromOrder({ label, base, current, buckets, order, labels: REVENUE_BUCKET_LABELS });
}

function buildBridgeFromOrder({ label, base, current, buckets, order, labels }) {
  const steps = order.map(k => ({ key: k, label: (labels && labels[k]) || k, value: buckets[k] || 0 }));
  const effectsSum = kahanSum(steps.map(s => s.value));
  const expected = base + effectsSum;
  const residual = current - expected;
  const tolerance = reconciliationTolerance(current);
  return {
    label, base, current,
    delta: current - base,
    steps,
    effectsSum,
    expected,
    residual,
    tolerance,
    pass: Math.abs(residual) <= tolerance,
    status: Math.abs(residual) <= tolerance ? "PASS" : "FAIL"
  };
}

/**
 * reconcileBridge — verificacao independente da identidade da ponte.
 * Recalcula a soma dos efeitos e a compara com a variacao observada, sem
 * reutilizar o total ja produzido pela decomposicao.
 */
export function reconcileBridge(base, current, effects, tolerance) {
  const values = Array.isArray(effects) ? effects.slice() : Object.values(effects || {});
  const effectsSum = kahanSum(values);
  const expected = base + effectsSum;
  const residual = current - expected;
  const tol = tolerance == null ? reconciliationTolerance(current) : tolerance;
  return {
    base, current, effectsSum, expected, residual,
    tolerance: tol,
    pass: Math.abs(residual) <= tol,
    status: Math.abs(residual) <= tol ? "PASS" : "FAIL"
  };
}

/* ---------------------------------------------------------------------------
   13. AGREGACAO POR DIMENSAO
   ----------------------------------------------------------------------------
   Protocolo 14: calcular SEMPRE na menor granularidade (SKU) e depois AGREGAR
   os efeitos ja calculados. Nunca recalcular PVM sobre medias agregadas —
   isso destruiria o efeito Mix interno ao grupo.
   ------------------------------------------------------------------------ */

export function groupValueOf(it, dimension) {
  if (!dimension || dimension === "__key__") return it.label || String(it.key);
  if (dimension === "__status__") return it.status;
  if (dimension === "__uom__") return it.uom || "(sem UOM)";
  const v = it.dims ? it.dims[dimension] : "";
  return (v == null || v === "") ? "(vazio)" : v;
}

export function aggregateEffectsBy(items, result, dimension) {
  const groups = new Map();
  const bucketKeys = Object.keys(result.buckets);

  for (const it of items) {
    const e = result.effects.get(it.key);
    if (!e || !e.inScope) continue;
    const g = groupValueOf(it, dimension);
    let row = groups.get(g);
    if (!row) {
      row = { group: g, items: 0, base: 0, current: 0, delta: 0, q0: 0, q1: 0 };
      for (const b of bucketKeys) row[b] = 0;
      groups.set(g, row);
    }
    row.items++;
    row.q0 += it.q0; row.q1 += it.q1;
    if (result.kind === "cogs") {
      row.base += it.cogs0 == null ? 0 : it.cogs0;
      row.current += it.cogs1 == null ? 0 : it.cogs1;
    } else if (result.kind === "grossMargin") {
      row.base += it.rev0 - (it.cogs0 == null ? 0 : it.cogs0);
      row.current += it.rev1 - (it.cogs1 == null ? 0 : it.cogs1);
    } else {
      row.base += it.rev0; row.current += it.rev1;
    }
    row.delta = row.current - row.base;
    for (const b of bucketKeys) row[b] += (e[b] || 0);
  }
  return Array.from(groups.values()).sort((a, b) => b.delta - a.delta);
}

export function countStatuses(items) {
  const c = { active: 0, new: 0, discontinued: 0, "non-comparable": 0, empty: 0, total: 0 };
  for (const it of items) { c[it.status] = (c[it.status] || 0) + 1; c.total++; }
  return c;
}

/* ---------------------------------------------------------------------------
   14. MATRIZ DE MIX
   ----------------------------------------------------------------------------
   Eixo X: diferencial de preco do item contra o preco medio base do portfolio.
   Eixo Y: variacao de participacao em quantidade (share atual - share base).
   Bolha : receita do periodo atual.
   Quadrantes: (X>0, Y>0) = mix favoravel; (X<0, Y>0) = mix desfavoravel.
   ------------------------------------------------------------------------ */

export function mixMatrix(items, revenueResult) {
  const stats = revenueResult.stats;
  const pBar = stats.avgPriceBase;
  const Q0 = stats.quantityBase, Q1 = stats.quantityCurrent;
  const out = [];
  for (const it of items) {
    if (it.status !== STATUS.ACTIVE) continue;
    const e = revenueResult.effects.get(it.key);
    const share0 = Q0 > 0 ? it.q0 / Q0 : null;
    const share1 = Q1 > 0 ? it.q1 / Q1 : null;
    if (share0 == null || share1 == null || pBar == null) continue;
    out.push({
      key: it.key,
      label: it.label,
      dims: it.dims,
      priceDifferential: it.p0 - pBar,
      priceDifferentialPct: pBar !== 0 ? (it.p0 - pBar) / pBar : null,
      shareBase: share0,
      shareCurrent: share1,
      shareChange: share1 - share0,
      revenueCurrent: it.rev1,
      mixEffect: e ? e.mix : 0
    });
  }
  return out;
}

/* ---------------------------------------------------------------------------
   15. TOP DRIVERS
   ------------------------------------------------------------------------ */

export function topDrivers(items, result, bucket, n) {
  const rows = [];
  for (const it of items) {
    const e = result.effects.get(it.key);
    if (!e || !e.inScope) continue;
    const v = e[bucket];
    if (!Number.isFinite(v) || v === 0) continue;
    rows.push({ key: it.key, label: it.label, dims: it.dims, status: it.status, value: v });
  }
  const take = n || 5;
  return {
    positive: rows.filter(r => r.value > 0).sort((a, b) => b.value - a.value).slice(0, take),
    negative: rows.filter(r => r.value < 0).sort((a, b) => a.value - b.value).slice(0, take)
  };
}

/* ---------------------------------------------------------------------------
   16. VERIFICACAO DE UNIDADES DE MEDIDA (protocolo 15)
   ------------------------------------------------------------------------ */

export const UOM_WARNING =
  "Mix analysis requires comparable units of measure. " +
  "Select a homogeneous UOM or use an alternative decomposition.";

export function checkUnitsOfMeasure(items) {
  const set = new Set();
  const perItemConflicts = [];
  for (const it of items) {
    if (it.status === STATUS.EMPTY) continue;
    if (it.uomConflict) perItemConflicts.push({ key: it.key, label: it.label, uoms: it.uomList });
    if (it.uom) set.add(it.uom);
  }
  const list = Array.from(set);
  return {
    declared: list.length > 0,
    units: list,
    heterogeneous: list.length > 1,
    itemConflicts: perItemConflicts,
    message: list.length > 1 ? UOM_WARNING : null
  };
}

/* ---------------------------------------------------------------------------
   17. COMPARACAO DE METODOLOGIAS (educacional)
   ------------------------------------------------------------------------ */

export function compareMethodologies(items) {
  return Object.keys(METHODOLOGIES).map(id => {
    const r = calculateRevenuePVM(items, { methodology: id });
    const m = METHODOLOGIES[id];
    return {
      id,
      label: m.label,
      priceFormula: m.priceFormula,
      volumeFormula: m.volumeFormula,
      mixFormula: m.mixFormula,
      crossFormula: m.crossFormula,
      hasCross: m.hasCross,
      buckets: r.buckets,
      residual: r.bridge.residual,
      pass: r.bridge.pass
    };
  });
}

/* ---------------------------------------------------------------------------
   18. FILTRO DE ITENS (recalculo completo — nunca reaproveita efeitos)
   ----------------------------------------------------------------------------
   Filtrar muda a POPULACAO comparavel e, portanto, muda g e Pm0. Reaproveitar
   efeitos calculados na populacao cheia produziria uma ponte que nao fecha.
   Por isso o app sempre refiltra os itens e recalcula do zero.
   ------------------------------------------------------------------------ */

export function filterItems(items, filters) {
  if (!filters) return items;
  const entries = Object.entries(filters).filter(([, v]) => Array.isArray(v) && v.length > 0);
  if (entries.length === 0) return items;
  return items.filter(it => entries.every(([dim, allowed]) => allowed.includes(groupValueOf(it, dim))));
}

export function distinctValues(items, dimension) {
  const s = new Set();
  for (const it of items) s.add(groupValueOf(it, dimension));
  return Array.from(s).sort((a, b) => String(a).localeCompare(String(b), "pt-BR"));
}

/* ---------------------------------------------------------------------------
   19. FACADE — executa a analise completa
   ------------------------------------------------------------------------ */

export function runAnalysis(items, options) {
  const opts = options || {};
  const method = getMethodology(opts.methodology);
  const revenue = calculateRevenuePVM(items, { methodology: method.id });
  const hasCogs = items.some(it => it.cogs0 != null || it.cogs1 != null);
  const grossMargin = hasCogs ? calculateGrossMarginPVM(items, { methodology: method.id }) : null;
  const uom = checkUnitsOfMeasure(items);

  return {
    engineVersion: PVM_ENGINE_VERSION,
    methodology: method.id,
    methodologyLabel: method.label,
    calculatedAt: new Date().toISOString(),
    revenue,
    cost: grossMargin ? grossMargin.cost : null,
    grossMargin,
    uom,
    hasCogs,
    counts: revenue.counts
  };
}
