"use client";
import * as React from "react";
import * as S from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const Select = S.Root;
export const SelectValue = S.Value;
export const SelectGroup = S.Group;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof S.Trigger>,
  React.ComponentPropsWithoutRef<typeof S.Trigger>
>(({ className, children, ...props }, ref) => (
  <S.Trigger
    ref={ref}
    className={cn(
      "flex h-8 w-full items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-xs text-[var(--fg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 font-mono",
      className,
    )}
    {...props}
  >
    {children}
    <S.Icon asChild>
      <ChevronDown className="h-3.5 w-3.5 opacity-60" />
    </S.Icon>
  </S.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof S.Content>,
  React.ComponentPropsWithoutRef<typeof S.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <S.Portal>
    <S.Content
      ref={ref}
      position={position}
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] shadow-lg",
        position === "popper" && "data-[side=bottom]:translate-y-1",
        className,
      )}
      {...props}
    >
      <S.Viewport className="p-1">{children}</S.Viewport>
    </S.Content>
  </S.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof S.Item>,
  React.ComponentPropsWithoutRef<typeof S.Item>
>(({ className, children, ...props }, ref) => (
  <S.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-7 pr-2 text-xs text-[var(--fg)] outline-none focus:bg-[var(--border)] data-[disabled]:opacity-50 font-mono",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <S.ItemIndicator>
        <Check className="h-3.5 w-3.5" />
      </S.ItemIndicator>
    </span>
    <S.ItemText>{children}</S.ItemText>
  </S.Item>
));
SelectItem.displayName = "SelectItem";
