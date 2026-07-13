import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cloud & SaaS Incident History",
  description:
    "Search historical cloud, SaaS, DevOps, security, and internet incidents tracked by DTMonitor.",
  alternates: { canonical: "https://monitor.ducktyped.xyz/history" },
  openGraph: {
    title: "Cloud & SaaS Incident History | DTMonitor",
    description:
      "Search historical incidents across AWS, Azure, OpenAI, Cloudflare, GitHub, Slack, and other providers.",
    url: "https://monitor.ducktyped.xyz/history",
  },
};

export default function HistoryLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
