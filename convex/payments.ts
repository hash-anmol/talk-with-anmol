import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const storePayment = mutation({
  args: {
    razorpayPaymentId: v.string(),
    razorpayOrderId: v.optional(v.string()),
    razorpayLinkId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    capturedAt: v.optional(v.number()),
    notes: v.any(),
    rawPayload: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_payment_id", (q) => q.eq("razorpayPaymentId", args.razorpayPaymentId))
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("payments", {
      razorpayPaymentId: args.razorpayPaymentId,
      razorpayOrderId: args.razorpayOrderId,
      razorpayLinkId: args.razorpayLinkId,
      amount: args.amount,
      currency: args.currency,
      status: args.status,
      capturedAt: args.capturedAt,
      notes: args.notes,
      rawPayload: args.rawPayload,
      createdAt: Date.now(),
    });
  },
});
