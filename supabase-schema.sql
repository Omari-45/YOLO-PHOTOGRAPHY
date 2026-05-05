-- Supabase schema for Yolo Photography admin features

-- Create a table for site-level settings, including logo URL, site name, theme color, and location.
create table if not exists site_settings (
  id uuid primary key default gen_random_uuid(),
  site_name text default 'Yolo Photography',
  logo_url text,
  primary_color text default '#334155',
  business_location text default 'Voi, Kenya',
  tiktok_link text,
  instagram_link text,
  facebook_link text,
  whatsapp_number text,
  day_message text default 'Good day! How can I help you?',
  night_message text default 'Good evening! How can I assist?',
  phone text,
  email text,
  google_maps_link text,
  theme text default 'light',
  admin_emails text[] default array['davidomari006@gmail.com'],
  updated_at timestamp with time zone default now()
);

insert into site_settings (site_name, primary_color, business_location)
select 'Yolo Photography', '#334155', 'Voi, Kenya'
where not exists (select 1 from site_settings);

-- Create a table for services offered.
create table if not exists services (
  id bigint generated always as identity primary key,
  service_name text not null,
  description text not null,
  price text,
  icon text default 'Camera',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create a table for gallery media items.
create table if not exists galleries (
  id bigint generated always as identity primary key,
  image_url text not null,
  storage_path text not null unique,
  category text not null,
  created_at timestamp with time zone default now()
);

alter table galleries
  add column if not exists storage_path text;

create unique index if not exists galleries_storage_path_key on galleries (storage_path);

-- Create a table for testimonial review workflow.
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_role text,
  quote text not null,
  is_published boolean not null default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

insert into testimonials (client_name, client_role, quote, is_published)
select 'Amina Wanjala', 'Wedding Client', 'Yolo Photography captured our Voi wedding with warmth, patience, and beautiful attention to every small detail.', true
where not exists (select 1 from testimonials);

insert into testimonials (client_name, client_role, quote, is_published)
select 'Brian Mutiso', 'Business Owner', 'The portraits were clean, modern, and ready for our brand launch. The whole session felt professional from start to finish.', true
where (select count(*) from testimonials) < 2;

insert into testimonials (client_name, client_role, quote, is_published)
select 'Mercy Kadzo', 'Family Session', 'Our family photos looked natural and timeless. The gallery delivery was fast and easy to share.', true
where (select count(*) from testimonials) < 3;

-- Create a table for website visits analytics.
create table if not exists site_visits (
  id bigint generated always as identity primary key,
  visitor_ip text,
  user_agent text,
  page_url text,
  referrer text,
  visited_at timestamp with time zone default now()
);

-- Create a table for booking inquiries.
create table if not exists bookings (
  id bigint generated always as identity primary key,
  client_name text not null,
  phone text not null,
  event_date date not null,
  service_type text not null,
  event_location text not null,
  created_at timestamp with time zone default now()
);

-- Notes:
-- 1. Create Supabase Storage buckets: site-assets and portfolios.
-- 2. Enable public or authenticated access for these buckets depending on your security policy.
-- 3. Use the admin dashboard to upload logo and portfolio images.
-- 4. Recommended categories: Studio, Wedding, Ruracio, Editorial, Lifestyle.
-- 5. Analytics table tracks visits for dashboard metrics.
-- 6. Bookings table stores client inquiries from the landing page form.
-- 7. Testimonials default to draft unless explicitly published by an admin.
