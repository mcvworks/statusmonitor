"use client";

import { ensureReadable } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

export function Sparkline({
  data,
  color,
  width = 48,
  height = 16,
}: SparklineProps) {
  const readableColor = ensureReadable(color);
  const allZero = data.every((v) => v === 0);

  if (allZero) {
    const y = height / 2;
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="shrink-0"
      >
        <line
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="currentColor"
          strokeWidth={1}
          className="text-text-muted"
          strokeOpacity={0.4}
        />
      </svg>
    );
  }

  const max = Math.max(...data);
  const padY = 1;
  const usableHeight = height - padY * 2;
  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = padY + usableHeight - (v / max) * usableHeight;
    return `${x},${y}`;
  });

  const polyline = points.join(" ");
  const fillPoints = `0,${height} ${polyline} ${width},${height}`;
  const gradientId = `spark-${color.replace("#", "")}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={readableColor} stopOpacity={0.15} />
          <stop offset="100%" stopColor={readableColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#${gradientId})`} />
      <polyline
        points={polyline}
        fill="none"
        stroke={readableColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
