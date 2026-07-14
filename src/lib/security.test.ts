import assert from "node:assert/strict";
import test from "node:test";
import type { Alert } from "@/generated/prisma/client";
import { toSecurityEvent } from "./security";

function alert(overrides: Partial<Alert> = {}): Alert {
  const now = new Date("2026-07-13T12:00:00.000Z");
  return {
    id: "alert-1",
    externalId: "CVE-2026-0001",
    source: "nvd",
    category: "security",
    severity: "critical",
    title: "CVE-2026-0001",
    description: null,
    url: null,
    region: null,
    timestamp: now,
    status: "active",
    signalKind: "advisory",
    confidence: "official",
    previousSeverity: null,
    metadata: null,
    resolvedAt: null,
    expiresAt: null,
    lastObservedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

test("CISA KEV ranks active exploitation above an unexploited CVSS advisory", () => {
  const kev = toSecurityEvent(alert({
    source: "cisa-kev",
    severity: "major",
    metadata: JSON.stringify({ requiredAction: "Apply the vendor update." }),
  }));
  const nvd = toSecurityEvent(alert({ severity: "critical" }));

  assert.equal(kev.kind, "exploited-vulnerability");
  assert.equal(kev.exploitationState, "active");
  assert.ok(kev.riskScore > nvd.riskScore);
  assert.equal(kev.action, "Apply the vendor update.");
});

test("EPSS enrichments affect exploitation state without claiming confirmation", () => {
  const event = toSecurityEvent(alert({
    metadata: JSON.stringify({ epss: { probability: 0.62 } }),
  }));

  assert.equal(event.kind, "critical-vulnerability");
  assert.equal(event.exploitationState, "likely");
  assert.equal(event.epssProbability, 0.62);
});
