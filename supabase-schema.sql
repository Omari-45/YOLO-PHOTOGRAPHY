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

alter table site_settings
  add column if not exists site_name text default 'Yolo Photography',
  add column if not exists logo_url text,
  add column if not exists primary_color text default '#334155',
  add column if not exists business_location text default 'Voi, Kenya',
  add column if not exists tiktok_link text,
  add column if not exists instagram_link text,
  add column if not exists facebook_link text,
  add column if not exists whatsapp_number text,
  add column if not exists day_message text default 'Good day! How can I help you?',
  add column if not exists night_message text default 'Good evening! How can I assist?',
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists google_maps_link text,
  add column if not exists theme text default 'light',
  add column if not exists admin_emails text[] default array['davidomari006@gmail.com'],
  add column if not exists updated_at timestamp with time zone default now();

update site_settings
set admin_emails = array['davidomari006@gmail.com']
where admin_emails is null or array_length(admin_emails, 1) is null;

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

-- Keep public reads open for the website and allow admins to write/manage content
-- with the anon key used by this client-side build. If you later move admin
-- mutations behind server functions, tighten these policies accordingly.
alter table site_settings enable row level security;
alter table services enable row level security;
alter table galleries enable row level security;
alter table testimonials enable row level security;
alter table bookings enable row level security;
alter table site_visits enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.site_settings
    where auth.email() = any(admin_emails)
  );
$$;

drop policy if exists "Public can read site settings" on site_settings;
create policy "Public can read site settings" on site_settings for select using (true);

drop policy if exists "Authenticated admins can update site settings" on site_settings;
create policy "Authenticated admins can update site settings" on site_settings
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Public can read services" on services;
create policy "Public can read services" on services for select using (true);

drop policy if exists "Authenticated admins can manage services" on services;
create policy "Authenticated admins can manage services" on services
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Public can read galleries" on galleries;
create policy "Public can read galleries" on galleries for select using (true);

drop policy if exists "Authenticated admins can manage galleries" on galleries;
create policy "Authenticated admins can manage galleries" on galleries
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Public can read published testimonials" on testimonials;
create policy "Public can read published testimonials" on testimonials for select using (is_published = true);

drop policy if exists "Anyone can submit testimonial drafts" on testimonials;
create policy "Anyone can submit testimonial drafts" on testimonials
  for insert
  with check (is_published = false);

drop policy if exists "Authenticated admins can manage testimonials" on testimonials;
create policy "Authenticated admins can manage testimonials" on testimonials
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Anyone can submit bookings" on bookings;
create policy "Anyone can submit bookings" on bookings for insert with check (true);

drop policy if exists "Authenticated admins can read bookings" on bookings;
create policy "Authenticated admins can read bookings" on bookings for select using (public.is_admin());

drop policy if exists "Anyone can track visits" on site_visits;
create policy "Anyone can track visits" on site_visits for insert with check (true);

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true), ('portfolios', 'portfolios', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read site asset files" on storage.objects;
create policy "Public can read site asset files" on storage.objects
  for select using (bucket_id in ('site-assets', 'portfolios'));

drop policy if exists "Authenticated admins can manage site asset files" on storage.objects;
create policy "Authenticated admins can manage site asset files" on storage.objects
  for all
  using (public.is_admin() and bucket_id in ('site-assets', 'portfolios'))
  with check (public.is_admin() and bucket_id in ('site-assets', 'portfolios'));

-- Notes:
-- 1. Create Supabase Storage buckets: site-assets and portfolios.
-- 2. Enable public or authenticated access for these buckets depending on your security policy.
-- 3. Use the admin dashboard to upload logo and portfolio images.
-- 4. Recommended categories: Studio, Wedding, Ruracio, Editorial, Lifestyle.
-- 5. Analytics table tracks visits for dashboard metrics.
-- 6. Bookings table stores client inquiries from the landing page form.
-- 7. Testimonials default to draft unless explicitly published by an admin.
