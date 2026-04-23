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
import { Button } from "@/components/ui/button";
import { fmtUSD } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const PERIODS: { label: string; period: PortfolioPeriod }[] = [
  { label: "1D", period: "day" },
  { label: "1W", period: "week" },
  { label: "1M", period: "month" },
  { label: "All", period: "allTime" },
];

type Mode = "combined" | "perWallet";

export function EquityChart() {
  const { snapshots, hydrated } = useAggregate();
  const [period, setPeriod] = useState<PortfolioPeriod>("week");
  const [mode, setMode] = useState<Mode>("combined");

  const enabledSnaps = snapshots.filter((s) => s.wallet.enabled);

  const points = useMemo(
    () => mergeEquityCurves(snapshots, period),
    [snapshots, period],
  );

  const chartData = useMemo(() => {
    return points.map((p) => {
      const row: Record<string, number> = { ts: p.ts, total: p.value };
      for (const id in p.perWallet) row[id] = p.perWallet[id];
      return row;
    });
  }, [points]);

  const firstVal = points[0]?.value ?? 0;
  const lastVal = points[points.length - 1]?.value ?? 0;
  const delta = lastVal - firstVal;
  const deltaPct = firstVal ? (delta / firstVal) * 100 : 0;

  const fmtX = (ts: number) => {
    const d = new Date(ts);
    if (period === "day") return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    if (period === "allTime" || period === "month")
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const fmtY = (v: number) => fmtUSD(v, { compact: true });

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Account Value</CardTitle>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="mono text-xl font-semibold text-[var(--fg)] sm:text-2xl">
              {fmtUSD(lastVal, { compact: true })}
            </span>
            {hydrated && firstVal > 0 && (
              <span
                className={cn(
                  "mono text-xs",
                  delta >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]",
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
                key={p.period}
                onClick={() => setPeriod(p.period)}
                className={cn(
                  "rounded px-2 py-0.5 text-[11px] transition-colors mono",
                  period === p.period
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
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="2 3" vertical={false} />
                <XAxis
                  dataKey="ts"
                  tickFormatter={fmtX}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  minTickGap={40}
                />
                <YAxis
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
                    stroke="var(--accent)"
                    strokeWidth={1.75}
                    dot={false}
                    isAnimationActive={false}
                    name="Total"
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
