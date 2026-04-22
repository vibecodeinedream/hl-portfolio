# HL Portfolio

A zero-backend, client-only multi-wallet portfolio tracker for [Hyperliquid](https://hyperliquid.xyz).

Aggregates perp equity, positions, P&L, spot balances, fills, and funding across an arbitrary set of wallets you control. Read-only addresses — no signing, no private keys, no agent wallets, no database, no auth.

**Repo:** https://github.com/vibecodeinedream

## Stack

- Next.js 16 (App Router, Turbopack) + React 19
- TypeScript, Tailwind CSS v4
- Zustand (persisted to `localStorage`) for wallet state
- TanStack Query for fetching + 5s polling (auto-paused on tab blur)
- Recharts for equity & funding charts
- Radix primitives + custom shadcn-style components

## Run locally

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. Add any Hyperliquid master/sub-account address; it persists in your browser.

### Debug a single wallet

```
/debug/0xYOUR_ADDRESS
```

Dumps the raw `clearinghouseState`, `spotClearinghouseState`, `portfolio`, `allMids`, and `spotMeta` responses — useful for verifying the API against the UI.

## Deploy to Vercel

```bash
pnpm dlx vercel
```

Zero config. No env vars needed (there is no backend). The Hyperliquid `/info` endpoint is CORS-open, so everything runs in the browser.

If the Vercel CLI is not installed: `npm i -g vercel` first.

## Features

**Dashboard** (`/`)
- 5 summary cards: total value, uPNL, position value, withdrawable, active wallets
- Combined or per-wallet equity chart (1D / 1W / 1M / All)
- Flat or coin-grouped positions table, sortable, expandable
- Collapsible spot holdings panel priced via `allMids`
- Wallet strip with per-wallet toggle (exclude from aggregate without deleting)

**Fills** (`/fills`)
- Merged across enabled wallets, sorted desc
- Filters: wallet, coin, side
- Summary bar: closed P&L, fees, net
- "Load older" pulls 30 days back via `userFillsByTime`

**Funding** (`/funding`)
- Received / paid / net summary
- Net-funding-by-coin bar chart
- 7 / 30 / 90 / 180-day windows

**Settings** (gear icon)
- Refresh cadence (5s / 15s / 30s / 60s / manual)
- Theme (dark / light)
- Pause polling when tab hidden
- Clear all data

**Shortcuts**
- `Cmd/Ctrl+K` — add wallet dialog

## Threat model

- Wallets live only in `localStorage` on your device. Clearing browser storage wipes them; exporting cross-device is not supported by design.
- The app never signs anything. Paste master or sub-account addresses only — **agent wallets will return empty**, so the UI shows a warning when a wallet reports zero across perp/spot/portfolio.
- No analytics, no telemetry, no third-party trackers. Wallet addresses do not leave the browser except in direct calls to `api.hyperliquid.xyz`.
- If Hyperliquid ever disables browser CORS, add a proxy Route Handler (20 lines in `src/app/api/hl/route.ts`) that forwards POSTs to `api.hyperliquid.xyz/info`.

## Rate limits

At 5-second polling with N wallets, the app makes ~3N requests per cycle (perp + spot + portfolio per wallet, plus one shared `allMids` and a cached `spotMeta`). Requests stagger by 120 ms per wallet. Above 10 wallets the add-wallet dialog warns you; above 20 it refuses.

If you ever see rate-limit errors, drop the cadence in Settings to 15 s.

## Acceptance checklist

The PRD's acceptance criteria:

- [x] Multiple wallets persist across reloads
- [x] Per-wallet toggle updates aggregate immediately
- [x] Total value = sum of per-wallet `accountValue` + spot USD
- [x] Equity chart across 1D/1W/1M/All with forward-filled merge
- [x] Flat + grouped positions tables, sortable, expandable
- [x] Fills page with filters + pagination
- [x] Funding page with summary + by-coin chart
- [x] Spot balances priced via `allMids`
- [x] Per-wallet error banner, agent-wallet hint
- [x] Settings drawer with cadence, theme, clear
- [x] Empty state, keyboard shortcut, last-updated indicator
- [x] Mobile: cards stack, tables scroll horizontally
