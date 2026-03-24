import type { AlertInput, AlertProvider, ProviderMetadata } from './types';

/**
 * Downdetector slug mapping for monitored providers.
 * Maps our provider keys to Downdetector URL slugs.
 */
export const DOWNDETECTOR_SLUGS: Record<string, string> = {
  aws: 'aws-amazon-web-services',
  azure: 'windows-azure',
  gcp: 'google-cloud',
  cloudflare: 'cloudflare',
  github: 'github',
  microsoft365: 'office-365',
  slack: 'slack',
  atlassian: 'jira',
  okta: 'okta',
  stripe: 'stripe',
  googleWorkspace: 'google',
  digitalocean: 'digitalocean',
  fastly: 'fastly',
  datadog: 'datadog',
  pagerduty: 'pagerduty',
  dockerHub: 'docker',
  npmRegistry: 'npm',
};

/** Build the public Downdetector URL for a given slug */
export function downdetectorUrl(slug: string): string {
  return `https://downdetector.com/status/${slug}/`;
}

/**
 * Downdetector provider — scrapes public status pages for crowdsourced
 * report signals. Each mapped provider gets its own check; report spikes
 * generate alerts with appropriate severity.
 *
 * Downdetector embeds a baseline / current report count in the page body.
 * We parse that to detect spikes. If the page structure changes or a
 * request fails, we gracefully return no alerts for that service.
 */
export class DowndetectorProvider implements AlertProvider {
  name = 'downdetector';
  category = 'cloud';
  pollInterval = 'slow' as const;
  metadata: ProviderMetadata = {
    name: 'downdetector',
    displayName: 'Downdetector',
    description: 'Crowdsourced outage reports from Downdetector',
    url: 'https://downdetector.com',
  };

  async fetchAlerts(): Promise<AlertInput[]> {
    const alerts: AlertInput[] = [];
    const entries = Object.entries(DOWNDETECTOR_SLUGS);

    // Fetch all services in parallel with individual error handling
    const results = await Promise.allSettled(
      entries.map(([providerKey, slug]) =>
        this.checkService(providerKey, slug),
      ),
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        alerts.push(result.value);
      }
    }

    return alerts;
  }

  private async checkService(
    providerKey: string,
    slug: string,
  ): Promise<AlertInput | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8_000);

      const response = await fetch(downdetectorUrl(slug), {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; StatusMonitor/1.0; +https://monitor.ducktyped.com)',
          Accept: 'text/html',
        },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return null;
      }

      const html = await response.text();
      return this.parseSignal(providerKey, slug, html);
    } catch {
      // Network error, timeout, or blocked — silently skip
      return null;
    }
  }

  private parseSignal(
    providerKey: string,
    slug: string,
    html: string,
  ): AlertInput | null {
    // Downdetector pages contain text patterns indicating status:
    // "Possible problems at" or "Problems at" when issues are detected
    // "No problems at" or "User reports indicate no current problems" when clear
    const hasProblems =
      /(?:Possible problems|Problems at|outage)/i.test(html) &&
      !/No problems at|no current problems/i.test(html);

    if (!hasProblems) {
      return null;
    }

    // Try to extract report count from the page
    // Downdetector shows a baseline chart with report numbers
    const reportCount = this.extractReportCount(html);
    const severity = this.classifySeverity(reportCount);

    // Only generate alerts for elevated+ signals
    if (severity === 'info') {
      return null;
    }

    const serviceName =
      slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const url = downdetectorUrl(slug);

    return {
      externalId: `dd-${slug}-${this.todayStamp()}`,
      source: this.name,
      category: this.category,
      severity,
      title: `Elevated user reports for ${serviceName}`,
      description: reportCount
        ? `Downdetector shows ~${reportCount} user reports in the last hour for ${serviceName}. This is a crowdsourced signal and may indicate an outage.`
        : `Downdetector indicates possible problems for ${serviceName}. Check the Downdetector page for report details.`,
      url,
      timestamp: new Date(),
      status: 'active',
      metadata: {
        providerKey,
        downdetectorSlug: slug,
        reportCount: reportCount ?? undefined,
        crowdsourced: true,
      },
    };
  }

  private extractReportCount(html: string): number | null {
    // Look for report count patterns in the page
    // Common patterns: "X reports", "X user reports", chart data attributes
    const patterns = [
      /(\d{1,6})\s+reports?\b/i,
      /data-reports="(\d+)"/i,
      /"report_count"\s*:\s*(\d+)/i,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(html);
      if (match?.[1]) {
        const count = parseInt(match[1], 10);
        if (count > 0 && count < 1_000_000) {
          return count;
        }
      }
    }

    return null;
  }

  private classifySeverity(
    reportCount: number | null,
  ): AlertInput['severity'] {
    if (reportCount === null) {
      // Can't determine count but page indicates problems
      return 'minor';
    }

    if (reportCount >= 1000) return 'critical';
    if (reportCount >= 300) return 'major';
    if (reportCount >= 50) return 'minor';
    return 'info';
  }

  private todayStamp(): string {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }
}
