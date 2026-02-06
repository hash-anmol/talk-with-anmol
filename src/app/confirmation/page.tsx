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
    const paymentId = searchParams.get("razorpay_payment_id");
    const paymentLinkId = searchParams.get("razorpay_payment_link_id");
    const paymentStatus = searchParams.get("razorpay_payment_link_status");
    const signature = searchParams.get("razorpay_signature");

    if (paymentId && paymentLinkId && paymentStatus && signature) {
      const params = new URLSearchParams();
      params.set("booking", bookingId);
      params.set("razorpay_payment_id", paymentId);
      params.set("razorpay_payment_link_id", paymentLinkId);
      params.set("razorpay_payment_link_reference_id", bookingId);
      params.set("razorpay_payment_link_status", paymentStatus);
      params.set("razorpay_signature", signature);
      fetch(`/api/razorpay/confirm?${params.toString()}`).catch(() => null);
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/booking-status?bookingId=${bookingId}`);
        if (!res.ok) {
          throw new Error("Unable to load booking status");
        }
        const json = await res.json();
        setData(json);
      } catch {
        setData({ status: "pending_payment" });
      } finally {
        setLoading(false);
      }
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
          {data.status === "pending_payment" ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <p className="font-medium text-green-800">
                  Your request has been accepted!
                </p>
                <p className="mt-2 text-green-700">
                  Please check your mailbox after 10 minutes for the confirmation email with your calendar invite and meeting link.
                </p>
              </div>
              <p className="text-[#6b5b4e]">
                If you don&apos;t receive the email or have any questions, please reach out to me at{" "}
                <a href="mailto:anmolmalik.oss@gmail.com" className="text-[#1e1a16] underline">
                  anmolmalik.oss@gmail.com
                </a>
              </p>
            </div>
          ) : (
            <>
              <p>
                Status: <strong className="text-[#1e1a16]">{data.status}</strong>
              </p>
              {data.status === "cancelled" && (
                <p className="text-[#6b5b4e]">
                  Payment failed. Please go back and try again.
                </p>
              )}
            </>
          )}
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
          {data.status !== "pending_payment" && (
            <p>Calendar invite has been sent to your email.</p>
          )}
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
            Thank you for booking! We are processing your request.
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
