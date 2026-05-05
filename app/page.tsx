export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="relative overflow-hidden px-6 py-20 lg:px-12">
        <div className="absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-slate-900 via-transparent to-transparent opacity-10" />
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-8">
              <span className="inline-flex rounded-full border border-slate-300 px-4 py-1 text-sm uppercase tracking-[0.35em] text-slate-600">
                Yolo Photography
              </span>
              <div className="space-y-6">
                <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
                  Professional Photography for Weddings, Portraits, and Events.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-600">
                  High-end photography that feels effortless, editorial, and unforgettable. Every frame tells your unique story, wherever you are.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <a href="#portfolio" className="inline-flex items-center justify-center rounded-full bg-slate-950 px-7 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  View Portfolio
                </a>
                <a href="/admin/login" className="inline-flex items-center justify-center rounded-full border border-slate-900 px-7 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                  Admin Login
                </a>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-100 p-1 shadow-soft">
              <div className="aspect-[4/5] rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(17,24,39,0.18),_transparent_42%)] p-8">
                <div className="grid h-full gap-4 rounded-[24px] bg-slate-950 p-6 text-white">
                  <div className="flex h-full flex-col justify-between rounded-[20px] bg-[radial-gradient(circle_at_top_right,_rgba(201,170,110,0.24),_transparent_40%)] p-6">
                    <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Featured Story</p>
                    <div className="space-y-3">
                      <h2 className="text-3xl font-semibold">Modern editorial portraits</h2>
                      <p className="text-sm leading-6 text-slate-200">Minimal styling, natural emotion, and timeless lighting for premium brand imagery.</p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.4em] text-slate-400">Capturing moments with clarity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="portfolio" className="border-t border-slate-200 px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-600">Portfolio</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Selected work across premium campaigns.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">Discover a clean, modern approach to storytelling through visuals, designed for brands and creative individuals.</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {['Studio Editorial', 'Brand Narrative', 'Intimate Portraits'].map((title) => (
              <article key={title} className="group overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 p-8 text-white transition hover:-translate-y-1 hover:shadow-soft">
                <div className="mb-6 h-56 rounded-[24px] bg-slate-800" />
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Featured</p>
                <h3 className="mt-4 text-2xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">Rich imagery, confident composition, and a refined visual tone that aligns with premium storytelling.</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-6xl rounded-[32px] bg-slate-950 px-10 py-16 text-white shadow-soft">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Studio Experience</p>
              <h2 className="mt-4 text-4xl font-semibold">A refined photography experience from first contact to delivery.</h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">Every session is tailored with precision, thoughtful direction, and an elevated editing style. The result is imagery you can feel proud to share.</p>
            </div>
            <div className="space-y-4 rounded-[28px] bg-slate-900/90 p-8">
              {['Custom consultation', 'Curated location styling', 'Fast turnaround', 'Gallery delivery'].map((item) => (
                <div key={item} className="rounded-3xl border border-slate-800 bg-slate-950/95 px-5 py-4">
                  <p className="text-sm text-slate-200">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-600">Let’s create</p>
          <h2 className="mt-4 text-3xl font-semibold text-slate-950">Book a session or request a custom proposal.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">Reach out for commissions, editorial work, and creative direction that makes your brand feel premium and purposeful.</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="mailto:hello@yolophotography.com" className="inline-flex items-center justify-center rounded-full bg-slate-950 px-8 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Contact Studio
            </a>
            <a href="/admin/login" className="inline-flex items-center justify-center rounded-full border border-slate-900 px-8 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
              Admin Portal
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
