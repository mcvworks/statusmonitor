import { NextRequest, NextResponse } from "next/server";
import { fetchCommunityThreads } from "@/lib/enrichment/community-threads";

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get("provider");

  if (!provider) {
    return NextResponse.json(
      { error: "provider query parameter is required" },
      { status: 400 }
    );
  }

  const threads = await fetchCommunityThreads(provider);
  return NextResponse.json({ threads });
}
