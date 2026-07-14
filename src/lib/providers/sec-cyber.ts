import type { AlertInput, AlertProvider, ProviderMetadata } from "./types";

interface SecTicker {
  cik_str: number;
  ticker: string;
  title: string;
}

interface SecSubmissions {
  cik: string;
  name: string;
  tickers?: string[];
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      acceptanceDateTime: string[];
      form: string[];
      primaryDocument: string[];
      items: string[];
    };
  };
}

export const DEFAULT_SEC_TECH_TICKERS = [
  "AAPL", "ADBE", "AMZN", "AVGO", "CRM", "CRWD", "CSCO", "DDOG",
  "GOOGL", "IBM", "INTC", "META", "MSFT", "NET", "NOW", "NVDA",
  "OKTA", "ORCL", "PANW", "SNOW", "TEAM", "TWLO",
] as const;

const CYBER_FORMS = new Set([
  "8-K", "8-K/A", "8-K12B", "8-K12B/A", "8-K12G3", "8-K12G3/A",
  "8-K15D5", "8-K15D/A",
]);

export class SecCyberProvider implements AlertProvider {
  name = "sec-cyber";
  category = "security";
  pollInterval = "slow" as const;
  minimumIntervalMs = 30 * 60 * 1000;
  silenceInitialBackfill = true;
  metadata: ProviderMetadata = {
    name: this.name,
    displayName: "SEC Cyber Disclosures",
    description: "Official Item 1.05 material cybersecurity incident disclosures",
    url: "https://www.sec.gov/edgar/search/",
  };

  async fetchAlerts(): Promise<AlertInput[]> {
    const headers = {
      "User-Agent": process.env.SEC_USER_AGENT ?? "duckTyped DTMonitor alerts@ducktyped.xyz",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    };
    const tickers = this.watchTickers();
    const tickerResponse = await fetch("https://www.sec.gov/files/company_tickers.json", {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    if (!tickerResponse.ok) throw new Error(`HTTP ${tickerResponse.status} from SEC ticker index`);
    const tickerIndex = Object.values((await tickerResponse.json()) as Record<string, SecTicker>);
    const byTicker = new Map(tickerIndex.map((item) => [item.ticker.toUpperCase(), item]));
    const selected = tickers.map((ticker) => byTicker.get(ticker)).filter((item): item is SecTicker => !!item);

    const results: SecSubmissions[] = [];
    for (let index = 0; index < selected.length; index += 5) {
      const batch = selected.slice(index, index + 5);
      const responses = await Promise.allSettled(batch.map(async (company) => {
        const cik = String(company.cik_str).padStart(10, "0");
        const response = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, {
          headers,
          signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status} for SEC CIK ${cik}`);
        return (await response.json()) as SecSubmissions;
      }));
      for (const result of responses) if (result.status === "fulfilled") results.push(result.value);
    }
    if (results.length === 0) throw new Error("SEC submissions were unavailable for every watched company");
    return results.flatMap((submission) => this.mapSubmission(submission));
  }

  mapSubmission(submission: SecSubmissions, now = new Date()): AlertInput[] {
    const recent = submission.filings.recent;
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const alerts: AlertInput[] = [];

    for (let index = 0; index < recent.accessionNumber.length; index++) {
      const form = recent.form[index];
      const items = recent.items[index] ?? "";
      const accepted = new Date(recent.acceptanceDateTime[index] || recent.filingDate[index]);
      if (!CYBER_FORMS.has(form) || !items.split(",").map((item) => item.trim()).includes("1.05")) continue;
      if (Number.isNaN(accepted.getTime()) || accepted < cutoff) continue;

      const accession = recent.accessionNumber[index];
      const cik = String(Number(submission.cik));
      const accessionPath = accession.replaceAll("-", "");
      const filingUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionPath}/${accession}-index.htm`;
      const ticker = submission.tickers?.[0] ?? null;
      alerts.push({
        externalId: accession,
        source: this.name,
        category: this.category,
        severity: "major",
        title: `${submission.name} disclosed a material cybersecurity incident`,
        description: `${submission.name}${ticker ? ` (${ticker})` : ""} filed an Item 1.05 disclosure with the U.S. Securities and Exchange Commission. This confirms the company determined the cybersecurity incident was material; review the filing for the stated scope and impact.`,
        url: filingUrl,
        timestamp: accepted,
        status: "monitoring",
        signalKind: "advisory",
        confidence: "official",
        expiresAt: new Date(accepted.getTime() + 90 * 24 * 60 * 60 * 1000),
        metadata: {
          securityKind: "security-incident",
          exploitationStatus: "none-known",
          disclosureType: "SEC Item 1.05",
          company: submission.name,
          ticker,
          cik: submission.cik,
          accessionNumber: accession,
          form,
          filedAt: recent.filingDate[index],
          primaryDocument: recent.primaryDocument[index],
        },
      });
    }
    return alerts;
  }

  private watchTickers(): string[] {
    const configured = process.env.SEC_TECH_TICKERS?.split(",")
      .map((ticker) => ticker.trim().toUpperCase())
      .filter(Boolean);
    return configured?.length ? [...new Set(configured)] : [...DEFAULT_SEC_TECH_TICKERS];
  }
}
