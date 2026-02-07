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
        "rounded-xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm",
        padding === "sm" && "p-4",
        padding === "md" && "p-6",
        padding === "lg" && "p-8",
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
          <p className="text-sm font-medium text-neutral-400">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
