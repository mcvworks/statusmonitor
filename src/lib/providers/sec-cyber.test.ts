import assert from "node:assert/strict";
import test from "node:test";
import { SecCyberProvider } from "./sec-cyber";

test("maps SEC Item 1.05 filings as confirmed security incidents, not breaches", () => {
  const provider = new SecCyberProvider();
  const alerts = provider.mapSubmission({
    cik: "0001234567",
    name: "EXAMPLE TECHNOLOGY INC",
    tickers: ["EXMPL"],
    filings: { recent: {
      accessionNumber: ["0001234567-26-000010"],
      filingDate: ["2026-07-12"],
      acceptanceDateTime: ["2026-07-12T14:30:00.000Z"],
      form: ["8-K"],
      primaryDocument: ["example-8k.htm"],
      items: ["1.05,9.01"],
    } },
  }, new Date("2026-07-13T12:00:00Z"));

  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].confidence, "official");
  assert.equal(alerts[0].metadata?.securityKind, "security-incident");
  assert.doesNotMatch(alerts[0].title, /breach/i);
  assert.match(alerts[0].url ?? "", /000123456726000010/);
});

test("ignores SEC filings that do not report Item 1.05", () => {
  const provider = new SecCyberProvider();
  const alerts = provider.mapSubmission({
    cik: "1234567", name: "EXAMPLE", tickers: ["EXMPL"],
    filings: { recent: {
      accessionNumber: ["0001234567-26-000011"], filingDate: ["2026-07-12"],
      acceptanceDateTime: ["2026-07-12T14:30:00.000Z"], form: ["8-K"],
      primaryDocument: ["example-8k.htm"], items: ["2.02,9.01"],
    } },
  }, new Date("2026-07-13T12:00:00Z"));
  assert.equal(alerts.length, 0);
});
