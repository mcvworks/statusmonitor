/**
 * Fetches community discussion threads from Hacker News and Reddit
 * for a given provider during active incidents.
 */

export interface CommunityThread {
  title: string;
  url: string;
  score: number;
  commentCount: number;
  source: "hn" | "reddit";
}

interface CacheEntry {
  threads: CommunityThread[];
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();

/** Provider display names used for search queries */
const PROVIDER_SEARCH_NAMES: Record<string, string> = {
  aws: "AWS",
  azure: "Azure",
  gcp: "Google Cloud",
  cloudflare: "Cloudflare",
  github: "GitHub",
  m365: "Microsoft 365",
  slack: "Slack",
  atlassian: "Atlassian",
  okta: "Okta",
  stripe: "Stripe",
  "google-workspace": "Google Workspace",
  digitalocean: "DigitalOcean",
  fastly: "Fastly",
  vercel: "Vercel",
  datadog: "Datadog",
  pagerduty: "PagerDuty",
};

async function fetchHNThreads(provider: string): Promise<CommunityThread[]> {
  const searchName = PROVIDER_SEARCH_NAMES[provider] ?? provider;
  const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(searchName + " outage")}&tags=story&numericFilters=created_at_i>${oneDayAgo}&hitsPerPage=3`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.hits ?? []).slice(0, 3).map((hit: Record<string, unknown>) => ({
      title: String(hit.title ?? ""),
      url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
      score: Number(hit.points ?? 0),
      commentCount: Number(hit.num_comments ?? 0),
      source: "hn" as const,
    }));
  } catch {
    return [];
  }
}

async function fetchRedditThreads(provider: string): Promise<CommunityThread[]> {
  const searchName = PROVIDER_SEARCH_NAMES[provider] ?? provider;
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(searchName + " outage")}&sort=new&t=day&limit=3`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "StatusMonitor/1.0" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const children = data?.data?.children ?? [];
    return children.slice(0, 3).map((child: Record<string, unknown>) => {
      const post = child.data as Record<string, unknown>;
      return {
        title: String(post.title ?? ""),
        url: `https://reddit.com${post.permalink}`,
        score: Number(post.score ?? 0),
        commentCount: Number(post.num_comments ?? 0),
        source: "reddit" as const,
      };
    });
  } catch {
    return [];
  }
}

export async function fetchCommunityThreads(provider: string): Promise<CommunityThread[]> {
  const cached = cache.get(provider);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.threads;
  }

  const [hn, reddit] = await Promise.all([
    fetchHNThreads(provider),
    fetchRedditThreads(provider),
  ]);

  const threads = [...hn, ...reddit];
  cache.set(provider, { threads, expiresAt: Date.now() + CACHE_TTL_MS });

  return threads;
}
