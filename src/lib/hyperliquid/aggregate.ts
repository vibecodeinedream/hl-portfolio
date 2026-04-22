import type { Wallet } from "@/lib/store/wallets";
import type {
  AllMids,
  ClearinghouseState,
  PortfolioData,
  PortfolioPeriod,
  PortfolioResponse,
  SpotClearinghouseState,
  SpotMeta,
} from "./types";
import { parseNum } from "@/lib/utils/format";

export type WalletSnapshot = {
  wallet: Wallet;
  perp: ClearinghouseState | null;
  spot: SpotClearinghouseState | null;
  portfolio: PortfolioResponse | null;
  error?: string;
};

export type AggregatedPosition = {
  walletId: string;
  walletLabel: string;
  walletColor: string;
  coin: string;
  side: "LONG" | "SHORT";
  sz: number;
  entryPx: number | null;
  markPx: number | null;
  positionValue: number;
  unrealizedPnl: number;
  roePct: number;
  liquidationPx: number | null;
  marginUsed: number;
  leverage: number;
  leverageType: "cross" | "isolated";
  cumFunding: number;
};

export type GroupedPosition = {
  coin: string;
  side: "LONG" | "SHORT" | "MIXED";
  sz: number; // signed sum
  netSz: number; // absolute size of net position
  entryPx: number | null; // size-weighted avg entry (of net direction)
  markPx: number | null;
  positionValue: number; // net notional value (signed direction)
  unrealizedPnl: number;
  marginUsed: number;
  contributors: {
    walletId: string;
    walletLabel: string;
    walletColor: string;
    sz: number;
    positionValue: number;
  }[];
};

export type SpotHolding = {
  walletId: string;
  walletLabel: string;
  walletColor: string;
  coin: string;      // resolved human name (e.g. "HYPE")
  rawCoin: string;   // original API coin (e.g. "@107" or "PURR/USDC")
  total: number;
  usdValue: number;
};

export type AggregateSummary = {
  totalAccountValue: number;    // perp accountValue sum (enabled only)
  totalPerpValue: number;       // same as totalAccountValue, alias for clarity
  totalPositionValue: number;
  totalUnrealizedPnl: number;
  weightedRoePct: number;       // positionValue-weighted ROE %
  totalWithdrawable: number;
  totalMarginUsed: number;
  weightedLeverage: number;     // totalPositionValue / totalAccountValue
  marginUsagePct: number;       // totalMarginUsed / totalAccountValue * 100
  spotUsdValue: number;
  totalValue: number;           // perp + spot
  activeWallets: number;
  totalWallets: number;
};

export type EquityPoint = { ts: number; value: number; perWallet: Record<string, number> };

export type AggregateResult = {
  summary: AggregateSummary;
  positions: AggregatedPosition[];
  grouped: GroupedPosition[];
  spot: SpotHolding[];
  perWallet: Map<string, WalletPerWalletSummary>;
};

export type WalletPerWalletSummary = {
  walletId: string;
  accountValue: number;
  unrealizedPnl: number;
  positionValue: number;
  marginUsed: number;
  withdrawable: number;
  spotUsd: number;
};

// ------- Spot coin resolution -------

export function resolveSpotCoin(rawCoin: string, spotMeta: SpotMeta | null): {
  name: string;
  tokenIdx: number | null;
  weiDecimals: number;
} {
  if (!spotMeta) return { name: rawCoin, tokenIdx: null, weiDecimals: 0 };
  // "PURR/USDC" style — the base token name is before the slash
  if (rawCoin.includes("/")) {
    const base = rawCoin.split("/")[0];
    const tok = spotMeta.tokens.find((t) => t.name === base);
    return {
      name: base,
      tokenIdx: tok?.index ?? null,
      weiDecimals: tok?.weiDecimals ?? 0,
    };
  }
  // "@<index>" style — universe[index] gives the pair, first token is base
  if (rawCoin.startsWith("@")) {
    const idx = parseInt(rawCoin.slice(1), 10);
    const universe = spotMeta.universe[idx];
    if (!universe) return { name: rawCoin, tokenIdx: null, weiDecimals: 0 };
    const baseIdx = universe.tokens[0];
    const tok = spotMeta.tokens[baseIdx];
    return {
      name: tok?.name ?? rawCoin,
      tokenIdx: baseIdx,
      weiDecimals: tok?.weiDecimals ?? 0,
    };
  }
  return { name: rawCoin, tokenIdx: null, weiDecimals: 0 };
}

// Resolve a USD price for a spot balance.
// Strategy: look up allMids for "@<universeIndex>" (the pair price in USDC)
// or for "PURR/USDC" directly.
export function priceSpotCoin(
  rawCoin: string,
  spotMeta: SpotMeta | null,
  mids: AllMids | null,
): number | null {
  if (!mids) return null;
  const direct = mids[rawCoin];
  if (direct) return parseNum(direct);
  if (!spotMeta) return null;
  if (rawCoin.startsWith("@")) {
    const idx = parseInt(rawCoin.slice(1), 10);
    const universe = spotMeta.universe[idx];
    if (!universe) return null;
    // Find a universe entry where this token pairs with USDC (tokens[1] name == USDC)
    const baseIdx = universe.tokens[0];
    // For tokens with multiple pairs, prefer USDC quote
    const usdcPair = spotMeta.universe.find((u) => {
      const base = u.tokens[0];
      const quote = u.tokens[1];
      return base === baseIdx && spotMeta.tokens[quote]?.name === "USDC";
    });
    if (usdcPair) {
      const mk = `@${usdcPair.index}`;
      if (mids[mk]) return parseNum(mids[mk]);
    }
  }
  // USDC → 1
  const info = resolveSpotCoin(rawCoin, spotMeta);
  if (info.name === "USDC") return 1;
  return null;
}

// ------- Portfolio equity curve alignment -------

export function getPeriodData(
  portfolio: PortfolioResponse | null,
  period: PortfolioPeriod,
): PortfolioData | null {
  if (!portfolio) return null;
  const entry = portfolio.find((p) => p[0] === period);
  return entry?.[1] ?? null;
}

// Merge accountValueHistory across wallets using step-function forward-fill.
// All timestamps from enabled wallets are collected, sorted. For each ts, each wallet's
// value is the most recent sample <= ts, or 0 if none yet.
export function mergeEquityCurves(
  snapshots: WalletSnapshot[],
  period: PortfolioPeriod,
): EquityPoint[] {
  const series = snapshots
    .filter((s) => s.wallet.enabled && s.portfolio)
    .map((s) => {
      const data = getPeriodData(s.portfolio, period);
      const hist: [number, number][] = (data?.accountValueHistory ?? [])
        .map(([ts, v]) => [ts, parseNum(v)] as [number, number])
        .sort((a, b) => a[0] - b[0]);
      return { id: s.wallet.id, hist };
    })
    .filter((x) => x.hist.length > 0);

  if (series.length === 0) return [];

  const allTs = Array.from(
    new Set(series.flatMap((s) => s.hist.map(([t]) => t))),
  ).sort((a, b) => a - b);

  const cursors = series.map(() => 0);
  const lastVals = series.map(() => 0);

  const points: EquityPoint[] = [];
  for (const ts of allTs) {
    const perWallet: Record<string, number> = {};
    let total = 0;
    series.forEach((s, i) => {
      while (
        cursors[i] < s.hist.length &&
        s.hist[cursors[i]][0] <= ts
      ) {
        lastVals[i] = s.hist[cursors[i]][1];
        cursors[i]++;
      }
      perWallet[s.id] = lastVals[i];
      total += lastVals[i];
    });
    points.push({ ts, value: total, perWallet });
  }
  return points;
}

// ------- Positions -------

export function buildPositions(
  snapshots: WalletSnapshot[],
  mids: AllMids | null,
): AggregatedPosition[] {
  const out: AggregatedPosition[] = [];
  for (const snap of snapshots) {
    if (!snap.wallet.enabled || !snap.perp) continue;
    for (const ap of snap.perp.assetPositions) {
      const p = ap.position;
      const sz = parseNum(p.szi);
      if (sz === 0) continue;
      const markPx = mids?.[p.coin] ? parseNum(mids[p.coin]) : null;
      const entry = p.entryPx ? parseNum(p.entryPx) : null;
      const positionValue = parseNum(p.positionValue);
      const unrealizedPnl = parseNum(p.unrealizedPnl);
      const roe = parseNum(p.returnOnEquity) * 100;
      const lev =
        p.leverage.type === "isolated"
          ? p.leverage.value
          : p.leverage.value;
      const cum = p.cumFunding ? parseNum(p.cumFunding.sinceOpen) : 0;
      out.push({
        walletId: snap.wallet.id,
        walletLabel: snap.wallet.label,
        walletColor: snap.wallet.color,
        coin: p.coin,
        side: sz >= 0 ? "LONG" : "SHORT",
        sz,
        entryPx: entry,
        markPx,
        positionValue,
        unrealizedPnl,
        roePct: roe,
        liquidationPx: p.liquidationPx ? parseNum(p.liquidationPx) : null,
        marginUsed: parseNum(p.marginUsed),
        leverage: lev,
        leverageType: p.leverage.type,
        cumFunding: cum,
      });
    }
  }
  out.sort((a, b) => b.positionValue - a.positionValue);
  return out;
}

export function groupPositions(positions: AggregatedPosition[]): GroupedPosition[] {
  const byCoin = new Map<string, AggregatedPosition[]>();
  for (const p of positions) {
    const arr = byCoin.get(p.coin) ?? [];
    arr.push(p);
    byCoin.set(p.coin, arr);
  }
  const out: GroupedPosition[] = [];
  for (const [coin, arr] of byCoin) {
    let signedSz = 0;
    let notional = 0;
    let upnl = 0;
    let margin = 0;
    let signedValue = 0;
    let weightedEntryNumerator = 0;
    let weightedEntryDenominator = 0;
    const contributors: GroupedPosition["contributors"] = [];
    const sides = new Set<"LONG" | "SHORT">();
    let markPx: number | null = null;
    for (const p of arr) {
      signedSz += p.sz;
      notional += p.positionValue;
      signedValue += (p.side === "LONG" ? 1 : -1) * p.positionValue;
      upnl += p.unrealizedPnl;
      margin += p.marginUsed;
      sides.add(p.side);
      if (p.entryPx !== null) {
        weightedEntryNumerator += p.entryPx * Math.abs(p.sz);
        weightedEntryDenominator += Math.abs(p.sz);
      }
      if (p.markPx !== null) markPx = p.markPx;
      contributors.push({
        walletId: p.walletId,
        walletLabel: p.walletLabel,
        walletColor: p.walletColor,
        sz: p.sz,
        positionValue: p.positionValue,
      });
    }
    const side: GroupedPosition["side"] =
      sides.size === 2 ? "MIXED" : signedSz >= 0 ? "LONG" : "SHORT";
    out.push({
      coin,
      side,
      sz: signedSz,
      netSz: Math.abs(signedSz),
      entryPx: weightedEntryDenominator
        ? weightedEntryNumerator / weightedEntryDenominator
        : null,
      markPx,
      positionValue: Math.abs(signedValue),
      unrealizedPnl: upnl,
      marginUsed: margin,
      contributors,
    });
  }
  out.sort((a, b) => b.positionValue - a.positionValue);
  return out;
}

// ------- Spot -------

export function buildSpot(
  snapshots: WalletSnapshot[],
  spotMeta: SpotMeta | null,
  mids: AllMids | null,
): SpotHolding[] {
  const out: SpotHolding[] = [];
  for (const snap of snapshots) {
    if (!snap.wallet.enabled || !snap.spot) continue;
    for (const bal of snap.spot.balances) {
      const total = parseNum(bal.total);
      if (total === 0) continue;
      const info = resolveSpotCoin(bal.coin, spotMeta);
      const px = priceSpotCoin(bal.coin, spotMeta, mids);
      out.push({
        walletId: snap.wallet.id,
        walletLabel: snap.wallet.label,
        walletColor: snap.wallet.color,
        coin: info.name,
        rawCoin: bal.coin,
        total,
        usdValue: px !== null ? total * px : 0,
      });
    }
  }
  out.sort((a, b) => b.usdValue - a.usdValue);
  return out;
}

// ------- Main aggregator -------

export function aggregate(
  snapshots: WalletSnapshot[],
  mids: AllMids | null,
  spotMeta: SpotMeta | null,
): AggregateResult {
  const positions = buildPositions(snapshots, mids);
  const grouped = groupPositions(positions);
  const spot = buildSpot(snapshots, spotMeta, mids);

  let totalAccountValue = 0;
  let totalPositionValue = 0;
  let totalUnrealizedPnl = 0;
  let weightedRoeNum = 0;
  let weightedRoeDen = 0;
  let totalWithdrawable = 0;
  let totalMarginUsed = 0;
  let activeWallets = 0;
  const perWallet = new Map<string, WalletPerWalletSummary>();

  for (const snap of snapshots) {
    const sum: WalletPerWalletSummary = {
      walletId: snap.wallet.id,
      accountValue: 0,
      unrealizedPnl: 0,
      positionValue: 0,
      marginUsed: 0,
      withdrawable: 0,
      spotUsd: 0,
    };
    if (snap.perp) {
      sum.accountValue = parseNum(snap.perp.marginSummary.accountValue);
      sum.positionValue = parseNum(snap.perp.marginSummary.totalNtlPos);
      sum.marginUsed = parseNum(snap.perp.marginSummary.totalMarginUsed);
      sum.withdrawable = parseNum(snap.perp.withdrawable);
      for (const ap of snap.perp.assetPositions) {
        sum.unrealizedPnl += parseNum(ap.position.unrealizedPnl);
      }
    }
    if (snap.spot) {
      for (const bal of snap.spot.balances) {
        const total = parseNum(bal.total);
        if (!total) continue;
        const px = priceSpotCoin(bal.coin, spotMeta, mids);
        if (px !== null) sum.spotUsd += total * px;
      }
    }
    perWallet.set(snap.wallet.id, sum);

    if (!snap.wallet.enabled) continue;
    activeWallets++;
    totalAccountValue += sum.accountValue;
    totalPositionValue += sum.positionValue;
    totalUnrealizedPnl += sum.unrealizedPnl;
    totalMarginUsed += sum.marginUsed;
    totalWithdrawable += sum.withdrawable;
  }
  for (const p of positions) {
    weightedRoeNum += p.roePct * p.positionValue;
    weightedRoeDen += p.positionValue;
  }
  const weightedRoePct = weightedRoeDen > 0 ? weightedRoeNum / weightedRoeDen : 0;
  const weightedLeverage =
    totalAccountValue > 0 ? totalPositionValue / totalAccountValue : 0;
  const marginUsagePct =
    totalAccountValue > 0 ? (totalMarginUsed / totalAccountValue) * 100 : 0;
  const spotUsdValue = spot.reduce((acc, s) => acc + s.usdValue, 0);

  return {
    summary: {
      totalAccountValue,
      totalPerpValue: totalAccountValue,
      totalPositionValue,
      totalUnrealizedPnl,
      weightedRoePct,
      totalWithdrawable,
      totalMarginUsed,
      weightedLeverage,
      marginUsagePct,
      spotUsdValue,
      totalValue: totalAccountValue + spotUsdValue,
      activeWallets,
      totalWallets: snapshots.length,
    },
    positions,
    grouped,
    spot,
    perWallet,
  };
}
