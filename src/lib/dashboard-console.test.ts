import assert from "node:assert/strict";
import test from "node:test";
import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { SWRConfig, type State } from "swr";
import { AlertList } from "../components/dashboard/AlertList";
import { HealthBanner } from "../components/dashboard/HealthBanner";
import { NewsTicker } from "../components/dashboard/NewsTicker";
import { ProviderDetailPanel } from "../components/dashboard/ProviderDetailPanel";
import { StatusOverview } from "../components/dashboard/StatusOverview";
import { Sidebar } from "../components/layout/Sidebar";
import { DASHBOARD_SUMMARY_KEY } from "../hooks/useDashboardSummary";
import { buildDashboardSummary, type SummaryProvider } from "./dashboard-snapshot";

const now = new Date("2026-11-20T03:00:00Z");
const summary = buildDashboardSummary({
  now,
  lastPollAt: now,
  sources: [{
    key: "cloudflare",
    category: "cloud",
    freshnessWindowMs: 6 * 60_000,
    successfulPoll: { startedAt: now, completedAt: now },
    hasUnverifiedObservations: false,
    state: { lastSuccessAt: now, lastError: null, consecutiveFailures: 0 },
  }],
  openAlerts: [],
  advisoriesOpen: 0,
  advisoriesRecent: 0,
});

const servedAt = now.getTime();
const summarySample = { summary, servedAt, requestStartedAt: null };
const feedData = {
  alerts: [{
    id: "example-alert",
    source: "cloudflare",
    category: "cloud",
    title: "Example incident",
    severity: "major",
    timestamp: now.toISOString(),
    lastObservedAt: now.toISOString(),
    status: "investigating",
    signalKind: "incident",
    confidence: "official",
    url: "https://example.com/status",
  }],
};

test("a failed refresh renders a cached all-clear as last known in the Console", () => {
  const cache = new Map([[DASHBOARD_SUMMARY_KEY, {
    data: summarySample,
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
        { value: { fallback: { [DASHBOARD_SUMMARY_KEY]: summarySample, "/api/alerts": feedData } } },
        createElement(Sidebar, { collapsed: false, onToggle: () => {} }),
      ),
    ));
  }

  assert.match(renderSidebar("/"), /href="\/status\/cloudflare"><span class="status-dot status-dot-operational"/);
  assert.match(renderSidebar("/dashboard"), /href="\/status\/cloudflare"><span class="status-dot status-dot-outage"/);
  assert.match(renderSidebar("/status/aws"), /href="\/status\/cloudflare"><span class="status-dot status-dot-outage"/);
});


test("the Console reports incomplete coverage while a source awaits its next verified poll", () => {
  const inFlight = withSourceUnavailable("unverified");
  const cache = new Map([[DASHBOARD_SUMMARY_KEY, { data: inFlight }]]);
  const markup = renderToStaticMarkup(createElement(
    SWRConfig,
    { value: { provider: () => cache } },
    createElement(HealthBanner, { sseStatus: "connected" }),
    createElement<NonNullable<ComponentProps<typeof StatusOverview>>>(StatusOverview, { variant: "rail" }),
  ));

  assert.match(markup, /Current incident status is unavailable/);
  assert.match(markup, /Sources with incomplete coverage/);
  assert.match(markup, /awaiting a recorded successful poll/);
  assert.doesNotMatch(markup, /No confirmed incidents|none current at fresh sources|Operational|Every source is fresh/);
});

const emptyAlerts = { data: { alerts: [] }, isLoading: false };

function withSourceUnavailable(dataState: "stale" | "unverified") {
  const coverage = dataState === "stale" ? "stale" : "unavailable";
  const provider: SummaryProvider = {
    ...summary.providers[0],
    dataState,
    coverage,
    status: "unknown",
  };
  return {
    ...summarySample,
    summary: {
      ...summary,
      coverage: { ...summary.coverage, fresh: 0, [coverage]: 1 },
      providers: [provider],
    },
  };
}

function renderProviderDetail(
  alerts: State<unknown>,
  snapshot: State<unknown> = { data: summarySample },
) {
  const cache = new Map([
    [DASHBOARD_SUMMARY_KEY, snapshot],
    ["/api/alerts?source=cloudflare", alerts],
  ]);
  const noop = () => {};
  return renderToStaticMarkup(createElement(
    AppRouterContext.Provider,
    { value: { back: noop, forward: noop, refresh: noop, push: noop, replace: noop, prefetch: noop } },
    createElement(
      SearchParamsContext.Provider,
      { value: new URLSearchParams("source=cloudflare") },
      createElement(
        SWRConfig,
        { value: { provider: () => cache } },
        createElement(ProviderDetailPanel, { source: "cloudflare" }),
      ),
    ),
  ));
}

function assertUnknownDetail(markup: string, note: RegExp) {
  assert.match(markup, />Unknown</);
  assert.match(markup, note);
  assert.match(markup, />Active incidents<\/span><span[^>]*>—</);
  assert.doesNotMatch(markup, />Operational</);
}

test("provider detail suppresses current status and counts during alert loading or failure", () => {
  assertUnknownDetail(renderProviderDetail({ isLoading: true }), /Checking provider status/);
  assertUnknownDetail(
    renderProviderDetail({ ...emptyAlerts, error: new Error("refresh failed") }),
    /Provider alerts could not be refreshed/,
  );
});

test("provider detail requires current verified source data even after a successful alert fetch", () => {
  assertUnknownDetail(
    renderProviderDetail(emptyAlerts, { data: withSourceUnavailable("stale") }),
    /Source data is stale/,
  );
  assertUnknownDetail(
    renderProviderDetail(emptyAlerts, { data: withSourceUnavailable("unverified") }),
    /Waiting for a verified source poll/,
  );
  assertUnknownDetail(
    renderProviderDetail(emptyAlerts, { data: summarySample, error: new Error("refresh failed") }),
    /Current provider status is unavailable/,
  );
  const lastObservedAt = new Date(now.getTime() + 1000).toISOString();
  assertUnknownDetail(
    renderProviderDetail({ data: { alerts: [{ ...feedData.alerts[0], lastObservedAt }] }, isLoading: false }),
    /Waiting for a verified source poll/,
  );
});

test("provider detail reports operational after a successful empty fetch with verified source data", () => {
  const markup = renderProviderDetail(emptyAlerts);
  assert.match(markup, />Operational</);
  assert.match(markup, />Active incidents<\/span><span[^>]*>0</);
  assert.match(markup, />Official status page</);
  assert.match(markup, /href="\/feed.xml\?source=cloudflare"/);
});


test("a personal feed refresh failure is shown alongside cached alerts without a feed count", () => {
  const cache = new Map([["/api/alerts", {
    data: { ...feedData, total: 1 },
    isLoading: false,
    error: new Error("Alert request failed"),
  }]]);
  const markup = renderToStaticMarkup(createElement(
    SWRConfig,
    { value: { provider: () => cache } },
    createElement<NonNullable<ComponentProps<typeof AlertList>>>(AlertList, { sourceFilter: ["cloudflare"] }),
  ));

  assert.match(markup, /role="alert"[^>]*>Failed to load alerts\. Retrying\.\.\./);
  assert.match(markup, /Example incident/);
  assert.doesNotMatch(markup, /Showing 1/);

  const filtered = renderToStaticMarkup(createElement(
    SWRConfig,
    { value: { provider: () => new Map(cache) } },
    createElement<NonNullable<ComponentProps<typeof AlertList>>>(AlertList, { sourceFilter: ["slack"] }),
  ));
  assert.match(filtered, /Failed to load alerts/);
  assert.doesNotMatch(filtered, /Example incident/);
});
