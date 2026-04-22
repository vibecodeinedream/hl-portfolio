"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useSettings, type RefreshCadence } from "@/lib/store/settings";
import { useWallets } from "@/lib/store/wallets";

const REFRESH_OPTIONS: { label: string; ms: RefreshCadence }[] = [
  { label: "5 seconds (default)", ms: 5_000 },
  { label: "15 seconds", ms: 15_000 },
  { label: "30 seconds", ms: 30_000 },
  { label: "60 seconds", ms: 60_000 },
  { label: "Manual only", ms: 0 },
];

export function SettingsDrawer({ children }: { children: React.ReactNode }) {
  const refreshMs = useSettings((s) => s.refreshMs);
  const setRefreshMs = useSettings((s) => s.setRefreshMs);
  const pauseWhenHidden = useSettings((s) => s.pauseWhenHidden);
  const setPauseWhenHidden = useSettings((s) => s.setPauseWhenHidden);
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);
  const clearAll = useWallets((s) => s.clearAll);

  function onClearData() {
    if (!confirm("Clear all wallets and settings? This cannot be undone.")) return;
    clearAll();
    try {
      localStorage.removeItem("hl-wallets");
      localStorage.removeItem("hl-settings");
      localStorage.removeItem("hl-theme");
    } catch {}
    window.location.reload();
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            All data stays local. No backend, no accounts.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-4">
          <Row
            label="Refresh cadence"
            help="How often to poll Hyperliquid. 5s is default; drop to 15s+ with many wallets."
          >
            <Select
              value={String(refreshMs)}
              onValueChange={(v) => setRefreshMs(Number(v) as RefreshCadence)}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REFRESH_OPTIONS.map((o) => (
                  <SelectItem key={o.ms} value={String(o.ms)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>

          <Row
            label="Pause when tab hidden"
            help="Saves API quota. Resumes on focus."
          >
            <Switch
              checked={pauseWhenHidden}
              onCheckedChange={setPauseWhenHidden}
            />
          </Row>

          <Row label="Theme">
            <Select
              value={theme}
              onValueChange={(v) => setTheme(v as "dark" | "light")}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
              </SelectContent>
            </Select>
          </Row>

          <div className="border-t border-[var(--border)] pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-[var(--fg)]">Clear all data</div>
                <p className="mt-0.5 text-[11px] text-[var(--fg-subtle)]">
                  Wipes wallets and settings from this browser.
                </p>
              </div>
              <Button variant="destructive" size="sm" onClick={onClearData}>
                Clear
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-[var(--fg)]">{label}</div>
        {help && (
          <p className="mt-0.5 text-[11px] text-[var(--fg-subtle)]">{help}</p>
        )}
      </div>
      {children}
    </div>
  );
}
