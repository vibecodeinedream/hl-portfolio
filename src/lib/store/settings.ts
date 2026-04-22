"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type RefreshCadence = 5_000 | 15_000 | 30_000 | 60_000 | 0; // 0 = manual
export type Theme = "dark" | "light";

type SettingsStore = {
  theme: Theme;
  refreshMs: RefreshCadence;
  pauseWhenHidden: boolean;
  setTheme: (t: Theme) => void;
  setRefreshMs: (ms: RefreshCadence) => void;
  setPauseWhenHidden: (v: boolean) => void;
};

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: "dark",
      refreshMs: 5_000,
      pauseWhenHidden: true,
      setTheme: (t) => set({ theme: t }),
      setRefreshMs: (ms) => set({ refreshMs: ms }),
      setPauseWhenHidden: (v) => set({ pauseWhenHidden: v }),
    }),
    {
      name: "hl-settings",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
