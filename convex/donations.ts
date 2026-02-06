import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("donations").order("desc").collect();
  },
});

export const add = mutation({
  args: {
    amount: v.number(),
    date: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("donations", {
      amount: args.amount,
      date: args.date,
      note: args.note,
      donated: false,
      createdAt: Date.now(),
    });
  },
});

export const markDonated = mutation({
  args: {
    donationId: v.id("donations"),
    proofUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.donationId, {
      donated: true,
      proofUrl: args.proofUrl,
    });
  },
});
