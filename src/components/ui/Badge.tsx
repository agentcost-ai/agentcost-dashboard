"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "default"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "red"
    | "yellow"
    | "green"
    | "gray";
  size?: "sm" | "md";
}

const variantStyles = {
  default: "bg-neutral-800 text-neutral-300",
  success: "bg-emerald-900/50 text-emerald-400 border-emerald-800",
  warning: "bg-amber-900/50 text-amber-400 border-amber-800",
  error: "bg-red-900/50 text-red-400 border-red-800",
  info: "bg-primary-900/50 text-primary-400 border-primary-800",
  red: "bg-red-900/50 text-red-400 border-red-800",
  yellow: "bg-amber-900/50 text-amber-400 border-amber-800",
  green: "bg-emerald-900/50 text-emerald-400 border-emerald-800",
  gray: "bg-neutral-800 text-neutral-400 border-neutral-700",
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full flex-wrap items-center rounded-full border font-medium",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",
        variantStyles[variant],
      )}
    >
      {children}
    </span>
  );
}
