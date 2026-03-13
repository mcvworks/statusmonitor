import { BaseJSONProvider } from './base-json';
import type { AlertInput, ProviderMetadata } from './types';

interface RadarOutage {
  id: number;
  asn: number;
  asnName: string;
  asnLocation: string;
  eventType: string;
  startDate: string;
  endDate?: string;
  scope: string;
}

interface RadarResponse {
  result: {
    outages: RadarOutage[];
  };
  success: boolean;
}

export class CloudflareRadarProvider extends BaseJSONProvider<RadarResponse> {
  name = 'cloudflare-radar';
  category = 'isp';
  pollInterval = 'slow' as const;
  metadata: ProviderMetadata = {
    name: 'cloudflare-radar',
    displayName: 'Cloudflare Radar',
    description: 'Internet outage detection and monitoring',
    url: 'https://radar.cloudflare.com',
  };

  constructor() {
    super('https://api.cloudflare.com/client/v4/radar/annotations/outages');
  }

  async fetchAlerts(): Promise<AlertInput[]> {
    const apiKey = process.env.CLOUDFLARE_RADAR_API_KEY;
    if (!apiKey) {
      console.warn(`[${this.name}] CLOUDFLARE_RADAR_API_KEY not set, skipping`);
      return [];
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const params = new URLSearchParams({
        dateStart: oneDayAgo.toISOString(),
        dateEnd: now.toISOString(),
        limit: '50',
        format: 'json',
      });

      const response = await fetch(`${this.apiUrl}?${params}`, {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        console.error(
          `[${this.name}] HTTP ${response.status} from Cloudflare Radar`,
        );
        return [];
      }

      const data = (await response.json()) as RadarResponse;
      if (!data.success) {
        console.error(`[${this.name}] Cloudflare Radar API returned failure`);
        return [];
      }

      return this.mapResponse(data);
    } catch (error) {
      console.error(`[${this.name}] Failed to fetch Radar data:`, error);
      return [];
    }
  }

  mapResponse(data: RadarResponse): AlertInput[] {
    return (data.result?.outages ?? []).map((outage) => {
      const severity: AlertInput['severity'] =
        outage.scope === 'country'
          ? 'critical'
          : outage.scope === 'region'
            ? 'major'
            : 'minor';

      const description = [
        `ASN: ${outage.asn} (${outage.asnName})`,
        `Location: ${outage.asnLocation}`,
        `Type: ${outage.eventType}`,
        `Scope: ${outage.scope}`,
      ].join('\n');

      return {
        externalId: `radar-${outage.id}`,
        source: this.name,
        category: this.category,
        severity,
        title: `Internet outage: ${outage.asnName} (${outage.asnLocation})`,
        description,
        url: `https://radar.cloudflare.com/outage-center`,
        region: outage.asnLocation,
        timestamp: new Date(outage.startDate),
        status: outage.endDate ? 'resolved' : 'active',
        resolvedAt: outage.endDate ? new Date(outage.endDate) : undefined,
      };
    });
  }
}
