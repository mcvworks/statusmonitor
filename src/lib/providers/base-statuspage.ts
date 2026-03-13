import type { AlertProvider, AlertInput, ProviderMetadata } from './types';

interface StatuspageIncident {
  id: string;
  name: string;
  status: string;
  impact: string;
  shortlink: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  components: Array<{ name: string }>;
  incident_updates: Array<{
    body: string;
    status: string;
    updated_at: string;
  }>;
}

interface StatuspageResponse {
  incidents: StatuspageIncident[];
}

const SEVERITY_MAP: Record<string, AlertInput['severity']> = {
  critical: 'critical',
  major: 'major',
  minor: 'minor',
  none: 'info',
};

const STATUS_MAP: Record<string, AlertInput['status']> = {
  investigating: 'investigating',
  identified: 'investigating',
  monitoring: 'monitoring',
  resolved: 'resolved',
  postmortem: 'resolved',
};

export abstract class BaseStatuspageProvider implements AlertProvider {
  abstract name: string;
  abstract category: string;
  abstract pollInterval: 'fast' | 'slow';
  abstract metadata: ProviderMetadata;

  constructor(protected baseUrl: string) {}

  async fetchAlerts(): Promise<AlertInput[]> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const response = await fetch(
        `${this.baseUrl}/api/v2/incidents.json`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (!response.ok) {
        console.error(`[${this.name}] HTTP ${response.status} from statuspage`);
        return [];
      }

      const data = (await response.json()) as StatuspageResponse;
      return data.incidents.map((incident) => this.mapIncident(incident));
    } catch (error) {
      console.error(`[${this.name}] Failed to fetch alerts:`, error);
      return [];
    }
  }

  private mapIncident(incident: StatuspageIncident): AlertInput {
    const componentNames = incident.components
      .map((c) => c.name)
      .join(', ');

    const latestUpdate = incident.incident_updates?.[0];
    const description = latestUpdate
      ? `${latestUpdate.body}${componentNames ? ` (Affected: ${componentNames})` : ''}`
      : componentNames
        ? `Affected components: ${componentNames}`
        : undefined;

    return {
      externalId: incident.id,
      source: this.name,
      category: this.category,
      severity: SEVERITY_MAP[incident.impact] ?? 'info',
      title: incident.name,
      description,
      url: incident.shortlink || undefined,
      timestamp: new Date(incident.created_at),
      status: STATUS_MAP[incident.status] ?? 'active',
      resolvedAt: incident.resolved_at
        ? new Date(incident.resolved_at)
        : undefined,
    };
  }
}
