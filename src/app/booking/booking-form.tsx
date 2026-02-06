"use client";

import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Slot = {
  start: string;
  end: string;
};

const TIMEZONE = "Asia/Kolkata";

export default function BookingForm() {
  const searchParams = useSearchParams();
  const rawType = searchParams.get("type");
  const bookingType = rawType === "quick" ? "quick" : "strategy";

  const today = DateTime.now().setZone(TIMEZONE).toISODate();
  const [date, setDate] = useState<string>(today ?? "");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    setError(null);
    const duration = bookingType === "quick" ? 10 : 45;
    fetch(`/api/availability?date=${date}&duration=${duration}`)
      .then((res) => res.json())
      .then((data) => {
        setSlots(data.slots || []);
      })
      .catch(() => setError("Unable to load slots right now."))
      .finally(() => setLoading(false));
  }, [date, bookingType]);

  const basePrice = bookingType === "quick" ? 250 : 600;
  const price = useMemo(() => (recording ? basePrice + 200 : basePrice), [recording, basePrice]);

  const submit = async () => {
    setError(null);
    if (!name || !email || !selectedSlot) {
      setError("Please complete your details and select a slot.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          recording,
          slotStart: selectedSlot.start,
          slotEnd: selectedSlot.end,
          bookingType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to create booking.");
      }
      window.location.href = data.paymentUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card p-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-4">
          <div className="mb-2">
            <h3 className="text-2xl font-bold text-emerald-700">
              {bookingType === "quick" ? "Quick Chat (Direct Phone Call)" : "1:1 AI Strategy Session"}
            </h3>
            <p className="text-sm text-[#6b5b4e]">
              {bookingType === "quick" ? "10-minute focused call via Phone." : "45-minute deep dive session."}
            </p>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#6b5b4e]">
              Your name
            </label>
            <input
              className="soft-input mt-2"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#6b5b4e]">
              Email
            </label>
            <input
              className="soft-input mt-2"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#6b5b4e]">
              Select a date (IST)
            </label>
            <input
              className="soft-input mt-2"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#6b5b4e]">
              Available slots
            </label>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {loading && <p className="text-sm">Loading slots...</p>}
              {!loading && slots.length === 0 && (
                <p className="text-sm text-[#6b5b4e]">
                  No slots available on this date.
                </p>
              )}
              {slots.map((slot) => {
                const label = DateTime.fromISO(slot.start)
                  .setZone(TIMEZONE)
                  .toFormat("hh:mm a");
                const selected = selectedSlot?.start === slot.start;
                return (
                  <button
                    key={slot.start}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-xl border px-4 py-2 text-left text-sm transition ${
                      selected
                        ? "border-black bg-black text-white"
                        : "border-[#e7ded2] bg-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#6b5b4e]">
            <input
              type="checkbox"
              checked={recording}
              onChange={(event) => setRecording(event.target.checked)}
            />
            Add recording for ₹200
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6b5b4e]">
              Summary
            </p>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span>Session fee</span>
              <span>₹{basePrice}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span>Recording</span>
              <span>{recording ? "₹200" : "—"}</span>
            </div>
            <div className="mt-4 flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>₹{price}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="btn-primary w-full text-center disabled:opacity-60"
          >
            {submitting ? "Redirecting..." : "Proceed to Payment"}
          </button>
          <p className="text-xs text-[#7b6a5f]">
            Payment is processed securely by Razorpay. Your booking is confirmed
            only after payment capture.
          </p>
        </div>
      </div>
    </section>
  );
}
