import type { AlertInput, AlertProvider, ProviderMetadata } from "./types";

interface GitHubAdvisory {
  ghsa_id: string;
  cve_id: string | null;
  url: string;
  html_url: string;
  summary: string;
  description: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low" | "unknown";
  published_at: string;
  updated_at: string;
  withdrawn_at: string | null;
  identifiers: Array<{ value: string; type: string }>;
  vulnerabilities: Array<{
    package: { ecosystem: string; name: string };
    vulnerable_version_range: string;
    first_patched_version: string | null;
    vulnerable_functions?: string[];
  }>;
  cvss?: { score: number; vector_string: string | null };
  cwes?: Array<{ cwe_id: string; name: string }>;
}

export class GitHubAdvisoriesProvider implements AlertProvider {
  name = "github-advisories";
  category = "security";
  pollInterval = "slow" as const;
  minimumIntervalMs = 30 * 60 * 1000;
  silenceInitialBackfill = true;
  metadata: ProviderMetadata = {
    name: this.name,
    displayName: "GitHub Advisories",
    description: "Reviewed advisories for open-source packages and ecosystems",
    url: "https://github.com/advisories",
  };

  async fetchAlerts(): Promise<AlertInput[]> {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "DTMonitor-Security-Collector/1.0",
    };
    const token = process.env.GITHUB_ADVISORIES_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(
      "https://api.github.com/advisories?type=reviewed&sort=published&direction=desc&per_page=100",
      { headers, signal: AbortSignal.timeout(15_000) },
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from GitHub Advisories API`);
    }
    return this.mapResponse((await response.json()) as GitHubAdvisory[]);
  }

  mapResponse(advisories: GitHubAdvisory[], now = new Date()): AlertInput[] {
    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return advisories
      .filter((advisory) =>
        !advisory.withdrawn_at
        && new Date(advisory.published_at) >= cutoff
        && ["critical", "high"].includes(advisory.severity),
      )
      .map((advisory) => {
        const packages = advisory.vulnerabilities.map((item) => ({
          ecosystem: item.package.ecosystem,
          name: item.package.name,
          vulnerableRange: item.vulnerable_version_range,
          firstPatchedVersion: item.first_patched_version,
        }));
        const packageNames = [...new Set(packages.map((item) => item.name))];
        const patched = packages.filter((item) => item.firstPatchedVersion);
        const action = patched.length > 0
          ? `Upgrade affected packages to a patched version: ${patched.map((item) => `${item.name} ${item.firstPatchedVersion}`).join(", ")}.`
          : "Review the advisory for a vendor workaround or patched release and restrict exposure until one is available.";

        return {
          externalId: advisory.ghsa_id,
          source: this.name,
          category: this.category,
          severity: advisory.severity === "critical" ? "critical" : "major",
          title: `${advisory.cve_id ? `${advisory.cve_id}: ` : ""}${advisory.summary}`,
          description: advisory.description || advisory.summary,
          url: advisory.html_url,
          timestamp: new Date(advisory.published_at),
          status: "active",
          signalKind: "advisory",
          confidence: "official",
          metadata: {
            securityKind: "critical-vulnerability",
            exploitationStatus: "none-known",
            ghsaId: advisory.ghsa_id,
            cveId: advisory.cve_id,
            identifiers: advisory.identifiers,
            packages,
            ecosystems: [...new Set(packages.map((item) => item.ecosystem))],
            product: packageNames.join(", ") || null,
            requiredAction: action,
            cvss: advisory.cvss
              ? { score: advisory.cvss.score, vector: advisory.cvss.vector_string }
              : null,
            cwes: advisory.cwes ?? [],
            advisoryType: advisory.type,
            updatedAt: advisory.updated_at,
          },
        };
      });
  }
}
