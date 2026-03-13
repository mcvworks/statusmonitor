import { BaseRSSProvider, type RSSItem } from './base-rss';
import type { AlertInput, ProviderMetadata } from './types';

export class AWSProvider extends BaseRSSProvider {
  name = 'aws';
  category = 'cloud';
  pollInterval = 'fast' as const;
  metadata: ProviderMetadata = {
    name: 'aws',
    displayName: 'Amazon Web Services',
    description: 'Cloud computing platform — EC2, S3, Lambda, RDS, and more',
    url: 'https://health.aws.amazon.com/health/status',
  };

  constructor() {
    super('https://status.aws.amazon.com/rss/all.rss');
  }

  mapItem(item: RSSItem): AlertInput | null {
    if (!item.guid || !item.title) return null;

    const title = item.title ?? '';
    const description = this.stripHTML(item.contentSnippet ?? item.content ?? '');
    const severity = this.parseSeverity(title);
    const status = this.parseStatus(title);
    const serviceName = this.parseServiceName(title);
    const region = this.parseRegion(title, description);

    return {
      externalId: item.guid,
      source: this.name,
      category: this.category,
      severity,
      title: serviceName ? `[${serviceName}] ${title}` : title,
      description: description || undefined,
      url: item.link ?? undefined,
      region: region ?? undefined,
      timestamp: item.pubDate ? new Date(item.pubDate) : new Date(),
      status,
    };
  }

  private stripHTML(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private parseSeverity(title: string): AlertInput['severity'] {
    const lower = title.toLowerCase();
    if (lower.includes('service disruption') || lower.includes('operational issue')) return 'critical';
    if (lower.includes('performance issue') || lower.includes('degraded')) return 'major';
    if (lower.includes('informational')) return 'info';
    return 'minor';
  }

  private parseStatus(title: string): AlertInput['status'] {
    const lower = title.toLowerCase();
    if (lower.includes('[resolved]') || lower.includes('resolved')) return 'resolved';
    if (lower.includes('[investigating]')) return 'investigating';
    if (lower.includes('[monitoring]')) return 'monitoring';
    return 'active';
  }

  private parseServiceName(title: string): string | null {
    // AWS titles often start with "Service is operating normally: Amazon EC2 (us-east-1)"
    // or "Informational message: Amazon S3"
    const colonIdx = title.indexOf(':');
    if (colonIdx === -1) return null;
    const afterColon = title.substring(colonIdx + 1).trim();
    // Strip region suffix like "(us-east-1)"
    return afterColon.replace(/\s*\([^)]*\)\s*$/, '').trim() || null;
  }

  private parseRegion(title: string, description: string): string | null {
    const regionPattern = /\b(us|eu|ap|sa|ca|me|af|il)-(north|south|east|west|central|northeast|southeast|northwest|southwest)-\d+\b/;
    const titleMatch = title.match(regionPattern);
    if (titleMatch) return titleMatch[0];
    const descMatch = description.match(regionPattern);
    if (descMatch) return descMatch[0];
    return null;
  }
}
