"use client";

import { Fragment } from "react";
import Link from "next/link";
import { ArrowDown, CircleCheck, TriangleAlert } from "lucide-react";
import type { SSEStatus } from "@/hooks/useSSE";
import {
  agePartsOf,
  formatAge,
  formatUtc,
  useDashboardSummary,
  useHydrated,
} from "@/hooks/useDashboardSummary";
import type {
  DashboardSummary,
  SummaryAffected,
  SummaryProvider,
} from "@/lib/dashboard-snapshot";
import { PROVIDER_STATUS_STYLES } from "@/lib/provider-status";
import {
  MONO,
  SEVERITIES,
  SEVERITY_INK,
  SEVERITY_LABELS,
  plural,
  providerName,
} from "./console-labels";

const TILE_LABEL = `${MONO} min-h-[30px] text-[10px] uppercase leading-[15px] tracking-[0.1em] text-text-muted @2xl:min-h-0`;
// The big figure and its unit wrap as a pair when a tile is narrow.
const TILE_VALUE = "flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[28px] font-bold leading-none text-text-primary";
const TILE_UNIT = "text-[13px] font-medium leading-tight text-text-secondary";
const TILE_NOTE = `${MONO} text-[11px] leading-snug text-text-muted`;
const MAX_NAMES = 6;

const LIVE_LABELS: Record<SSEStatus, { text: string; dot: string }> = {
  connected: {
    text: "Live stream connected",
    dot: "bg-secondary shadow-[0_0_6px_rgba(72,224,199,0.5)]",
  },
  connecting: { text: "Live stream connecting…", dot: "bg-minor" },
  disconnected: {
    text: "Live stream offline · still refreshing every 30 s",
    dot: "bg-text-muted",
  },
};

function nameList(providers: SummaryProvider[]): string {
  const names = providers.slice(0, MAX_NAMES).map((p) => providerName(p.key));
  const extra = providers.length - names.length;
  return extra > 0 ? `${names.join(", ")} +${extra} more` : names.join(", ");
}

/**
 * Opening Console summary: four instrument tiles, then the providers that are
 * affected right now. Everything here comes from the server snapshot, never
 * from the alert feed's current page or filters. While the snapshot is
 * loading, failed, or out of date, nothing is presented as an all-clear.
 */
export function HealthBanner({ sseStatus }: { sseStatus: SSEStatus }) {
  const { summary, nowMs, isLoading, isError, isOutOfDate } =
    useDashboardSummary();
  const hydrated = useHydrated();
  // Before the page is live the stream has simply not started yet.
  const live = LIVE_LABELS[hydrated ? sseStatus : "connecting"];

  return (
    <section
      aria-labelledby="console-title"
      className="glass-card corner-brackets rounded-2xl p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1
            id="console-title"
            className="font-[family-name:var(--font-display)] text-lg font-bold tracking-wide text-primary-ink sm:text-xl"
          >
            Live Cloud &amp; SaaS Service Status
          </h1>
          <p className="mt-1 hidden text-[13px] text-text-secondary sm:block">
            Monitor cloud platforms, DevOps tools, security advisories, and ISP
            connectivity.
          </p>
        </div>
        <nav aria-label="Jump to" className="flex flex-wrap gap-2">
          <a
            href="#alert-feed"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[13px] font-semibold text-on-primary transition hover:brightness-110"
          >
            <span className="sm:hidden">Feed</span>
            <span className="hidden sm:inline">Alert feed</span>
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <a
            href="#provider-status"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[13px] font-semibold text-text-secondary transition-colors hover:border-border-hover hover:bg-surface-hover hover:text-text-primary"
          >
            <span className="sm:hidden">Providers</span>
            <span className="hidden sm:inline">Provider status</span>
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <a
            href="#email-alerts"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[13px] font-semibold text-text-secondary transition-colors hover:border-border-hover hover:bg-surface-hover hover:text-text-primary"
          >
            Email alerts
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </nav>
      </div>

      {summary && isOutOfDate && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-lg border border-major/40 bg-major/5 px-3 py-2 text-[13px] text-text-primary"
        >
          <TriangleAlert
            className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--ink-major)]"
            aria-hidden="true"
          />
          <span>
            This summary could not be refreshed and may be out of date. Showing
            the snapshot from {formatUtc(summary.generatedAt)}.
          </span>
        </p>
      )}

      {summary ? (
        <Tiles
          summary={summary}
          nowMs={nowMs}
          live={live}
          trusted={!isOutOfDate}
        />
      ) : (
        <TilePlaceholders failed={isError && !isLoading} />
      )}

      <h2
        className={`${MONO} mt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary`}
      >
        Affected now
        {summary && summary.affected.length > 0 && (
          <span className="font-normal text-text-muted">
            {" "}
            · {plural(summary.affected.length, "provider")}
          </span>
        )}
      </h2>

      {summary ? (
        <AffectedNow summary={summary} nowMs={nowMs} trusted={!isOutOfDate} />
      ) : (
        <p
          role={isError && !isLoading ? "alert" : "status"}
          className="mt-1.5 border-t border-border py-3 text-[13px] text-text-secondary"
        >
          {isError && !isLoading
            ? "Current status could not be loaded, so nothing can be confirmed yet. Trying again."
            : "Checking sources…"}
        </p>
      )}
    </section>
  );
}

function Tile({
  accent,
  children,
}: {
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-w-0 flex-col gap-1 rounded-[10px] border border-border border-t-2 bg-surface-input px-3 py-2.5"
      style={{ borderTopColor: accent ?? "var(--t-text-muted)" }}
    >
      {children}
    </div>
  );
}

function TilePlaceholders({ failed }: { failed: boolean }) {
  const labels = [
    "Confirmed incidents",
    "Source coverage",
    "Last completed poll",
    "Not counted as incidents",
  ];
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 @2xl:grid-cols-4">
      {labels.map((label) => (
        <Tile key={label}>
          <span className={TILE_LABEL}>{label}</span>
          <span className={`${TILE_VALUE} !text-text-muted`}>—</span>
          <span className={TILE_NOTE}>{failed ? "unavailable" : "loading…"}</span>
        </Tile>
      ))}
    </div>
  );
}

function Tiles({
  summary,
  nowMs,
  live,
  trusted,
}: {
  summary: DashboardSummary;
  nowMs: number | null;
  live: { text: string; dot: string };
  trusted: boolean;
}) {
  const { incidents, coverage, advisories } = summary;
  const worst = SEVERITIES.find((sev) => incidents.bySeverity[sev] > 0);
  const serviceGaps = summary.providers.filter(
    (p) => p.role === "service" && p.coverage !== "fresh",
  ).length;
  // Teal only for a real all-clear: nothing open anywhere, every service
  // source fresh.
  const incidentAccent = !trusted
    ? undefined
    : worst
      ? SEVERITY_INK[worst]
      : serviceGaps === 0 &&
          summary.observedOutages === 0 &&
          summary.olderOpen.total === 0
        ? "var(--ink-info)"
        : undefined;
  const pollAge = agePartsOf(summary.lastPollAt, nowMs);

  return (
    <div className="mt-4 grid grid-cols-2 gap-2 @2xl:grid-cols-4">
      <Tile accent={incidentAccent}>
        <span className={TILE_LABEL}>Confirmed incidents</span>
        <span
          className={TILE_VALUE}
          style={worst ? { color: SEVERITY_INK[worst] } : undefined}
        >
          {incidents.total.toLocaleString("en-US")}
        </span>
        <span className={TILE_NOTE}>
          {incidents.total === 0 ? (
            "none current at fresh sources"
          ) : (
            <>
              {SEVERITIES.filter((sev) => incidents.bySeverity[sev] > 0).map(
                (sev) => (
                  <span key={sev}>
                    <span style={{ color: SEVERITY_INK[sev] }}>
                      {incidents.bySeverity[sev]} {sev}
                    </span>
                    {" · "}
                  </span>
                ),
              )}
              {plural(incidents.providers, "provider")}
            </>
          )}
        </span>
        {summary.observedOutages > 0 && (
          <span className={TILE_NOTE}>
            + {plural(summary.observedOutages, "observed internet outage")}
          </span>
        )}
      </Tile>

      <Tile
        accent={
          coverage.fresh === coverage.total
            ? "var(--ink-info)"
            : "var(--ink-minor)"
        }
      >
        <span className={TILE_LABEL}>Source coverage</span>
        <span className={`${TILE_VALUE} !gap-x-0`}>
          {coverage.fresh}
          <span className={TILE_UNIT}>/{coverage.total} fresh</span>
        </span>
        <span
          role="img"
          aria-label={`${coverage.fresh} fresh, ${coverage.stale} stale, ${coverage.unavailable} unavailable`}
          className="my-0.5 flex h-2 gap-0.5 overflow-hidden rounded-full"
        >
          {coverage.fresh > 0 && (
            <span className="bg-secondary" style={{ flexGrow: coverage.fresh }} />
          )}
          {coverage.stale > 0 && (
            <span
              className="coverage-stale"
              style={{ flexGrow: coverage.stale }}
            />
          )}
          {coverage.unavailable > 0 && (
            <span
              className="bg-text-muted opacity-50"
              style={{ flexGrow: coverage.unavailable }}
            />
          )}
        </span>
        <span className={TILE_NOTE}>
          {coverage.fresh === coverage.total
            ? "every source checked recently"
            : [
                coverage.stale > 0 && `${coverage.stale} stale`,
                coverage.unavailable > 0 &&
                  `${coverage.unavailable} unavailable`,
              ]
                .filter(Boolean)
                .join(" · ")}
        </span>
      </Tile>

      <Tile>
        <span className={TILE_LABEL}>Last completed poll</span>
        {pollAge && summary.lastPollAt ? (
          <time
            dateTime={summary.lastPollAt}
            title={`Last successful source check: ${formatUtc(summary.lastPollAt)}`}
            className={TILE_VALUE}
          >
            {pollAge.value}
            <span className={TILE_UNIT}>{pollAge.unit} ago</span>
          </time>
        ) : (
          <span className={TILE_VALUE}>—</span>
        )}
        <span className={TILE_NOTE}>
          {summary.lastPollAt
            ? "newest successful source check"
            : "no source has been checked yet"}
        </span>
        <span className={`${TILE_NOTE} flex items-center gap-1.5`}>
          <span
            className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${live.dot}`}
            aria-hidden="true"
          />
          {live.text}
        </span>
      </Tile>

      <Tile>
        <span className={TILE_LABEL}>Not counted as incidents</span>
        <span className={TILE_VALUE}>
          {advisories.recent.toLocaleString("en-US")}
          <span className={TILE_UNIT}>
            {advisories.recent === 1 ? "advisory" : "advisories"}
          </span>
        </span>
        <span className={TILE_NOTE}>new in {summary.windowDays} days</span>
        <span className={TILE_NOTE}>
          + {plural(summary.unconfirmedSignals, "unconfirmed signal")}
        </span>
        <span className={TILE_NOTE}>
          <Link
            href="/security"
            className="text-primary-ink underline-offset-2 hover:underline"
          >
            {advisories.open.toLocaleString("en-US")} open in the security feed
          </Link>
        </span>
      </Tile>
    </div>
  );
}

function AffectedNow({
  summary,
  nowMs,
  trusted,
}: {
  summary: DashboardSummary;
  nowMs: number | null;
  trusted: boolean;
}) {
  const unknown = summary.providers.filter((p) => p.coverage !== "fresh");
  const stale = unknown.filter((p) => p.coverage === "stale");
  const unavailable = unknown.filter((p) => p.coverage === "unavailable");
  const serviceGaps = unknown.filter((p) => p.role === "service").length;
  // Sources that cannot be confirmed now but listed incidents when last read.
  const lastKnown = unknown.filter((p) => p.openAtLastCheck > 0);
  const olderOpen = summary.providers.filter(
    (p) => p.coverage === "fresh" && p.olderOpen > 0,
  );
  const freshServices = summary.providers.filter(
    (p) => p.role === "service" && p.coverage === "fresh",
  ).length;
  const { incidents, observedOutages } = summary;

  return (
    <>
      {/* Announced only when the wording changes, not on every refresh. */}
      <p role="status" className="sr-only">
        {plural(incidents.total, "confirmed incident")} across{" "}
        {plural(incidents.providers, "provider")}
        {observedOutages > 0 &&
          `, plus ${plural(observedOutages, "observed internet outage")}`}
        . {summary.coverage.fresh} of {summary.coverage.total} sources fresh.
      </p>

      {summary.affected.length > 0 ? (
        <ul className="mt-1.5">
          {summary.affected.map((row) => (
            <AffectedRow key={row.source} row={row} nowMs={nowMs} />
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 flex items-start gap-2 border-t border-border py-3 text-[13px] text-text-secondary">
          {trusted && serviceGaps === 0 && olderOpen.length === 0 ? (
            // The only all-clear: every service source fresh, nothing open.
            <>
              <CircleCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-secondary-ink"
                aria-hidden="true"
              />
              <span>
                <span className="font-semibold text-text-primary">
                  No confirmed incidents.
                </span>{" "}
                All {freshServices} service sources were checked in the last
                15 minutes and none lists an open incident.
              </span>
            </>
          ) : !trusted || serviceGaps > 0 ? (
            <span>
              <span className="font-semibold text-text-primary">
                No confirmed incidents from the sources that could be checked.
              </span>{" "}
              {trusted
                ? `${plural(serviceGaps, "service source")} can't be confirmed right now, so this is not an all-clear.`
                : "This snapshot is out of date, so this is not an all-clear."}
            </span>
          ) : (
            <span>
              <span className="font-semibold text-text-primary">
                No current incidents.
              </span>{" "}
              Every service source was checked in the last 15 minutes, but{" "}
              {plural(olderOpen.length, "provider")} still{" "}
              {olderOpen.length === 1 ? "lists" : "list"} older records as
              open, so this is not a full all-clear.
            </span>
          )}
        </p>
      )}

      {unknown.length > 0 && (
        <p className="flex items-start gap-2 border-t border-border px-1 pt-2.5 text-xs leading-relaxed text-text-muted">
          <span
            className={`status-dot mt-1 ${
              stale.length > 0 ? "status-dot-stale" : "status-dot-unavailable"
            }`}
            aria-hidden="true"
          />
          <span>
            Can&apos;t confirm right now:{" "}
            {stale.length > 0 && (
              <>
                <span className="font-semibold text-text-secondary">
                  {nameList(stale)}
                </span>{" "}
                (stale)
              </>
            )}
            {stale.length > 0 && unavailable.length > 0 && " · "}
            {unavailable.length > 0 && (
              <>
                <span className="font-semibold text-text-secondary">
                  {nameList(unavailable)}
                </span>{" "}
                (unavailable)
              </>
            )}
            . Shown as Unknown, never as Operational.
            {lastKnown.length > 0 && (
              <>
                {" "}
                Last known, not counted above:{" "}
                {lastKnown.slice(0, MAX_NAMES).map((provider, index) => (
                  <Fragment key={provider.key}>
                    {index > 0 && ", "}
                    <Link
                      href={`/status/${provider.key}`}
                      className="font-semibold text-text-secondary underline decoration-border underline-offset-2 transition-colors hover:text-primary-ink hover:decoration-current"
                    >
                      {providerName(provider.key)}
                    </Link>{" "}
                    had {provider.openAtLastCheck} open (checked{" "}
                    {formatAge(provider.lastSuccessAt, nowMs)})
                  </Fragment>
                ))}
                {lastKnown.length > MAX_NAMES &&
                  ` +${lastKnown.length - MAX_NAMES} more`}
                .
              </>
            )}
          </span>
        </p>
      )}

      {olderOpen.length > 0 && (
        <p
          className={`flex items-start gap-2 px-1 text-xs leading-relaxed text-text-muted ${
            unknown.length > 0 ? "pt-2" : "border-t border-border pt-2.5"
          }`}
        >
          <span
            className="status-dot status-dot-older mt-1"
            aria-hidden="true"
          />
          <span>
            Not counted:{" "}
            <span className="font-semibold text-text-secondary">
              {plural(summary.olderOpen.total, "older open record")}
            </span>{" "}
            from {nameList(olderOpen)}.{" "}
            {olderOpen.length === 1
              ? "Its feed still lists"
              : "Their feeds still list"}{" "}
            {summary.olderOpen.total === 1
              ? "it as open, but it is"
              : "them as open, but they are"}{" "}
            more than {summary.windowDays} days old with no dated updates. Not
            shown as Operational either.
          </span>
        </p>
      )}
    </>
  );
}

function AffectedRow({
  row,
  nowMs,
}: {
  row: SummaryAffected;
  nowMs: number | null;
}) {
  const style = PROVIDER_STATUS_STYLES[row.status];
  const statusInk =
    row.status === "outage" ? "var(--ink-critical)" : "var(--ink-minor)";

  return (
    <li className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-border px-1 py-2">
      <span className="flex w-full items-center gap-2 text-[13px] @xl:w-52 @xl:shrink-0">
        <span className={`status-dot ${style.dot}`} aria-hidden="true" />
        <span className="min-w-0 font-semibold text-text-primary [overflow-wrap:anywhere]">
          {providerName(row.source)}
        </span>
        <span
          className={`${MONO} text-[11px] uppercase tracking-wide`}
          style={{ color: statusInk }}
        >
          {style.label}
        </span>
      </span>

      <span className="min-w-0 flex-1 basis-56 text-[13px] [overflow-wrap:anywhere]">
        <Link
          href={`/incident/${row.id}`}
          className="text-text-primary underline decoration-border underline-offset-4 transition-colors hover:text-primary-ink hover:decoration-current"
        >
          {row.title}
        </Link>
        {row.more > 0 && (
          <>
            {" "}
            <Link
              href={`/status/${row.source}`}
              className={`${MONO} whitespace-nowrap text-[11px] text-primary-ink underline-offset-2 hover:underline`}
            >
              +{row.more} more
            </Link>
          </>
        )}
      </span>

      <span className={`${MONO} text-[11px] text-text-muted`}>
        <span style={{ color: SEVERITY_INK[row.severity] }}>
          {SEVERITY_LABELS[row.severity]}
        </span>
        {row.confidence !== "official" && (
          <span className="text-text-secondary"> · {row.confidence}</span>
        )}
        {" · "}started {formatAge(row.startedAt, nowMs)}
        {" · "}verified {formatAge(row.lastObservedAt, nowMs)}
      </span>
    </li>
  );
}
