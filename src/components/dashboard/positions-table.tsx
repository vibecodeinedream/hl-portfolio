"use client";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAggregate } from "@/lib/hooks/use-aggregate";
import {
  fmtNum,
  fmtPct,
  fmtPrice,
  fmtSize,
  fmtUSD,
} from "@/lib/utils/format";
import type { AggregatedPosition, GroupedPosition } from "@/lib/hyperliquid/aggregate";

type ViewMode = "flat" | "grouped";
type SortKey =
  | "wallet"
  | "coin"
  | "size"
  | "entry"
  | "mark"
  | "value"
  | "pnl"
  | "roe"
  | "liq"
  | "leverage"
  | "funding";

type SortDir = "asc" | "desc";

export function PositionsTable() {
  const { result, hydrated } = useAggregate();
  const [mode, setMode] = useState<ViewMode>("flat");
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const positions = result.positions;
  const grouped = result.grouped;

  function toggleSort(k: SortKey) {
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir("desc");
    }
  }

  const sortedFlat = useMemo(() => {
    const arr = [...positions];
    arr.sort((a, b) => compareFlat(a, b, sortKey));
    return sortDir === "asc" ? arr : arr.reverse();
  }, [positions, sortKey, sortDir]);

  const sortedGrouped = useMemo(() => {
    const arr = [...grouped];
    arr.sort((a, b) => compareGrouped(a, b, sortKey));
    return sortDir === "asc" ? arr : arr.reverse();
  }, [grouped, sortKey, sortDir]);

  const body =
    mode === "flat" ? (
      <FlatTable
        positions={sortedFlat}
        expanded={expanded}
        setExpanded={setExpanded}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={toggleSort}
      />
    ) : (
      <GroupedTable
        rows={sortedGrouped}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={toggleSort}
      />
    );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Positions</CardTitle>
        <div className="flex rounded-md border border-[var(--border)] p-0.5">
          {(["flat", "grouped"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded px-2 py-0.5 text-[11px] transition-colors",
                mode === m
                  ? "bg-[var(--surface-elevated)] text-[var(--fg)]"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg)]",
              )}
            >
              {m === "flat" ? "Flat" : "Grouped"}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        <div className="overflow-x-auto">
          {!hydrated || (positions.length === 0 && mode === "flat") ? (
            <EmptyPositions hydrated={hydrated} />
          ) : mode === "grouped" && grouped.length === 0 ? (
            <EmptyPositions hydrated={hydrated} />
          ) : (
            body
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyPositions({ hydrated }: { hydrated: boolean }) {
  return (
    <div className="px-4 py-8 text-center text-xs text-[var(--fg-subtle)]">
      {hydrated ? "No open positions." : "Loading…"}
    </div>
  );
}

function SortHeader({
  label,
  k,
  align = "left",
  sortKey,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  k: SortKey;
  align?: "left" | "right";
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const active = sortKey === k;
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--fg-muted)]",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      <button
        onClick={() => onSort(k)}
        className={cn(
          "inline-flex items-center gap-1 hover:text-[var(--fg)] transition-colors",
          active && "text-[var(--fg)]",
          align === "right" && "flex-row-reverse",
        )}
      >
        {label}
        <ChevronsUpDown className={cn("h-3 w-3", active ? "opacity-80" : "opacity-40")} />
      </button>
    </th>
  );
}

function FlatTable({
  positions,
  expanded,
  setExpanded,
  sortKey,
  sortDir,
  onSort,
}: {
  positions: AggregatedPosition[];
  expanded: Set<string>;
  setExpanded: (s: Set<string>) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  return (
    <table className="w-full min-w-[680px] text-[13px]">
      <thead className="border-b border-[var(--border)] bg-[var(--surface)]">
        <tr>
          <th className="w-6 px-3"></th>
          <SortHeader label="Wallet" k="wallet" className="w-full" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--fg-muted)] whitespace-nowrap">
            Side
          </th>
          <SortHeader label="Coin" k="coin" className="whitespace-nowrap" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <SortHeader label="Value" k="value" align="right" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <SortHeader label="uPNL" k="pnl" align="right" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <SortHeader label="Entry" k="entry" align="right" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <SortHeader label="Mark" k="mark" align="right" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <SortHeader label="ROE" k="roe" align="right" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <SortHeader label="Liq" k="liq" align="right" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <SortHeader label="Lev" k="leverage" align="right" className="hidden lg:table-cell" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <SortHeader label="Funding" k="funding" align="right" className="hidden lg:table-cell" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
        </tr>
      </thead>
      <tbody>
        {positions.map((p, idx) => {
          const key = `${p.walletId}:${p.coin}`;
          const isOpen = expanded.has(key);
          return (
            <FlatRow
              key={key}
              p={p}
              index={idx}
              isOpen={isOpen}
              onToggle={() => {
                const n = new Set(expanded);
                if (isOpen) n.delete(key);
                else n.add(key);
                setExpanded(n);
              }}
            />
          );
        })}
      </tbody>
    </table>
  );
}

function FlatRow({
  p,
  index,
  isOpen,
  onToggle,
}: {
  p: AggregatedPosition;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const liqProx =
    p.markPx && p.liquidationPx
      ? (Math.abs(p.markPx - p.liquidationPx) / p.markPx) * 100
      : null;
  const liqDanger = liqProx !== null && liqProx < 10;
  const zebra = index % 2 === 1 ? "bg-[var(--surface-elevated)]/25" : "";
  return (
    <>
      <tr
        className={cn(
          "border-b border-[var(--border)]/60 hover:bg-[var(--surface-elevated)]/60 cursor-pointer",
          zebra,
        )}
        onClick={onToggle}
      >
        <td className="px-3 py-2.5">
          {isOpen ? (
            <ChevronDown className="h-3 w-3 text-[var(--fg-subtle)]" />
          ) : (
            <ChevronRight className="h-3 w-3 text-[var(--fg-subtle)]" />
          )}
        </td>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ background: p.walletColor }}
            />
            <span className="truncate text-[var(--fg-muted)]">{p.walletLabel}</span>
          </div>
        </td>
        <td className="px-3 py-2.5">
          <Badge variant={p.side === "LONG" ? "long" : "short"}>{p.side}</Badge>
        </td>
        <td className="px-3 py-2.5 font-medium text-[var(--fg)]">{p.coin}</td>
        <td className="mono px-3 py-2.5 text-right text-[var(--fg)]">
          {fmtUSD(p.positionValue, { compact: true })}
        </td>
        <td
          className={cn(
            "mono px-3 py-2.5 text-right",
            p.unrealizedPnl > 0
              ? "text-[var(--positive)]"
              : p.unrealizedPnl < 0
                ? "text-[var(--negative)]"
                : "text-[var(--fg-muted)]",
          )}
        >
          {fmtUSD(p.unrealizedPnl, { sign: true })}
        </td>
        <td className="mono px-3 py-2.5 text-right text-[var(--fg-muted)]">
          {fmtPrice(p.entryPx)}
        </td>
        <td className="mono px-3 py-2.5 text-right text-[var(--fg)]">
          {fmtPrice(p.markPx)}
        </td>
        <td
          className={cn(
            "mono px-3 py-2.5 text-right",
            p.roePct > 0
              ? "text-[var(--positive)]"
              : p.roePct < 0
                ? "text-[var(--negative)]"
                : "text-[var(--fg-muted)]",
          )}
        >
          {fmtPct(p.roePct, 2, true)}
        </td>
        <td
          className={cn(
            "mono px-3 py-2.5 text-right",
            liqDanger ? "text-[var(--negative)]" : "text-[var(--fg-muted)]",
          )}
        >
          {fmtPrice(p.liquidationPx)}
        </td>
        <td className="mono hidden lg:table-cell px-3 py-2.5 text-right text-[var(--fg-muted)]">
          {p.leverage}x
          <span className="ml-1 text-[11px] text-[var(--fg-subtle)]">
            {p.leverageType === "isolated" ? "iso" : "cx"}
          </span>
        </td>
        <td
          className={cn(
            "mono hidden lg:table-cell px-3 py-2.5 text-right",
            p.cumFunding > 0
              ? "text-[var(--negative)]"
              : p.cumFunding < 0
                ? "text-[var(--positive)]"
                : "text-[var(--fg-muted)]",
          )}
          title="Funding accrued since position opened — positive = paid, negative = received"
        >
          {fmtUSD(-p.cumFunding, { sign: true })}
        </td>
      </tr>
      {isOpen && (
        <tr className="border-b border-[var(--border)]/60 bg-[var(--surface-elevated)]/30">
          <td></td>
          <td colSpan={11} className="px-3 py-3">
            <dl className="grid grid-cols-2 gap-2 text-[11px] md:grid-cols-4">
              <Detail label="Margin used" value={fmtUSD(p.marginUsed)} />
              <Detail label="Size (signed)" value={fmtNum(p.sz, 4)} />
              <Detail
                label="Liq proximity"
                value={liqProx !== null ? fmtPct(liqProx, 1) : "—"}
                color={liqDanger ? "negative" : undefined}
              />
              <Detail
                label="Cumulative funding (since open)"
                value={fmtUSD(p.cumFunding, { sign: true })}
              />
            </dl>
          </td>
        </tr>
      )}
    </>
  );
}

function Detail({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: "positive" | "negative";
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">
        {label}
      </span>
      <span
        className={cn(
          "mono",
          color === "positive"
            ? "text-[var(--positive)]"
            : color === "negative"
              ? "text-[var(--negative)]"
              : "text-[var(--fg)]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function GroupedTable({
  rows,
  sortKey,
  sortDir,
  onSort,
}: {
  rows: GroupedPosition[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  return (
    <table className="w-full min-w-[680px] text-[13px]">
      <thead className="border-b border-[var(--border)] bg-[var(--surface)]">
        <tr>
          <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--fg-muted)] whitespace-nowrap">
            Side
          </th>
          <SortHeader label="Coin" k="coin" className="w-full" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <SortHeader label="Value" k="value" align="right" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <SortHeader label="uPNL" k="pnl" align="right" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--fg-muted)] whitespace-nowrap">
            Wallets
          </th>
          <SortHeader label="Avg Entry" k="entry" align="right" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <SortHeader label="Mark" k="mark" align="right" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.coin}
            className="border-b border-[var(--border)]/60 hover:bg-[var(--surface-elevated)]/50"
          >
            <td className="px-3 py-2.5">
              <Badge
                variant={
                  r.side === "MIXED" ? "warning" : r.side === "LONG" ? "long" : "short"
                }
              >
                {r.side}
              </Badge>
            </td>
            <td className="px-3 py-2.5 font-medium text-[var(--fg)]">{r.coin}</td>
            <td className="mono px-3 py-2.5 text-right text-[var(--fg)]">
              {fmtUSD(r.positionValue, { compact: true })}
            </td>
            <td
              className={cn(
                "mono px-3 py-2.5 text-right",
                r.unrealizedPnl > 0
                  ? "text-[var(--positive)]"
                  : r.unrealizedPnl < 0
                    ? "text-[var(--negative)]"
                    : "text-[var(--fg-muted)]",
              )}
            >
              {fmtUSD(r.unrealizedPnl, { sign: true })}
            </td>
            <td className="px-3 py-2.5">
              <div className="flex items-center gap-1">
                {r.contributors.map((c) => (
                  <div
                    key={c.walletId}
                    title={`${c.walletLabel}: ${fmtUSD(c.positionValue, { compact: true })}`}
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: c.walletColor }}
                  />
                ))}
                <span className="ml-1 text-[11px] text-[var(--fg-subtle)]">
                  {r.contributors.length}
                </span>
              </div>
            </td>
            <td className="mono px-3 py-2.5 text-right text-[var(--fg-muted)]">
              {fmtPrice(r.entryPx)}
            </td>
            <td className="mono px-3 py-2.5 text-right text-[var(--fg)]">
              {fmtPrice(r.markPx)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function compareFlat(a: AggregatedPosition, b: AggregatedPosition, k: SortKey): number {
  switch (k) {
    case "wallet":
      return a.walletLabel.localeCompare(b.walletLabel);
    case "coin":
      return a.coin.localeCompare(b.coin);
    case "size":
      return Math.abs(a.sz) - Math.abs(b.sz);
    case "entry":
      return (a.entryPx ?? 0) - (b.entryPx ?? 0);
    case "mark":
      return (a.markPx ?? 0) - (b.markPx ?? 0);
    case "value":
      return a.positionValue - b.positionValue;
    case "pnl":
      return a.unrealizedPnl - b.unrealizedPnl;
    case "roe":
      return a.roePct - b.roePct;
    case "liq":
      return (a.liquidationPx ?? 0) - (b.liquidationPx ?? 0);
    case "leverage":
      return a.leverage - b.leverage;
    case "funding":
      return a.cumFunding - b.cumFunding;
  }
}

function compareGrouped(a: GroupedPosition, b: GroupedPosition, k: SortKey): number {
  switch (k) {
    case "coin":
      return a.coin.localeCompare(b.coin);
    case "size":
      return a.netSz - b.netSz;
    case "entry":
      return (a.entryPx ?? 0) - (b.entryPx ?? 0);
    case "mark":
      return (a.markPx ?? 0) - (b.markPx ?? 0);
    case "value":
      return a.positionValue - b.positionValue;
    case "pnl":
      return a.unrealizedPnl - b.unrealizedPnl;
    default:
      return a.positionValue - b.positionValue;
  }
}
