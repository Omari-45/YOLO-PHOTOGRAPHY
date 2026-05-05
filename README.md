# Yolo Photography

A premium, high-conversion photography portfolio website built with modern JavaScript, Tailwind CSS (CDN), and Supabase integration.

## 📋 What is included

- **index.html** — High-conversion landing page with hero, dynamic gallery, and services section
- **/admin** — Protected Next.js admin dashboard for branding, gallery, and testimonials
- **main.js** — Modern ES6 JavaScript with Supabase CDN integration
- **styles/site.css** — Premium minimalist styling

## 🚀 Quick Start

### 1. Update Supabase Credentials

In both **index.html** (line ~342) and **main.js** (line ~12), replace:

```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-public-anon-key';
const ADMIN_EMAIL = 'owner@example.com';  // (main.js only)
```

### 2. Create Supabase Tables & Buckets

1. Run the SQL from `supabase-schema.sql` in your Supabase SQL editor
2. Create two Storage buckets:
   - `site-assets` (for logo uploads)
   - `portfolios` (for gallery images)
3. Set both buckets to public access or use policies based on your needs

### 3. Preview in VS Code

- Open `index.html` in Live Preview
- Run the Next.js app and open `/admin` for the protected admin dashboard

**No Node.js required!** Everything runs via CDN.

## 📄 File Structure

```
YOLO PHOTOGRAPHER/
├── index.html              # Public landing page
├── app/admin/page.tsx      # Protected admin panel
├── app/admin/login/page.tsx # Admin login page
├── main.js                 # Core ES6 logic (Supabase integration)
├── styles/
│   └── site.css            # Styling for admin dashboard
├── supabase-schema.sql     # Database schema
├── README.md               # This file
└── [deprecated: app/, lib/, next.config.mjs, etc.]
```

## 🎨 Features

### Landing Page (index.html)
- Dynamic branding from `site_settings` table
- Logo and primary color fetch from Supabase
- Full-width hero section with CTA
- Portfolio gallery with category filters (All, Wedding, Ruracio, Studio)
- Responsive grid (3 columns desktop, 1 column mobile)
- Service showcase with pricing
- Contact section
- Graceful empty states for missing images

### Admin Dashboard (/admin)
- Secure Supabase Auth login
- Logo upload to Supabase Storage
- Automatic primary color extraction from logo
- Portfolio media manager with drag-and-drop
- Gallery preview and delete functionality
- Real-time theme updates

## 🔐 Security

- Owner-only admin access via email verification
- Supabase Auth handles password security
- Storage bucket access controlled via Supabase policies
- Session validation on dashboard load

## 🎯 Recommended Categories

When uploading media, use these category tags:
- **Studio** — Portrait and product photography
- **Wedding** — Ceremonies and receptions
- **Ruracio** — Cultural celebration events
- **Editorial** — Magazine and campaign work
- **Lifestyle** — Candid and lifestyle shots

## 💡 Tips

- **Logo Best Practices**: Use PNG with transparency for best results. Primary color is auto-extracted.
- **Gallery Management**: Delete old images when adding seasonal collections.
- **Mobile Optimization**: The landing page is fully responsive.
- **Custom Domain**: Deploy to Vercel, Netlify, or any static host.

## 🛠 Troubleshooting

**"Supabase credentials must be updated"**: Open `index.html` and `main.js`, then set your credentials.

**Empty gallery**: Make sure you've uploaded images to the `galleries` table with a valid `storage_path` pointing to `portfolios` bucket files.

**Logo not showing**: Verify the logo file exists in the `site-assets` bucket and the `logo_url` is correctly saved in `site_settings`.

---

Built with 💛 for premium photography studios.
