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
  const [recording, setRecording] = useState(true);
  const [testMode, setTestMode] = useState(true);
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
  const computedPrice = useMemo(() => (recording ? basePrice + 200 : basePrice), [recording, basePrice]);
  const price = testMode ? 1 : computedPrice;

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
          testMode,
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
          <div
            onClick={() => setRecording(!recording)}
            className={`flex cursor-pointer items-center justify-between rounded-2xl border-2 p-5 transition-all duration-300 ${
              recording
                ? "border-orange-400 bg-orange-50/50 shadow-md ring-1 ring-orange-200"
                : "border-[#e7ded2] bg-white opacity-70"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all ${
                  recording
                    ? "border-orange-600 bg-orange-600"
                    : "border-[#d0c5b4]"
                }`}
              >
                {recording && (
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <div>
                <p
                  className={`font-black tracking-tight transition-all ${
                    recording ? "text-orange-900 text-lg" : "text-[#6b5b4e]"
                  }`}
                >
                  Add Session Recording
                </p>
                <p className="text-xs font-medium text-[#7b6a5f]">
                  Get a high-quality video & audio recording to revisit
                  anytime. Highly recommended!
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span
                className={`font-black transition-all ${
                  recording ? "text-orange-700 text-xl" : "text-[#6b5b4e]"
                }`}
              >
                ₹200
              </span>
              {recording && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                  Recommended
                </span>
              )}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#6b5b4e]">
            <input
              type="checkbox"
              checked={testMode}
              onChange={(event) => setTestMode(event.target.checked)}
            />
            Test mode (₹1)
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
              <span>₹{testMode ? 1 : basePrice}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span>Recording</span>
              <span>{recording && !testMode ? "₹200" : "—"}</span>
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
