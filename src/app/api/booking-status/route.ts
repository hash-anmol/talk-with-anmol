import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convexServer";
import { api } from "@/../convex/_generated/api";

export async function GET(request: NextRequest) {
  const bookingId = request.nextUrl.searchParams.get("bookingId");
  if (!bookingId) {
    return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
  }

  const client = getConvexClient();
  if (!client) {
    return NextResponse.json({ status: "unknown" });
  }

  try {
    const booking = await client.query(api.bookings.getBooking, {
      bookingId: bookingId as any,
    });
    if (!booking) {
      return NextResponse.json({ status: "not_found" });
    }

    let status = booking.status;

    if (status === "pending_payment") {
      const payments = await client.query(api.payments.getPaymentsByBooking, {
        bookingId: bookingId as any,
      });
      const hasCaptured = payments.some((p) => p.status === "captured");
      const hasFailed = payments.some((p) => p.status === "failed");

      if (hasCaptured) {
        status = "confirmed";
      } else if (hasFailed) {
        status = "cancelled";
      }
    }

    return NextResponse.json({
      status,
      slotStart: booking.slotStart,
      slotEnd: booking.slotEnd,
      recordingRequested: booking.recordingRequested,
      meetLink: booking.meetLink,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
