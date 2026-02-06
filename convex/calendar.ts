"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { google } from "googleapis";

// Helper to get authenticated OAuth2 client
export function getGoogleAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google credentials missing. Run: node scripts/get-google-token.mjs");
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

export const createCalendarEvent = action({
  args: {
    bookingId: v.id("bookings"),
    customerEmail: v.string(),
    customerName: v.string(),
    slotStart: v.string(),
    slotEnd: v.string(),
    bookingType: v.optional(v.string()),
  },
  handler: async (_, args) => {
    const oauth2 = getGoogleAuth();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
    const adminEmail = process.env.ADMIN_EMAIL || "anmolmalik.oss@gmail.com";

    const sessionType = args.bookingType === "quick" ? "Quick 10-min" : "Strategy 45-min";
    
    const calendar = google.calendar({ version: "v3", auth: oauth2 });
    const response = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      sendUpdates: "all", // This sends native Google Calendar invites to all attendees
      requestBody: {
        summary: `${sessionType} AI Agent Session with ${args.customerName}`,
        description: `1-on-1 AI Agent Session

Session Type: ${sessionType}
Customer: ${args.customerName}
Email: ${args.customerEmail}

This meeting was automatically scheduled via Talk with Anmol.`,
        start: {
          dateTime: args.slotStart,
          timeZone: "UTC",
        },
        end: {
          dateTime: args.slotEnd,
          timeZone: "UTC",
        },
        attendees: [
          { email: args.customerEmail, displayName: args.customerName },
          { email: adminEmail, organizer: true, responseStatus: "accepted" },
        ],
        conferenceData: {
          createRequest: {
            requestId: `${args.bookingId}-${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 60 }, // 1 hour before
            { method: "popup", minutes: 10 }, // 10 minutes before
          ],
        },
        guestsCanModify: false,
        guestsCanInviteOthers: false,
      },
    });

    const meetLink = response.data.conferenceData?.entryPoints?.find(
      (entry) => entry.entryPointType === "video"
    )?.uri;

    return {
      calendarEventId: response.data.id,
      meetLink: meetLink ?? null,
      htmlLink: response.data.htmlLink ?? null,
    };
  },
});
