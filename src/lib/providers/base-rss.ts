import Parser from 'rss-parser';
import type { AlertProvider, AlertInput, ProviderMetadata } from './types';

type RSSItem = Parser.Item;

export abstract class BaseRSSProvider implements AlertProvider {
  abstract name: string;
  abstract category: string;
  abstract pollInterval: 'fast' | 'slow';
  abstract metadata: ProviderMetadata;

  private parser: Parser;

  constructor(protected feedUrl: string) {
    this.parser = new Parser({
      timeout: 10_000,
    });
  }

  abstract mapItem(item: RSSItem): AlertInput | null;

  async fetchAlerts(): Promise<AlertInput[]> {
    try {
      const feed = await this.parser.parseURL(this.feedUrl);
      const alerts: AlertInput[] = [];

      for (const item of feed.items) {
        const mapped = this.mapItem(item);
        if (mapped) {
          alerts.push(mapped);
        }
      }

      return alerts;
    } catch (error) {
      console.error(`[${this.name}] Failed to fetch RSS feed:`, error);
      return [];
    }
  }
}

export type { RSSItem };
