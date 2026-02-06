# Session-to-Charity Booking Platform

A Next.js + Convex platform for booking paid 1-on-1 sessions, auto-generating Google Meet invites, and publishing a transparent charity ledger.

## Requirements

- Node.js 18+
- Razorpay account (Payment Links + webhooks)
- Google Cloud project with Calendar API enabled
- Convex project

## Environment Variables

Create `.env.local` in the project root:

```
NEXT_PUBLIC_CONVEX_URL=
CONVEX_URL=
NEXT_PUBLIC_BASE_URL=http://localhost:3000

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_CALENDAR_ID=primary

ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
ADMIN_SESSION_SECRET=
```

Notes:
- Use `ADMIN_PASSWORD_HASH` (bcrypt) or set `ADMIN_PASSWORD` instead.
- `NEXT_PUBLIC_BASE_URL` is used for Razorpay callback URLs.

## Setup

```bash
npm install
npx convex dev
npm run dev
```

## Razorpay Webhook

Set your webhook URL to:

```
<YOUR_BASE_URL>/api/razorpay/webhook
```

Listen for `payment.captured` events.

## Profile Image

Drop your hero photo at:

```
public/images/profile.jpg
```

## Key Routes

- `/` Landing
- `/session` Session details
- `/booking` Booking flow
- `/confirmation` Payment confirmation
- `/charity` Public donation ledger
- `/talkwithanmoladmin` Admin dashboard
