import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convexServer";
import { api } from "@/../convex/_generated/api";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  const durationStr = request.nextUrl.searchParams.get("duration");
  const duration = durationStr ? parseInt(durationStr, 10) : undefined;

  if (!date) {
    return NextResponse.json({ error: "Missing date" }, { status: 400 });
  }

  const client = getConvexClient();
  if (!client) {
    return NextResponse.json({ slots: [] });
  }

  try {
    const data = await client.action(api.availability.getAvailability, { 
      date,
      duration 
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
