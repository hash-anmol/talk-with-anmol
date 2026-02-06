import { cookies } from "next/headers";
import Link from "next/link";
import AdminLoginForm from "@/app/admin/admin-login-form";
import DonationManager from "@/app/admin/donation-manager";
import { getAdminCookieName, verifyAdminToken } from "@/lib/adminSession";
import { getConvexClient } from "@/lib/convexServer";
import { api } from "@/../convex/_generated/api";

async function getAdminData() {
  const client = getConvexClient();
  if (!client) return { bookings: [], donations: [] };
  const bookings = await client.query(api.admin.listBookings, {});
  const donations = await client.query(api.donations.list, {});
  return { bookings, donations };
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(getAdminCookieName())?.value;
  let isAuthed = false;

  if (cookie) {
    try {
      await verifyAdminToken(cookie);
      isAuthed = true;
    } catch {
      isAuthed = false;
    }
  }

  if (!isAuthed) {
    return (
      <div className="page-shell">
        <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-12">
          <AdminLoginForm />
        </div>
      </div>
    );
  }

  const { bookings, donations } = await getAdminData();

  return (
    <div className="page-shell">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
        <header className="card p-6">
          <h1 className="text-3xl font-semibold">Admin dashboard</h1>
          <p className="mt-2 text-sm text-[#6b5b4e]">
            Manage bookings, payments, and charity ledger.
          </p>
        </header>

        <section className="card p-6">
          <h2 className="text-2xl font-semibold">Upcoming sessions</h2>
          <div className="mt-4 space-y-3">
            {bookings.length === 0 && (
              <p className="text-sm text-[#6b5b4e]">No sessions yet.</p>
            )}
            {bookings.map((booking: any) => (
              <div
                key={booking._id}
                className="flex flex-col gap-1 rounded-xl border border-[#eadfd2] bg-white p-4 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{booking.customerName}</span>
                  <span className="pill">{booking.status}</span>
                </div>
                <p>{booking.customerEmail}</p>
                <p>
                  {booking.slotStart} → {booking.slotEnd}
                </p>
                {booking.recordingRequested && (
                  <p className="text-[#1e1a16]">Recording requested.</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-2xl font-semibold">Donations</h2>
          <div className="mt-4">
            <DonationManager donations={donations} />
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
