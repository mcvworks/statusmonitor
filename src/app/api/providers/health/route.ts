import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAllProviders } from "@/lib/providers/registry";

export const dynamic = "force-dynamic";

export type ProviderDataState =
  | "healthy"
  | "error"
  | "stale"
  | "not_configured"
  | "pending";

export async function GET() {
  const providers = getAllProviders();
  const states = await prisma.providerState.findMany();
  const byProvider = new Map(states.map((state) => [state.provider, state]));
  const now = Date.now();

  const result = Object.fromEntries(
    providers.map((provider) => {
      const state = byProvider.get(provider.name);
      const tierWindow = provider.pollInterval === "fast" ? 6 * 60_000 : 15 * 60_000;
      const freshnessWindow = Math.max(
        tierWindow,
        (provider.minimumIntervalMs ?? 0) * 1.5,
      );

      let dataState: ProviderDataState = "pending";
      if (state) {
        const configured = !state.lastError?.toLowerCase().includes("not configured");
        const fresh =
          !!state.lastSuccessAt &&
          now - state.lastSuccessAt.getTime() <= freshnessWindow;
        if (!configured) dataState = "not_configured";
        else if (!fresh) dataState = "stale";
        else if (state.consecutiveFailures > 0) dataState = "error";
        else dataState = "healthy";
      }

      return [
        provider.name,
        {
          state: dataState,
          lastAttemptAt: state?.lastAttemptAt.toISOString() ?? null,
          lastSuccessAt: state?.lastSuccessAt?.toISOString() ?? null,
          lastErrorAt: state?.lastErrorAt?.toISOString() ?? null,
          lastError: state?.lastError ?? null,
          consecutiveFailures: state?.consecutiveFailures ?? 0,
          lastAlertCount: state?.lastAlertCount ?? 0,
        },
      ];
    }),
  );

  return NextResponse.json(result);
}
