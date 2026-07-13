import assert from "node:assert/strict";
import test from "node:test";
import { ConfiguredStatuspageProvider } from "./configured-statuspage";

const provider = new ConfiguredStatuspageProvider({
  name: "test-statuspage",
  displayName: "Test Statuspage",
  description: "Test provider",
  baseUrl: "https://status.example.com",
});

test("maps Statuspage incidents when optional component arrays are absent", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        incidents: [
          {
            id: "incident-1",
            name: "Elevated errors",
            status: "investigating",
            impact: "major",
            shortlink: "https://stspg.io/example",
            created_at: "2026-07-13T00:00:00Z",
            updated_at: "2026-07-13T00:01:00Z",
            resolved_at: null,
            incident_updates: [
              {
                body: "We are investigating.",
                status: "investigating",
                updated_at: "2026-07-13T00:01:00Z",
              },
            ],
          },
        ],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );

  const alerts = await provider.fetchAlerts();
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].severity, "major");
  assert.equal(alerts[0].status, "investigating");
  assert.deepEqual(alerts[0].metadata?.components, []);
});

test("provider HTTP failures reject instead of masquerading as empty success", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => new Response(null, { status: 503 });

  await assert.rejects(provider.fetchAlerts(), /HTTP 503 from statuspage/);
});
