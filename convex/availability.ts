"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { google } from "googleapis";
import { DateTime } from "luxon";
import { api } from "./_generated/api";

function generateSlots(
  date: DateTime, 
  busy: Array<{ start: Date; end: Date }>, 
  sessionMinutes: number,
  ranges: Array<{ startHour: number; startMinute: number; endHour: number; endMinute: number }>,
  bufferMinutes: number
) {
  const slots: { start: string; end: string }[] = [];

  for (const range of ranges) {
    let cursor = date.set({ hour: range.startHour, minute: range.startMinute, second: 0 });
    const end = date.set({ hour: range.endHour, minute: range.endMinute, second: 0 });

    while (cursor.plus({ minutes: sessionMinutes }) <= end) {
      const slotStart = cursor;
      const slotEnd = cursor.plus({ minutes: sessionMinutes });
      const overlaps = busy.some((block) => {
        const blockStart = DateTime.fromJSDate(block.start);
        const blockEnd = DateTime.fromJSDate(block.end);
        return slotStart < blockEnd && slotEnd > blockStart;
      });

      if (!overlaps) {
        slots.push({
          start: slotStart.toISO() || "",
          end: slotEnd.toISO() || "",
        });
      }

      cursor = cursor.plus({ minutes: sessionMinutes + bufferMinutes });
    }
  }

  return slots;
}

export const getAvailability = action({
  args: { date: v.string(), duration: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Fetch settings from DB
    const globalSettings = await ctx.runQuery(api.settings.getGlobalSettings);
    const timezone = globalSettings.timezone || "Asia/Kolkata";
    const bufferMinutes = globalSettings.bufferMinutes ?? 10;
    const maxSessionsPerMonth = globalSettings.maxSessionsPerMonth;
    const maxSessionsPerDay = globalSettings.maxSessionsPerDay;
    
    const availabilitySettings = await ctx.runQuery(api.settings.getAvailabilitySettings);
    const blockedDates = await ctx.runQuery(api.settings.getBlockedDates);

    const sessionMinutes = args.duration ?? 45;
    const date = DateTime.fromISO(args.date, { zone: timezone });
    if (!date.isValid) {
      return { slots: [] };
    }

    const bookingStatuses = new Set(["pending_payment", "confirmed"]);
    const dateStart = date.startOf("day");
    const dateEnd = date.endOf("day");
    const monthStart = date.startOf("month");
    const monthEnd = date.endOf("month");

    if (typeof maxSessionsPerDay === "number" || typeof maxSessionsPerMonth === "number") {
      const existingBookings = await ctx.runQuery(api.bookings.listBookings, {});
      const activeBookings = existingBookings.filter((booking) =>
        bookingStatuses.has(booking.status)
      );

      const dailyCount = activeBookings.filter((booking) => {
        const slotStart = DateTime.fromISO(booking.slotStart, { zone: timezone });
        return slotStart >= dateStart && slotStart <= dateEnd;
      }).length;

      const monthlyCount = activeBookings.filter((booking) => {
        const slotStart = DateTime.fromISO(booking.slotStart, { zone: timezone });
        return slotStart >= monthStart && slotStart <= monthEnd;
      }).length;

      if (typeof maxSessionsPerDay === "number" && dailyCount >= maxSessionsPerDay) {
        return { slots: [], status: "daily_limit_reached" };
      }

      if (typeof maxSessionsPerMonth === "number" && monthlyCount >= maxSessionsPerMonth) {
        return { slots: [], status: "monthly_limit_reached" };
      }
    }

    // Check if date is blocked
    const isBlocked = blockedDates.some(bd => bd.date === date.toISODate());
    if (isBlocked) {
      return { slots: [], status: "blocked" };
    }

    // Check if day is enabled and get ranges
    const dayOfWeek = date.weekday % 7; // Luxon 1-7 (Mon-Sun) -> DB 0-6 (Sun-Sat)
    const daySetting = availabilitySettings.find(s => s.dayOfWeek === dayOfWeek);
    
    if (!daySetting || !daySetting.enabled || daySetting.slots.length === 0) {
      return { slots: [], status: "unavailable" };
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    let busy: Array<{ start: Date; end: Date }> = [];

    if (clientId && clientSecret && refreshToken) {
      try {
        const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
        oauth2.setCredentials({ refresh_token: refreshToken });

        const calendar = google.calendar({ version: "v3", auth: oauth2 });
        const timeMin = date.startOf("day").toISO() || undefined;
        const timeMax = date.endOf("day").toISO() || undefined;

        const freeBusy = await calendar.freebusy.query({
          requestBody: {
            timeMin,
            timeMax,
            items: [{ id: calendarId }],
          },
        });

        const busySlots = freeBusy.data.calendars?.[calendarId]?.busy || [];
        busy = busySlots.map((slot) => ({
          start: new Date(slot.start ?? ""),
          end: new Date(slot.end ?? ""),
        }));
      } catch (error) {
        console.error("Google Calendar Error:", error);
      }
    }

    const slots = generateSlots(date, busy, sessionMinutes, daySetting.slots, bufferMinutes);
    return { slots, source: busy.length > 0 ? "google" : "computed" };
  },
});
