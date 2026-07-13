import assert from "node:assert/strict";
import test from "node:test";
import type { SerializedAlert } from "./alert-schema";
import { deriveProviderStatus } from "./provider-status";

function alert(
  overrides: Partial<SerializedAlert> = {},
): SerializedAlert {
  const now = new Date().toISOString();
  return {
    id: "alert-1",
    externalId: "external-1",
    source: "example",
    category: "cloud",
    severity: "minor",
    previousSeverity: null,
    title: "Example",
    description: null,
    url: null,
    region: null,
    timestamp: now,
    status: "active",
    signalKind: "incident",
    confidence: "official",
    metadata: null,
    resolvedAt: null,
    expiresAt: null,
    lastObservedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

test("advisories and community signals do not degrade service health", () => {
  assert.equal(
    deriveProviderStatus([
      alert({ signalKind: "advisory", severity: "critical" }),
      alert({ signalKind: "community_signal", severity: "major" }),
    ]),
    "operational",
  );
});

test("official operational signals determine provider status", () => {
  assert.equal(
    deriveProviderStatus([alert({ signalKind: "incident", severity: "major" })]),
    "outage",
  );
  assert.equal(
    deriveProviderStatus([alert({ signalKind: "internet_outage", severity: "minor" })]),
    "degraded",
  );
});
