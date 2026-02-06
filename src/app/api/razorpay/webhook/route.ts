import { NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { getConvexClient } from "@/lib/convexServer";
import { api } from "@/../convex/_generated/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const bodyText = await request.text();
  const isValid = verifyRazorpaySignature(bodyText, signature, secret);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(bodyText);
  const event = payload.event as string;

  if (!event?.includes("payment")) {
    return NextResponse.json({ status: "ignored" });
  }

  const paymentEntity = payload.payload?.payment?.entity;
  if (!paymentEntity) {
    return NextResponse.json({ status: "ignored" });
  }

  const notes = paymentEntity.notes || {};
  const bookingId =
    notes.booking_id ||
    notes.bookingId ||
    payload.payload?.payment_link?.entity?.reference_id;

  const client = getConvexClient();
  if (!client) {
    return NextResponse.json({ error: "Convex not configured" }, { status: 500 });
  }

  await client.action(api.payments_node.storePaymentAction, {
    razorpayPaymentId: paymentEntity.id,
    razorpayOrderId: paymentEntity.order_id,
    razorpayLinkId: paymentEntity.payment_link_id,
    amount: paymentEntity.amount / 100,
    currency: paymentEntity.currency,
    status: paymentEntity.status,
    capturedAt: paymentEntity.created_at ? paymentEntity.created_at * 1000 : undefined,
    notes,
    rawPayload: payload,
  });

  if (bookingId) {
    const booking = await client.query(api.bookings.getBooking, { bookingId });
    if (booking) {
      const calendar = await client.action(api.calendar.createCalendarEvent, {
        bookingId,
        customerEmail: booking.customerEmail,
        customerName: booking.customerName,
        slotStart: booking.slotStart,
        slotEnd: booking.slotEnd,
      });

      await client.mutation(api.bookings.confirmBooking, {
        bookingId: bookingId as any,
        paymentId: paymentEntity.id,
        calendarEventId: calendar.calendarEventId || undefined,
        meetLink: calendar.meetLink || undefined,
      });
    }
  }

  return NextResponse.json({ status: "ok" });
}
