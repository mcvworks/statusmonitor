import { NextRequest, NextResponse } from "next/server";
import {
  getAffectedServices,
  getAffectedServicesWithAlertStatus,
  getProvidersForService,
} from "@/lib/dependencies/resolver";
import { DEPENDENCY_MAP } from "@/lib/dependencies/static-map";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const provider = params.get("provider");
  const service = params.get("service");
  const active = params.get("active") === "true";
  const region = params.get("region") ?? undefined;

  // Reverse lookup: which providers does a service depend on?
  if (service) {
    const providers = getProvidersForService(service);
    return NextResponse.json({ service, providers });
  }

  // Filtered by provider
  if (provider) {
    if (active) {
      const affected = await getAffectedServicesWithAlertStatus(provider, region);
      return NextResponse.json({ provider, region: region ?? null, services: affected });
    }

    const services = getAffectedServices(provider, region);
    return NextResponse.json({ provider, region: region ?? null, services });
  }

  // Return entire dependency map
  const map = DEPENDENCY_MAP.map((m) => ({
    provider: m.provider,
    serviceCount: m.services.length,
    services: m.services,
  }));

  return NextResponse.json({
    providers: map,
    totalMappings: map.reduce((sum, m) => sum + m.serviceCount, 0),
  });
}
