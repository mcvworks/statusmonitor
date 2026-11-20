import assert from "node:assert/strict";
import test from "node:test";
import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { SWRConfig } from "swr";
import { HealthBanner } from "../components/dashboard/HealthBanner";
import { NewsTicker } from "../components/dashboard/NewsTicker";
import { StatusOverview } from "../components/dashboard/StatusOverview";
import { Sidebar } from "../components/layout/Sidebar";
import { DASHBOARD_SUMMARY_KEY } from "../hooks/useDashboardSummary";
import { buildDashboardSummary } from "./dashboard-snapshot";

const now = new Date("2026-11-20T03:00:00Z");
const summary = buildDashboardSummary({
  now,
  lastPollAt: now,
  sources: [{
    key: "cloudflare",
    category: "cloud",
    freshnessWindowMs: 6 * 60_000,
    state: { lastSuccessAt: now, lastError: null, consecutiveFailures: 0 },
  }],
  openAlerts: [],
  advisoriesOpen: 0,
  advisoriesRecent: 0,
});

const summaryData = { summary, receivedAt: null };
const feedData = {
  alerts: [{
    id: "example-alert",
    source: "cloudflare",
    title: "Example incident",
    severity: "major",
    timestamp: now.toISOString(),
    status: "investigating",
    signalKind: "incident",
    confidence: "official",
    url: "https://example.com/status",
  }],
};

test("a failed refresh renders a cached all-clear as last known in the Console", () => {
  const cache = new Map([[DASHBOARD_SUMMARY_KEY, {
    data: summaryData,
    error: new Error("Summary request failed"),
  }]]);
  const markup = renderToStaticMarkup(createElement(
    SWRConfig,
    { value: { provider: () => cache } },
    createElement(HealthBanner, { sseStatus: "connected" }),
    createElement<NonNullable<ComponentProps<typeof StatusOverview>>>(StatusOverview, { variant: "rail" }),
  ));

  assert.match(markup, /Summary refresh failed/);
  assert.match(markup, /Last known confirmed incidents/);
  assert.match(markup, /Current incident status is unavailable/);
  assert.match(markup, /aria-label="Last known coverage: /);
  assert.match(markup, /Operational at last refresh/);
  assert.doesNotMatch(markup, /No confirmed incidents|none current at fresh sources|0 confirmed incidents|Every source is fresh/);
});

test("the wire repeats working destinations without repeating tab stops", () => {
  const cache = new Map([["/api/alerts?limit=50&scope=operations", { data: feedData, isLoading: false }]]);
  const markup = renderToStaticMarkup(createElement(
    SWRConfig,
    { value: { provider: () => cache } },
    createElement(NewsTicker),
  ));
  const copies = markup.split(/<span class="inline-flex items-center" aria-hidden="(?:true|false)">/);
  assert.equal(copies.length, 3);
  for (const copy of copies.slice(1)) {
    assert.match(copy, /href="\/incident\/example-alert"/);
    assert.match(copy, /href="https:\/\/example.com\/status"/);
    assert.doesNotMatch(copy, /\binert(?:=|\s|>)/);
  }
  assert.equal((copies[1].match(/tabindex="-1"/g) ?? []).length, 0);
  assert.equal((copies[2].match(/tabindex="-1"/g) ?? []).length, 2);
});

test("sidebar uses the summary on the homepage and the alert feed on other routes", () => {
  function renderSidebar(pathname: string) {
    return renderToStaticMarkup(createElement(
      PathnameContext.Provider,
      { value: pathname },
      createElement(
        SWRConfig,
        { value: { fallback: { [DASHBOARD_SUMMARY_KEY]: summaryData, "/api/alerts": feedData } } },
        createElement(Sidebar, { collapsed: false, onToggle: () => {} }),
      ),
    ));
  }

  assert.match(renderSidebar("/"), /href="\/status\/cloudflare"><span class="status-dot status-dot-operational"/);
  assert.match(renderSidebar("/dashboard"), /href="\/status\/cloudflare"><span class="status-dot status-dot-outage"/);
  assert.match(renderSidebar("/status/aws"), /href="\/status\/cloudflare"><span class="status-dot status-dot-outage"/);
});
