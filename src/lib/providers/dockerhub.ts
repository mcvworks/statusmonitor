import { BaseStatusRSSProvider } from './base-status-rss';
import type { RSSItem } from './base-rss';
import type { AlertInput, ProviderMetadata } from './types';

const FEED_STATUSES: Record<string, AlertInput['status']> = {
  investigating: 'investigating',
  identified: 'investigating',
  monitoring: 'monitoring',
  resolved: 'resolved',
  scheduled: 'active',
  'in progress': 'active',
  verifying: 'monitoring',
  complete: 'resolved',
  completed: 'resolved',
};

export class DockerHubProvider extends BaseStatusRSSProvider {
  name = 'dockerhub';
  category = 'devops';
  pollInterval = 'slow' as const;
  metadata: ProviderMetadata = {
    name: 'dockerhub',
    displayName: 'Docker Hub',
    description: 'Container image registry and build service',
    url: 'https://www.dockerstatus.com',
  };

  constructor() {
    super('https://www.dockerstatus.com/feed.rss');
  }

  mapItem(item: RSSItem): AlertInput | null {
    const alert = super.mapItem(item);
    if (!alert) return null;

    // incident.io puts the current state before the description. Prose may
    // mention earlier states, and completed maintenance uses "Complete".
    const label = /^Status:\s*(investigating|identified|monitoring|resolved|scheduled|in progress|verifying|complete|completed)\b/i
      .exec(alert.description ?? '')?.[1].toLowerCase();
    if (label) {
      alert.status = FEED_STATUSES[label];
      alert.resolvedAt = alert.status === 'resolved' ? alert.timestamp : undefined;
    }
    return alert;
  }
}
