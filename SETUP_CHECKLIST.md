🎯 YOLO Photography - SETUP CHECKLIST
=====================================

Before going live, complete these steps:

□ 1. UPDATE SUPABASE CREDENTIALS

  In .env.local for local testing:
  - Set NEXT_PUBLIC_SUPABASE_URL to your project URL (no /rest/v1/)
  - Set NEXT_PUBLIC_SUPABASE_ANON_KEY to your anon key
  - Set NEXT_PUBLIC_SUPABASE_ADMIN_EMAIL to the owner's email

  In Vercel Project Settings > Environment Variables:
  - Add the same three NEXT_PUBLIC_* variables

□ 2. CREATE SUPABASE DATABASE

  - Go to your Supabase SQL editor
  - Copy and run all SQL from supabase-schema.sql
  - Verify these tables created:
    * site_settings (1 row with a generated UUID id)
    * galleries (empty, ready for images)
    * services (editable pricing/packages)
    * testimonials (client reviews, draft until approved)
    * bookings (home page booking requests)
    * site_visits (basic analytics)
  - Confirm site_settings.admin_emails includes every allowed admin email

□ 3. CREATE STORAGE BUCKETS

  - Create bucket: site-assets
  - Create bucket: portfolios
  - Set both to public access (the schema also includes storage policies)

□ 4. SEED INITIAL DATA (optional)

  Add a row to site_settings:
  - site_name: "YOLO Photography"
  - primary_color: "#334155"
  - logo_url: null (upload via dashboard later)

□ 5. TEST LOCALLY

  - Run the Next.js app
  - Open / for the public site
  - Open /admin/login and sign in with an email in site_settings.admin_emails
  - Confirm /admin redirects to login when signed out

□ 6. UPLOAD FIRST LOGO (via dashboard)

  - Navigate to dashboard
  - Upload a logo image
  - Verify primary color updates automatically
  - Check that logo appears on landing page

□ 7. UPLOAD FIRST GALLERY IMAGES (via dashboard)

  - Upload at least 1 image with category "Studio"
  - Upload at least 1 image with category "Wedding"
  - Test filters on landing page

□ 8. VERIFY LIVE FEATURES

  - Landing page shows logo and site name from Supabase
  - Hero section displays correctly with CTA buttons
  - Gallery filters work (All, Wedding, Ruracio, Studio, Editorial, Lifestyle)
  - Admin login requires an email listed in site_settings.admin_emails
  - Dashboard shows uploaded images and categories
  - User Management can add/remove admin emails (owner email cannot be removed)
  - Services can be added, deleted, and prices edited
  - Reviews can be submitted from home page and published from admin
  - Booking form saves requests and they appear in Admin > Bookings
  - Primary color is consistent and remains highly readable
  - PWA install prompt works and service worker caches the site

□ 9. VERIFY VERCEL PREVIEW

  - Confirm the latest commit appears in the Vercel preview deployment
  - Open the preview URL and verify the landing page loads
  - Confirm the admin route (/admin) is protected and redirects to login if unauthorized
  - Check browser console for no Supabase or PWA errors

□ 10. DEPLOY (when ready)

  - Push files to GitHub
  - Deploy to Vercel
  - Ensure Supabase environment variables are set in Vercel

□ 11. MONITOR & MAINTAIN

  - Add new gallery images regularly
  - Update logo if rebranding
  - Monitor for any Supabase errors in browser console

---

For detailed instructions, see README.md

Questions? Check the browser console for error messages when testing.
