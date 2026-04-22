export function fmtUSD(n: number | null | undefined, opts?: { compact?: boolean; sign?: boolean }) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const compact = opts?.compact ?? false;
  const sign = opts?.sign ?? false;
  const abs = Math.abs(n);
  let str: string;
  if (compact && abs >= 1000) {
    str = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: abs >= 10_000 ? 2 : 2,
    }).format(n);
  } else {
    str = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  }
  if (sign && n > 0) return "+" + str;
  return str;
}

export function fmtNum(n: number | null | undefined, digits = 4) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(n);
}

export function fmtPct(n: number | null | undefined, digits = 2, sign = false) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const s = n.toFixed(digits) + "%";
  if (sign && n > 0) return "+" + s;
  return s;
}

export function fmtPrice(n: number | null | undefined) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  let digits = 2;
  if (abs < 0.01) digits = 6;
  else if (abs < 1) digits = 4;
  else if (abs < 100) digits = 3;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function fmtSize(n: number | null | undefined, digits = 4) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(n);
}

export function shortAddr(addr: string, head = 6, tail = 4) {
  if (!addr) return "";
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function isValidAddr(addr: string): addr is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export function parseNum(s: string | number | null | undefined): number {
  if (s === null || s === undefined) return 0;
  if (typeof s === "number") return Number.isFinite(s) ? s : 0;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function fmtRelTime(ts: number) {
  const now = Date.now();
  const diff = Math.max(0, Math.round((now - ts) / 1000));
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function fmtDateTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
