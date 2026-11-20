import { plainText } from './base-status-rss';
import type { AlertInput, AlertProvider, ProviderMetadata } from './types';

interface SlackIncident {
  id: number;
  title: string;
  type: string;
  status: string;
  url: string;
  date_created: string;
  date_updated: string;
  notes: Array<{ body: string; date_created: string }>;
  services: string[];
}

export class SlackStatusProvider implements AlertProvider {
  name = 'slack';
  category = 'cloud';
  pollInterval = 'fast' as const;
  metadata: ProviderMetadata = {
    name: 'slack',
    displayName: 'Slack',
    description: 'Team messaging and collaboration platform',
    url: 'https://status.slack.com',
  };

  async fetchAlerts(): Promise<AlertInput[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch('https://slack-status.com/api/v2.0.0/history', {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} from Slack status API`);

      const incidents = (await response.json()) as SlackIncident[];
      return incidents.slice(0, 50).map((incident) => {
        const latest = incident.notes.at(-1);
        const status = incident.status === 'resolved' ? 'resolved' : 'investigating';
        return {
          externalId: String(incident.id),
          source: this.name,
          category: this.category,
          severity: /unavailable|outage/i.test(incident.title) ? 'major' : 'minor',
          title: incident.title.trim(),
          description: plainText(latest?.body),
          url: incident.url,
          timestamp: new Date(incident.date_created),
          status,
          resolvedAt: status === 'resolved' ? new Date(incident.date_updated) : undefined,
          signalKind: incident.type === 'maintenance' ? 'maintenance' : 'incident',
          confidence: 'official',
          metadata: {
            services: incident.services,
            updates: incident.notes.map((note) => ({
              body: plainText(note.body),
              timestamp: note.date_created,
            })),
          },
        } satisfies AlertInput;
      });
    } catch (error) {
      throw new Error(
        `Failed to fetch Slack status: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
