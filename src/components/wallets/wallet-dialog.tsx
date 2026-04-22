"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MAX_WALLETS, SOFT_WARN_AT, useWallets, type Wallet } from "@/lib/store/wallets";
import { isValidAddr } from "@/lib/utils/format";

export function WalletDialog({
  children,
  existing,
  open,
  onOpenChange,
}: {
  children?: React.ReactNode;
  existing?: Wallet;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const addWallet = useWallets((s) => s.addWallet);
  const updateWallet = useWallets((s) => s.updateWallet);
  const wallets = useWallets((s) => s.wallets);

  const [address, setAddress] = useState(existing?.address ?? "");
  const [label, setLabel] = useState(existing?.label ?? "");
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!existing;
  const atLimit = !isEdit && wallets.length >= MAX_WALLETS;
  const nearLimit = !isEdit && wallets.length >= SOFT_WARN_AT;

  function reset() {
    setAddress(existing?.address ?? "");
    setLabel(existing?.label ?? "");
    setError(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = address.trim();
    if (!isValidAddr(trimmed)) {
      setError("Enter a valid 0x… address (40 hex chars).");
      return;
    }
    if (isEdit && existing) {
      updateWallet(existing.id, { address: trimmed, label: label.trim() });
    } else {
      if (atLimit) {
        setError(`Wallet limit reached (${MAX_WALLETS}).`);
        return;
      }
      const w = addWallet({ address: trimmed, label });
      if (!w) {
        setError("Wallet already added or limit reached.");
        return;
      }
    }
    reset();
    onOpenChange?.(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange?.(v);
      }}
    >
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit wallet" : "Add wallet"}</DialogTitle>
          <DialogDescription>
            Read-only. Paste a master or sub-account address — never an agent wallet (those return empty).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[var(--fg-muted)]">Address</label>
            <Input
              autoFocus
              spellCheck={false}
              placeholder="0x…"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[var(--fg-muted)]">Label</label>
            <Input
              placeholder="Main / Degen / Sub-1"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="font-sans"
            />
          </div>

          {nearLimit && !atLimit && (
            <p className="text-xs text-[var(--warning)]">
              You&apos;re approaching HL&apos;s rate limits with {wallets.length} wallets. Consider 15s+ polling.
            </p>
          )}
          {error && <p className="text-xs text-[var(--negative)]">{error}</p>}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="accent" size="sm" disabled={atLimit}>
              {isEdit ? "Save" : "Add wallet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
