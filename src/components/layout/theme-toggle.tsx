"use client";
import { Moon, Sun } from "lucide-react";
import { useSettings } from "@/lib/store/settings";
import { useEffect } from "react";

export function ThemeToggle() {
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);

  useEffect(() => {
    const el = document.documentElement;
    if (theme === "light") el.classList.add("light");
    else el.classList.remove("light");
    try {
      localStorage.setItem("hl-theme", theme);
    } catch {}
  }, [theme]);

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-md p-1.5 text-[var(--fg-muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--fg)]"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
