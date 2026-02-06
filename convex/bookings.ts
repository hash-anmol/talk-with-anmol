import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createBookingIntent = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    slotStart: v.string(),
    slotEnd: v.string(),
    recording: v.boolean(),
    timezone: v.string(),
    bookingType: v.union(v.literal("strategy"), v.literal("quick")),
  },
  handler: async (ctx, args) => {
    const basePrice = args.bookingType === "strategy" ? 500 : 250;
    const price = args.recording ? basePrice + 200 : basePrice;
    const bookingId = await ctx.db.insert("bookings", {
      customerName: args.name,
      customerEmail: args.email,
      bookingType: args.bookingType,
      slotStart: args.slotStart,
      slotEnd: args.slotEnd,
      timezone: args.timezone,
      recordingRequested: args.recording,
      price,
      status: "pending_payment",
      createdAt: Date.now(),
    });
    return { bookingId, price };
  },
});

export const getRemainingSlots = query({
  args: {},
  handler: async (ctx) => {
    const confirmedBookings = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "confirmed"))
      .collect();

    const strategyBookings = confirmedBookings.filter(
      (b) => (b.bookingType ?? "strategy") === "strategy"
    ).length;
    const quickBookings = confirmedBookings.filter(
      (b) => b.bookingType === "quick"
    ).length;

    // Based on user's request: "only 5 left" for strategy, "only 7 left" for quick
    // We assume these are the current numbers if there are no confirmed bookings yet.
    // So we define capacity as current_requested_left + current_confirmed.
    // For now, let's just use 10 and 15 as arbitrary capacities if we don't have them yet.
    // Or better, let's just use the numbers provided by user as the starting point.
    const strategyCapacity = 5 + strategyBookings;
    const quickCapacity = 7 + quickBookings;

    return {
      strategy: Math.max(0, strategyCapacity - strategyBookings),
      quick: Math.max(0, quickCapacity - quickBookings),
    };
  },
});

export const getBooking = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.bookingId);
  },
});

export const listBookings = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("bookings").order("desc").collect();
  },
});

export const confirmBooking = mutation({
  args: {
    bookingId: v.id("bookings"),
    paymentId: v.string(),
    calendarEventId: v.optional(v.string()),
    meetLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookingId, {
      status: "confirmed",
      paymentId: args.paymentId,
      calendarEventId: args.calendarEventId,
      meetLink: args.meetLink,
    });
  },
});
