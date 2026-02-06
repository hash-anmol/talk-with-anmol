import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listBookings = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("bookings").order("desc").collect();
  },
});

export const updateDonation = mutation({
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
