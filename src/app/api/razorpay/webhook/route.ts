import { NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { getConvexClient } from "@/lib/convexServer";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

export const runtime = "nodejs";

// Map Razorpay status to our payment status
function mapRazorpayStatus(status: string): "created" | "authorized" | "captured" | "refunded" | "failed" {
  switch (status) {
    case "created":
      return "created";
    case "authorized":
      return "authorized";
    case "captured":
      return "captured";
    case "refunded":
      return "refunded";
    case "failed":
      return "failed";
    default:
      return "created";
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !secret) {
    console.warn("Razorpay webhook: missing signature or secret", {
      hasSignature: !!signature,
      hasSecret: !!secret,
    });
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const bodyText = await request.text();
  const isValid = verifyRazorpaySignature(bodyText, signature, secret);
  if (!isValid) {
    console.warn("Razorpay webhook: invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(bodyText);
  const event = payload.event as string;

  if (!event?.includes("payment") && !event?.includes("payment_link")) {
    return NextResponse.json({ status: "ignored" });
  }

  const paymentEntity = payload.payload?.payment?.entity;
  if (!paymentEntity) {
    return NextResponse.json({ status: "ignored" });
  }

  const notes = paymentEntity.notes || {};
  const paymentLinkEntity = payload.payload?.payment_link?.entity;
  const bookingId =
    notes.booking_id ||
    notes.bookingId ||
    paymentLinkEntity?.reference_id;

  if (!bookingId) {
    console.warn("Razorpay webhook: missing booking id", {
      paymentId: paymentEntity.id,
      referenceId: paymentLinkEntity?.reference_id,
    });
    return NextResponse.json({ status: "ignored", reason: "no booking id" });
  }

  const client = getConvexClient();
  if (!client) {
    console.error("Razorpay webhook: Convex not configured");
    return NextResponse.json({ error: "Convex not configured" }, { status: 500 });
  }

  // Store the payment with proper status mapping
  await client.action(api.payments_node.storePaymentAction, {
    bookingId: bookingId as Id<"bookings">,
    razorpayPaymentId: paymentEntity.id,
    razorpayOrderId: paymentEntity.order_id,
    razorpayLinkId: paymentEntity.payment_link_id,
    amount: paymentEntity.amount / 100,
    currency: paymentEntity.currency,
    status: mapRazorpayStatus(paymentEntity.status),
    capturedAt: paymentEntity.created_at ? paymentEntity.created_at * 1000 : undefined,
    rawPayload: payload,
  });

  // Mark failed payments as cancelled to allow retry
  if (paymentEntity.status === "failed" && bookingId) {
    await client.mutation(api.bookings.updateBookingStatus, {
      bookingId: bookingId as Id<"bookings">,
      status: "cancelled",
    });
  }

  // Only confirm booking on successful capture
  if (paymentEntity.status === "captured" && bookingId) {
    // Get booking with user data for calendar event and email
    const bookingData = await client.query(api.bookings.getBookingWithUser, {
      bookingId: bookingId as Id<"bookings">
    });

    if (bookingData && bookingData.user) {
      let calendar: { calendarEventId?: string; meetLink?: string; htmlLink?: string } = {};

      // Step 1: Create Google Calendar event (sends native invite to customer)
      try {
        const result = await client.action(api.calendar.createCalendarEvent, {
          bookingId: bookingId as Id<"bookings">,
          customerEmail: bookingData.user.email,
          customerName: bookingData.user.name,
          slotStart: bookingData.slotStart,
          slotEnd: bookingData.slotEnd,
          bookingType: bookingData.bookingType,
        });
        calendar = {
          calendarEventId: result.calendarEventId || undefined,
          meetLink: result.meetLink || undefined,
          htmlLink: result.htmlLink || undefined,
        };
      } catch (calendarError) {
        console.error("Failed to create calendar event:", calendarError);
      }

      // Step 2: Confirm booking with calendar/meet details
      await client.mutation(api.bookings.confirmBooking, {
        bookingId: bookingId as Id<"bookings">,
        calendarEventId: calendar.calendarEventId || undefined,
        meetLink: calendar.meetLink || undefined,
      });

      // Step 3: Send confirmation email via Gmail
      try {
        await client.action(api.email.sendBookingConfirmation, {
          customerEmail: bookingData.user.email,
          customerName: bookingData.user.name,
          bookingType: bookingData.bookingType,
          slotStart: bookingData.slotStart,
          slotEnd: bookingData.slotEnd,
          timezone: bookingData.timezone,
          meetLink: calendar.meetLink || undefined,
          calendarLink: calendar.htmlLink || undefined,
          amount: bookingData.price,
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}
