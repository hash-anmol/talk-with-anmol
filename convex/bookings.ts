import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { DateTime } from "luxon";

// Helper to find or create a customer user
async function findOrCreateCustomer(
  ctx: any,
  name: string,
  email: string,
  phone?: string
) {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .unique();

  if (existing) {
    // Update name if changed
    if (existing.name !== name || (phone && existing.phone !== phone)) {
      await ctx.db.patch(existing._id, { name, ...(phone && { phone }) });
    }
    return existing._id;
  }

  return await ctx.db.insert("users", {
    name,
    email,
    phone,
    role: "customer",
    createdAt: Date.now(),
  });
}

export const createBookingIntent = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    slotStart: v.string(),
    slotEnd: v.string(),
    recording: v.boolean(),
    timezone: v.string(),
    bookingType: v.union(v.literal("strategy"), v.literal("quick")),
    notes: v.optional(v.string()),
    testMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Find or create the customer user
    const userId = await findOrCreateCustomer(ctx, args.name, args.email, args.phone);

    const globalSettings = await ctx.db.query("globalSettings").collect();
    const settingsMap = globalSettings.reduce((acc: Record<string, any>, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    const timezone = settingsMap.timezone || args.timezone || "Asia/Kolkata";
    const maxSessionsPerMonth = settingsMap.maxSessionsPerMonth;
    const maxSessionsPerDay = settingsMap.maxSessionsPerDay;

    const activeStatuses = new Set(["confirmed", "completed"]);
    const slotStart = DateTime.fromISO(args.slotStart, { zone: timezone });
    if (!slotStart.isValid) {
      throw new Error("Invalid slot start time");
    }

    const monthStart = slotStart.startOf("month");
    const monthEnd = slotStart.endOf("month");
    const dayStart = slotStart.startOf("day");
    const dayEnd = slotStart.endOf("day");

    const existingBookings = await ctx.db.query("bookings").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const activeUserBookings = existingBookings.filter((booking) => activeStatuses.has(booking.status));

    const userMonthlyBooking = activeUserBookings.some((booking) => {
      const bookingStart = DateTime.fromISO(booking.slotStart, { zone: timezone });
      return bookingStart >= monthStart && bookingStart <= monthEnd;
    });

    if (userMonthlyBooking) {
      throw new Error("You can only book one session per month.");
    }

    if (typeof maxSessionsPerMonth === "number" || typeof maxSessionsPerDay === "number") {
      const allBookings = await ctx.db.query("bookings").collect();
      const activeBookings = allBookings.filter((booking) => activeStatuses.has(booking.status));

      const monthlyCount = activeBookings.filter((booking) => {
        const bookingStart = DateTime.fromISO(booking.slotStart, { zone: timezone });
        return bookingStart >= monthStart && bookingStart <= monthEnd;
      }).length;

      const dailyCount = activeBookings.filter((booking) => {
        const bookingStart = DateTime.fromISO(booking.slotStart, { zone: timezone });
        return bookingStart >= dayStart && bookingStart <= dayEnd;
      }).length;

      if (typeof maxSessionsPerMonth === "number" && monthlyCount >= maxSessionsPerMonth) {
        throw new Error("Monthly session limit reached. Please choose another month.");
      }

      if (typeof maxSessionsPerDay === "number" && dailyCount >= maxSessionsPerDay) {
        throw new Error("Daily session limit reached. Please choose another day.");
      }
    }

    // Calculate price (in INR, not paise for display)
    const basePrice = args.bookingType === "strategy" ? 600 : 250;
    const computedPrice = args.recording ? basePrice + 200 : basePrice;
    const price = args.testMode ? 1 : computedPrice;

    const bookingId = await ctx.db.insert("bookings", {
      userId,
      bookingType: args.bookingType,
      slotStart: args.slotStart,
      slotEnd: args.slotEnd,
      timezone,
      recordingRequested: args.recording,
      price,
      testMode: args.testMode ?? false,
      status: "pending_payment",
      notes: args.notes,
      createdAt: Date.now(),
    });

    return { bookingId, userId, price };
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

export const getConfirmedBookingCount = query({
  args: {},
  handler: async (ctx) => {
    const confirmedBookings = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "confirmed"))
      .collect();
    
    const completedBookings = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .collect();
    
    // Starting with a base of 4 as seen in the UI, or just return total
    const extra = await ctx.db
      .query("globalSettings")
      .withIndex("by_key", (q) => q.eq("key", "extraBookings"))
      .unique();
    const extraCount = extra ? (extra.value as number) : 0;
    
    return confirmedBookings.length + completedBookings.length + extraCount;
  },
});

export const incrementExtraBookings = mutation({
  args: {},
  handler: async (ctx) => {
    const extra = await ctx.db
      .query("globalSettings")
      .withIndex("by_key", (q) => q.eq("key", "extraBookings"))
      .unique();
    
    if (extra) {
      await ctx.db.patch(extra._id, { value: (extra.value as number) + 1 });
    } else {
      await ctx.db.insert("globalSettings", { key: "extraBookings", value: 1 });
    }
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
    calendarEventId: v.optional(v.string()),
    meetLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookingId, {
      status: "confirmed",
      calendarEventId: args.calendarEventId,
      meetLink: args.meetLink,
    });
  },
});

// Get a booking with the associated user data
export const getBookingWithUser = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;

    const user = await ctx.db.get(booking.userId);
    return { ...booking, user };
  },
});

// Get all bookings for a specific user
export const getBookingsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// List all bookings with user data (for admin)
export const listBookingsWithUsers = query({
  args: {},
  handler: async (ctx) => {
    const bookings = await ctx.db.query("bookings").order("desc").collect();
    
    const bookingsWithUsers = await Promise.all(
      bookings.map(async (booking) => {
        const user = await ctx.db.get(booking.userId);
        return { ...booking, user };
      })
    );
    
    return bookingsWithUsers;
  },
});

// Update booking status
export const updateBookingStatus = mutation({
  args: {
    bookingId: v.id("bookings"),
    status: v.union(
      v.literal("pending_payment"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed"),
      v.literal("refunded")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookingId, {
      status: args.status,
    });
  },
});
