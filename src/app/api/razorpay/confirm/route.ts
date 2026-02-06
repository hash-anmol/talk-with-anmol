import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getConvexClient } from "@/lib/convexServer";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bookingId = searchParams.get("booking") || searchParams.get("razorpay_payment_link_reference_id");
  const paymentId = searchParams.get("razorpay_payment_id");
  const paymentLinkId = searchParams.get("razorpay_payment_link_id");
  const status = searchParams.get("razorpay_payment_link_status");
  const signature = searchParams.get("razorpay_signature");
  const referenceId = searchParams.get("razorpay_payment_link_reference_id") || bookingId;

  if (!bookingId || !paymentId || !paymentLinkId || !status || !signature) {
    console.warn("Razorpay confirm: missing params", {
      hasBookingId: !!bookingId,
      hasPaymentId: !!paymentId,
      hasPaymentLinkId: !!paymentLinkId,
      hasStatus: !!status,
      hasSignature: !!signature,
    });
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    console.error("Razorpay confirm: missing Razorpay credentials");
    return NextResponse.json({ error: "Razorpay credentials missing" }, { status: 500 });
  }

  const payload = `${paymentLinkId}|${paymentId}|${referenceId}|${status}`;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(payload)
    .digest("hex");

  let valid = expectedSignature === signature;
  if (!valid) {
    console.warn("Razorpay confirm: invalid signature", {
      bookingId,
      paymentId,
      paymentLinkId,
      referenceId,
      status,
    });
    try {
      const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const linkResponse = await fetch(
        `https://api.razorpay.com/v1/payment_links/${paymentLinkId}`,
        {
          headers: {
            Authorization: `Basic ${basicAuth}`,
          },
        }
      );

      if (linkResponse.ok) {
        const linkData = await linkResponse.json();
        if (
          linkData?.status === "paid" &&
          linkData?.reference_id === referenceId
        ) {
          valid = true;
        }
      }
    } catch (error) {
      console.error("Razorpay confirm: API verify failed", error);
    }

    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const client = getConvexClient();
  if (!client) {
    console.error("Razorpay confirm: Convex not configured");
    return NextResponse.json({ error: "Convex not configured" }, { status: 500 });
  }

  const paymentStatus = status === "paid" ? "captured" : "failed";

  const bookingData = await client.query(api.bookings.getBookingWithUser, {
    bookingId: bookingId as Id<"bookings">,
  });

  if (!bookingData) {
    console.warn("Razorpay confirm: booking not found", { bookingId });
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  await client.action(api.payments_node.storePaymentAction, {
    bookingId: bookingId as Id<"bookings">,
    razorpayPaymentId: paymentId,
    razorpayOrderId: undefined,
    razorpayLinkId: paymentLinkId,
    amount: bookingData.price,
    currency: "INR",
    status: paymentStatus as "captured" | "failed",
    capturedAt: paymentStatus === "captured" ? Date.now() : undefined,
    rawPayload: Object.fromEntries(searchParams.entries()),
  });

  if (paymentStatus === "failed") {
    await client.mutation(api.bookings.updateBookingStatus, {
      bookingId: bookingId as Id<"bookings">,
      status: "cancelled",
    });
    return NextResponse.json({ status: "failed" });
  }

  if (bookingData && bookingData.user) {
    let calendar: { calendarEventId?: string; meetLink?: string; htmlLink?: string } = {};

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

    await client.mutation(api.bookings.confirmBooking, {
      bookingId: bookingId as Id<"bookings">,
      calendarEventId: calendar.calendarEventId || undefined,
      meetLink: calendar.meetLink || undefined,
    });

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

  return NextResponse.json({ status: "ok" });
}
