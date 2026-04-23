"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CircleDollarSign, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ThemeToggle } from "./theme-toggle";
import { LastUpdated } from "./last-updated";
import { PrivacyToggle } from "./privacy-toggle";
import { SettingsDrawer } from "@/components/settings/settings-drawer";

const TABS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/fills", label: "Fills", icon: Activity },
  { href: "/funding", label: "Funding", icon: CircleDollarSign },
] as const;

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/70">
      <div className="mx-auto flex h-12 max-w-[1600px] items-center gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />
          <span className="hidden sm:inline">HL Portfolio</span>
        </Link>
        <nav className="flex items-center gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active =
              t.href === "/"
                ? pathname === "/"
                : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors",
                  active
                    ? "bg-[var(--surface-elevated)] text-[var(--fg)]"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)]",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
              </Link>
            );
          })}
          <PrivacyToggle />
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LastUpdated />
          <ThemeToggle />
          <SettingsDrawer>
            <button
              aria-label="Settings"
              className="rounded-md p-1.5 text-[var(--fg-muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--fg)]"
            >
              <Settings className="h-4 w-4" />
            </button>
          </SettingsDrawer>
        </div>
      </div>
    </header>
  );
}
