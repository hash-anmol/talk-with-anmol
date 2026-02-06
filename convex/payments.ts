import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const storePayment = mutation({
  args: {
    bookingId: v.id("bookings"),
    razorpayPaymentId: v.string(),
    razorpayOrderId: v.optional(v.string()),
    razorpayLinkId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("created"),
      v.literal("authorized"),
      v.literal("captured"),
      v.literal("refunded"),
      v.literal("failed")
    ),
    capturedAt: v.optional(v.number()),
    rawPayload: v.any(),
  },
  handler: async (ctx, args) => {
    // Check if payment already exists
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_payment_id", (q) => q.eq("razorpayPaymentId", args.razorpayPaymentId))
      .unique();

    if (existing) {
      // Update existing payment status
      await ctx.db.patch(existing._id, {
        status: args.status,
        capturedAt: args.capturedAt,
        rawPayload: args.rawPayload,
      });
      return existing._id;
    }

    return await ctx.db.insert("payments", {
      bookingId: args.bookingId,
      razorpayPaymentId: args.razorpayPaymentId,
      razorpayOrderId: args.razorpayOrderId,
      razorpayLinkId: args.razorpayLinkId,
      amount: args.amount,
      currency: args.currency,
      status: args.status,
      capturedAt: args.capturedAt,
      rawPayload: args.rawPayload,
      createdAt: Date.now(),
    });
  },
});

// Get payment by Razorpay payment ID
export const getByRazorpayId = query({
  args: { razorpayPaymentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_payment_id", (q) => q.eq("razorpayPaymentId", args.razorpayPaymentId))
      .unique();
  },
});

// Get all payments for a booking
export const getPaymentsByBooking = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .order("desc")
      .collect();
  },
});

// List all payments (for admin)
export const listPayments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("payments").order("desc").collect();
  },
});

// Update payment status (e.g., for refunds)
export const updatePaymentStatus = mutation({
  args: {
    paymentId: v.id("payments"),
    status: v.union(
      v.literal("created"),
      v.literal("authorized"),
      v.literal("captured"),
      v.literal("refunded"),
      v.literal("failed")
    ),
    refundedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.paymentId, {
      status: args.status,
      refundedAt: args.refundedAt,
    });
  },
});

// Get payments with booking details (for admin dashboard)
export const listPaymentsWithBookings = query({
  args: {},
  handler: async (ctx) => {
    const payments = await ctx.db.query("payments").order("desc").collect();
    
    const paymentsWithBookings = await Promise.all(
      payments.map(async (payment) => {
        const booking = await ctx.db.get(payment.bookingId);
        let user = null;
        if (booking) {
          user = await ctx.db.get(booking.userId);
        }
        return { ...payment, booking, user };
      })
    );
    
    return paymentsWithBookings;
  },
});
