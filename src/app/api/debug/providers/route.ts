import { NextResponse } from 'next/server';
import { getAllProviders } from '@/lib/providers/registry';

export async function GET() {
  const providers = getAllProviders();

  const results = await Promise.allSettled(
    providers.map(async (provider) => {
      const start = Date.now();
      const alerts = await provider.fetchAlerts();
      const duration = Date.now() - start;

      return {
        name: provider.name,
        displayName: provider.metadata.displayName,
        category: provider.category,
        pollInterval: provider.pollInterval,
        alertCount: alerts.length,
        durationMs: duration,
        alerts: alerts.map((a) => ({
          externalId: a.externalId,
          title: a.title,
          severity: a.severity,
          status: a.status,
          timestamp: a.timestamp.toISOString(),
          resolvedAt: a.resolvedAt?.toISOString() ?? null,
          url: a.url ?? null,
        })),
      };
    }),
  );

  const output = results.map((result, i) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      name: providers[i].name,
      displayName: providers[i].metadata.displayName,
      error: String(result.reason),
    };
  });

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    providerCount: providers.length,
    providers: output,
  });
}
