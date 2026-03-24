import { PROVIDERS } from "@/lib/constants";
import { PROVIDER_ICON_PATHS } from "@/lib/provider-icons";
import { ensureReadable } from "@/lib/utils";

interface ProviderIconProps {
  providerKey: string;
  size?: number;
  className?: string;
}

export function ProviderIcon({
  providerKey,
  size = 14,
  className = "",
}: ProviderIconProps) {
  const meta = PROVIDERS[providerKey];
  if (!meta) return null;

  const iconSlug = meta.iconSlug;
  const path = iconSlug ? PROVIDER_ICON_PATHS[iconSlug] : null;
  const color = ensureReadable(meta.color);

  if (path) {
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={color}
        className={`shrink-0 ${className}`}
        aria-label={meta.name}
      >
        <path d={path} />
      </svg>
    );
  }

  // Monogram fallback — first letter in a colored circle
  const letter = meta.name.charAt(0);
  const fontSize = Math.round(size * 0.55);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded font-[family-name:var(--font-display)] font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: `${color}20`,
        color,
        fontSize,
        lineHeight: 1,
      }}
      aria-label={meta.name}
    >
      {letter}
    </span>
  );
}
