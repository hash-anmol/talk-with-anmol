import BookingForm from "@/app/booking/booking-form";
import Link from "next/link";
import { Suspense } from "react";

export default function BookingPage() {
  return (
    <div className="page-shell">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-12">
        <header className="card p-6">
          <p className="pill">Step 1 · Choose your slot</p>
          <h1 className="mt-3 text-3xl font-semibold">Book a session</h1>
          <p className="mt-2 text-sm text-[#6b5b4e]">
            Select a time that works for you. We will confirm the booking only
            after payment is captured.
          </p>
        </header>

        <Suspense fallback={<div className="card p-6">Loading booking form...</div>}>
          <BookingForm />
        </Suspense>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/session" className="btn-secondary">
            Read Session Details
          </Link>
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
