"use client";
import { useEffect, useState } from "react";
import { WalletDialog } from "@/components/wallets/wallet-dialog";

export function CmdK() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return <WalletDialog open={open} onOpenChange={setOpen} />;
}
