import { plainText, statusFromText } from './base-status-rss';
import type { AlertInput, AlertProvider, ProviderMetadata } from './types';

interface PagerDutyPost {
  id: string;
  title: string;
  post_type: string;
  first_update_at: number;
  last_update_at: number;
  latest_update?: { message?: string; status_id?: string };
  updates?: Array<{ message?: string; reported_at: number }>;
}

export class PagerDutyProvider implements AlertProvider {
  name = 'pagerduty';
  category = 'devops';
  pollInterval = 'slow' as const;
  metadata: ProviderMetadata = {
    name: 'pagerduty',
    displayName: 'PagerDuty',
    description: 'Incident management and on-call scheduling',
    url: 'https://status.pagerduty.com',
  };

  async fetchAlerts(): Promise<AlertInput[]> {
    const now = Date.now();
    const since = now - 90 * 24 * 60 * 60 * 1000;
    const endpoint = new URL('https://status.pagerduty.com/api/posts');
    endpoint.searchParams.set('since', String(since));
    endpoint.searchParams.set('until', String(now));
    endpoint.searchParams.set('limit', '100');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(endpoint, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status} from PagerDuty status API`);
      const data = (await response.json()) as { posts?: PagerDutyPost[] };

      return (data.posts ?? []).map((post) => {
        const message = plainText(post.latest_update?.message);
        const status = post.latest_update?.status_id === 'PPFX0EI'
          ? 'resolved'
          : statusFromText(message);
        const timestamp = new Date(post.first_update_at);
        return {
          externalId: post.id,
          source: this.name,
          category: this.category,
          severity: /outage|unavailable/i.test(`${post.title} ${message}`) ? 'major' : 'minor',
          title: post.title,
          description: message || undefined,
          url: `https://status.pagerduty.com/incidents/details/${post.id}`,
          timestamp,
          status,
          resolvedAt: status === 'resolved' ? new Date(post.last_update_at) : undefined,
          signalKind: post.post_type === 'maintenance' ? 'maintenance' : 'incident',
          confidence: 'official',
          metadata: {
            updates: (post.updates ?? []).map((update) => ({
              body: plainText(update.message),
              timestamp: new Date(update.reported_at).toISOString(),
            })),
          },
        } satisfies AlertInput;
      });
    } catch (error) {
      throw new Error(
        `Failed to fetch PagerDuty status: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
