-- Run this in Supabase SQL Editor before handover.
-- It makes the live database match the admin app expectations and keeps the owner protected.

alter table site_settings
  add column if not exists site_name text default 'YOLO Photography',
  add column if not exists logo_url text,
  add column if not exists primary_color text default '#334155',
  add column if not exists business_location text default 'Voi, Kenya',
  add column if not exists tiktok_link text,
  add column if not exists instagram_link text,
  add column if not exists facebook_link text,
  add column if not exists whatsapp_number text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists google_maps_link text,
  add column if not exists admin_emails text[] default array['davidomari006@gmail.com'],
  add column if not exists updated_at timestamp with time zone default now();

insert into site_settings (site_name, primary_color, business_location, admin_emails)
select 'YOLO Photography', '#334155', 'Voi, Kenya', array['davidomari006@gmail.com']
where not exists (select 1 from site_settings);

update site_settings
set admin_emails = array(
  select distinct email
  from unnest(coalesce(admin_emails, array[]::text[]) || array['davidomari006@gmail.com']) as email
)
where not ('davidomari006@gmail.com' = any(coalesce(admin_emails, array[]::text[])));

update site_settings
set site_name = 'YOLO Photography'
where site_name is null
   or lower(trim(site_name)) in ('my photography', 'yolo photography');

create table if not exists bookings (
  id bigint generated always as identity primary key,
  client_name text not null,
  phone text not null,
  event_date date not null,
  service_type text not null,
  event_location text not null,
  created_at timestamp with time zone default now()
);

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  quote text not null,
  is_published boolean not null default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists galleries (
  id bigint generated always as identity primary key,
  image_url text not null,
  storage_path text not null unique,
  category text not null,
  created_at timestamp with time zone default now()
);

create table if not exists services (
  id bigint generated always as identity primary key,
  service_name text not null,
  description text not null,
  price text,
  icon text default 'Camera',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table site_settings enable row level security;
alter table bookings enable row level security;
alter table testimonials enable row level security;
alter table galleries enable row level security;
alter table services enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.email() = 'davidomari006@gmail.com'
    or exists (
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

drop policy if exists "Anyone can submit bookings" on bookings;
create policy "Anyone can submit bookings" on bookings for insert with check (true);

drop policy if exists "Authenticated admins can read bookings" on bookings;
create policy "Authenticated admins can read bookings" on bookings for select using (public.is_admin());

drop policy if exists "Public can read published testimonials" on testimonials;
create policy "Public can read published testimonials" on testimonials for select using (is_published = true);

drop policy if exists "Anyone can submit testimonial drafts" on testimonials;
create policy "Anyone can submit testimonial drafts" on testimonials for insert with check (is_published = false);

drop policy if exists "Authenticated admins can manage testimonials" on testimonials;
create policy "Authenticated admins can manage testimonials" on testimonials
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

drop policy if exists "Public can read services" on services;
create policy "Public can read services" on services for select using (true);

drop policy if exists "Authenticated admins can manage services" on services;
create policy "Authenticated admins can manage services" on services
  for all
  using (public.is_admin())
  with check (public.is_admin());

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

-- Important handover reminders:
-- 1. Keep Public Insert enabled for bookings and testimonial drafts, or the public forms will fail under RLS.
-- 2. Add SUPABASE_SERVICE_ROLE_KEY to the deployed server environment for inviteUserByEmail().
