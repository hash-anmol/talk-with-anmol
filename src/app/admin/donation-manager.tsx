"use client";

import { useState } from "react";

type Donation = {
  _id: string;
  amount: number;
  date: string;
  note?: string;
  donated: boolean;
  proofUrl?: string;
};

export default function DonationManager({ donations }: { donations: Donation[] }) {
  const [items, setItems] = useState(donations);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const markDonated = async (donationId: string) => {
    setLoadingId(donationId);
    await fetch("/api/admin/donation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donationId }),
    });
    setItems((prev) =>
      prev.map((item) =>
        item._id === donationId ? { ...item, donated: true } : item
      )
    );
    setLoadingId(null);
  };

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item._id}
          className="flex flex-col gap-2 rounded-xl border border-[#eadfd2] bg-white p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">₹{item.amount}</p>
              <p className="text-xs text-[#6b5b4e]">{item.date}</p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              disabled={item.donated || loadingId === item._id}
              onClick={() => markDonated(item._id)}
            >
              {item.donated ? "Donated" : "Mark donated"}
            </button>
          </div>
          {item.note && <p className="text-sm text-[#6b5b4e]">{item.note}</p>}
        </div>
      ))}
    </div>
  );
}
