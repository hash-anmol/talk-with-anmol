import Link from "next/link";
import { getConvexClient } from "@/lib/convexServer";
import { api } from "@/../convex/_generated/api";

async function getDonations() {
  const client = getConvexClient();
  if (!client) return [];
  try {
    const data = await client.query(api.donations.list, {});
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function CharityPage() {
  const donations = await getDonations();
  const totalCollected = donations.reduce(
    (sum: number, item: { amount: number }) => sum + item.amount,
    0
  );
  const totalDonated = donations.reduce(
    (sum: number, item: { donated: boolean; amount: number }) =>
      item.donated ? sum + item.amount : sum,
    0
  );
  const pending = totalCollected - totalDonated;

  return (
    <div className="page-shell py-12 px-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="card charity-card p-10 border-none shadow-xl">
          <h1 className="text-4xl font-bold">Charity Transparency</h1>
          <p className="mt-3 text-lg text-[#6b5b4e] max-w-2xl">
            A public, factual ledger of money collected from sessions and donated to impactful causes. 100% of proceeds are donated.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="card p-6 border-none shadow-lg bg-white/80 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-orange-600">
              Total collected
            </p>
            <p className="mt-2 text-3xl font-bold">₹{totalCollected}</p>
          </div>
          <div className="card p-6 border-none shadow-lg bg-green-50/50">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-green-700">
              Total donated
            </p>
            <p className="mt-2 text-3xl font-bold text-green-700">₹{totalDonated}</p>
          </div>
          <div className="card p-6 border-none shadow-lg bg-orange-50/50">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-orange-700">
              Pending donation
            </p>
            <p className="mt-2 text-3xl font-bold text-orange-700">₹{pending}</p>
          </div>
        </section>

        <section className="card p-8 border-none shadow-xl">
          <h2 className="text-2xl font-bold mb-6">Donation ledger</h2>
          <div className="space-y-4">
            {donations.length === 0 && (
              <p className="text-[#9b8b7b] italic text-center py-10">No donations logged yet. Be the first to book!</p>
            )}
            {donations.map(
              (item: {
                _id: string;
                date: string;
                amount: number;
                note?: string;
                donated: boolean;
              }) => (
                <div
                  key={item._id}
                  className="flex flex-col gap-2 rounded-2xl border border-orange-100 bg-orange-50/10 p-5 hover:bg-orange-50/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-[#3b2f26]">₹{item.amount}</span>
                    <span
                      className={`pill px-4 py-1.5 ${
                        item.donated ? "bg-green-100 text-green-700 border-none" : "bg-orange-100 text-orange-700 border-none"
                      }`}
                    >
                      {item.donated ? "✓ Donated" : "• Pending"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm text-[#6b5b4e]">
                    <p className="font-medium">{item.date}</p>
                    {item.note && <p className="italic">"{item.note}"</p>}
                  </div>
                </div>
              )
            )}
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
