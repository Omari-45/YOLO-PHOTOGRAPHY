'use client';

import { FormEvent, useEffect, useMemo, useState, type CSSProperties, type SVGProps } from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

type SiteSettings = {
  site_name?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  whatsapp_number?: string | null;
  business_location?: string | null;
  email?: string | null;
  phone?: string | null;
  facebook_link?: string | null;
  instagram_link?: string | null;
  tiktok_link?: string | null;
};

type GalleryItem = {
  id: number;
  image_url: string;
  category: string;
};

type Service = {
  id: number;
  service_name: string;
  description: string;
  price: string | null;
  icon: string | null;
};

type Testimonial = {
  id: string;
  client_name: string;
  client_role: string | null;
  quote: string;
};

const CATEGORY_OPTIONS = ['All', 'Wedding', 'Ruracio', 'Studio', 'Editorial', 'Lifestyle'];
const DEFAULT_ACCENT = '#334155';

const fallbackServices: Service[] = [
  { id: -1, service_name: 'Wedding Photography', description: 'Full-day ceremony coverage with edited digital delivery.', price: 'From KSh 45,000', icon: 'Wedding' },
  { id: -2, service_name: 'Studio Portraits', description: 'Clean portraits for families, teams, founders, and creatives.', price: 'From KSh 8,000', icon: 'Studio' },
  { id: -3, service_name: 'Ruracio Coverage', description: 'Cultural event storytelling with detail, family, and emotion.', price: 'From KSh 35,000', icon: 'Event' },
];

function escapePhone(phone: string) {
  return phone.replace(/[^\d+]/g, '');
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2h-3a4 4 0 0 0-4 4v3H8v4h3v8h4v-8h3l1-4h-4V6a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 11.37 7 4 4 0 0 1 16 11.37z" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

function TiktokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13 2v8a4 4 0 1 0 4 4V6h3" />
      <path d="M14 22a4 4 0 1 1 0-8" />
    </svg>
  );
}

export default function HomePage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isOffline, setIsOffline] = useState(false);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [loading, setLoading] = useState(true);
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingSaving, setBookingSaving] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [settingsResult, galleryResult, servicesResult, testimonialsResult] = await Promise.all([
        supabase
          .from('site_settings')
          .select('site_name,logo_url,primary_color,whatsapp_number,business_location,email,phone,facebook_link,instagram_link,tiktok_link')
          .limit(1)
          .maybeSingle(),
        supabase.from('galleries').select('id,image_url,category').order('created_at', { ascending: false }).limit(18),
        supabase.from('services').select('id,service_name,description,price,icon').order('created_at', { ascending: false }),
        supabase.from('testimonials').select('id,client_name,client_role,quote').eq('is_published', true).order('created_at', { ascending: false }).limit(6),
      ]);

      if (!settingsResult.error) setSettings(settingsResult.data || null);
      if (!galleryResult.error) setGalleryItems((galleryResult.data as GalleryItem[]) || []);
      if (!servicesResult.error) setServices((servicesResult.data as Service[]) || []);
      if (!testimonialsResult.error) setTestimonials((testimonialsResult.data as Testimonial[]) || []);
      setLoading(false);
    }

    fetchData();
  }, []);

  useEffect(() => {
    setAccentColor(settings?.primary_color || DEFAULT_ACCENT);
  }, [settings?.primary_color]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (settings?.site_name) document.title = `${settings.site_name} - Professional Photographer`;
  }, [settings?.site_name]);

  const filteredGallery = useMemo(() => {
    if (activeCategory === 'All') return galleryItems;
    return galleryItems.filter((item) => item.category === activeCategory);
  }, [activeCategory, galleryItems]);

  const brandName = settings?.site_name || 'Yolo Photography';
  const logoUrl = settings?.logo_url;
  const visibleServices = services.length ? services : fallbackServices;
  const whatsappHref = settings?.whatsapp_number
    ? `https://wa.me/${escapePhone(settings.whatsapp_number)}?text=${encodeURIComponent(`Hi ${brandName}, I would like to book a photography session.`)}`
    : '#booking';

  async function handleBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookingSaving(true);
    setBookingMessage('');
    const form = new FormData(event.currentTarget);
    const { error } = await supabase.from('bookings').insert([{
      client_name: String(form.get('client_name') || '').trim(),
      phone: String(form.get('phone') || '').trim(),
      event_date: String(form.get('event_date') || ''),
      service_type: String(form.get('service_type') || '').trim(),
      event_location: String(form.get('event_location') || '').trim(),
    }]);

    setBookingSaving(false);
    if (error) {
      setBookingMessage(error.message);
      return;
    }

    event.currentTarget.reset();
    setBookingMessage('Booking request sent. We will contact you shortly.');
  }

  async function handleReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReviewSaving(true);
    setReviewMessage('');
    const form = new FormData(event.currentTarget);
    const { error } = await supabase.from('testimonials').insert([{
      client_name: String(form.get('client_name') || '').trim(),
      client_role: String(form.get('client_role') || '').trim() || null,
      quote: String(form.get('quote') || '').trim(),
      is_published: false,
    }]);

    setReviewSaving(false);
    if (error) {
      setReviewMessage(error.message);
      return;
    }

    event.currentTarget.reset();
    setReviewMessage('Thank you. Your review will appear after approval.');
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950" style={{ '--accent': accentColor } as CSSProperties}>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 px-6 backdrop-blur lg:px-12">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6">
          <a href="#" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white">
              {logoUrl ? <img src={logoUrl} alt={`${brandName} logo`} className="h-8 w-auto object-contain" /> : 'Y'}
            </span>
            <span className="font-semibold text-slate-950">{brandName}</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
            <a href="#portfolio" className="hover:text-slate-950">Portfolio</a>
            <a href="#services" className="hover:text-slate-950">Services</a>
            <a href="#reviews" className="hover:text-slate-950">Reviews</a>
            <a href="#booking" className="hover:text-slate-950">Booking</a>
            <a href="/admin" className="hover:text-slate-950">Admin</a>
          </nav>
        </div>
      </header>

      <section className="px-6 py-20 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-8">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">{settings?.business_location || 'Voi, Kenya'}</p>
            <h1 className="text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">Photography for weddings, studio portraits, events, and brand stories.</h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">Book a polished session, browse live packages, and share reviews directly from the site.</p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <a href="#booking" className="inline-flex justify-center rounded-full bg-slate-950 px-8 py-4 text-sm font-semibold text-white hover:bg-slate-800">Book a Session</a>
              <a href="#portfolio" className="inline-flex justify-center rounded-full border border-slate-900 px-8 py-4 text-sm font-semibold text-slate-950 hover:bg-white">View Portfolio</a>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-700">
              <span className="rounded-full bg-white px-3 py-2 shadow-sm">{settings?.email || 'Email after setup'}</span>
              <span className="rounded-full bg-white px-3 py-2 shadow-sm">{settings?.phone || 'Phone after setup'}</span>
              <span className={`rounded-full px-3 py-2 shadow-sm ${isOffline ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{isOffline ? 'Offline mode' : 'Connected'}</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="aspect-[4/5] bg-slate-900">
              {filteredGallery[0] ? <img src={filteredGallery[0].image_url} alt={filteredGallery[0].category} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center p-8 text-center text-white">{logoUrl ? <img src={logoUrl} alt="" className="max-h-48 object-contain" /> : 'Upload portfolio images from admin'}</div>}
            </div>
          </div>
        </div>
      </section>

      <section id="portfolio" className="border-t border-slate-200 px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-600">Portfolio</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Explore work by category</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {CATEGORY_OPTIONS.map((category) => (
                <button key={category} type="button" onClick={() => setActiveCategory(category)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeCategory === category ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'}`}>
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-[24px] bg-slate-200" />) : filteredGallery.length ? filteredGallery.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                <div className="relative h-72 bg-slate-100">
                  <img src={item.image_url} alt={item.category} className="h-full w-full object-cover" />
                  {logoUrl ? <img src={logoUrl} alt="" className="pointer-events-none absolute bottom-4 right-4 max-h-12 max-w-28 object-contain opacity-60" /> : null}
                </div>
                <div className="p-5">
                  <p className="text-sm font-semibold text-slate-500">{item.category}</p>
                </div>
              </article>
            )) : <p className="col-span-full rounded-[24px] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">No images yet. Upload your first gallery image from admin.</p>}
          </div>
        </div>
      </section>

      <section id="services" className="bg-white px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-600">Services</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Packages and pricing</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {visibleServices.map((service) => (
              <article key={service.id} className="rounded-2xl border border-slate-200 p-6">
                <p className="text-sm font-semibold text-slate-500">{service.icon || 'Photography'}</p>
                <h3 className="mt-4 text-xl font-semibold text-slate-950">{service.service_name}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{service.description}</p>
                <p className="mt-6 text-sm font-bold text-slate-950">{service.price || 'Price on request'}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="reviews" className="px-6 py-20 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-600">Reviews</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Client testimonials</h2>
            <div className="mt-8 grid gap-4">
              {testimonials.length ? testimonials.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm leading-7 text-slate-700">&ldquo;{item.quote}&rdquo;</p>
                  <p className="mt-4 font-semibold text-slate-950">{item.client_name}</p>
                  <p className="text-sm text-slate-500">{item.client_role || 'Client'}</p>
                </article>
              )) : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">No published reviews yet.</p>}
            </div>
          </div>

          <form onSubmit={handleReview} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-950">Add a review</h3>
            <input name="client_name" required placeholder="Full name" className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" />
            <input name="client_role" placeholder="Session type, optional" className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" />
            <textarea name="quote" required rows={5} placeholder="Your testimonial" className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" />
            {reviewMessage ? <p className="mt-3 text-sm text-slate-600">{reviewMessage}</p> : null}
            <button disabled={reviewSaving} className="mt-5 w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{reviewSaving ? 'Sending...' : 'Submit review'}</button>
          </form>
        </div>
      </section>

      <section id="booking" className="bg-slate-900 px-6 py-20 text-white lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Booking</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Book from the home page</h2>
            <p className="mt-5 text-sm leading-7 text-slate-300">Client requests save to Supabase and appear in the admin Bookings tab.</p>
            <a href={whatsappHref} className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950">WhatsApp</a>
          </div>
          <form onSubmit={handleBooking} className="grid gap-4 rounded-2xl border border-white/10 bg-white p-6 text-slate-950 shadow-sm sm:grid-cols-2">
            <input name="client_name" required placeholder="Full name" className="rounded-xl border border-slate-300 px-4 py-3 text-sm" />
            <input name="phone" required placeholder="Phone number" className="rounded-xl border border-slate-300 px-4 py-3 text-sm" />
            <input name="event_date" required type="date" className="rounded-xl border border-slate-300 px-4 py-3 text-sm" />
            <select name="service_type" required className="rounded-xl border border-slate-300 px-4 py-3 text-sm">
              <option value="">Select service</option>
              {visibleServices.map((service) => <option key={service.id} value={service.service_name}>{service.service_name}</option>)}
            </select>
            <input name="event_location" required placeholder="Event location" className="rounded-xl border border-slate-300 px-4 py-3 text-sm sm:col-span-2" />
            {bookingMessage ? <p className="text-sm text-slate-200 sm:col-span-2">{bookingMessage}</p> : null}
            <button disabled={bookingSaving} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2">{bookingSaving ? 'Sending...' : 'Send booking request'}</button>
          </form>
        </div>
      </section>

      <section id="contact" className="bg-slate-950 px-6 py-16 text-slate-100 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Contact Us</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Reach out on socials, phone, or email</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-4 text-slate-200">
                <Phone className="h-6 w-6 text-[#d3b16e]" />
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Phone</p>
                  {settings?.phone ? (
                    <a href={`tel:${escapePhone(settings.phone)}`} className="mt-1 block text-lg font-semibold text-white hover:text-[#d3b16e]">{settings.phone}</a>
                  ) : (
                    <p className="mt-1 text-lg font-semibold text-white">Available after setup</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center gap-4 text-slate-200">
                <MessageCircle className="h-6 w-6 text-[#d3b16e]" />
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Email</p>
                  {settings?.email ? (
                    <a href={`mailto:${settings.email}`} className="mt-1 block text-lg font-semibold text-white hover:text-[#d3b16e]">{settings.email}</a>
                  ) : (
                    <p className="mt-1 text-lg font-semibold text-white">Available after setup</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-sm sm:p-6">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Socials</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {settings?.facebook_link ? (
                  <a href={settings.facebook_link} target="_blank" rel="noreferrer" className="group inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-3xl border border-white/10 bg-slate-950 p-3 text-slate-200 transition hover:border-[#d3b16e] hover:text-[#d3b16e]">
                    <FacebookIcon className="h-5 w-5" />
                    <span className="sr-only">Facebook</span>
                  </a>
                ) : null}
                {settings?.tiktok_link ? (
                  <a href={settings.tiktok_link} target="_blank" rel="noreferrer" className="group inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-3xl border border-white/10 bg-slate-950 p-3 text-slate-200 transition hover:border-[#d3b16e] hover:text-[#d3b16e]">
                    <TiktokIcon className="h-5 w-5" />
                    <span className="sr-only">TikTok</span>
                  </a>
                ) : null}
                {settings?.instagram_link ? (
                  <a href={settings.instagram_link} target="_blank" rel="noreferrer" className="group inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-3xl border border-white/10 bg-slate-950 p-3 text-slate-200 transition hover:border-[#d3b16e] hover:text-[#d3b16e]">
                    <InstagramIcon className="h-5 w-5" />
                    <span className="sr-only">Instagram</span>
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 px-6 py-10 text-slate-400 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-6 text-center text-sm sm:text-base md:grid-cols-[1fr_auto_1fr] md:items-center md:text-left">
          <div className="flex flex-col items-center gap-3 md:items-start">
            <div className="flex items-center justify-center gap-3 md:justify-start">
              {settings?.facebook_link ? (
                <a href={settings.facebook_link} target="_blank" rel="noreferrer" className="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 text-slate-200 transition hover:border-[#d3b16e] hover:text-[#d3b16e]">
                  <FacebookIcon className="h-5 w-5" />
                  <span className="sr-only">Facebook</span>
                </a>
              ) : null}
              {settings?.tiktok_link ? (
                <a href={settings.tiktok_link} target="_blank" rel="noreferrer" className="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 text-slate-200 transition hover:border-[#d3b16e] hover:text-[#d3b16e]">
                  <TiktokIcon className="h-5 w-5" />
                  <span className="sr-only">TikTok</span>
                </a>
              ) : null}
              {settings?.instagram_link ? (
                <a href={settings.instagram_link} target="_blank" rel="noreferrer" className="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 text-slate-200 transition hover:border-[#d3b16e] hover:text-[#d3b16e]">
                  <InstagramIcon className="h-5 w-5" />
                  <span className="sr-only">Instagram</span>
                </a>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 md:items-center">
            <p className="text-sm text-slate-400">© 2026 YOLO Photography. All rights reserved.</p>
            <a href="https://destinecreation.com" target="_blank" rel="noreferrer" className="text-sm font-semibold text-slate-200 transition hover:text-[#d3b16e]">Powered by Destine Creation</a>
          </div>

          <div className="flex flex-col items-center gap-3 md:items-end">
            <a href="#booking" className="inline-flex justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#d3b16e]">
              Book a Session
            </a>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Stay connected</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {settings?.facebook_link ? (
                <a href={settings.facebook_link} target="_blank" rel="noreferrer" className="text-slate-300 transition hover:text-[#d3b16e]">Facebook</a>
              ) : null}
              {settings?.instagram_link ? (
                <a href={settings.instagram_link} target="_blank" rel="noreferrer" className="text-slate-300 transition hover:text-[#d3b16e]">Instagram</a>
              ) : null}
              {settings?.tiktok_link ? (
                <a href={settings.tiktok_link} target="_blank" rel="noreferrer" className="text-slate-300 transition hover:text-[#d3b16e]">TikTok</a>
              ) : null}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
