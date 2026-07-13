import Link from "next/link";
import { CheckCircle2, CircleX } from "lucide-react";

export default async function ConfirmedPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const confirmed = status === "confirmed";
  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      {confirmed ? <CheckCircle2 className="mx-auto h-12 w-12 text-secondary" /> : <CircleX className="mx-auto h-12 w-12 text-critical" />}
      <h1 className="mt-5 text-2xl font-bold text-text-primary">{confirmed ? "Alerts are active" : "That confirmation link is invalid"}</h1>
      <p className="mt-3 text-sm leading-6 text-text-secondary">{confirmed ? "You’ll automatically receive new alerts that match your selections. Every email includes a link to change or stop alerts." : "The link may have expired or already been used. Submit the form again for a fresh confirmation email."}</p>
      <Link href={confirmed ? "/" : "/subscribe"} className="mt-6 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-background">{confirmed ? "View live status" : "Try again"}</Link>
    </div>
  );
}
