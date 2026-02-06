"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { google } from "googleapis";

export const createCalendarEvent = action({
  args: {
    bookingId: v.id("bookings"),
    customerEmail: v.string(),
    customerName: v.string(),
    slotStart: v.string(),
    slotEnd: v.string(),
  },
  handler: async (_, args) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error("Google Calendar credentials missing");
    }

    const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
    oauth2.setCredentials({ refresh_token: refreshToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2 });
    const response = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      requestBody: {
        summary: `AI Agent Session with ${args.customerName}`,
        description: "1-on-1 AI Agent Session",
        start: {
          dateTime: args.slotStart,
        },
        end: {
          dateTime: args.slotEnd,
        },
        attendees: [{ email: args.customerEmail }],
        conferenceData: {
          createRequest: {
            requestId: `${args.bookingId}-${Date.now()}`,
          },
        },
      },
    });

    const meetLink = response.data.conferenceData?.entryPoints?.find(
      (entry) => entry.entryPointType === "video"
    )?.uri;

    return {
      calendarEventId: response.data.id,
      meetLink: meetLink ?? null,
    };
  },
});
