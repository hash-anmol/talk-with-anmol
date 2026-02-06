"use node";

import Razorpay from "razorpay";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const createPaymentLink = action({
  args: {
    bookingId: v.id("bookings"),
    amount: v.number(),
    customerName: v.string(),
    customerEmail: v.string(),
    slotStart: v.string(),
    slotEnd: v.string(),
    recording: v.boolean(),
    callbackUrl: v.string(),
  },
  handler: async (_, args) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials missing");
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const link = await razorpay.paymentLink.create({
      amount: args.amount * 100,
      currency: "INR",
      accept_partial: false,
      description: "1-on-1 AI Agent Session",
      customer: {
        name: args.customerName,
        email: args.customerEmail,
      },
      reference_id: args.bookingId,
      callback_url: args.callbackUrl,
      callback_method: "get",
      notes: {
        booking_id: args.bookingId,
        slot_start: args.slotStart,
        slot_end: args.slotEnd,
        recording_enabled: args.recording ? "true" : "false",
        user_email: args.customerEmail,
      },
    });

    return {
      paymentLinkId: link.id,
      paymentUrl: link.short_url,
    };
  },
});

export const storePaymentAction = action({
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
  handler: async (ctx, args): Promise<string> => {
    return await ctx.runMutation(api.payments.storePayment, args);
  },
});
