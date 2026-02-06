import { cookies } from "next/headers";
import Link from "next/link";
import AdminLoginForm from "@/app/talkwithanmoladmin/admin-login-form";
import AvailabilitySettings from "@/app/talkwithanmoladmin/availability-settings";
import { getAdminCookieName, verifyAdminToken } from "@/lib/adminSession";
import { getConvexClient } from "@/lib/convexServer";
import { api } from "@/../convex/_generated/api";

type BookingWithUser = {
  _id: string;
  slotStart: string;
  slotEnd: string;
  bookingType: string;
  status: string;
  recordingRequested: boolean;
  price: number;
  user: {
    name: string;
    email: string;
  } | null;
};

async function getAdminData() {
  const client = getConvexClient();
  if (!client) return { bookings: [], stats: null };
  const bookings = await client.query(api.admin.listBookings, {});
  const stats = await client.query(api.admin.getDashboardStats, {});
  return { bookings, stats };
}

export default async function AdminPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || "sessions";

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

  const { bookings, stats } = await getAdminData();

  return (
    <div className="page-shell">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
        <header className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-[#6b5b4e]">
              Manage bookings and view revenue stats.
            </p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl w-fit self-start md:self-center">
            <Link 
              href="/talkwithanmoladmin?tab=sessions"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "sessions" ? "bg-white shadow-sm text-black" : "text-[#6b5b4e] hover:text-black"
              }`}
            >
              Sessions
            </Link>
            <Link 
              href="/talkwithanmoladmin?tab=availability"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "availability" ? "bg-white shadow-sm text-black" : "text-[#6b5b4e] hover:text-black"
              }`}
            >
              Availability
            </Link>
          </div>
        </header>

        {activeTab === "sessions" ? (
          <>
            {stats && (
              <section className="grid gap-4 md:grid-cols-4">
                <div className="card p-4 text-center">
                  <p className="text-xs uppercase tracking-wide text-[#6b5b4e]">Total Bookings</p>
                  <p className="text-2xl font-bold">{stats.totalBookings}</p>
                </div>
                <div className="card p-4 text-center bg-green-50">
                  <p className="text-xs uppercase tracking-wide text-green-700">Confirmed</p>
                  <p className="text-2xl font-bold text-green-700">{stats.confirmedBookings}</p>
                </div>
                <div className="card p-4 text-center bg-orange-50">
                  <p className="text-xs uppercase tracking-wide text-orange-700">Pending</p>
                  <p className="text-2xl font-bold text-orange-700">{stats.pendingBookings}</p>
                </div>
                <div className="card p-4 text-center bg-blue-50">
                  <p className="text-xs uppercase tracking-wide text-blue-700">Revenue</p>
                  <p className="text-2xl font-bold text-blue-700">₹{stats.totalRevenue}</p>
                </div>
              </section>
            )}

            <section className="card p-6">
              <h2 className="text-2xl font-semibold">Sessions</h2>
              <div className="mt-4 space-y-3">
                {bookings.length === 0 && (
                  <p className="text-sm text-[#6b5b4e]">No sessions yet.</p>
                )}
                {bookings.map((booking: BookingWithUser) => (
                  <div
                    key={booking._id}
                    className="flex flex-col gap-1 rounded-xl border border-[#eadfd2] bg-white p-4 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{booking.user?.name ?? "Unknown"}</span>
                      <span className={`pill ${
                        booking.status === "confirmed" ? "bg-green-100 text-green-700" :
                        booking.status === "pending_payment" ? "bg-orange-100 text-orange-700" :
                        booking.status === "completed" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p>{booking.user?.email ?? "No email"}</p>
                    <p>
                      {new Date(booking.slotStart).toLocaleString()} → {new Date(booking.slotEnd).toLocaleString()}
                    </p>
                    <div className="flex items-center justify-between text-xs text-[#6b5b4e]">
                      <span>{booking.bookingType === "strategy" ? "Strategy Session" : "Quick Session"}</span>
                      <span>₹{booking.price}</span>
                    </div>
                    {booking.recordingRequested && (
                      <p className="text-[#1e1a16]">Recording requested.</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <AvailabilitySettings />
        )}

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/charity" className="btn-secondary">
            View Charity Ledger
          </Link>
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

