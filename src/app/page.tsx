"use client";
import { useWallets } from "@/lib/store/wallets";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { WalletStrip } from "@/components/dashboard/wallet-strip";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { EquityChart } from "@/components/dashboard/equity-chart";
import { PositionsTable } from "@/components/dashboard/positions-table";
import { SpotHoldings } from "@/components/dashboard/spot-holdings";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ErrorBanner } from "@/components/dashboard/error-banner";
import { VisibilityGate } from "@/components/dashboard/visibility-gate";
import { CmdK } from "@/components/shortcuts/cmd-k";

export default function HomePage() {
  const hydrated = useHydrated();
  const wallets = useWallets((s) => s.wallets);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-5">
      <VisibilityGate />
      <CmdK />
      {hydrated && wallets.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <WalletStrip />
          <ErrorBanner />
          <SummaryCards />
          <EquityChart />
          <PositionsTable />
          <SpotHoldings />
        </>
      )}
    </div>
  );
}
