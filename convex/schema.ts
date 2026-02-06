import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("customer")),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
  bookings: defineTable({
    customerName: v.string(),
    customerEmail: v.string(),
    bookingType: v.union(v.literal("strategy"), v.literal("quick")),
    slotStart: v.string(),
    slotEnd: v.string(),
    timezone: v.string(),
    recordingRequested: v.boolean(),
    price: v.number(),
    status: v.union(
      v.literal("pending_payment"),
      v.literal("confirmed"),
      v.literal("cancelled")
    ),
    paymentId: v.optional(v.string()),
    calendarEventId: v.optional(v.string()),
    meetLink: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_status", ["status"]),
  payments: defineTable({
    razorpayPaymentId: v.string(),
    razorpayOrderId: v.optional(v.string()),
    razorpayLinkId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    capturedAt: v.optional(v.number()),
    notes: v.any(),
    rawPayload: v.any(),
    createdAt: v.number(),
  }).index("by_payment_id", ["razorpayPaymentId"]),
  donations: defineTable({
    amount: v.number(),
    date: v.string(),
    note: v.optional(v.string()),
    proofUrl: v.optional(v.string()),
    donated: v.boolean(),
    createdAt: v.number(),
    createdBy: v.optional(v.string()),
  }),
  adminSessions: defineTable({
    email: v.string(),
    token: v.string(),
    createdAt: v.number(),
  }).index("by_token", ["token"]),
  auditLogs: defineTable({
    action: v.string(),
    entityId: v.string(),
    actor: v.string(),
    createdAt: v.number(),
  }),
});
