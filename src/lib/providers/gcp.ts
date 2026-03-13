import { BaseJSONProvider } from './base-json';
import type { AlertInput, ProviderMetadata } from './types';

interface GoogleIncidentUpdate {
  created: string;
  text: string;
  status: string;
}

interface GoogleIncident {
  id: string;
  external_desc: string;
  severity: string;
  status_impact: string;
  uri: string;
  begin: string;
  end?: string;
  created: string;
  modified: string;
  affected_products: Array<{ title: string }>;
  most_recent_update?: GoogleIncidentUpdate;
}

const SEVERITY_MAP: Record<string, AlertInput['severity']> = {
  high: 'critical',
  medium: 'major',
  low: 'minor',
};

const STATUS_MAP: Record<string, AlertInput['status']> = {
  AVAILABLE: 'resolved',
  SERVICE_DISRUPTION: 'active',
  SERVICE_INFORMATION: 'investigating',
};

export class GCPProvider extends BaseJSONProvider<GoogleIncident[]> {
  name = 'gcp';
  category = 'cloud';
  pollInterval = 'fast' as const;
  metadata: ProviderMetadata = {
    name: 'gcp',
    displayName: 'Google Cloud Platform',
    description: 'Cloud computing services by Google',
    url: 'https://status.cloud.google.com',
  };

  constructor() {
    super('https://status.cloud.google.com/incidents.json');
  }

  mapResponse(data: GoogleIncident[]): AlertInput[] {
    return data.map((incident) => {
      const products = incident.affected_products
        ?.map((p) => p.title)
        .join(', ');
      const latestUpdate = incident.most_recent_update;
      const description = latestUpdate
        ? `${latestUpdate.text}${products ? ` (Affected: ${products})` : ''}`
        : products
          ? `Affected products: ${products}`
          : undefined;

      const status = latestUpdate?.status
        ? (STATUS_MAP[latestUpdate.status] ?? 'active')
        : incident.end
          ? 'resolved'
          : 'active';

      return {
        externalId: incident.id,
        source: this.name,
        category: this.category,
        severity: SEVERITY_MAP[incident.severity] ?? 'info',
        title: incident.external_desc,
        description,
        url: incident.uri
          ? `https://status.cloud.google.com${incident.uri}`
          : undefined,
        timestamp: new Date(incident.created),
        status,
        resolvedAt: incident.end ? new Date(incident.end) : undefined,
      };
    });
  }
}
