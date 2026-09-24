import type { Metadata } from "next";
import { ManageSubscription } from "@/components/subscriptions/ManageSubscription";
import { RequestManageLinkForm } from "@/components/subscriptions/RequestManageLinkForm";

export const metadata: Metadata = { title: "Manage or Stop Email Alerts", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function ManagePage({ searchParams }: { searchParams: Promise<{ id?: string; token?: string }> }) {
  const { id = "", token = "" } = await searchParams;
  return <div className="mx-auto max-w-2xl space-y-5"><div><h1 className="text-2xl font-bold text-text-primary">Manage or stop email alerts</h1><p className="mt-2 text-sm text-text-secondary">Change your provider and severity selections, or unsubscribe from email alerts.</p></div>{id && token ? <ManageSubscription id={id} token={token} /> : <RequestManageLinkForm />}</div>;
}
