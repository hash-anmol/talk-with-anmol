"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { google } from "googleapis";
import { DateTime } from "luxon";

const TIMEZONE = "Asia/Kolkata";
const BUFFER_MINUTES = 10;
const WORK_START_HOUR = 10;
const WORK_END_HOUR = 18;

function generateSlots(date: DateTime, busy: Array<{ start: Date; end: Date }>, sessionMinutes: number) {
  const slots: { start: string; end: string }[] = [];
  let cursor = date.set({ hour: WORK_START_HOUR, minute: 0, second: 0 });
  const end = date.set({ hour: WORK_END_HOUR, minute: 0, second: 0 });

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
        start: slotStart.toISO(),
        end: slotEnd.toISO(),
      });
    }

    cursor = cursor.plus({ minutes: sessionMinutes + BUFFER_MINUTES });
  }

  return slots;
}

export const getAvailability = action({
  args: { date: v.string(), duration: v.optional(v.number()) },
  handler: async (_, args) => {
    const sessionMinutes = args.duration ?? 45;
    const date = DateTime.fromISO(args.date, { zone: TIMEZONE });
    if (!date.isValid) {
      return { slots: [] };
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    if (!clientId || !clientSecret || !refreshToken) {
      const fallback = generateSlots(date, [], sessionMinutes);
      return { slots: fallback.slice(0, 6), source: "mock" };
    }

    const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
    oauth2.setCredentials({ refresh_token: refreshToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2 });
    const timeMin = date.startOf("day").toISO();
    const timeMax = date.endOf("day").toISO();

    const freeBusy = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: [{ id: calendarId }],
      },
    });

    const busySlots = freeBusy.data.calendars?.[calendarId]?.busy || [];
    const busy = busySlots.map((slot) => ({
      start: new Date(slot.start ?? ""),
      end: new Date(slot.end ?? ""),
    }));

    const slots = generateSlots(date, busy, sessionMinutes);
    return { slots, source: "google" };
  },
});
