import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-[var(--surface-elevated)] text-[var(--fg-muted)] border border-[var(--border)]",
        long: "bg-[var(--positive)]/15 text-[var(--positive)]",
        short: "bg-[var(--negative)]/15 text-[var(--negative)]",
        warning: "bg-[var(--warning)]/15 text-[var(--warning)]",
        subtle: "bg-[var(--surface-elevated)] text-[var(--fg-subtle)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
