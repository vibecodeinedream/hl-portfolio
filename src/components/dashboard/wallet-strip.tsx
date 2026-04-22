"use client";
import { useState } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown";
import { DialogTrigger } from "@/components/ui/dialog";
import { WalletDialog } from "@/components/wallets/wallet-dialog";
import { useWallets, type Wallet } from "@/lib/store/wallets";
import { useAggregate } from "@/lib/hooks/use-aggregate";
import { fmtUSD, shortAddr } from "@/lib/utils/format";

export function WalletStrip() {
  const wallets = useWallets((s) => s.wallets);
  const toggleWallet = useWallets((s) => s.toggleWallet);
  const removeWallet = useWallets((s) => s.removeWallet);
  const { result, errors } = useAggregate();
  const [editing, setEditing] = useState<Wallet | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  if (wallets.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {wallets.map((w) => {
        const summary = result.perWallet.get(w.id);
        const err = errors.find((e) => e.wallet.id === w.id);
        const total = summary ? summary.accountValue + summary.spotUsd : 0;
        return (
          <div
            key={w.id}
            className={`group flex shrink-0 items-center gap-2.5 rounded-md border px-3 py-2 transition-colors ${
              w.enabled
                ? "border-[var(--border)] bg-[var(--surface)]"
                : "border-[var(--border)] bg-[var(--surface)]/50 opacity-60"
            }`}
          >
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: w.color }}
            />
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-medium text-[var(--fg)]">
                  {w.label}
                </span>
                {err && (
                  <AlertTriangle className="h-3 w-3 text-[var(--warning)]" />
                )}
              </div>
              <span className="mono text-[10px] text-[var(--fg-subtle)]">
                {shortAddr(w.address)}
              </span>
            </div>
            <div className="mono ml-2 text-right text-xs text-[var(--fg-muted)]">
              {summary ? fmtUSD(total, { compact: true }) : "—"}
            </div>
            <Switch
              checked={w.enabled}
              onCheckedChange={() => toggleWallet(w.id)}
              aria-label={`${w.enabled ? "Disable" : "Enable"} ${w.label}`}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Wallet menu"
                  className="rounded p-1 text-[var(--fg-subtle)] hover:bg-[var(--surface-elevated)] hover:text-[var(--fg)]"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditing(w)}>
                  <Pencil className="mr-2 h-3 w-3" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    navigator.clipboard?.writeText(w.address).catch(() => {})
                  }
                >
                  Copy address
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    if (confirm(`Remove wallet "${w.label}"?`)) removeWallet(w.id);
                  }}
                  className="text-[var(--negative)]"
                >
                  <Trash2 className="mr-2 h-3 w-3" /> Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}

      <WalletDialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="shrink-0">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </DialogTrigger>
      </WalletDialog>

      {editing && (
        <WalletDialog
          existing={editing}
          open={!!editing}
          onOpenChange={(v) => {
            if (!v) setEditing(null);
          }}
        />
      )}
    </div>
  );
}
