import assert from "node:assert/strict";
import test from "node:test";
import { GitHubAdvisoriesProvider } from "./github-advisories";

test("maps recent reviewed GitHub advisories with package remediation", () => {
  const provider = new GitHubAdvisoriesProvider();
  const alerts = provider.mapResponse([{
    ghsa_id: "GHSA-aaaa-bbbb-cccc",
    cve_id: "CVE-2026-1234",
    url: "https://api.github.com/advisories/GHSA-aaaa-bbbb-cccc",
    html_url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc",
    summary: "Example package allows remote code execution",
    description: "A remotely exploitable flaw affects Example package.",
    type: "reviewed",
    severity: "critical",
    published_at: "2026-07-12T12:00:00Z",
    updated_at: "2026-07-12T13:00:00Z",
    withdrawn_at: null,
    identifiers: [{ type: "CVE", value: "CVE-2026-1234" }],
    vulnerabilities: [{
      package: { ecosystem: "npm", name: "example" },
      vulnerable_version_range: "< 4.2.1",
      first_patched_version: "4.2.1",
    }],
    cvss: { score: 9.8, vector_string: "CVSS:3.1/AV:N/AC:L" },
    cwes: [{ cwe_id: "CWE-94", name: "Code Injection" }],
  }], new Date("2026-07-13T12:00:00Z"));

  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].severity, "critical");
  assert.match(String(alerts[0].metadata?.requiredAction), /4\.2\.1/);
  assert.equal(alerts[0].metadata?.cveId, "CVE-2026-1234");
});

test("ignores withdrawn, stale, and lower-severity GitHub advisories", () => {
  const provider = new GitHubAdvisoriesProvider();
  const base = {
    ghsa_id: "GHSA-aaaa-bbbb-cccc", cve_id: null, url: "", html_url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc",
    summary: "Example", description: "Example", type: "reviewed", severity: "medium" as const,
    published_at: "2026-07-12T12:00:00Z", updated_at: "2026-07-12T12:00:00Z", withdrawn_at: null,
    identifiers: [], vulnerabilities: [], cvss: undefined, cwes: [],
  };
  assert.equal(provider.mapResponse([base], new Date("2026-07-13T12:00:00Z")).length, 0);
});

