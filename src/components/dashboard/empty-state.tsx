"use client";
import { useState } from "react";
import { Plus, Wallet as WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletDialog } from "@/components/wallets/wallet-dialog";
import { DialogTrigger } from "@/components/ui/dialog";

export function EmptyState() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mx-auto my-12 w-full max-w-lg">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-elevated)]">
          <WalletIcon className="h-4 w-4 text-[var(--accent)]" />
        </div>
        <h2 className="text-base font-semibold text-[var(--fg)]">
          Add your first wallet
        </h2>
        <p className="mt-1.5 text-xs text-[var(--fg-muted)]">
          Paste any Hyperliquid address. Read-only — no signing, no private keys.
        </p>
        <WalletDialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="accent" size="sm" className="mt-5">
              <Plus className="h-3.5 w-3.5" /> Add wallet
            </Button>
          </DialogTrigger>
        </WalletDialog>
        <p className="mt-4 text-[10px] text-[var(--fg-subtle)]">
          Wallets persist in this browser only. No server, no accounts.
        </p>
      </div>
    </div>
  );
}
