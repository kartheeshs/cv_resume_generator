# CV Resume Generator

A Next.js application that streams polished PDF resumes, authenticates with Firebase (email link + Google), and stores drafts, templates, and entitlements in Firestore.

## Stack

- **Hosting/SSR**: Next.js (optimized for Vercel deploys)
- **Authentication & Database**: Firebase (Spark/Blaze, `asia-northeast1`)
- **PDF generation**: `@react-pdf/renderer` streamed from a Route Handler
- **Rate limiting / queues**: Upstash Redis (integration-ready placeholder)
- **Monitoring**: Sentry (hook up your DSN when ready)
- **Payments**: Stripe (wire in when you start charging)

## Getting started

1. Install dependencies and copy the environment template:

   ```bash
   npm install
   cp .env.example .env.local
   ```

2. Fill in your Firebase config in `.env.local`:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
   NEXT_PUBLIC_EMAIL_SIGN_IN_REDIRECT=https://your-domain.com/callback
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Visit `http://localhost:3000` to explore the landing page, log in, and manage resumes.

## Features

- Passwordless email link and Google sign-in with role-aware admin gating.
- Firestore-backed storage for drafts, templates (auto-seeded), and entitlement tracking.
- Admin dashboard to promote users and curate templates.
- Resume builder with template hydration, Firestore draft syncing, and streamed PDF downloads via `/api/resume`.

## Environment & deployment notes

- Set Firebase to the `asia-northeast1` (Tokyo) region for low-latency reads/writes.
- Configure Upstash, Sentry, and Stripe credentials when you are ready to scale beyond the included scaffolding.
- PDF files are streamed on demand—no storage bucket costs.
