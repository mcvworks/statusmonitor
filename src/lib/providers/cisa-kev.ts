import { BaseJSONProvider } from './base-json';
import type { AlertInput, ProviderMetadata } from './types';

interface KEVVulnerability {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  knownRansomwareCampaignUse: string;
  notes: string;
}

interface KEVCatalog {
  title: string;
  catalogVersion: string;
  dateReleased: string;
  count: number;
  vulnerabilities: KEVVulnerability[];
}

export class CISAKEVProvider extends BaseJSONProvider<KEVCatalog> {
  name = 'cisa-kev';
  category = 'security';
  pollInterval = 'slow' as const;
  metadata: ProviderMetadata = {
    name: 'cisa-kev',
    displayName: 'CISA KEV',
    description: 'Known Exploited Vulnerabilities catalog',
    url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
  };

  constructor() {
    super(
      'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
    );
  }

  mapResponse(data: KEVCatalog): AlertInput[] {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return data.vulnerabilities
      .filter((vuln) => new Date(vuln.dateAdded) >= thirtyDaysAgo)
      .map((vuln) => {
        const dueDate = new Date(vuln.dueDate);
        const daysUntilDue = Math.ceil(
          (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        let severity: AlertInput['severity'];
        if (daysUntilDue <= 0) {
          severity = 'critical';
        } else if (daysUntilDue <= 7) {
          severity = 'major';
        } else if (daysUntilDue <= 14) {
          severity = 'minor';
        } else {
          severity = 'info';
        }

        if (vuln.knownRansomwareCampaignUse === 'Known') {
          severity = severity === 'info' ? 'minor' : severity === 'minor' ? 'major' : severity;
        }

        const description = [
          vuln.shortDescription,
          `Vendor: ${vuln.vendorProject} — ${vuln.product}`,
          `Required Action: ${vuln.requiredAction}`,
          `Due: ${vuln.dueDate}`,
          vuln.knownRansomwareCampaignUse === 'Known'
            ? 'Known ransomware campaign use'
            : null,
        ]
          .filter(Boolean)
          .join('\n');

        return {
          externalId: vuln.cveID,
          source: this.name,
          category: this.category,
          severity,
          title: `${vuln.cveID}: ${vuln.vulnerabilityName}`,
          description,
          url: `https://nvd.nist.gov/vuln/detail/${vuln.cveID}`,
          timestamp: new Date(vuln.dateAdded),
          status: daysUntilDue <= 0 ? 'active' : 'investigating',
        };
      });
  }
}
