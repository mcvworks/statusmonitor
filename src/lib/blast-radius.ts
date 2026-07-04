// Providers that have entries in the static dependency map.
// Server-safe module — usable from both server and client components.
const BLAST_RADIUS_PROVIDERS = new Set([
  "aws",
  "azure",
  "gcp",
  "cloudflare",
  "fastly",
]);

export function hasBlastRadius(source: string): boolean {
  return BLAST_RADIUS_PROVIDERS.has(source);
}
