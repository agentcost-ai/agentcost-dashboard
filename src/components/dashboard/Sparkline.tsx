"use client";

import { useId } from "react";

interface SparklineProps {
  data: number[];
  /** Stroke color, e.g. "#38bdf8" */
  color: string;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Dependency-free inline sparkline (pure SVG). Used inside stat cards where
 * a full Recharts instance would be wasteful.
 */
export function Sparkline({
  data,
  color,
  width = 120,
  height = 36,
  className,
}: SparklineProps) {
  const gradientId = useId();

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = width / (data.length - 1);
  // 2px vertical padding so the stroke never clips at the extremes.
  const points = data.map((v, i) => ({
    x: i * stepX,
    y: height - 2 - ((v - min) / span) * (height - 4),
  }));

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${path} L${width},${height} L0,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Endpoint dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2.2}
        fill={color}
      />
    </svg>
  );
}
