import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
  ["second", 1],
];

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffSec = Math.round((d.getTime() - Date.now()) / 1000);

  for (const [unit, seconds] of UNITS) {
    if (Math.abs(diffSec) >= seconds || unit === "second") {
      return rtf.format(Math.round(diffSec / seconds), unit);
    }
  }

  return "just now";
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + "\u2026";
}

/**
 * Ensure a hex color meets a minimum perceived brightness for dark backgrounds.
 * Uses relative luminance; if too dark, lightens the color while preserving hue.
 */
export function ensureReadable(hex: string, minLuminance = 0.12): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // sRGB relative luminance
  const lum =
    0.2126 * (r <= 0.03928 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4) +
    0.7152 * (g <= 0.03928 ? g / 12.92 : ((g + 0.055) / 1.055) ** 2.4) +
    0.0722 * (b <= 0.03928 ? b / 12.92 : ((b + 0.055) / 1.055) ** 2.4);

  if (lum >= minLuminance) return hex;

  // Lighten by blending toward white until we meet the threshold
  const factor = Math.min(Math.max(minLuminance / Math.max(lum, 0.001), 1.5), 3.5);
  const lighten = (c: number) =>
    Math.min(255, Math.round(c * 255 * factor + (factor - 1) * 40));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");

  return `#${toHex(lighten(r))}${toHex(lighten(g))}${toHex(lighten(b))}`;
}
