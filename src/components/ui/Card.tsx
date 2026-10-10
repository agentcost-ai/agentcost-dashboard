"use client";

import { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  style?: CSSProperties;
}

export function Card({
  children,
  className,
  padding = "md",
  style,
}: CardProps) {
  return (
    <div
      style={style}
      className={cn(
        "rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#131317] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        padding === "sm" && "p-4",
        padding === "md" && "p-4 sm:p-6",
        padding === "lg" && "p-5 sm:p-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string | ReactNode;
  trend?: {
    value: number;
    positive?: boolean;
  };
  icon?: ReactNode;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
}: MetricCardProps) {
  return (
    <Card className="animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] text-neutral-500">{title}</p>
          <p className="mt-2 text-[2rem] font-light leading-none tracking-[-0.02em] text-white tabular-nums">
            {value}
          </p>
          {subtitle && (
            <div className="mt-1 text-sm text-neutral-500">{subtitle}</div>
          )}
          {trend && (
            <p
              className={cn(
                "mt-2 text-sm font-medium",
                trend.positive ? "text-emerald-400" : "text-red-400",
              )}
            >
              {trend.positive ? "+" : ""}
              {trend.value}% from previous period
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-neutral-400">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
