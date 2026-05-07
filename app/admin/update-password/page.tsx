'use client';

import { FormEvent, useEffect, useState, type ReactNode, type SVGProps } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

type SocialLinks = {
  facebook_link?: string | null;
  instagram_link?: string | null;
  tiktok_link?: string | null;
};

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

function SocialIconLink({
  href,
  label,
  children,
}: {
  href?: string | null;
  label: string;
  children: ReactNode;
}) {
  const className = 'inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-slate-800 bg-slate-950 text-slate-200 transition hover:border-[#d3b16e] hover:text-[#d3b16e]';

  if (!href) {
    return (
      <span className={`${className} opacity-50`} aria-label={label}>
        {children}
      </span>
    );
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
      <span className="sr-only">{label}</span>
    </a>
  );
}

export default function UpdatePasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLinks | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function prepareRecoverySession() {
      const code = new URLSearchParams(window.location.search).get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(error.message);
          setMessageType('error');
        }
      }

      const { data } = await supabase.auth.getSession();
      setSessionReady(Boolean(data.session));
    }

    async function loadSocialLinks() {
      const { data } = await supabase
        .from('site_settings')
        .select('facebook_link,instagram_link,tiktok_link')
        .limit(1)
        .maybeSingle();

      setSocialLinks(data || null);
    }

    prepareRecoverySession();
    loadSocialLinks();
  }, []);

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      setMessageType('error');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters.');
      setMessageType('error');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      setMessageType('error');
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    setMessage('Password updated successfully.');
    setMessageType('success');
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-10 sm:py-16">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl flex-col justify-center">
        <div className="w-full rounded-[28px] border border-white/10 bg-slate-900/90 p-6 shadow-soft backdrop-blur-xl sm:rounded-[32px] sm:p-10">
          <div className="mb-8 space-y-3 text-center sm:mb-10">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400 sm:text-sm sm:tracking-[0.35em]">Yolo Photography Admin</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Update Password</h1>
            <p className="mx-auto max-w-xl text-sm leading-7 text-slate-300">
              Create a new password for your admin account.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleUpdatePassword}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter a new password"
                className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm your new password"
                className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                required
              />
            </div>

            {message ? (
              <p className={`text-sm ${messageType === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>
                {message}
              </p>
            ) : null}

            {messageType === 'error' && !sessionReady && !message ? (
              <p className="text-sm text-slate-400">Open this page from the password reset email to update your password.</p>
            ) : null}

            {messageType === 'success' ? (
              <button
                type="button"
                onClick={() => router.push('/admin/login')}
                className="inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#b38f57]"
              >
                Redirect to Login
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#b38f57] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            )}
          </form>

          <button
            type="button"
            onClick={() => router.push('/admin/login')}
            className="mt-8 text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            Back to Login
          </button>
        </div>

        <footer className="mt-8 flex flex-col items-center gap-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <SocialIconLink href={socialLinks?.facebook_link} label="Facebook">
              <FacebookIcon className="h-5 w-5" />
            </SocialIconLink>
            <SocialIconLink href={socialLinks?.tiktok_link} label="TikTok">
              <TiktokIcon className="h-5 w-5" />
            </SocialIconLink>
            <SocialIconLink href={socialLinks?.instagram_link} label="Instagram">
              <InstagramIcon className="h-5 w-5" />
            </SocialIconLink>
          </div>
          <a href="https://destinecreation.com" target="_blank" rel="noreferrer" className="text-sm font-semibold text-slate-300 transition hover:text-[#d3b16e]">
            Powered by Destine Creation
          </a>
        </footer>
      </div>
    </main>
  );
}
