import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAvailabilitySettings = query({
  handler: async (ctx) => {
    return await ctx.db.query("availabilitySettings").collect();
  },
});

export const updateDaySettings = mutation({
  args: {
    id: v.id("availabilitySettings"),
    enabled: v.boolean(),
    slots: v.array(v.object({
      startHour: v.number(),
      startMinute: v.number(),
      endHour: v.number(),
      endMinute: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      enabled: args.enabled,
      slots: args.slots,
    });
  },
});

export const getBlockedDates = query({
  handler: async (ctx) => {
    return await ctx.db.query("blockedDates").collect();
  },
});

export const addBlockedDate = mutation({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("blockedDates")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .unique();
    if (!existing) {
      await ctx.db.insert("blockedDates", { date: args.date });
    }
  },
});

export const removeBlockedDate = mutation({
  args: { id: v.id("blockedDates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getGlobalSettings = query({
  handler: async (ctx) => {
    const settings = await ctx.db.query("globalSettings").collect();
    return settings.reduce((acc: any, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
  },
});

export const updateGlobalSetting = mutation({
  args: { key: v.string(), value: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("globalSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
    } else {
      await ctx.db.insert("globalSettings", { key: args.key, value: args.value });
    }
  },
});

export const initializeSettings = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("availabilitySettings").collect();
    if (existing.length === 0) {
      // Default: Mon-Sat 10 AM - 6 PM
      for (let i = 0; i < 7; i++) {
        await ctx.db.insert("availabilitySettings", {
          dayOfWeek: i,
          enabled: i !== 0, // Sunday disabled by default
          slots: [
            { startHour: 10, startMinute: 0, endHour: 18, endMinute: 0 }
          ],
        });
      }
      
      // Global settings defaults
      await ctx.db.insert("globalSettings", { key: "bufferMinutes", value: 10 });
      await ctx.db.insert("globalSettings", { key: "timezone", value: "Asia/Kolkata" });
      await ctx.db.insert("globalSettings", { key: "maxSessionsPerMonth", value: 10 });
      await ctx.db.insert("globalSettings", { key: "maxSessionsPerDay", value: 2 });
      await ctx.db.insert("globalSettings", { key: "testModeEnabled", value: false });
    }
  },
});

// Admin credentials management
export const getAdminCredentials = query({
  handler: async (ctx) => {
    const email = await ctx.db
      .query("globalSettings")
      .withIndex("by_key", (q) => q.eq("key", "adminEmail"))
      .unique();
    const passwordHash = await ctx.db
      .query("globalSettings")
      .withIndex("by_key", (q) => q.eq("key", "adminPasswordHash"))
      .unique();
    return {
      email: email?.value,
      passwordHash: passwordHash?.value,
    };
  },
});

export const setAdminCredentials = mutation({
  args: { email: v.string(), passwordHash: v.string() },
  handler: async (ctx, args) => {
    const existingEmail = await ctx.db
      .query("globalSettings")
      .withIndex("by_key", (q) => q.eq("key", "adminEmail"))
      .unique();
    if (existingEmail) {
      await ctx.db.patch(existingEmail._id, { value: args.email });
    } else {
      await ctx.db.insert("globalSettings", { key: "adminEmail", value: args.email });
    }

    const existingHash = await ctx.db
      .query("globalSettings")
      .withIndex("by_key", (q) => q.eq("key", "adminPasswordHash"))
      .unique();
    if (existingHash) {
      await ctx.db.patch(existingHash._id, { value: args.passwordHash });
    } else {
      await ctx.db.insert("globalSettings", { key: "adminPasswordHash", value: args.passwordHash });
    }
  },
});
