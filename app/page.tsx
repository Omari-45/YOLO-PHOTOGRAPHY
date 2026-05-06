'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { supabase } from '../lib/supabaseClient';

type SiteSettings = {
  site_name?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  theme?: string | null;
  whatsapp_number?: string | null;
  business_location?: string | null;
  email?: string | null;
  phone?: string | null;
};

type GalleryItem = {
  id: number;
  image_url: string;
  category: string;
};

const CATEGORY_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'Wedding', label: 'Wedding (Ceremonies)' },
  { value: 'Ruracio', label: 'Ruracio (Cultural events)' },
  { value: 'Studio', label: 'Studio (Portraits/Product)' },
  { value: 'Editorial', label: 'Editorial (Campaigns)' },
  { value: 'Lifestyle', label: 'Lifestyle (Candid shots)' },
];

const DEFAULT_ACCENT = '#334155';
const DEFAULT_BG = '#f8fafc';
const DEFAULT_SURFACE = '#ffffff';
const DEFAULT_TEXT = '#0f172a';

function rgbToHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

async function averageColorFromImage(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));
      ctx.drawImage(img, 0, 0, 32, 32);
      const data = ctx.getImageData(0, 0, 32, 32).data;
      let red = 0;
      let green = 0;
      let blue = 0;
      let count = 0;

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha < 30) continue;
        red += data[i];
        green += data[i + 1];
        blue += data[i + 2];
        count += 1;
      }

      if (!count) return resolve(DEFAULT_ACCENT);
      const avg: [number, number, number] = [Math.round(red / count), Math.round(green / count), Math.round(blue / count)];
      resolve(rgbToHex(avg));
    };
    img.onerror = reject;
    img.src = src;
  });
}

export default function HomePage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isOffline, setIsOffline] = useState(false);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [settingsResult, galleryResult] = await Promise.all([
        supabase
          .from('site_settings')
          .select('site_name,logo_url,primary_color,theme,whatsapp_number,business_location,email,phone')
          .limit(1)
          .maybeSingle(),
        supabase
          .from('galleries')
          .select('id,image_url,category')
          .order('created_at', { ascending: false })
          .limit(18),
      ]);

      if (!settingsResult.error) {
        setSettings(settingsResult.data || null);
      }

      if (!galleryResult.error) {
        setGalleryItems((galleryResult.data as GalleryItem[]) || []);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (!settings?.logo_url) {
      setAccentColor(settings?.primary_color || DEFAULT_ACCENT);
      return;
    }

    let active = true;
    averageColorFromImage(settings.logo_url)
      .then((color) => {
        if (!active) return;
        setAccentColor(color);
      })
      .catch(() => {
        setAccentColor(settings?.primary_color || DEFAULT_ACCENT);
      });

    return () => {
      active = false;
    };
  }, [settings?.logo_url, settings?.primary_color]);

  useEffect(() => {
    document.documentElement.style.setProperty('--page-accent', accentColor);
  }, [accentColor]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/sw.js')
      .catch(() => {
        // Service worker registration is optional
      });
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
    if (settings?.site_name) {
      document.title = `${settings.site_name} — Professional Photographer`;
    }
  }, [settings?.site_name]);

  const filteredGallery = useMemo(() => {
    if (activeCategory === 'All') return galleryItems;
    return galleryItems.filter((item) => item.category === activeCategory);
  }, [activeCategory, galleryItems]);

  const brandName = settings?.site_name || 'Yolo Photography';
  const logoUrl = settings?.logo_url;
  const heroSubtitle = settings?.business_location ? `Based in ${settings.business_location}` : 'Premium photography for weddings, studio, and editorial clients.';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950" style={{ '--accent': accentColor } as CSSProperties}>
      <section className="relative overflow-hidden px-6 py-20 lg:px-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(51,65,85,0.12),_transparent_40%)]" />
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-sm">
                  {logoUrl ? <img src={logoUrl} alt={`${brandName} logo`} className="h-10 w-auto object-contain" /> : <span className="text-lg font-semibold">Y</span>}
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-500">{brandName}</p>
                  <p className="text-lg font-semibold text-slate-900">Photography studio</p>
                </div>
              </div>

              <div className="max-w-3xl space-y-6">
                <h1 className="text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">Premium photography for weddings, editorial campaigns, and modern studio work.</h1>
                <p className="text-lg leading-8 text-slate-600">{heroSubtitle}</p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <a href="#portfolio" className="inline-flex items-center justify-center rounded-full bg-slate-950 px-8 py-4 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Explore Portfolio
                </a>
                <a href="mailto:hello@yolophotography.com" className="inline-flex items-center justify-center rounded-full border border-slate-900 px-8 py-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                  Contact Studio
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
                <span className="rounded-full bg-slate-100 px-3 py-2">{settings?.email ?? 'Email available after setup'}</span>
                <span className="rounded-full bg-slate-100 px-3 py-2">{settings?.phone ?? 'Phone available after setup'}</span>
                <span className={`rounded-full px-3 py-2 ${isOffline ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {isOffline ? 'Offline mode' : 'Connected' }
                </span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-4 shadow-soft">
              <div className="aspect-[4/5] overflow-hidden rounded-[28px] bg-slate-950">
                {logoUrl ? (
                  <img src={logoUrl} alt="Brand logo" className="h-full w-full object-contain object-center opacity-90" />
                ) : (
                  <div className="grid h-full place-items-center bg-slate-950 text-white">
                    <p className="text-xl font-semibold">Your logo</p>
                  </div>
                )}
              </div>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <p>Dynamic branding loads from Supabase site settings.</p>
                <p>Logo uploads and site name sync automatically with the admin dashboard.</p>
              </div>
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
            <p className="max-w-xl text-sm leading-7 text-slate-600">Filter the gallery by event type and discover your next photography style.</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {CATEGORY_OPTIONS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setActiveCategory(item.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeCategory === item.value ? 'bg-slate-950 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 h-56 rounded-[24px] bg-slate-200" />
                  <div className="h-4 w-3/4 rounded-full bg-slate-200" />
                  <div className="mt-3 h-3 w-1/2 rounded-full bg-slate-200" />
                </div>
              ))
            ) : filteredGallery.length ? (
              filteredGallery.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1">
                  <div className="relative h-72 bg-slate-100">
                    <img src={item.image_url} alt={item.category} className="h-full w-full object-cover" />
                    <span className="absolute left-4 top-4 rounded-full bg-slate-950/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">{item.category}</span>
                  </div>
                  <div className="space-y-3 p-6">
                    <h3 className="text-xl font-semibold text-slate-950">{item.category}</h3>
                    <p className="text-sm leading-6 text-slate-600">{item.category === 'Wedding' ? 'Ceremonial photography with cinematic clarity.' : item.category === 'Studio' ? 'Studio portraits, product, and creative set design.' : item.category === 'Ruracio' ? 'Cultural event storytelling with colour and emotion.' : item.category === 'Editorial' ? 'Campaign imagery designed for modern brands.' : 'Lifestyle stories captured naturally on location.'}</p>
                  </div>
                </article>
              ))
            ) : (
              <div className="col-span-full rounded-[28px] border border-dashed border-slate-300 bg-white/80 p-12 text-center text-slate-600 shadow-sm">
                <p className="text-lg font-semibold">No images are available yet.</p>
                <p className="mt-3 max-w-xl mx-auto text-sm leading-7">Upload your portfolio from the admin dashboard, then refresh to see the gallery here.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-slate-200 bg-white p-10 shadow-soft">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-600">Supportive branding</p>
              <h2 className="mt-4 text-4xl font-semibold text-slate-950">Minimal styling that keeps attention on your work.</h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600">The site adapts brand visuals from Supabase, while preserving strong contrast and clean readability across the entire experience.</p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-8">
              <div className="mb-6 flex items-center gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">A</span>
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Theme</p>
                  <p className="font-semibold text-slate-950">Professional and balanced</p>
                </div>
              </div>
              <div className="grid gap-4 text-sm text-slate-600">
                <p>Dynamic accent color from logo or brand settings</p>
                <p>Responsive columns and mobile-first gallery layout</p>
                <p>Fast load with offline-ready service worker and manifest</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
