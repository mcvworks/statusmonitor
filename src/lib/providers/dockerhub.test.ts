import assert from "node:assert/strict";
import test from "node:test";
import Parser from "rss-parser";
import { DockerHubProvider } from "./dockerhub";

const provider = new DockerHubProvider();

test("Docker's incident.io RSS preserves identity and treats completed maintenance as resolved", async () => {
  const feed = await new Parser().parseString(`<?xml version="1.0"?><rss version="2.0"><channel>
    <title>Docker Status</title><link>https://www.dockerstatus.com/</link><description>Status</description>
    <item><title>Maintenance: Status page migration</title>
    <guid>https://www.dockerstatus.com//incidents/test-migration</guid>
    <link>https://www.dockerstatus.com//incidents/test-migration</link>
    <pubDate>Tue, 25 Aug 2026 20:31:30 GMT</pubDate>
    <description><![CDATA[<b>Status: Complete</b><br/><br/>The scheduled migration is complete.]]></description>
    </item></channel></rss>`);
  const alert = provider.mapItem(feed.items[0]);
  assert(alert);
  assert.equal(alert.externalId, "https://www.dockerstatus.com//incidents/test-migration");
  assert.equal(alert.source, "dockerhub");
  assert.equal(alert.signalKind, "maintenance");
  assert.equal(alert.status, "resolved");
  assert.equal(alert.resolvedAt?.toISOString(), "2026-08-25T20:31:30.000Z");
});

test("Docker's explicit status takes precedence over lifecycle words in the incident prose", () => {
  for (const [label, prose, expected] of [
    ["Resolved", "We finished investigating the outage.", "resolved"],
    ["Investigating", "The previous outage was resolved; new errors are occurring.", "investigating"],
    ["Monitoring", "We have identified the cause and applied a fix.", "monitoring"],
    ["Verifying", "The scheduled maintenance has finished.", "monitoring"],
    ["In progress", "A previous issue was resolved.", "active"],
  ] as const) {
    const alert = provider.mapItem({
      title: "Registry status", guid: `docker-test-${label}`,
      isoDate: "2026-09-24T00:00:00Z",
      content: `<b>Status: ${label}</b><br/><br/>${prose}`,
    });
    assert.equal(alert?.status, expected, label);
    assert.equal(Boolean(alert?.resolvedAt), expected === "resolved", label);
  }
});
