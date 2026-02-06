"use client";

import { DateTime } from "luxon";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const TIMEZONE = "Asia/Kolkata";

type BookingStatus = {
  status: string;
  slotStart?: string;
  slotEnd?: string;
  recordingRequested?: boolean;
  meetLink?: string;
};

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking");
  const [data, setData] = useState<BookingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;
    const fetchStatus = async () => {
      const res = await fetch(`/api/booking-status?bookingId=${bookingId}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, [bookingId]);

  const startLabel = data?.slotStart
    ? DateTime.fromISO(data.slotStart).setZone(TIMEZONE).toFormat("ff")
    : "";

  return (
    <section className="card p-6">
      {!bookingId && (
        <p className="text-sm text-[#6b5b4e]">
          No booking reference found. Please contact support if you believe
          this is an error.
        </p>
      )}

      {bookingId && loading && (
        <p className="text-sm text-[#6b5b4e]">Checking status...</p>
      )}

      {bookingId && !loading && data && (
        <div className="space-y-3 text-sm text-[#6b5b4e]">
          <p>
            Status: <strong className="text-[#1e1a16]">{data.status}</strong>
          </p>
          {startLabel && (
            <p>
              Session time: <strong className="text-[#1e1a16]">{startLabel}</strong>
            </p>
          )}
          {data.recordingRequested && (
            <p className="text-[#1e1a16]">Recording requested.</p>
          )}
          {data.meetLink && (
            <a className="btn-secondary inline-block" href={data.meetLink}>
              Join Google Meet
            </a>
          )}
          <p>Calendar invite has been sent to your email.</p>
        </div>
      )}
    </section>
  );
}

export default function ConfirmationPage() {
  return (
    <div className="page-shell">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
        <header className="card p-6">
          <h1 className="text-3xl font-semibold">Booking confirmation</h1>
          <p className="mt-2 text-sm text-[#6b5b4e]">
            We are verifying your payment and creating the calendar invite.
          </p>
        </header>

        <Suspense fallback={<section className="card p-6"><p className="text-sm text-[#6b5b4e]">Loading confirmation...</p></section>}>
          <ConfirmationContent />
        </Suspense>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
          <Link href="/charity" className="btn-secondary">
            Charity Transparency
          </Link>
        </div>
      </div>
    </div>
  );
}
