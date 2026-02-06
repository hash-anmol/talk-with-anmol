"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { google } from "googleapis";
import { getGoogleAuth } from "./calendar";

// Helper to format date/time nicely
function formatDateTime(isoString: string, timezone: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  });
}

// Generate HTML email content
function generateEmailHTML(args: {
  customerName: string;
  bookingType: string;
  slotStart: string;
  slotEnd: string;
  timezone: string;
  meetLink: string | null;
  amount: number;
  calendarLink: string | null;
}): string {
  const sessionType = args.bookingType === "quick" ? "Quick 10-min" : "Strategy 45-min";
  const formattedDate = formatDateTime(args.slotStart, args.timezone);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Booking Confirmed!</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px;">Hi ${args.customerName},</p>
    
    <p style="font-size: 16px;">Your <strong>${sessionType} AI Agent Session</strong> has been successfully booked and paid for.</p>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
      <h2 style="margin-top: 0; color: #4f46e5; font-size: 18px;">Session Details</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Session Type:</td>
          <td style="padding: 8px 0; font-weight: 600;">${sessionType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Date & Time:</td>
          <td style="padding: 8px 0; font-weight: 600;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Amount Paid:</td>
          <td style="padding: 8px 0; font-weight: 600;">₹${args.amount}</td>
        </tr>
      </table>
    </div>
    
    ${args.meetLink ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${args.meetLink}" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Join Google Meet
      </a>
    </div>
    <p style="text-align: center; color: #6b7280; font-size: 14px;">
      Or copy this link: <a href="${args.meetLink}" style="color: #4f46e5;">${args.meetLink}</a>
    </p>
    ` : ''}
    
    ${args.calendarLink ? `
    <p style="text-align: center;">
      <a href="${args.calendarLink}" style="color: #4f46e5; font-size: 14px;">View in Google Calendar</a>
    </p>
    ` : ''}
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>Reminder:</strong> You'll receive a calendar invite shortly. Please accept it to add the event to your calendar and get reminders.
      </p>
    </div>
    
    <p style="font-size: 16px;">Looking forward to our session!</p>
    
    <p style="font-size: 16px; margin-bottom: 0;">
      Best regards,<br>
      <strong>Anmol</strong>
    </p>
  </div>
  
  <div style="background: #1f2937; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      Talk with Anmol - AI Agent Sessions<br>
      This email was sent because you booked a session.
    </p>
  </div>
</body>
</html>
  `;
}

// Generate plain text version
function generatePlainText(args: {
  customerName: string;
  bookingType: string;
  slotStart: string;
  slotEnd: string;
  timezone: string;
  meetLink: string | null;
  amount: number;
}): string {
  const sessionType = args.bookingType === "quick" ? "Quick 10-min" : "Strategy 45-min";
  const formattedDate = formatDateTime(args.slotStart, args.timezone);
  
  return `
Booking Confirmed!

Hi ${args.customerName},

Your ${sessionType} AI Agent Session has been successfully booked and paid for.

SESSION DETAILS
---------------
Session Type: ${sessionType}
Date & Time: ${formattedDate}
Amount Paid: ₹${args.amount}

${args.meetLink ? `JOIN THE MEETING
-----------------
Google Meet: ${args.meetLink}` : ''}

You'll receive a calendar invite shortly. Please accept it to add the event to your calendar and get reminders.

Looking forward to our session!

Best regards,
Anmol

---
Talk with Anmol - AI Agent Sessions
  `.trim();
}

// Create RFC 2822 formatted email
function createEmail(args: {
  to: string;
  from: string;
  bcc?: string;
  subject: string;
  html: string;
  text: string;
}): string {
  const boundary = `boundary_${Date.now()}`;
  
  const headers = [
    `From: ${args.from}`,
    `To: ${args.to}`,
    args.bcc ? `Bcc: ${args.bcc}` : '',
    `Subject: ${args.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].filter(Boolean).join('\r\n');
  
  const body = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    args.text,
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    args.html,
    `--${boundary}--`,
  ].join('\r\n');
  
  return `${headers}\r\n\r\n${body}`;
}

// Encode email for Gmail API
function encodeEmail(email: string): string {
  return Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const sendBookingConfirmation = action({
  args: {
    customerEmail: v.string(),
    customerName: v.string(),
    bookingType: v.string(),
    slotStart: v.string(),
    slotEnd: v.string(),
    timezone: v.string(),
    meetLink: v.optional(v.string()),
    calendarLink: v.optional(v.string()),
    amount: v.number(),
  },
  handler: async (_, args) => {
    const oauth2 = getGoogleAuth();
    const adminEmail = process.env.ADMIN_EMAIL || "anmolmalik.oss@gmail.com";
    
    const gmail = google.gmail({ version: "v1", auth: oauth2 });
    
    const sessionType = args.bookingType === "quick" ? "Quick 10-min" : "Strategy 45-min";
    const subject = `Booking Confirmed: ${sessionType} Session on ${new Date(args.slotStart).toLocaleDateString()}`;
    
    const htmlContent = generateEmailHTML({
      customerName: args.customerName,
      bookingType: args.bookingType,
      slotStart: args.slotStart,
      slotEnd: args.slotEnd,
      timezone: args.timezone,
      meetLink: args.meetLink ?? null,
      calendarLink: args.calendarLink ?? null,
      amount: args.amount,
    });
    
    const textContent = generatePlainText({
      customerName: args.customerName,
      bookingType: args.bookingType,
      slotStart: args.slotStart,
      slotEnd: args.slotEnd,
      timezone: args.timezone,
      meetLink: args.meetLink ?? null,
      amount: args.amount,
    });
    
    const rawEmail = createEmail({
      to: args.customerEmail,
      from: `Talk with Anmol <${adminEmail}>`,
      bcc: adminEmail, // BCC yourself on all emails
      subject: subject,
      html: htmlContent,
      text: textContent,
    });
    
    const encodedEmail = encodeEmail(rawEmail);
    
    try {
      const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedEmail,
        },
      });
      
      return {
        success: true,
        messageId: response.data.id,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to send email:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});
