"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AvailabilitySettings() {
  const availability = useQuery(api.settings.getAvailabilitySettings);
  const globalSettings = useQuery(api.settings.getGlobalSettings);
  const blockedDates = useQuery(api.settings.getBlockedDates);
  
  const updateDay = useMutation(api.settings.updateDaySettings);
  const updateGlobal = useMutation(api.settings.updateGlobalSetting);
  const addBlocked = useMutation(api.settings.addBlockedDate);
  const removeBlocked = useMutation(api.settings.removeBlockedDate);
  const initialize = useMutation(api.settings.initializeSettings);

  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (availability && availability.length === 0 && !isInitializing) {
      setIsInitializing(true);
      initialize();
    }
  }, [availability, initialize, isInitializing]);

  if (!availability || !globalSettings || !blockedDates) {
    return <div className="p-4 text-center">Loading settings...</div>;
  }

  const sortedAvailability = [...availability].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  return (
    <div className="flex flex-col gap-6">
      <section className="card p-6">
        <h2 className="text-2xl font-semibold mb-4">Weekly Schedule</h2>
        <div className="space-y-6">
          {sortedAvailability.map((day) => (
            <div key={day._id} className="flex flex-col gap-3 p-4 border border-[#eadfd2] rounded-xl bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={(e) => updateDay({ id: day._id, enabled: e.target.checked, slots: day.slots })}
                    className="h-5 w-5 rounded border-[#eadfd2] text-orange-600 focus:ring-orange-500"
                  />
                  <span className={`text-lg font-medium ${day.enabled ? "text-black" : "text-[#9b8b7b]"}`}>
                    {DAYS[day.dayOfWeek]}
                  </span>
                </div>
                {!day.enabled && <span className="text-xs uppercase font-bold text-[#9b8b7b]">Disabled</span>}
              </div>

              {day.enabled && (
                <div className="flex flex-col gap-3 ml-8">
                  {day.slots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={slot.startHour}
                          onChange={(e) => {
                            const newSlots = [...day.slots];
                            newSlots[index] = { ...slot, startHour: parseInt(e.target.value) };
                            updateDay({ id: day._id, enabled: day.enabled, slots: newSlots });
                          }}
                          className="w-16 p-1 border border-[#eadfd2] rounded text-center"
                        />
                        <span>:</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          step="5"
                          value={slot.startMinute}
                          onChange={(e) => {
                            const newSlots = [...day.slots];
                            newSlots[index] = { ...slot, startMinute: parseInt(e.target.value) };
                            updateDay({ id: day._id, enabled: day.enabled, slots: newSlots });
                          }}
                          className="w-16 p-1 border border-[#eadfd2] rounded text-center"
                        />
                      </div>
                      <span className="text-[#9b8b7b]">to</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={slot.endHour}
                          onChange={(e) => {
                            const newSlots = [...day.slots];
                            newSlots[index] = { ...slot, endHour: parseInt(e.target.value) };
                            updateDay({ id: day._id, enabled: day.enabled, slots: newSlots });
                          }}
                          className="w-16 p-1 border border-[#eadfd2] rounded text-center"
                        />
                        <span>:</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          step="5"
                          value={slot.endMinute}
                          onChange={(e) => {
                            const newSlots = [...day.slots];
                            newSlots[index] = { ...slot, endMinute: parseInt(e.target.value) };
                            updateDay({ id: day._id, enabled: day.enabled, slots: newSlots });
                          }}
                          className="w-16 p-1 border border-[#eadfd2] rounded text-center"
                        />
                      </div>
                      {day.slots.length > 1 && (
                        <button
                          onClick={() => {
                            const newSlots = day.slots.filter((_, i) => i !== index);
                            updateDay({ id: day._id, enabled: day.enabled, slots: newSlots });
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const lastSlot = day.slots[day.slots.length - 1];
                      const newSlots = [...day.slots, { 
                        startHour: lastSlot.endHour, 
                        startMinute: lastSlot.endMinute,
                        endHour: Math.min(23, lastSlot.endHour + 2),
                        endMinute: 0
                      }];
                      updateDay({ id: day._id, enabled: day.enabled, slots: newSlots });
                    }}
                    className="text-sm text-orange-600 font-bold hover:underline flex items-center gap-1 w-fit"
                  >
                    + Add time range
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-2xl font-semibold mb-4">Global Settings</h2>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#6b5b4e]">Buffer between sessions (minutes)</label>
              <select
                value={globalSettings.bufferMinutes || 10}
                onChange={(e) => updateGlobal({ key: "bufferMinutes", value: parseInt(e.target.value) })}
                className="p-2 border border-[#eadfd2] rounded-lg"
              >
                <option value="0">None</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#6b5b4e]">Max sessions per month</label>
              <select
                value={globalSettings.maxSessionsPerMonth ?? 10}
                onChange={(e) => updateGlobal({ key: "maxSessionsPerMonth", value: parseInt(e.target.value) })}
                className="p-2 border border-[#eadfd2] rounded-lg"
              >
                {[5, 7, 10, 12, 15, 20, 25, 30].map((value) => (
                  <option key={value} value={value}>
                    {value} sessions
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#6b5b4e]">Max sessions per day</label>
              <select
                value={globalSettings.maxSessionsPerDay ?? 2}
                onChange={(e) => updateGlobal({ key: "maxSessionsPerDay", value: parseInt(e.target.value) })}
                className="p-2 border border-[#eadfd2] rounded-lg"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 10].map((value) => (
                  <option key={value} value={value}>
                    {value} sessions
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#6b5b4e]">Timezone</label>
              <input
                type="text"
                value={globalSettings.timezone || "Asia/Kolkata"}
                readOnly
                className="p-2 border border-[#eadfd2] rounded-lg bg-gray-50 opacity-60"
              />
              <p className="text-[10px] text-[#9b8b7b]">Timezone is currently fixed to Asia/Kolkata.</p>
            </div>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-2xl font-semibold mb-4">Blocked Dates</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="date"
                id="block-date-input"
                className="flex-1 p-2 border border-[#eadfd2] rounded-lg"
              />
              <button
                onClick={() => {
                  const input = document.getElementById("block-date-input") as HTMLInputElement;
                  if (input.value) {
                    addBlocked({ date: input.value });
                    input.value = "";
                  }
                }}
                className="btn-primary py-2 px-4"
              >
                Block
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {blockedDates.length === 0 && (
                <p className="text-sm text-[#9b8b7b] italic">No dates blocked.</p>
              )}
              {blockedDates.map((bd) => (
                <div key={bd._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-[#eadfd2]">
                  <span className="text-sm font-medium">{new Date(bd.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                  <button
                    onClick={() => removeBlocked({ id: bd._id })}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
