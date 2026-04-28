"use client";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAggregate } from "@/lib/hooks/use-aggregate";
import { mergeEquityCurves } from "@/lib/hyperliquid/aggregate";
import type { PortfolioPeriod } from "@/lib/hyperliquid/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtUSD } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type Mode = "combined" | "perWallet";
type Metric = "pnl" | "value";
type WindowKey = "day" | "week" | "month" | "allTime";

const PERIODS: { label: string; key: WindowKey }[] = [
  { label: "1D", key: "day" },
  { label: "1W", key: "week" },
  { label: "1M", key: "month" },
  { label: "All", key: "allTime" },
];

const PERP_PERIOD: Record<WindowKey, PortfolioPeriod> = {
  day: "perpDay",
  week: "perpWeek",
  month: "perpMonth",
  allTime: "perpAllTime",
};

export function EquityChart() {
  const { snapshots, hydrated } = useAggregate();
  const [periodKey, setPeriodKey] = useState<WindowKey>("day");
  const [mode, setMode] = useState<Mode>("combined");
  const [metric, setMetric] = useState<Metric>("pnl");

  const enabledSnaps = snapshots.filter((s) => s.wallet.enabled);

  const apiPeriod: PortfolioPeriod =
    metric === "pnl" ? PERP_PERIOD[periodKey] : periodKey;

  const points = useMemo(() => {
    // Cutoff trim only applies for the rolling 24h Account-Value view; HL's
    // perp* buckets are already period-bucketed for PnL, so we trust them.
    const cutoffTs =
      metric === "value" && periodKey === "day"
        ? Date.now() - 24 * 60 * 60 * 1000
        : undefined;
    const field = metric === "pnl" ? "pnlHistory" : "accountValueHistory";
    return mergeEquityCurves(snapshots, apiPeriod, cutoffTs, field);
  }, [snapshots, apiPeriod, metric, periodKey]);

  const chartData = useMemo(() => {
    return points.map((p) => {
      const row: Record<string, number> = { ts: p.ts, total: p.value };
      for (const id in p.perWallet) row[id] = p.perWallet[id];
      return row;
    });
  }, [points]);

  const xDomain = useMemo<[number, number]>(() => {
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    if (periodKey === "day") return [now - DAY, now];
    if (periodKey === "week") return [now - 7 * DAY, now];
    if (periodKey === "month") return [now - 30 * DAY, now];
    const first = points[0]?.ts ?? now - 30 * DAY;
    const last = points[points.length - 1]?.ts ?? now;
    return [first, last];
  }, [periodKey, points]);

  const xTicks = useMemo<number[]>(() => {
    const [start, end] = xDomain;
    if (end <= start) return [];
    let count = 6;
    if (periodKey === "week") count = 7;
    const step = (end - start) / count;
    const ticks: number[] = [];
    for (let i = 0; i <= count; i++) ticks.push(Math.round(start + step * i));
    return ticks;
  }, [xDomain, periodKey]);

  const yDomain = useMemo<[number, number]>(() => {
    if (chartData.length === 0) return [0, 1];
    let values: number[];
    if (mode === "combined") {
      values = chartData.map((d) => d.total);
    } else {
      values = enabledSnaps.flatMap((s) =>
        chartData
          .map((d) => d[s.wallet.id])
          .filter((v): v is number => v !== undefined),
      );
    }
    if (values.length === 0) return [0, 1];
    let min = Math.min(...values);
    let max = Math.max(...values);
    // For PnL, anchor visually at zero whenever the data crosses (or hugs) it
    // so positive vs. negative is unmistakable.
    if (metric === "pnl") {
      if (min > 0) min = 0;
      if (max < 0) max = 0;
    }
    if (min === max) {
      const pad = Math.abs(min) * 0.02 || 1;
      return [min - pad, max + pad];
    }
    const range = max - min;
    const pad = range * 0.08;
    return [min - pad, max + pad];
  }, [chartData, mode, enabledSnaps, metric]);

  const firstVal = points[0]?.value ?? 0;
  const lastVal = points[points.length - 1]?.value ?? 0;
  const delta = lastVal - firstVal;
  const deltaPct = firstVal ? (delta / firstVal) * 100 : 0;

  const heroSign = lastVal > 0 ? "+" : "";
  const pnlColor =
    lastVal > 0
      ? "text-[var(--positive)]"
      : lastVal < 0
        ? "text-[var(--negative)]"
        : "text-[var(--fg)]";

  const fmtX = (ts: number) => {
    const d = new Date(ts);
    if (periodKey === "day")
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const fmtY = (v: number) => fmtUSD(v, { compact: true });

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>
            {metric === "pnl" ? "Perps P&L" : "Account Value"}
          </CardTitle>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className={cn(
                "mono money text-xl font-semibold sm:text-2xl",
                metric === "pnl" ? pnlColor : "text-[var(--fg)]",
              )}
            >
              {metric === "pnl" ? heroSign : ""}
              {fmtUSD(lastVal, { compact: true })}
            </span>
            {metric === "value" && hydrated && firstVal > 0 && (
              <span
                className={cn(
                  "mono money text-xs",
                  delta >= 0
                    ? "text-[var(--positive)]"
                    : "text-[var(--negative)]",
                )}
              >
                {delta >= 0 ? "+" : ""}
                {fmtUSD(delta, { compact: true })} ({delta >= 0 ? "+" : ""}
                {deltaPct.toFixed(2)}%)
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <div className="flex rounded-md border border-[var(--border)] p-0.5">
            {(["pnl", "value"] as Metric[]).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={cn(
                  "rounded px-2 py-0.5 text-[11px] transition-colors",
                  metric === m
                    ? "bg-[var(--surface-elevated)] text-[var(--fg)]"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)]",
                )}
              >
                {m === "pnl" ? "PnL" : "Value"}
              </button>
            ))}
          </div>
          <div className="flex rounded-md border border-[var(--border)] p-0.5">
            {(["combined", "perWallet"] as Mode[]).map((m) => (
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
                {m === "combined" ? "Combined" : "Per Wallet"}
              </button>
            ))}
          </div>
          <div className="flex rounded-md border border-[var(--border)] p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriodKey(p.key)}
                className={cn(
                  "rounded px-2 py-0.5 text-[11px] transition-colors mono",
                  periodKey === p.key
                    ? "bg-[var(--surface-elevated)] text-[var(--fg)]"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)]",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="h-[260px] w-full">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-[var(--fg-subtle)]">
              {enabledSnaps.length === 0
                ? "No wallets enabled"
                : "No data yet. Hyperliquid is loading…"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
              >
                <CartesianGrid
                  stroke="var(--border)"
                  strokeDasharray="2 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="ts"
                  type="number"
                  scale="time"
                  domain={xDomain}
                  ticks={xTicks}
                  tickFormatter={fmtX}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  minTickGap={20}
                />
                <YAxis
                  domain={yDomain}
                  tickFormatter={fmtY}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={55}
                />
                <Tooltip
                  labelFormatter={(v) => fmtX(v as number)}
                  formatter={(v) => fmtUSD(Number(v))}
                  contentStyle={{
                    background: "var(--surface-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    fontSize: 11,
                  }}
                />
                {mode === "combined" ? (
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={
                      metric === "pnl" && lastVal < 0
                        ? "var(--negative)"
                        : "var(--accent)"
                    }
                    strokeWidth={1.75}
                    dot={false}
                    isAnimationActive={false}
                    name={metric === "pnl" ? "P&L" : "Total"}
                  />
                ) : (
                  enabledSnaps.map((s) => (
                    <Line
                      key={s.wallet.id}
                      type="monotone"
                      dataKey={s.wallet.id}
                      stroke={s.wallet.color}
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                      name={s.wallet.label}
                    />
                  ))
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
