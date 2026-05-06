'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

const adminEmail = process.env.NEXT_PUBLIC_SUPABASE_ADMIN_EMAIL;
const logoBucket = 'site-assets';
const galleryBucket = 'portfolios';
const brandAccentColor = '#334155';
const categories = ['Studio', 'Wedding', 'Ruracio', 'Editorial', 'Lifestyle'];

type AdminSection = 'branding' | 'gallery' | 'testimonials';

type SiteSettings = {
  id?: string;
  logo_url?: string | null;
  site_name?: string | null;
};

type GalleryItem = {
  id: number;
  image_url: string;
  storage_path: string;
  category: string;
  created_at: string;
};

type Testimonial = {
  id: string;
  client_name: string;
  client_role: string | null;
  quote: string;
  is_published: boolean;
  created_at: string;
};

type MessageState = {
  type: 'idle' | 'success' | 'error';
  text: string;
};

const sectionItems: Array<{ id: AdminSection; label: string; description: string }> = [
  { id: 'branding', label: 'Branding', description: 'Logo and site identity' },
  { id: 'gallery', label: 'Gallery', description: 'Watermarked portfolio media' },
  { id: 'testimonials', label: 'Testimonials', description: 'Draft to live reviews' },
];

function buildStoragePath(folder: string, file: File) {
  const cleanName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${folder}/${crypto.randomUUID()}-${cleanName || 'upload'}`;
}

async function fetchSiteSettings(columns = '*') {
  const { data, error } = await supabase
    .from('site_settings')
    .select(columns)
    .limit(1)
    .maybeSingle();

  return { data: data as SiteSettings | null, error };
}

async function saveSiteSettings(updates: Partial<SiteSettings>) {
  const { data: currentSettings, error: fetchError } = await fetchSiteSettings('id');
  if (fetchError) return { error: fetchError };

  if (currentSettings?.id) {
    return supabase
      .from('site_settings')
      .update(updates)
      .eq('id', currentSettings.id);
  }

  return supabase
    .from('site_settings')
    .insert([updates]);
}

export default function AdminPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
  const [activeSection, setActiveSection] = useState<AdminSection>('branding');

  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoMessage, setLogoMessage] = useState<MessageState>({ type: 'idle', text: '' });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryPreview, setGalleryPreview] = useState('');
  const [galleryCategory, setGalleryCategory] = useState(categories[0]);
  const [galleryMessage, setGalleryMessage] = useState<MessageState>({ type: 'idle', text: '' });
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [deletingGalleryId, setDeletingGalleryId] = useState<number | null>(null);

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialName, setTestimonialName] = useState('');
  const [testimonialRole, setTestimonialRole] = useState('');
  const [testimonialQuote, setTestimonialQuote] = useState('');
  const [testimonialMessage, setTestimonialMessage] = useState<MessageState>({ type: 'idle', text: '' });
  const [savingTestimonial, setSavingTestimonial] = useState(false);
  const [busyTestimonialId, setBusyTestimonialId] = useState<string | null>(null);

  const pageStyle = useMemo(
    () => ({ '--theme-accent': brandAccentColor } as CSSProperties),
    []
  );

  useEffect(() => {
    async function checkAccess() {
      const { data } = await supabase.auth.getSession();

      if (data.session?.user?.email === adminEmail) {
        setStatus('authorized');
        await Promise.all([loadSettings(), loadGallery(), loadTestimonials()]);
        return;
      }

      setStatus('unauthorized');
      router.replace('/admin/login');
    }

    checkAccess();
  }, [router]);

  useEffect(() => {
    let previewUrl: string | null = null;
    if (logoFile) {
      previewUrl = URL.createObjectURL(logoFile);
      setLogoPreview(previewUrl);
    } else {
      setLogoPreview('');
    }

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [logoFile]);

  useEffect(() => {
    let previewUrl: string | null = null;
    if (galleryFile) {
      previewUrl = URL.createObjectURL(galleryFile);
      setGalleryPreview(previewUrl);
    } else {
      setGalleryPreview('');
    }

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [galleryFile]);

  async function loadSettings() {
    const { data } = await fetchSiteSettings('id,logo_url,site_name');
    if (data?.logo_url) setLogoUrl(data.logo_url);
  }

  async function loadGallery() {
    const { data, error } = await supabase
      .from('galleries')
      .select('id,image_url,storage_path,category,created_at')
      .order('created_at', { ascending: false });

    if (!error) setGalleryItems((data as GalleryItem[]) || []);
  }

  async function loadTestimonials() {
    const { data, error } = await supabase
      .from('testimonials')
      .select('id,client_name,client_role,quote,is_published,created_at')
      .order('created_at', { ascending: false });

    if (!error) setTestimonials((data as Testimonial[]) || []);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  }

  async function handleLogoUpload() {
    if (!logoFile) {
      setLogoMessage({ type: 'error', text: 'Choose a logo file first.' });
      return;
    }

    setUploadingLogo(true);
    setLogoMessage({ type: 'idle', text: '' });

    try {
      const logoPath = buildStoragePath('logos', logoFile);
      const { error: uploadError } = await supabase.storage.from(logoBucket).upload(logoPath, logoFile, {
        cacheControl: '31536000',
        upsert: true,
      });

      if (uploadError) {
        setLogoMessage({ type: 'error', text: uploadError.message });
        return;
      }

      const { data: publicUrlData } = supabase.storage.from(logoBucket).getPublicUrl(logoPath);
      if (!publicUrlData.publicUrl) {
        setLogoMessage({ type: 'error', text: 'Unable to create a public logo URL.' });
        return;
      }

      const { error: settingsError } = await saveSiteSettings({ logo_url: publicUrlData.publicUrl });
      if (settingsError) {
        setLogoMessage({ type: 'error', text: settingsError.message });
        return;
      }

      setLogoUrl(publicUrlData.publicUrl);
      setLogoFile(null);
      setLogoMessage({ type: 'success', text: 'Logo saved. Gallery images now show it as a watermark.' });
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleGalleryUpload() {
    if (!galleryFile) {
      setGalleryMessage({ type: 'error', text: 'Choose a gallery image first.' });
      return;
    }

    setUploadingGallery(true);
    setGalleryMessage({ type: 'idle', text: '' });

    try {
      const uploadPath = buildStoragePath('galleries', galleryFile);
      const { error: uploadError } = await supabase.storage.from(galleryBucket).upload(uploadPath, galleryFile, {
        cacheControl: '31536000',
        upsert: false,
      });

      if (uploadError) {
        setGalleryMessage({ type: 'error', text: uploadError.message });
        return;
      }

      const { data: publicUrlData } = supabase.storage.from(galleryBucket).getPublicUrl(uploadPath);
      if (!publicUrlData.publicUrl) {
        setGalleryMessage({ type: 'error', text: 'Unable to create a public image URL.' });
        return;
      }

      const { error: insertError } = await supabase.from('galleries').insert([
        {
          image_url: publicUrlData.publicUrl,
          storage_path: uploadPath,
          category: galleryCategory,
        },
      ]);

      if (insertError) {
        setGalleryMessage({ type: 'error', text: insertError.message });
        return;
      }

      setGalleryFile(null);
      setGalleryCategory(categories[0]);
      setGalleryMessage({ type: 'success', text: 'Image uploaded and added to the gallery.' });
      await loadGallery();
    } finally {
      setUploadingGallery(false);
    }
  }

  async function handleDeleteGallery(item: GalleryItem) {
    setDeletingGalleryId(item.id);
    setGalleryMessage({ type: 'idle', text: '' });

    const { error: removeError } = await supabase.storage.from(galleryBucket).remove([item.storage_path]);
    if (removeError) {
      setGalleryMessage({ type: 'error', text: removeError.message });
      setDeletingGalleryId(null);
      return;
    }

    const { error: deleteError } = await supabase.from('galleries').delete().eq('id', item.id);
    if (deleteError) {
      setGalleryMessage({ type: 'error', text: deleteError.message });
    } else {
      setGalleryMessage({ type: 'success', text: 'Image removed.' });
      await loadGallery();
    }

    setDeletingGalleryId(null);
  }

  async function handleCreateTestimonial() {
    if (!testimonialName.trim() || !testimonialQuote.trim()) {
      setTestimonialMessage({ type: 'error', text: 'Client name and quote are required.' });
      return;
    }

    setSavingTestimonial(true);
    setTestimonialMessage({ type: 'idle', text: '' });

    const { error } = await supabase.from('testimonials').insert([
      {
        client_name: testimonialName.trim(),
        client_role: testimonialRole.trim() || null,
        quote: testimonialQuote.trim(),
        is_published: false,
      },
    ]);

    if (error) {
      setTestimonialMessage({ type: 'error', text: error.message });
    } else {
      setTestimonialName('');
      setTestimonialRole('');
      setTestimonialQuote('');
      setTestimonialMessage({ type: 'success', text: 'Testimonial saved as draft.' });
      await loadTestimonials();
    }

    setSavingTestimonial(false);
  }

  async function handleToggleTestimonial(item: Testimonial) {
    setBusyTestimonialId(item.id);
    const { error } = await supabase
      .from('testimonials')
      .update({ is_published: !item.is_published, updated_at: new Date().toISOString() })
      .eq('id', item.id);

    if (error) {
      setTestimonialMessage({ type: 'error', text: error.message });
    } else {
      setTestimonialMessage({
        type: 'success',
        text: item.is_published ? 'Testimonial unpublished.' : 'Testimonial published live.',
      });
      await loadTestimonials();
    }

    setBusyTestimonialId(null);
  }

  async function handleDeleteTestimonial(item: Testimonial) {
    if (!confirm(`Delete testimonial from ${item.client_name}?`)) return;

    setBusyTestimonialId(item.id);
    const { error } = await supabase.from('testimonials').delete().eq('id', item.id);

    if (error) {
      setTestimonialMessage({ type: 'error', text: error.message });
    } else {
      setTestimonialMessage({ type: 'success', text: 'Testimonial deleted permanently.' });
      await loadTestimonials();
    }

    setBusyTestimonialId(null);
  }

  if (status === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-6 text-sm text-slate-300">Loading secure admin...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950" style={pageStyle}>
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-slate-200 bg-slate-950 px-5 py-6 text-white lg:border-b-0 lg:border-r lg:border-slate-800">
          <div className="flex items-center justify-between gap-4 lg:block">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Secret Admin</p>
              <h1 className="mt-2 text-2xl font-semibold">Yolo Studio</h1>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 lg:mt-8"
            >
              Logout
            </button>
          </div>

          <nav className="mt-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {sectionItems.map((section) => {
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`rounded-2xl px-4 py-4 text-left transition ${
                    active ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="block text-sm font-semibold">{section.label}</span>
                  <span className={`mt-1 block text-xs ${active ? 'text-slate-600' : 'text-slate-500'}`}>{section.description}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="px-5 py-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Protected Route /admin</p>
                <h2 className="mt-2 text-3xl font-semibold">{sectionItems.find((item) => item.id === activeSection)?.label}</h2>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                {galleryItems.length} images / {testimonials.filter((item) => item.is_published).length} live reviews
              </div>
            </header>

            {activeSection === 'branding' ? (
              <BrandingSection
                logoUrl={logoUrl}
                logoPreview={logoPreview}
                logoMessage={logoMessage}
                uploadingLogo={uploadingLogo}
                onFileChange={setLogoFile}
                onUpload={handleLogoUpload}
              />
            ) : null}

            {activeSection === 'gallery' ? (
              <GallerySection
                logoUrl={logoUrl}
                items={galleryItems}
                preview={galleryPreview}
                category={galleryCategory}
                message={galleryMessage}
                uploading={uploadingGallery}
                deletingId={deletingGalleryId}
                onFileChange={setGalleryFile}
                onCategoryChange={setGalleryCategory}
                onUpload={handleGalleryUpload}
                onDelete={handleDeleteGallery}
              />
            ) : null}

            {activeSection === 'testimonials' ? (
              <TestimonialsSection
                testimonials={testimonials}
                name={testimonialName}
                role={testimonialRole}
                quote={testimonialQuote}
                message={testimonialMessage}
                saving={savingTestimonial}
                busyId={busyTestimonialId}
                onNameChange={setTestimonialName}
                onRoleChange={setTestimonialRole}
                onQuoteChange={setTestimonialQuote}
                onCreate={handleCreateTestimonial}
                onToggle={handleToggleTestimonial}
                onDelete={handleDeleteTestimonial}
              />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function Message({ message }: { message: MessageState }) {
  if (!message.text) return null;

  return (
    <p className={`text-sm ${message.type === 'error' ? 'text-rose-600' : 'text-emerald-700'}`}>
      {message.text}
    </p>
  );
}

function BrandingSection({
  logoUrl,
  logoPreview,
  logoMessage,
  uploadingLogo,
  onFileChange,
  onUpload,
}: {
  logoUrl: string;
  logoPreview: string;
  logoMessage: MessageState;
  uploadingLogo: boolean;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">Current logo</p>
        <div className="mt-5 grid min-h-56 place-items-center rounded-2xl border border-slate-200 bg-slate-50 p-6">
          {logoUrl ? <img src={logoUrl} alt="Saved logo" className="max-h-40 object-contain" /> : <p className="text-sm text-slate-500">No logo uploaded yet.</p>}
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">Logo uploads update the site mark only. Colors stay fixed for readability and local SEO consistency.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700">
          Upload logo
          <input
            type="file"
            accept="image/*"
            onChange={(event) => onFileChange(event.target.files?.[0] || null)}
            className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
          />
        </label>

        {logoPreview ? <img src={logoPreview} alt="Logo preview" className="mt-5 h-32 w-full rounded-2xl border border-slate-200 object-contain p-4" /> : null}
        <div className="mt-5 space-y-4">
          <Message message={logoMessage} />
          <button
            type="button"
            onClick={onUpload}
            disabled={uploadingLogo}
            className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploadingLogo ? 'Uploading...' : 'Save logo'}
          </button>
        </div>
      </div>
    </div>
  );
}

function GallerySection({
  logoUrl,
  items,
  preview,
  category,
  message,
  uploading,
  deletingId,
  onFileChange,
  onCategoryChange,
  onUpload,
  onDelete,
}: {
  logoUrl: string;
  items: GalleryItem[];
  preview: string;
  category: string;
  message: MessageState;
  uploading: boolean;
  deletingId: number | null;
  onFileChange: (file: File | null) => void;
  onCategoryChange: (value: string) => void;
  onUpload: () => void;
  onDelete: (item: GalleryItem) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700">
            Gallery image
            <input
              type="file"
              accept="image/*"
              onChange={(event) => onFileChange(event.target.files?.[0] || null)}
              className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
            />
          </label>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Category
            <select
              value={category}
              onChange={(event) => onCategoryChange(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
            >
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>

          {preview ? (
            <WatermarkedImage className="mt-5 aspect-[4/3] rounded-2xl" imageUrl={preview} logoUrl={logoUrl} alt="Selected gallery preview" />
          ) : null}

          <div className="mt-5 space-y-4">
            <Message message={message} />
            <button
              type="button"
              onClick={onUpload}
              disabled={uploading}
              className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? 'Uploading...' : 'Upload image'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Watermark behavior</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">Gallery images display your company logo as a CSS overlay in the admin and public gallery surfaces. Storage paths are saved for clean bucket management.</p>
          <div className="mt-5 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
            Use a transparent PNG logo for the best watermark result.
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.length ? items.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <WatermarkedImage imageUrl={item.image_url} logoUrl={logoUrl} alt={item.category} className="aspect-[4/3]" />
            <div className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">{item.category}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{item.storage_path}</p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(item)}
                disabled={deletingId === item.id}
                className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
              >
                {deletingId === item.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </article>
        )) : <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No gallery images yet.</p>}
      </div>
    </div>
  );
}

function WatermarkedImage({ imageUrl, logoUrl, alt, className = '' }: { imageUrl: string; logoUrl: string; alt: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-slate-200 ${className}`}>
      <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
      {logoUrl ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-slate-950/5">
          <img src={logoUrl} alt="" aria-hidden="true" className="max-h-20 max-w-[45%] object-contain opacity-35 grayscale" />
        </div>
      ) : null}
    </div>
  );
}

function TestimonialsSection({
  testimonials,
  name,
  role,
  quote,
  message,
  saving,
  busyId,
  onNameChange,
  onRoleChange,
  onQuoteChange,
  onCreate,
  onToggle,
  onDelete,
}: {
  testimonials: Testimonial[];
  name: string;
  role: string;
  quote: string;
  message: MessageState;
  saving: boolean;
  busyId: string | null;
  onNameChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onQuoteChange: (value: string) => void;
  onCreate: () => void;
  onToggle: (item: Testimonial) => void;
  onDelete: (item: Testimonial) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">New testimonial</p>
        <div className="mt-5 space-y-4">
          <input value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="Client name" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          <input value={role} onChange={(event) => onRoleChange(event.target.value)} placeholder="Role or session type" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          <textarea value={quote} onChange={(event) => onQuoteChange(event.target.value)} placeholder="Client quote" rows={5} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          <Message message={message} />
          <button
            type="button"
            onClick={onCreate}
            disabled={saving}
            className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? 'Saving draft...' : 'Save as draft'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {testimonials.length ? testimonials.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {item.is_published ? 'Live' : 'Draft'}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-slate-950">{item.client_name}</h3>
                <p className="text-sm text-slate-500">{item.client_role || 'Client'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onToggle(item)}
                  disabled={busyId === item.id}
                  className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {item.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  disabled={busyId === item.id}
                  className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">&ldquo;{item.quote}&rdquo;</p>
          </article>
        )) : <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No testimonials yet. Add three starters or create a fresh draft.</p>}
      </div>
    </div>
  );
}
