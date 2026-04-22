"use client";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchAllMids,
  fetchPerp,
  fetchPortfolio,
  fetchSpot,
  fetchSpotMeta,
} from "@/lib/hyperliquid/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isValidAddr } from "@/lib/utils/format";

export default function DebugAddress({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const valid = isValidAddr(address);

  const perp = useQuery({
    queryKey: ["dbg-perp", address],
    queryFn: ({ signal }) => fetchPerp(address, signal),
    enabled: valid,
  });
  const spot = useQuery({
    queryKey: ["dbg-spot", address],
    queryFn: ({ signal }) => fetchSpot(address, signal),
    enabled: valid,
  });
  const portfolio = useQuery({
    queryKey: ["dbg-portfolio", address],
    queryFn: ({ signal }) => fetchPortfolio(address, signal),
    enabled: valid,
  });
  const mids = useQuery({
    queryKey: ["dbg-mids"],
    queryFn: ({ signal }) => fetchAllMids(signal),
  });
  const spotMeta = useQuery({
    queryKey: ["dbg-spotMeta"],
    queryFn: ({ signal }) => fetchSpotMeta(signal),
  });

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-5">
      <h1 className="mono text-sm text-[var(--fg-muted)]">Debug · {address}</h1>
      {!valid && (
        <div className="rounded-md border border-[var(--negative)]/40 bg-[var(--negative)]/10 px-3 py-2 text-xs text-[var(--negative)]">
          Invalid address.
        </div>
      )}
      <DebugCard title="clearinghouseState (perp)" q={perp} />
      <DebugCard title="spotClearinghouseState" q={spot} />
      <DebugCard title="portfolio" q={portfolio} />
      <DebugCard title="allMids" q={mids} />
      <DebugCard title="spotMeta" q={spotMeta} />
    </div>
  );
}

function DebugCard({
  title,
  q,
}: {
  title: string;
  q: ReturnType<typeof useQuery>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {q.isLoading ? (
          <div className="text-xs text-[var(--fg-subtle)]">loading…</div>
        ) : q.isError ? (
          <div className="text-xs text-[var(--negative)]">
            {(q.error as Error).message}
          </div>
        ) : (
          <pre className="mono max-h-[400px] overflow-auto whitespace-pre-wrap break-words text-[11px] text-[var(--fg-muted)]">
            {JSON.stringify(q.data, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
