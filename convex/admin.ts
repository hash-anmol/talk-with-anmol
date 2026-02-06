import { query } from "./_generated/server";

// List all bookings with user data (for admin dashboard)
export const listBookings = query({
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

// List all payments with booking and user data
export const listPayments = query({
  args: {},
  handler: async (ctx) => {
    const payments = await ctx.db.query("payments").order("desc").collect();
    
    const paymentsWithDetails = await Promise.all(
      payments.map(async (payment) => {
        const booking = await ctx.db.get(payment.bookingId);
        let user = null;
        if (booking) {
          user = await ctx.db.get(booking.userId);
        }
        return { ...payment, booking, user };
      })
    );
    
    return paymentsWithDetails;
  },
});

// Get dashboard summary stats
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const bookings = await ctx.db.query("bookings").collect();
    const payments = await ctx.db.query("payments").collect();
    
    const confirmedBookings = bookings.filter(b => b.status === "confirmed");
    const completedBookings = bookings.filter(b => b.status === "completed");
    const pendingBookings = bookings.filter(b => b.status === "pending_payment");
    
    const capturedPayments = payments.filter(p => p.status === "captured");
    const totalRevenue = capturedPayments.reduce((sum, p) => sum + p.amount, 0);
    
    return {
      totalBookings: bookings.length,
      confirmedBookings: confirmedBookings.length,
      completedBookings: completedBookings.length,
      pendingBookings: pendingBookings.length,
      totalRevenue,
      totalPayments: payments.length,
    };
  },
});
