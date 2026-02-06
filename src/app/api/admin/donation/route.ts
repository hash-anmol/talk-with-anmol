import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convexServer";
import { api } from "@/../convex/_generated/api";
import { getAdminCookieName, verifyAdminToken } from "@/lib/adminSession";

export async function POST(request: Request) {
  const cookie = cookies().get(getAdminCookieName())?.value;
  if (!cookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await verifyAdminToken(cookie);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { donationId, proofUrl } = await request.json();
  if (!donationId) {
    return NextResponse.json({ error: "Missing donationId" }, { status: 400 });
  }

  const client = getConvexClient();
  if (!client) {
    return NextResponse.json({ error: "Convex not configured" }, { status: 500 });
  }

  await client.mutation(api.admin.updateDonation, { donationId, proofUrl });
  return NextResponse.json({ status: "ok" });
}
