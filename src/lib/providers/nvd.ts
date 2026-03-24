import { BaseJSONProvider } from './base-json';
import type { AlertInput, ProviderMetadata } from './types';

interface NVDCVSSData {
  baseScore: number;
  baseSeverity: string;
  vectorString?: string;
  attackVector?: string;
  attackComplexity?: string;
  privilegesRequired?: string;
  userInteraction?: string;
  scope?: string;
  confidentialityImpact?: string;
  integrityImpact?: string;
  availabilityImpact?: string;
}

interface NVDMetric {
  cvssData: NVDCVSSData;
}

interface NVDDescription {
  lang: string;
  value: string;
}

interface NVDCVE {
  id: string;
  published: string;
  lastModified: string;
  descriptions: NVDDescription[];
  metrics?: {
    cvssMetricV31?: NVDMetric[];
    cvssMetricV40?: NVDMetric[];
  };
}

interface NVDResponse {
  vulnerabilities: Array<{ cve: NVDCVE }>;
  totalResults: number;
  resultsPerPage: number;
}

export class NVDProvider extends BaseJSONProvider<NVDResponse> {
  name = 'nvd';
  category = 'security';
  pollInterval = 'slow' as const;
  metadata: ProviderMetadata = {
    name: 'nvd',
    displayName: 'NVD',
    description: 'National Vulnerability Database — high severity CVEs',
    url: 'https://nvd.nist.gov',
  };

  constructor() {
    // Fetch CVEs modified in the last 24 hours with CVSS >= 7.0
    super('https://services.nvd.nist.gov/rest/json/cves/2.0');
  }

  async fetchAlerts(): Promise<AlertInput[]> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const params = new URLSearchParams({
        pubStartDate: oneDayAgo.toISOString(),
        pubEndDate: now.toISOString(),
        cvssV3Severity: 'HIGH',
        resultsPerPage: '50',
      });

      const headers: Record<string, string> = {};
      const apiKey = process.env.NVD_API_KEY;
      if (apiKey) {
        headers['apiKey'] = apiKey;
      }

      const response = await fetch(`${this.apiUrl}?${params}`, {
        signal: controller.signal,
        headers,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        console.error(`[${this.name}] HTTP ${response.status} from NVD API`);
        return [];
      }

      const data = (await response.json()) as NVDResponse;
      return this.mapResponse(data);
    } catch (error) {
      console.error(`[${this.name}] Failed to fetch NVD data:`, error);
      return [];
    }
  }

  mapResponse(data: NVDResponse): AlertInput[] {
    const alerts: AlertInput[] = [];

    for (const { cve } of data.vulnerabilities) {
      const cvss =
        cve.metrics?.cvssMetricV40?.[0] ??
        cve.metrics?.cvssMetricV31?.[0];
      const score = cvss?.cvssData.baseScore ?? 0;

      if (score < 7.0) continue;

      const enDesc = cve.descriptions.find((d) => d.lang === 'en');
      const description = enDesc?.value ?? cve.descriptions[0]?.value;

      let severity: AlertInput['severity'];
      if (score >= 9.0) {
        severity = 'critical';
      } else if (score >= 8.0) {
        severity = 'major';
      } else {
        severity = 'minor';
      }

      const cvssData = cvss?.cvssData;
      alerts.push({
        externalId: cve.id,
        source: this.name,
        category: this.category,
        severity,
        title: `${cve.id} (CVSS ${score.toFixed(1)})`,
        description,
        url: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
        timestamp: new Date(cve.published),
        status: 'active',
        metadata: {
          cvss: {
            score,
            severity: cvssData?.baseSeverity ?? null,
            vector: cvssData?.vectorString ?? null,
            attackVector: cvssData?.attackVector ?? null,
            attackComplexity: cvssData?.attackComplexity ?? null,
            privilegesRequired: cvssData?.privilegesRequired ?? null,
            userInteraction: cvssData?.userInteraction ?? null,
            scope: cvssData?.scope ?? null,
            confidentialityImpact: cvssData?.confidentialityImpact ?? null,
            integrityImpact: cvssData?.integrityImpact ?? null,
            availabilityImpact: cvssData?.availabilityImpact ?? null,
          },
        },
      });
    }

    return alerts;
  }
}
