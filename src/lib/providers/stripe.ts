import Parser from 'rss-parser';
import { BaseStatusRSSProvider } from './base-status-rss';
import type { AlertInput } from './types';
import type { ProviderMetadata } from './types';

export function sanitizeStripeDates(xml: string): string {
  return xml.replace(/<entry>([\s\S]*?)<\/entry>/g, (entry) => {
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1];
    const updated = entry.match(/<updated>([^<]+)<\/updated>/)?.[1];
    if (!published || !updated) return entry;

    const year = Number(published.slice(0, 4));
    return year >= 2100
      ? entry.replace(`<published>${published}</published>`, `<published>${updated}</published>`)
      : entry;
  });
}

export class StripeProvider extends BaseStatusRSSProvider {
  name = 'stripe';
  category = 'cloud';
  pollInterval = 'fast' as const;
  metadata: ProviderMetadata = {
    name: 'stripe',
    displayName: 'Stripe',
    description: 'Online payment processing platform',
    url: 'https://status.stripe.com',
  };

  constructor() {
    super('https://status.stripe.com/current/atom.xml');
  }

  async fetchAlerts(): Promise<AlertInput[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(this.feedUrl, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status} from Stripe status feed`);

      // Stripe occasionally publishes a malformed far-future maintenance year.
      // rss-parser rejects the entire feed unless that entry uses its valid update date.
      const xml = sanitizeStripeDates(await response.text());
      const feed = await new Parser().parseString(xml);
      return feed.items.map((item) => this.mapItem(item)).filter((alert): alert is AlertInput => alert !== null);
    } catch (error) {
      throw new Error(
        `Failed to fetch Stripe status: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
