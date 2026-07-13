import type { Metadata } from "next";
import { ManageSubscription } from "@/components/subscriptions/ManageSubscription";

export const metadata: Metadata = { title: "Manage Alerts | DTMonitor", robots: { index: false, follow: false } };

export default async function ManagePage({ searchParams }: { searchParams: Promise<{ id?: string; token?: string }> }) {
  const { id = "", token = "" } = await searchParams;
  return <div className="mx-auto max-w-2xl space-y-5"><div><h1 className="text-2xl font-bold text-text-primary">Manage email alerts</h1><p className="mt-2 text-sm text-text-secondary">Update the incidents you want DTMonitor to email you about.</p></div><ManageSubscription id={id} token={token} /></div>;
}
