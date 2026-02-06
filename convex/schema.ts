import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - stores both admins and customers
  users: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    passwordHash: v.optional(v.string()), // Only for admin users
    role: v.union(v.literal("admin"), v.literal("customer")),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  // Bookings table - the core entity, linked to a user
  bookings: defineTable({
    userId: v.id("users"), // Foreign key to users table
    bookingType: v.union(v.literal("strategy"), v.literal("quick")),
    slotStart: v.string(), // ISO datetime string
    slotEnd: v.string(), // ISO datetime string
    timezone: v.string(),
    recordingRequested: v.boolean(),
    price: v.number(), // Price in smallest currency unit (paise)
    testMode: v.optional(v.boolean()),
    status: v.union(
      v.literal("pending_payment"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed"),
      v.literal("refunded")
    ),
    calendarEventId: v.optional(v.string()),
    meetLink: v.optional(v.string()),
    notes: v.optional(v.string()), // Any notes from customer
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_user", ["userId"]),

  // Payments table - tracks all payment transactions, linked to a booking
  payments: defineTable({
    bookingId: v.id("bookings"), // Foreign key to bookings table
    razorpayPaymentId: v.string(),
    razorpayOrderId: v.optional(v.string()),
    razorpayLinkId: v.optional(v.string()),
    amount: v.number(), // Amount in smallest currency unit (paise)
    currency: v.string(),
    status: v.union(
      v.literal("created"),
      v.literal("authorized"),
      v.literal("captured"),
      v.literal("refunded"),
      v.literal("failed")
    ),
    capturedAt: v.optional(v.number()),
    refundedAt: v.optional(v.number()),
    rawPayload: v.any(), // Store full Razorpay webhook payload
    createdAt: v.number(),
  })
    .index("by_payment_id", ["razorpayPaymentId"])
    .index("by_booking", ["bookingId"]),

  // Admin sessions for authentication
  adminSessions: defineTable({
    email: v.string(),
    token: v.string(),
    createdAt: v.number(),
  }).index("by_token", ["token"]),

  // Audit logs for tracking admin actions
  auditLogs: defineTable({
    action: v.string(),
    entityType: v.string(), // "booking", "payment", "user"
    entityId: v.string(),
    actor: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }),

  // New Availability Settings
  availabilitySettings: defineTable({
    dayOfWeek: v.number(), // 0=Sunday, 1=Monday, ..., 6=Saturday
    enabled: v.boolean(),
    slots: v.array(v.object({
      startHour: v.number(),
      startMinute: v.number(),
      endHour: v.number(),
      endMinute: v.number(),
    })),
  }).index("by_day", ["dayOfWeek"]),

  blockedDates: defineTable({
    date: v.string(), // ISO date string "YYYY-MM-DD"
  }).index("by_date", ["date"]),

  globalSettings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),
});
