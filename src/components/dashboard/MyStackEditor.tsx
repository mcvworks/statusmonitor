"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  Package,
  Search,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { PROVIDERS } from "@/lib/constants";
import { useStack, type StackEntry } from "@/hooks/useStack";

// ─── Known Services (autocomplete pool) ────────────────────

interface KnownService {
  name: string;
  provider: string;
}

const KNOWN_SERVICES: KnownService[] = [
  // AWS ecosystem
  { name: "EC2", provider: "aws" },
  { name: "S3", provider: "aws" },
  { name: "Lambda", provider: "aws" },
  { name: "RDS", provider: "aws" },
  { name: "DynamoDB", provider: "aws" },
  { name: "CloudFront", provider: "aws" },
  { name: "ECS", provider: "aws" },
  { name: "EKS", provider: "aws" },
  { name: "SQS", provider: "aws" },
  { name: "SNS", provider: "aws" },
  { name: "Route 53", provider: "aws" },
  { name: "Elastic Beanstalk", provider: "aws" },
  // Azure
  { name: "Azure VMs", provider: "azure" },
  { name: "Azure SQL", provider: "azure" },
  { name: "Azure Blob Storage", provider: "azure" },
  { name: "Azure Functions", provider: "azure" },
  { name: "Azure AKS", provider: "azure" },
  { name: "Azure DevOps", provider: "azure" },
  // GCP
  { name: "Compute Engine", provider: "gcp" },
  { name: "Cloud Run", provider: "gcp" },
  { name: "BigQuery", provider: "gcp" },
  { name: "Cloud Storage", provider: "gcp" },
  { name: "GKE", provider: "gcp" },
  { name: "Cloud Functions", provider: "gcp" },
  // Cloudflare
  { name: "CDN", provider: "cloudflare" },
  { name: "Workers", provider: "cloudflare" },
  { name: "DNS", provider: "cloudflare" },
  { name: "R2 Storage", provider: "cloudflare" },
  { name: "Pages", provider: "cloudflare" },
  // Platform services
  { name: "GitHub Actions", provider: "github" },
  { name: "GitHub Repos", provider: "github" },
  { name: "Slack Messaging", provider: "slack" },
  { name: "Jira", provider: "atlassian" },
  { name: "Confluence", provider: "atlassian" },
  { name: "Bitbucket", provider: "atlassian" },
  { name: "Okta SSO", provider: "okta" },
  { name: "Stripe Payments", provider: "stripe" },
  { name: "Google Workspace Email", provider: "googleWorkspace" },
  { name: "Google Workspace Drive", provider: "googleWorkspace" },
  { name: "Vercel Hosting", provider: "vercelNetlify" },
  { name: "Netlify Hosting", provider: "vercelNetlify" },
  { name: "DigitalOcean Droplets", provider: "digitalocean" },
  { name: "Fastly CDN", provider: "fastly" },
  // DevOps
  { name: "Datadog Monitoring", provider: "datadog" },
  { name: "PagerDuty Alerts", provider: "pagerduty" },
  { name: "Docker Hub Registry", provider: "dockerHub" },
  { name: "npm Packages", provider: "npmRegistry" },
  // Microsoft 365
  { name: "Outlook", provider: "microsoft365" },
  { name: "Teams", provider: "microsoft365" },
  { name: "SharePoint", provider: "microsoft365" },
  { name: "OneDrive", provider: "microsoft365" },
];

// ─── Quick-add Presets ─────────────────────────────────────

interface StackPreset {
  name: string;
  description: string;
  services: { serviceName: string; provider: string }[];
}

const STACK_PRESETS: StackPreset[] = [
  {
    name: "Startup on AWS",
    description: "Vercel + Stripe + Slack + GitHub + Datadog",
    services: [
      { serviceName: "Vercel Hosting", provider: "vercelNetlify" },
      { serviceName: "Stripe Payments", provider: "stripe" },
      { serviceName: "Slack Messaging", provider: "slack" },
      { serviceName: "GitHub Repos", provider: "github" },
      { serviceName: "GitHub Actions", provider: "github" },
      { serviceName: "Datadog Monitoring", provider: "datadog" },
      { serviceName: "S3", provider: "aws" },
      { serviceName: "CloudFront", provider: "aws" },
    ],
  },
  {
    name: "Enterprise Microsoft",
    description: "Azure + M365 + Teams + Okta + PagerDuty",
    services: [
      { serviceName: "Azure VMs", provider: "azure" },
      { serviceName: "Azure SQL", provider: "azure" },
      { serviceName: "Azure Blob Storage", provider: "azure" },
      { serviceName: "Outlook", provider: "microsoft365" },
      { serviceName: "Teams", provider: "microsoft365" },
      { serviceName: "SharePoint", provider: "microsoft365" },
      { serviceName: "Okta SSO", provider: "okta" },
      { serviceName: "PagerDuty Alerts", provider: "pagerduty" },
    ],
  },
  {
    name: "Full-stack GCP",
    description: "GCP + GitHub + Slack + Stripe + Atlassian",
    services: [
      { serviceName: "Compute Engine", provider: "gcp" },
      { serviceName: "Cloud Run", provider: "gcp" },
      { serviceName: "BigQuery", provider: "gcp" },
      { serviceName: "Cloud Storage", provider: "gcp" },
      { serviceName: "GitHub Repos", provider: "github" },
      { serviceName: "Slack Messaging", provider: "slack" },
      { serviceName: "Stripe Payments", provider: "stripe" },
      { serviceName: "Jira", provider: "atlassian" },
    ],
  },
  {
    name: "JAMstack",
    description: "Vercel + Cloudflare + GitHub + Stripe",
    services: [
      { serviceName: "Vercel Hosting", provider: "vercelNetlify" },
      { serviceName: "CDN", provider: "cloudflare" },
      { serviceName: "DNS", provider: "cloudflare" },
      { serviceName: "Workers", provider: "cloudflare" },
      { serviceName: "GitHub Repos", provider: "github" },
      { serviceName: "GitHub Actions", provider: "github" },
      { serviceName: "Stripe Payments", provider: "stripe" },
      { serviceName: "npm Packages", provider: "npmRegistry" },
    ],
  },
];

// ─── Component ─────────────────────────────────────────────

export function MyStackEditor() {
  const { stack, addService, addBulk, removeService } = useStack();
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [region, setRegion] = useState("");
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Filter autocomplete suggestions
  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return KNOWN_SERVICES.slice(0, 8);
    const lower = searchTerm.toLowerCase();
    return KNOWN_SERVICES.filter(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        (PROVIDERS[s.provider]?.name ?? s.provider)
          .toLowerCase()
          .includes(lower)
    ).slice(0, 8);
  }, [searchTerm]);

  // Concentration risk — group stack by provider
  const concentration = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of stack) {
      counts[entry.provider] = (counts[entry.provider] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([provider, count]) => ({
        provider,
        name: PROVIDERS[provider]?.name ?? provider,
        count,
        pct: stack.length > 0 ? Math.round((count / stack.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [stack]);

  const maxConcentration = concentration[0];

  const handleSelectSuggestion = (svc: KnownService) => {
    setSearchTerm(svc.name);
    setSelectedProvider(svc.provider);
    setShowSuggestions(false);
  };

  const handleAdd = async () => {
    if (!searchTerm.trim() || !selectedProvider) return;
    setAdding(true);
    try {
      await addService({
        serviceName: searchTerm.trim(),
        provider: selectedProvider,
        region: region.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setSearchTerm("");
      setSelectedProvider("");
      setRegion("");
      setNotes("");
    } finally {
      setAdding(false);
    }
  };

  const handlePreset = async (preset: StackPreset) => {
    setAdding(true);
    try {
      await addBulk(preset.services);
    } finally {
      setAdding(false);
    }
  };

  const providerOptions = Object.entries(PROVIDERS).map(([key, meta]) => ({
    key,
    name: meta.name,
  }));

  return (
    <div className="space-y-6">
      {/* ─── Quick-Add Presets ─────────────────────────── */}
      <div className="glass-card space-y-3 p-4">
        <h3 className="section-label">
          <Zap className="h-3.5 w-3.5" />
          Quick-Add Presets
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {STACK_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePreset(preset)}
              disabled={adding}
              className="flex flex-col items-start gap-1 rounded-xl border border-border p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface-hover disabled:opacity-50"
            >
              <span className="text-sm font-medium text-text-primary">
                {preset.name}
              </span>
              <span className="font-[family-name:var(--font-mono)] text-[11px] text-text-muted">
                {preset.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Add Service Form ─────────────────────────── */}
      <div className="glass-card space-y-3 p-4">
        <h3 className="section-label">
          <Plus className="h-3.5 w-3.5" />
          Add Service
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Service name with autocomplete */}
          <div className="relative">
            <label className="mb-1 block text-xs text-text-muted">
              Service Name
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="e.g. S3, Vercel Hosting..."
                className="w-full rounded-lg border border-border bg-surface-input py-2 pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-surface-card shadow-lg"
              >
                {suggestions.map((svc) => (
                  <button
                    key={`${svc.provider}-${svc.name}`}
                    onClick={() => handleSelectSuggestion(svc)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover"
                  >
                    <span className="text-text-primary">{svc.name}</span>
                    <span className="font-[family-name:var(--font-mono)] text-[11px] text-text-muted">
                      {PROVIDERS[svc.provider]?.name ?? svc.provider}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Provider dropdown */}
          <div>
            <label className="mb-1 block text-xs text-text-muted">
              Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-input px-3 py-2 text-sm text-text-primary focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
            >
              <option value="">Select provider...</option>
              {providerOptions.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Region (optional) */}
          <div>
            <label className="mb-1 block text-xs text-text-muted">
              Region (optional)
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. us-east-1"
              className="w-full rounded-lg border border-border bg-surface-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Notes (optional) */}
          <div>
            <label className="mb-1 block text-xs text-text-muted">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Production database"
              className="w-full rounded-lg border border-border bg-surface-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={!searchTerm.trim() || !selectedProvider || adding}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-bg-primary transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          {adding ? "Adding..." : "Add to Stack"}
        </button>
      </div>

      {/* ─── Concentration Risk ───────────────────────── */}
      {stack.length > 0 && (
        <div className="glass-card space-y-3 p-4">
          <h3 className="section-label">
            <AlertTriangle className="h-3.5 w-3.5" />
            Concentration Risk
          </h3>

          {maxConcentration && maxConcentration.pct >= 50 && (
            <div className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-accent" />
              <p className="text-xs text-text-secondary">
                <span className="font-medium text-accent">
                  {maxConcentration.count}/{stack.length} services
                </span>{" "}
                ({maxConcentration.pct}%) depend on{" "}
                <span className="font-medium">{maxConcentration.name}</span>.
                Consider diversifying.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {concentration.map((c) => (
              <div key={c.provider} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">{c.name}</span>
                  <span className="font-[family-name:var(--font-mono)] text-text-muted">
                    {c.count}/{stack.length} ({c.pct}%)
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className={`h-full rounded-full transition-all ${
                      c.pct >= 60
                        ? "bg-error"
                        : c.pct >= 40
                          ? "bg-accent"
                          : "bg-secondary"
                    }`}
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Services List ────────────────────────────── */}
      <div className="glass-card space-y-3 p-4">
        <h3 className="section-label">
          <Package className="h-3.5 w-3.5" />
          Services I Use
          {stack.length > 0 && (
            <span className="ml-auto font-[family-name:var(--font-mono)] text-[11px] font-normal text-text-muted">
              {stack.length} service{stack.length !== 1 ? "s" : ""}
            </span>
          )}
        </h3>

        {stack.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">
            No services added yet. Use a preset above or add services manually.
          </p>
        ) : (
          <div className="space-y-1">
            {groupByProvider(stack).map(([provider, entries]) => (
              <div key={provider}>
                <p className="mb-1 mt-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider text-text-muted">
                  {PROVIDERS[provider]?.name ?? provider}
                </p>
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-surface-hover"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-text-primary">
                        {entry.serviceName}
                      </p>
                      <p className="font-[family-name:var(--font-mono)] text-[11px] text-text-muted">
                        {entry.region && `${entry.region} · `}
                        {entry.notes || ""}
                      </p>
                    </div>
                    <button
                      onClick={() => removeService(entry.id)}
                      className="ml-2 shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error"
                      aria-label={`Remove ${entry.serviceName}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function groupByProvider(
  stack: StackEntry[]
): [string, StackEntry[]][] {
  const grouped: Record<string, StackEntry[]> = {};
  for (const entry of stack) {
    if (!grouped[entry.provider]) grouped[entry.provider] = [];
    grouped[entry.provider].push(entry);
  }
  return Object.entries(grouped).sort(
    ([, a], [, b]) => b.length - a.length
  );
}
