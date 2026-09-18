/**
 * Curated links from provider status pages to matching duckTyped error guides
 * and tools. duckTyped is a first-party sibling site (see docs/CROSS-LINKING.md),
 * so these render as plain followed links. Labels mirror each target page's <h1>.
 *
 * URL shape on duckTyped: error guides have no trailing slash, tools do.
 */

const DUCKTYPED_URL = "https://ducktyped.xyz";

export interface DuckTypedLink {
  kind: "guide" | "tool";
  label: string;
  href: string;
}

const guide = (path: string, label: string): DuckTypedLink => ({
  kind: "guide",
  label,
  href: `${DUCKTYPED_URL}${path}`,
});

const tool = (path: string, label: string): DuckTypedLink => ({
  kind: "tool",
  label,
  href: `${DUCKTYPED_URL}${path}`,
});

const DNS_LOOKUP = tool("/dns-lookup/", "DNS Record Checker");

const CLOUDFLARE_LINKS = [
  guide("/errors/cloudflare/", "Cloudflare error guides"),
  guide("/errors/cloudflare/error-520", "Cloudflare Error 520 — Web Server Returns an Unknown Error"),
  guide("/errors/cloudflare/error-521", "Cloudflare Error 521 — Web Server Is Down"),
  guide("/errors/cloudflare/error-522", "Cloudflare Error 522 — Connection Timed Out"),
  guide("/errors/cloudflare/error-523", "Cloudflare Error 523 — Origin Is Unreachable"),
  guide("/errors/cloudflare/error-524", "Cloudflare Error 524 — A Timeout Occurred"),
  DNS_LOOKUP,
  tool("/ssl-checker/", "SSL Certificate Checker"),
];

const NPM_LINKS = [
  guide("/errors/devops/npm-err-econnreset", "npm ERR! code ECONNRESET"),
  guide("/errors/devops/npm-err-enotfound", "npm ERR! code ENOTFOUND"),
  guide("/errors/devops/npm-err-eresolve", "npm ERR! code ERESOLVE"),
];

const DOCKER_LINKS = [
  guide("/errors/devops/docker-image-pull-failed", "Docker Image Pull Failed"),
  guide("/errors/devops/kubernetes-imagepullbackoff", "Kubernetes ImagePullBackOff"),
];

const GITHUB_LINKS = [
  guide("/errors/devops/git-repository-not-found", "fatal: repository not found"),
  guide("/errors/devops/permission-denied-publickey", "Permission Denied (publickey)"),
];

const EMAIL_LINKS = [
  guide("/errors/email/smtp-421", "SMTP 421 — Service Temporarily Unavailable"),
  guide("/errors/email/smtp-450", "SMTP 450 — Mailbox Temporarily Unavailable"),
  guide("/errors/email/smtp-451", "SMTP 451 — Local Processing Error"),
  guide("/errors/email/smtp-550", "SMTP 550 — Mailbox Unavailable"),
  tool("/smtp-checker/", "SMTP Server Checker"),
  tool("/email-header-analyzer/", "Email Header Analyzer"),
  tool("/blacklist-checker/", "Blacklist / RBL Checker"),
];

const HOSTING_LINKS = [
  guide("/errors/http/502-bad-gateway", "502 Bad Gateway"),
  guide("/errors/http/503-service-unavailable", "503 Service Unavailable"),
  guide("/errors/http/504-gateway-timeout", "504 Gateway Timeout"),
  tool("/http-latency/", "HTTP Latency Checker"),
  DNS_LOOKUP,
];

/** Keys must match provider registry slugs in `PROVIDERS` (src/lib/constants.ts). */
export const DUCKTYPED_GUIDES: Record<string, readonly DuckTypedLink[]> = {
  cloudflare: CLOUDFLARE_LINKS,
  "npm-registry": NPM_LINKS,
  dockerhub: DOCKER_LINKS,
  github: GITHUB_LINKS,
  m365: EMAIL_LINKS,
  "google-workspace": EMAIL_LINKS,
  aws: HOSTING_LINKS,
  azure: HOSTING_LINKS,
  gcp: HOSTING_LINKS,
  digitalocean: HOSTING_LINKS,
  fastly: HOSTING_LINKS,
  vercel: HOSTING_LINKS,
  netlify: HOSTING_LINKS,
};

/** Links for a provider slug; empty when the provider has no matching guides. */
export function getDuckTypedGuides(providerSlug: string): readonly DuckTypedLink[] {
  return Object.hasOwn(DUCKTYPED_GUIDES, providerSlug)
    ? DUCKTYPED_GUIDES[providerSlug]
    : [];
}
