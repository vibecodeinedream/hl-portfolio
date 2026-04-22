"use client";
import { useEffect, useState } from "react";
import { useAggregate } from "@/lib/hooks/use-aggregate";
import { fmtRelTime } from "@/lib/utils/format";

export function LastUpdated() {
  const { lastUpdated, isFetching } = useAggregate();
  const [, setTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(i);
  }, []);

  if (!lastUpdated) return null;
  return (
    <span className="mono hidden items-center gap-1.5 text-[11px] text-[var(--fg-subtle)] md:flex">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          isFetching ? "bg-[var(--accent)] animate-pulse" : "bg-[var(--fg-subtle)]"
        }`}
      />
      {fmtRelTime(lastUpdated)}
    </span>
  );
}
