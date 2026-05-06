# Yolo Photography

A Next.js photography portfolio and admin dashboard backed by Supabase. The Vercel deployment uses the `app/` routes, with `app/page.tsx` as the public home page and `app/admin` as the protected admin area.

## What Is Included

- `app/page.tsx` - Public landing page with portfolio, services, reviews, booking, footer, and social links.
- `app/admin/page.tsx` - Protected admin dashboard for branding, gallery, reviews, services, bookings, and user management.
- `app/admin/login/page.tsx` - Supabase Auth login for allowed admin emails.
- `lib/supabaseClient.ts` - Shared Supabase client using Vercel/Next environment variables.
- `supabase-schema.sql` - Tables, starter data, RLS policies, and storage policies.
- `index.html`, `main.js`, `dashboard.html`, `admin.html` - Legacy/static preview files. They are not the primary Vercel app when Vercel detects this as a Next.js project.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Set local environment variables in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
NEXT_PUBLIC_SUPABASE_ADMIN_EMAIL=owner@example.com
```

Do not include `/rest/v1/` in `NEXT_PUBLIC_SUPABASE_URL`.

3. Run the Supabase setup:

- Open the Supabase SQL editor.
- Run all SQL from `supabase-schema.sql`.
- Confirm `site_settings.admin_emails` includes the owner email and any other admins.
- Confirm storage buckets `site-assets` and `portfolios` exist and are public.

4. Start the local app:

```bash
npm run dev
```

Open `/` for the public site and `/admin/login` for admin access.

## Vercel Deployment

Set these environment variables in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_ADMIN_EMAIL`

Then deploy from the latest GitHub commit on `main`. Vercel will build the Next.js app from `app/`; uncommitted local changes will not appear on Vercel until they are committed and pushed.

## Features

- Dynamic site name, logo, contact details, and social links from Supabase.
- Portfolio gallery with categories: Studio, Wedding, Ruracio, Editorial, Lifestyle.
- Logo and gallery uploads to Supabase Storage.
- Client reviews submitted from the home page and approved from admin.
- Services with editable pricing.
- Booking form on the home page with requests visible in admin.
- Admin user management through `site_settings.admin_emails`.
- PWA manifest and service worker assets.

## Troubleshooting

**Admin opens without the right user:** Confirm `/admin` redirects when signed out, and confirm the signed-in email is listed in `site_settings.admin_emails`.

**Uploads fail:** Re-run the storage policy section in `supabase-schema.sql`, and verify the `site-assets` and `portfolios` buckets exist.

**Gallery, services, reviews, or bookings do not save:** Re-run `supabase-schema.sql` so the RLS policies match the app.

**Vercel does not show local fixes:** Commit and push the local changes to GitHub, then check the Vercel preview or production deployment for that commit.
