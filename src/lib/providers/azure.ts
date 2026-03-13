import { BaseRSSProvider, type RSSItem } from './base-rss';
import type { AlertInput, ProviderMetadata } from './types';

export class AzureProvider extends BaseRSSProvider {
  name = 'azure';
  category = 'cloud';
  pollInterval = 'fast' as const;
  metadata: ProviderMetadata = {
    name: 'azure',
    displayName: 'Microsoft Azure',
    description: 'Cloud computing platform — VMs, App Service, Azure SQL, and more',
    url: 'https://azure.status.microsoft/en-us/status',
  };

  constructor() {
    super('https://azure.status.microsoft/en-us/status/feed/');
  }

  mapItem(item: RSSItem): AlertInput | null {
    if (!item.guid || !item.title) return null;

    const title = item.title ?? '';
    const description = item.contentSnippet ?? item.content ?? '';
    const severity = this.parseSeverity(title, description);
    const status = this.parseStatus(title, description);
    const regions = this.parseRegions(title, description);

    return {
      externalId: item.guid,
      source: this.name,
      category: this.category,
      severity,
      title,
      description: description.trim() || undefined,
      url: item.link ?? undefined,
      region: regions ?? undefined,
      timestamp: item.pubDate ? new Date(item.pubDate) : new Date(),
      status,
    };
  }

  private parseSeverity(title: string, description: string): AlertInput['severity'] {
    const text = `${title} ${description}`.toLowerCase();
    if (text.includes('outage') || text.includes('service disruption') || text.includes('unavailable')) return 'critical';
    if (text.includes('degraded') || text.includes('degradation') || text.includes('performance')) return 'major';
    if (text.includes('advisory') || text.includes('informational')) return 'info';
    return 'minor';
  }

  private parseStatus(title: string, description: string): AlertInput['status'] {
    const text = `${title} ${description}`.toLowerCase();
    if (text.includes('resolved') || text.includes('mitigated')) return 'resolved';
    if (text.includes('investigating')) return 'investigating';
    if (text.includes('monitoring')) return 'monitoring';
    return 'active';
  }

  private parseRegions(title: string, description: string): string | null {
    const text = `${title} ${description}`;
    // Azure regions: "East US", "West Europe", "Southeast Asia", etc.
    const regionPattern = /\b(East US 2?|West US [23]?|Central US|North Central US|South Central US|West Central US|Canada (?:Central|East)|Brazil South|North Europe|West Europe|UK (?:South|West)|France (?:Central|South)|Germany (?:West Central|North)|Switzerland (?:North|West)|Norway (?:East|West)|Sweden Central|East Asia|Southeast Asia|Japan (?:East|West)|Australia (?:East|Central|Southeast)|Korea (?:Central|South)|South Africa (?:North|West)|UAE (?:North|Central)|Central India|South India|West India)\b/gi;
    const matches = text.match(regionPattern);
    if (matches && matches.length > 0) {
      // Deduplicate and join
      const unique = [...new Set(matches.map(r => r.trim()))];
      return unique.join(', ');
    }
    return null;
  }
}
