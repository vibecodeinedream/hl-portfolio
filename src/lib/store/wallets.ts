"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import { pickColor } from "@/lib/utils/colors";

export type Wallet = {
  id: string;
  address: `0x${string}`;
  label: string;
  enabled: boolean;
  color: string;
  addedAt: number;
};

type WalletStore = {
  wallets: Wallet[];
  addWallet: (args: { address: `0x${string}`; label: string; color?: string }) => Wallet | null;
  updateWallet: (id: string, patch: Partial<Omit<Wallet, "id" | "addedAt">>) => void;
  removeWallet: (id: string) => void;
  toggleWallet: (id: string) => void;
  clearAll: () => void;
};

export const MAX_WALLETS = 20;
export const SOFT_WARN_AT = 10;

export const useWallets = create<WalletStore>()(
  persist(
    (set, get) => ({
      wallets: [],
      addWallet: ({ address, label, color }) => {
        const state = get();
        const existing = state.wallets.find(
          (w) => w.address.toLowerCase() === address.toLowerCase(),
        );
        if (existing) return null;
        if (state.wallets.length >= MAX_WALLETS) return null;
        const usedColors = state.wallets.map((w) => w.color);
        const w: Wallet = {
          id: uuid(),
          address,
          label: label.trim() || `Wallet ${state.wallets.length + 1}`,
          enabled: true,
          color: color ?? pickColor(usedColors),
          addedAt: Date.now(),
        };
        set({ wallets: [...state.wallets, w] });
        return w;
      },
      updateWallet: (id, patch) =>
        set((s) => ({
          wallets: s.wallets.map((w) => (w.id === id ? { ...w, ...patch } : w)),
        })),
      removeWallet: (id) =>
        set((s) => ({ wallets: s.wallets.filter((w) => w.id !== id) })),
      toggleWallet: (id) =>
        set((s) => ({
          wallets: s.wallets.map((w) =>
            w.id === id ? { ...w, enabled: !w.enabled } : w,
          ),
        })),
      clearAll: () => set({ wallets: [] }),
    }),
    {
      name: "hl-wallets",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

// SSR-safe selector: returns [] until hydrated.
export function useHydratedWallets(): Wallet[] {
  if (typeof window === "undefined") return [];
  return useWallets.getState().wallets;
}
