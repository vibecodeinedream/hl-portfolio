"use client";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useWallets } from "@/lib/store/wallets";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { useFunding } from "@/lib/hooks/use-funding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fmtDateTime, fmtPct, fmtUSD, parseNum } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const DAY = 24 * 60 * 60 * 1000;
const WINDOWS: { label: string; days: number }[] = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "All-time (180d cap)", days: 180 },
];

export default function FundingPage() {
  const hydrated = useHydrated();
  const wallets = useWallets((s) => s.wallets);
  const enabledWallets = wallets.filter((w) => w.enabled);
  const [days, setDays] = useState(30);

  const startTime = Date.now() - days * DAY;
  const endTime = Date.now();

  const results = useFunding(hydrated ? enabledWallets : [], startTime, endTime);
  const events = useMemo(
    () =>
      results
        .flatMap((r) => r.events)
        .sort((a, b) => b.time - a.time),
    [results],
  );

  // Funding "usdc" field is signed: negative = paid by user, positive = received.
  const paid = events
    .filter((e) => parseNum(e.delta.usdc) < 0)
    .reduce((acc, e) => acc + parseNum(e.delta.usdc), 0);
  const received = events
    .filter((e) => parseNum(e.delta.usdc) > 0)
    .reduce((acc, e) => acc + parseNum(e.delta.usdc), 0);
  const net = paid + received;

  const byCoin = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) {
      map.set(e.delta.coin, (map.get(e.delta.coin) ?? 0) + parseNum(e.delta.usdc));
    }
    return Array.from(map.entries())
      .map(([coin, amount]) => ({ coin, amount }))
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  }, [events]);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight">Funding</h1>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WINDOWS.map((w) => (
              <SelectItem key={w.days} value={String(w.days)}>
                {w.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mono text-2xl font-semibold text-[var(--positive)]">
              {fmtUSD(received, { sign: true })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mono text-2xl font-semibold text-[var(--negative)]">
              {fmtUSD(paid, { sign: true })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Net</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "mono text-2xl font-semibold",
                net > 0
                  ? "text-[var(--positive)]"
                  : net < 0
                    ? "text-[var(--negative)]"
                    : "text-[var(--fg-muted)]",
              )}
            >
              {fmtUSD(net, { sign: true })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Net funding by coin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full">
            {byCoin.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-[var(--fg-subtle)]">
                {hydrated ? "No funding events in window." : "Loading…"}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCoin} margin={{ top: 6, right: 8, left: 8, bottom: 4 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="2 3" vertical={false} />
                  <XAxis
                    dataKey="coin"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border)" }}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => fmtUSD(v as number, { compact: true })}
                    width={60}
                  />
                  <Tooltip
                    formatter={(v) => fmtUSD(Number(v), { sign: true })}
                    contentStyle={{
                      background: "var(--surface-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                    cursor={{ fill: "var(--surface-elevated)", opacity: 0.5 }}
                  />
                  <Bar dataKey="amount" radius={[2, 2, 0, 0]}>
                    {byCoin.map((entry) => (
                      <Cell
                        key={entry.coin}
                        fill={entry.amount >= 0 ? "var(--positive)" : "var(--negative)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Events · {events.length}</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <div className="overflow-x-auto">
            {!hydrated ? (
              <div className="px-4 py-8 text-center text-xs text-[var(--fg-subtle)]">Loading…</div>
            ) : events.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-[var(--fg-subtle)]">
                No funding events in window.
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="border-b border-[var(--border)] bg-[var(--surface)]">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
                      Time
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
                      Wallet
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
                      Coin
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
                      Side
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
                      Rate
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
                      Payment
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0, 300).map((e) => {
                    const usdc = parseNum(e.delta.usdc);
                    const rate = parseNum(e.delta.fundingRate);
                    const sz = parseNum(e.delta.szi);
                    const side = sz >= 0 ? "LONG" : "SHORT";
                    return (
                      <tr
                        key={`${e.walletId}:${e.hash}:${e.time}:${e.delta.coin}`}
                        className="border-b border-[var(--border)]/60"
                      >
                        <td className="mono px-3 py-2 text-[var(--fg-muted)]">
                          {fmtDateTime(e.time)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ background: e.walletColor }}
                            />
                            <span className="text-[var(--fg-muted)]">{e.walletLabel}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 font-medium text-[var(--fg)]">{e.delta.coin}</td>
                        <td className="px-3 py-2">
                          <Badge variant={side === "LONG" ? "long" : "short"}>{side}</Badge>
                        </td>
                        <td className="mono px-3 py-2 text-right text-[var(--fg-muted)]">
                          {fmtPct(rate * 100, 4, true)}
                        </td>
                        <td
                          className={cn(
                            "mono px-3 py-2 text-right",
                            usdc > 0
                              ? "text-[var(--positive)]"
                              : usdc < 0
                                ? "text-[var(--negative)]"
                                : "text-[var(--fg-muted)]",
                          )}
                        >
                          {fmtUSD(usdc, { sign: true })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
