import Link from "next/link";
import { getConvexClient } from "@/lib/convexServer";
import { api } from "@/../convex/_generated/api";

type Payment = {
  _id: string;
  amount: number;
  status: string;
  createdAt: number;
  booking: {
    _id: string;
    slotStart: string;
    bookingType: string;
  } | null;
  user: {
    name: string;
    email: string;
  } | null;
};

async function getPaymentsData() {
  const client = getConvexClient();
  if (!client) return { payments: [], stats: { totalRevenue: 0, totalDonated: 0 } };
  try {
    const payments = await client.query(api.admin.listPayments, {});
    const capturedPayments = payments.filter((p: Payment) => p.status === "captured");
    const totalRevenue = capturedPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0);
    
    // For now, assume all captured payments are donated (100% charity model)
    return {
      payments: capturedPayments,
      stats: {
        totalRevenue,
        totalDonated: totalRevenue, // 100% donation model
      },
    };
  } catch {
    return { payments: [], stats: { totalRevenue: 0, totalDonated: 0 } };
  }
}

export default async function CharityPage() {
  const { payments, stats } = await getPaymentsData();

  return (
    <div className="page-shell py-12 px-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="card charity-card p-10 border-none shadow-xl">
          <h1 className="text-4xl font-bold">Charity Transparency</h1>
          <p className="mt-3 text-lg text-[#6b5b4e] max-w-2xl">
            A public, factual ledger of money collected from sessions and donated to impactful causes. 100% of proceeds are donated.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="card p-6 border-none shadow-lg bg-white/80 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-orange-600">
              Total collected
            </p>
            <p className="mt-2 text-3xl font-bold">₹{stats.totalRevenue}</p>
          </div>
          <div className="card p-6 border-none shadow-lg bg-green-50/50">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-green-700">
              Total donated
            </p>
            <p className="mt-2 text-3xl font-bold text-green-700">₹{stats.totalDonated}</p>
          </div>
        </section>

        <section className="card p-8 border-none shadow-xl">
          <h2 className="text-2xl font-bold mb-2">Session Ledger</h2>
          <p className="text-[#6b5b4e] mb-6">Celebrating the generous souls who made a difference</p>
          <div className="space-y-5">
            {payments.length === 0 && (
              <p className="text-[#9b8b7b] italic text-center py-10">No sessions completed yet. Be the first to book!</p>
            )}
            {payments.map((payment: Payment) => {
              const donorName = payment.user?.name || "Anonymous Donor";
              const donorInitial = donorName.charAt(0).toUpperCase();
              
              return (
                <div
                  key={payment._id}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-orange-100/50"
                >
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-200/30 to-rose-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-amber-200/20 to-orange-200/20 rounded-full translate-y-1/2 -translate-x-1/2" />
                  
                  <div className="relative flex items-start gap-4">
                    {/* Donor Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center shadow-md">
                        <span className="text-2xl font-bold text-white">{donorInitial}</span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-[#3b2f26] truncate">{donorName}</h3>
                          <p className="text-sm text-[#6b5b4e]">made a generous contribution</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold shadow-sm">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            ₹{payment.amount}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 text-sm text-[#6b5b4e] border border-orange-100">
                          <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {payment.booking?.slotStart 
                            ? new Date(payment.booking.slotStart).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "Session completed"}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 text-sm text-[#6b5b4e] border border-orange-100">
                          <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          {payment.booking?.bookingType === "strategy" ? "Strategy Session" : "Quick Session"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Sparkle decoration */}
                  <div className="absolute top-3 right-12 text-orange-300/60">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/booking" className="btn-primary">
            Book a Session
          </Link>
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
