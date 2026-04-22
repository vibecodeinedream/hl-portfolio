// TypeScript types for Hyperliquid /info endpoint responses.
// All numeric values come back as strings unless noted. Always parseFloat before math.

export type HexAddress = `0x${string}`;

export type MarginSummary = {
  accountValue: string;
  totalNtlPos: string;
  totalRawUsd: string;
  totalMarginUsed: string;
};

export type LeverageInfo =
  | { type: "cross"; value: number }
  | { type: "isolated"; value: number; rawUsd: string };

export type AssetPosition = {
  type: "oneWay";
  position: {
    coin: string;
    szi: string; // signed size; negative = short
    entryPx: string | null;
    positionValue: string;
    unrealizedPnl: string;
    returnOnEquity: string;
    leverage: LeverageInfo;
    liquidationPx: string | null;
    marginUsed: string;
    maxLeverage?: number;
    cumFunding?: {
      allTime: string;
      sinceOpen: string;
      sinceChange: string;
    };
  };
};

export type ClearinghouseState = {
  marginSummary: MarginSummary;
  crossMarginSummary: MarginSummary;
  crossMaintenanceMarginUsed: string;
  withdrawable: string;
  assetPositions: AssetPosition[];
  time: number;
};

export type SpotBalance = {
  coin: string; // "PURR/USDC" or "@<idx>"
  token: number;
  total: string;
  hold: string;
  entryNtl?: string;
};

export type SpotClearinghouseState = {
  balances: SpotBalance[];
};

export type PortfolioPeriod =
  | "day"
  | "week"
  | "month"
  | "allTime"
  | "perpDay"
  | "perpWeek"
  | "perpMonth"
  | "perpAllTime";

export type PortfolioData = {
  accountValueHistory: [number, string][];
  pnlHistory: [number, string][];
  vlm: string;
};

export type PortfolioResponse = [PortfolioPeriod, PortfolioData][];

export type Fill = {
  coin: string;
  px: string;
  sz: string;
  side: "B" | "A"; // B = buy, A = ask/sell
  time: number;
  startPosition: string;
  dir: string; // "Open Long", "Close Short", etc.
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
  tid: number;
  feeToken?: string;
  builderFee?: string;
};

export type FundingEvent = {
  time: number;
  hash: string;
  delta: {
    type: "funding";
    coin: string;
    usdc: string;
    szi: string;
    fundingRate: string;
    nSamples?: number;
  };
};

export type AllMids = Record<string, string>;

export type SpotMetaToken = {
  name: string;
  szDecimals: number;
  weiDecimals: number;
  index: number;
  tokenId: string;
  isCanonical: boolean;
  evmContract?: unknown;
  fullName?: string;
};

export type SpotMetaUniverse = {
  name: string;
  tokens: number[]; // [baseIndex, quoteIndex]
  index: number;
  isCanonical: boolean;
};

export type SpotMeta = {
  tokens: SpotMetaToken[];
  universe: SpotMetaUniverse[];
};
