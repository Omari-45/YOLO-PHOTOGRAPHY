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

  - Landing page shows logo
  - Hero section displays correctly
  - Gallery filters work (All, Wedding, Ruracio, Studio)
  - Admin login requires correct email
  - Dashboard shows uploaded images
  - Primary color is consistent everywhere

□ 9. DEPLOY (when ready)

  - Push files to GitHub
  - Deploy to Vercel, Netlify, or your hosting
  - Ensure Supabase is accessible from your domain

□ 10. MONITOR & MAINTAIN

  - Add new gallery images regularly
  - Update logo if rebranding
  - Monitor for any Supabase errors in browser console

---

For detailed instructions, see README.md

Questions? Check the browser console for error messages when testing.
