import { NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convexServer";
import { api } from "@/../convex/_generated/api";

const TIMEZONE = "Asia/Kolkata";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, slotStart, slotEnd, recording, bookingType, testMode } = body ?? {};

  if (!name || !email || !slotStart || !slotEnd || !bookingType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const client = getConvexClient();
  if (!client) {
    return NextResponse.json({ error: "Convex not configured" }, { status: 500 });
  }

  try {
    const booking = await client.mutation(api.bookings.createBookingIntent, {
      name,
      email,
      slotStart,
      slotEnd,
      recording: Boolean(recording),
      timezone: TIMEZONE,
      bookingType: bookingType as "strategy" | "quick",
      testMode: Boolean(testMode),
    });

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000";

    const baseOrigin = origin.replace(/\/$/, "");
    const callbackUrl = `${baseOrigin}/confirmation?booking=${booking.bookingId}`;

    const paymentLink = await client.action(api.payments_node.createPaymentLink, {
      bookingId: booking.bookingId,
      amount: booking.price,
      customerName: name,
      customerEmail: email,
      slotStart,
      slotEnd,
      recording: Boolean(recording),
      callbackUrl,
    });

    return NextResponse.json({
      bookingId: booking.bookingId,
      paymentUrl: paymentLink.paymentUrl,
    });
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message || "Failed";
      if (
        message.includes("one session per month") ||
        message.includes("Monthly session limit") ||
        message.includes("Daily session limit")
      ) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
