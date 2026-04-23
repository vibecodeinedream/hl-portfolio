"use client";
import { useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useSettings } from "@/lib/store/settings";

export function PrivacyToggle() {
  const privacy = useSettings((s) => s.privacy);
  const togglePrivacy = useSettings((s) => s.togglePrivacy);

  useEffect(() => {
    const el = document.documentElement;
    if (privacy) el.classList.add("privacy");
    else el.classList.remove("privacy");
  }, [privacy]);

  return (
    <button
      onClick={togglePrivacy}
      aria-label={privacy ? "Show dollar values" : "Hide dollar values"}
      title={privacy ? "Show dollar values" : "Hide dollar values"}
      className="rounded-md p-1.5 text-[var(--fg-muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--fg)]"
    >
      {privacy ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}
