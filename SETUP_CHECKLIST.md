🎯 YOLO PHOTOGRAPHY - SETUP CHECKLIST
=====================================

Before going live, complete these steps:

□ 1. UPDATE SUPABASE CREDENTIALS

  In index.html (~line 342):
  - Replace SUPABASE_URL with your project URL
  - Replace SUPABASE_ANON_KEY with your anon key

  In main.js (~line 12):
  - Replace SUPABASE_URL with your project URL
  - Replace SUPABASE_ANON_KEY with your anon key
  - Set ADMIN_EMAIL to the owner's email

□ 2. CREATE SUPABASE DATABASE

  - Go to your Supabase SQL editor
  - Copy and run all SQL from supabase-schema.sql
  - Verify both tables created:
    * site_settings (1 row with a generated UUID id)
    * galleries (empty, ready for images)

□ 3. CREATE STORAGE BUCKETS

  - Create bucket: site-assets
  - Create bucket: portfolios
  - Set both to public access (or configure policies)

□ 4. SEED INITIAL DATA (optional)

  Add a row to site_settings:
  - site_name: "Yolo Photography"
  - primary_color: "#334155"
  - logo_url: null (upload via dashboard later)

□ 5. TEST LOCALLY

  - Open index.html in Live Preview (public site)
  - Run the Next.js app
  - Open /admin (protected admin panel)

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
  - Admin login requires correct owner email
  - Dashboard shows uploaded images and categories
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
