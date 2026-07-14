# Security Intelligence Roadmap

Last updated: 2026-07-14

## Current checkpoint

The production security experience currently includes:

- a separate `/security` intelligence page with event filters and risk ranking;
- indexable security event detail pages plus RSS and JSON feeds;
- CISA Known Exploited Vulnerabilities and NVD ingestion;
- reviewed high/critical GitHub Security Advisories;
- SEC Item 1.05 cybersecurity disclosures for a configurable major-technology watchlist;
- CVE-level presentation correlation across CISA, NVD, and GitHub;
- silent initial source backfills to avoid flooding existing subscribers;
- null-safe handling for incomplete upstream CVSS records.

## Next implementation order

### 1. Separate operational and security notifications

Allow every account-free notification destination to select one or more event classes:

- operational outages;
- actively exploited vulnerabilities;
- major security incidents;
- critical vulnerability advisories;
- malware campaigns.

Apply these choices consistently to email, browser push, Slack, and Teams. Existing subscriptions should retain their current behavior until the visitor changes the new preference.

Acceptance criteria:

- security and operational preferences are independently selectable;
- management pages clearly show the selected event classes;
- notification logs prevent duplicate delivery across correlated records;
- existing subscribers are migrated without an unexpected alert burst.

### 2. Add a malware campaign pipeline

Ingest vetted indicators from ThreatFox and URLhaus. MalwareBazaar can follow after its usage and redistribution terms are reviewed for this deployment.

Raw hashes, domains, IPs, and URLs must remain evidence attached to a campaign. They must not each become a human-facing event.

Acceptance criteria:

- indicators have first-seen, last-seen, confidence, source, and expiration fields;
- indicators are clustered by malware family, campaign, infrastructure, and time window;
- only a new campaign or material campaign update can notify;
- expired infrastructure is visibly marked and no longer treated as current.

### 3. Add stack relevance

Match vulnerability and campaign data to the visitor's browser-local stack using provider, ecosystem, package, product, and version identifiers.

Acceptance criteria:

- cards explain why an event matches the visitor's stack;
- package/version matches distinguish affected, fixed, and unknown versions;
- stack data remains browser-local by default;
- notification rules can optionally require a stack match.

### 4. Measure source quality and speed

Add an internal source-quality view covering:

- source publication time versus ingestion time;
- poll and parse failures;
- stale-source duration;
- correction and false-positive counts;
- duplicate/correlation rate;
- notification delivery delay.

Latency calculations must exclude historical backfills and distinguish source delay from DTMonitor processing delay.

### 5. Expand confirmed incident coverage

- broaden the SEC watchlist or move to a responsibly polled all-filer discovery feed;
- add official vendor security incident and PSIRT sources;
- add regulator disclosures for relevant sectors;
- keep ransomware-group claims and social reports unverified until corroborated.

## Product rules to preserve

- A high CVSS score alone does not prove exploitation or business impact.
- A ransomware-group claim alone does not confirm a breach.
- Official confirmation, corroboration, and emerging signals must remain distinct.
- Automated summaries must cite evidence and must not invent scope, victim counts, or attribution.
- Operational service health must not be degraded by security advisories.
- New sources must establish their initial baseline silently.
