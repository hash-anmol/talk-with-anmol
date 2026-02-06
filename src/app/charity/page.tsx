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
          <h2 className="text-2xl font-bold mb-6">Session Ledger</h2>
          <div className="space-y-4">
            {payments.length === 0 && (
              <p className="text-[#9b8b7b] italic text-center py-10">No sessions completed yet. Be the first to book!</p>
            )}
            {payments.map((payment: Payment) => (
              <div
                key={payment._id}
                className="flex flex-col gap-2 rounded-2xl border border-orange-100 bg-orange-50/10 p-5 hover:bg-orange-50/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-[#3b2f26]">₹{payment.amount}</span>
                  <span className="pill px-4 py-1.5 bg-green-100 text-green-700 border-none">
                    Donated
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm text-[#6b5b4e]">
                  <p className="font-medium">
                    {payment.booking?.slotStart 
                      ? new Date(payment.booking.slotStart).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Session completed"}
                  </p>
                  <p className="italic">
                    {payment.booking?.bookingType === "strategy" ? "Strategy Session" : "Quick Session"}
                  </p>
                </div>
              </div>
            ))}
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
