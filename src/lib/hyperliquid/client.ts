import type {
  AllMids,
  ClearinghouseState,
  Fill,
  FundingEvent,
  PortfolioResponse,
  SpotClearinghouseState,
  SpotMeta,
} from "./types";

const BASE_URL = "https://api.hyperliquid.xyz/info";

export class RateLimitError extends Error {
  constructor() {
    super("Hyperliquid rate limit hit (429)");
  }
}

async function post<T>(body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (res.status === 429) throw new RateLimitError();
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HL ${res.status}: ${txt.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export function fetchPerp(user: string, signal?: AbortSignal) {
  return post<ClearinghouseState>({ type: "clearinghouseState", user }, signal);
}

export function fetchSpot(user: string, signal?: AbortSignal) {
  return post<SpotClearinghouseState>(
    { type: "spotClearinghouseState", user },
    signal,
  );
}

export function fetchPortfolio(user: string, signal?: AbortSignal) {
  return post<PortfolioResponse>({ type: "portfolio", user }, signal);
}

export function fetchAllMids(signal?: AbortSignal) {
  return post<AllMids>({ type: "allMids" }, signal);
}

export function fetchSpotMeta(signal?: AbortSignal) {
  return post<SpotMeta>({ type: "spotMeta" }, signal);
}

export function fetchFills(user: string, signal?: AbortSignal) {
  return post<Fill[]>({ type: "userFills", user }, signal);
}

export function fetchFillsByTime(
  user: string,
  startTime: number,
  endTime?: number,
  signal?: AbortSignal,
) {
  const body: Record<string, unknown> = {
    type: "userFillsByTime",
    user,
    startTime,
  };
  if (endTime !== undefined) body.endTime = endTime;
  return post<Fill[]>(body, signal);
}

export function fetchFunding(
  user: string,
  startTime: number,
  endTime?: number,
  signal?: AbortSignal,
) {
  const body: Record<string, unknown> = {
    type: "userFunding",
    user,
    startTime,
  };
  if (endTime !== undefined) body.endTime = endTime;
  return post<FundingEvent[]>(body, signal);
}

// Stagger requests within a refresh cycle to avoid rate-limit spikes.
export function stagger(index: number, spacingMs = 100) {
  return new Promise<void>((resolve) =>
    setTimeout(resolve, index * spacingMs),
  );
}
