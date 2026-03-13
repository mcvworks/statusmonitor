import { BaseRSSProvider, type RSSItem } from './base-rss';
import type { AlertInput, ProviderMetadata } from './types';

export class M365Provider extends BaseRSSProvider {
  name = 'm365';
  category = 'cloud';
  pollInterval = 'fast' as const;
  metadata: ProviderMetadata = {
    name: 'm365',
    displayName: 'Microsoft 365',
    description: 'Productivity suite — Outlook, Teams, SharePoint, OneDrive, and more',
    url: 'https://status.office.com',
  };

  constructor() {
    super('https://status.office.com/api/feed/mac');
  }

  mapItem(item: RSSItem): AlertInput | null {
    if (!item.guid || !item.title) return null;

    const title = item.title ?? '';
    const description = item.contentSnippet ?? item.content ?? '';
    const severity = this.parseSeverity(title, description);
    const status = this.parseStatus(title, description);
    const service = this.parseService(title);

    return {
      externalId: item.guid,
      source: this.name,
      category: this.category,
      severity,
      title: service ? `[${service}] ${title}` : title,
      description: description.trim() || undefined,
      url: item.link ?? 'https://status.office.com',
      timestamp: item.pubDate ? new Date(item.pubDate) : new Date(),
      status,
    };
  }

  private parseSeverity(title: string, description: string): AlertInput['severity'] {
    const text = `${title} ${description}`.toLowerCase();
    // M365 uses terms like "service incident", "advisory", "service degradation"
    if (text.includes('service incident') || text.includes('outage') || text.includes('unavailable')) return 'critical';
    if (text.includes('degradation') || text.includes('degraded') || text.includes('intermittent')) return 'major';
    if (text.includes('advisory') || text.includes('planned maintenance')) return 'info';
    return 'minor';
  }

  private parseStatus(title: string, description: string): AlertInput['status'] {
    const text = `${title} ${description}`.toLowerCase();
    if (text.includes('resolved') || text.includes('service restored') || text.includes('service is restored')) return 'resolved';
    if (text.includes('investigating')) return 'investigating';
    if (text.includes('monitoring') || text.includes('we\'re monitoring')) return 'monitoring';
    return 'active';
  }

  private parseService(title: string): string | null {
    // M365 titles often reference specific services
    const services = [
      'Exchange Online', 'Microsoft Teams', 'SharePoint Online',
      'OneDrive for Business', 'Outlook', 'Microsoft 365 Admin Center',
      'Yammer', 'Planner', 'Power BI', 'Power Automate',
      'Power Apps', 'Microsoft Forms', 'Microsoft Stream',
      'Microsoft Bookings', 'Microsoft To Do', 'Intune',
      'Azure Active Directory', 'Entra',
    ];

    for (const service of services) {
      if (title.toLowerCase().includes(service.toLowerCase())) {
        return service;
      }
    }
    return null;
  }
}
