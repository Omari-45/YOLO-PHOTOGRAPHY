'use client';

import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Music2 } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

type SocialLinks = {
  facebook_link?: string | null;
  instagram_link?: string | null;
  tiktok_link?: string | null;
};

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
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLinks | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function prepareRecoverySession() {
      setCheckingSession(true);

      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const code = searchParams.get('code');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;

          window.history.replaceState(null, document.title, window.location.pathname);
        }

        const { data } = await supabase.auth.getSession();
        setSessionReady(Boolean(data.session));

        if (!data.session) {
          setMessage('Open this page from the latest password reset email to update your password.');
          setMessageType('error');
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Unable to verify the password reset link.');
        setMessageType('error');
      } finally {
        setCheckingSession(false);
      }
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

    if (!sessionReady) {
      setMessage('Open this page from the latest password reset email to update your password.');
      setMessageType('error');
      return;
    }

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
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400 sm:text-sm sm:tracking-[0.35em]">YOLO Photography Admin</p>
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
                disabled={loading || checkingSession || !sessionReady}
                className="inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#b38f57] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {checkingSession ? 'Checking reset link...' : loading ? 'Updating...' : 'Update Password'}
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
            <SocialIconLink href={socialLinks?.tiktok_link} label="TikTok">
              <Music2 className="h-5 w-5" />
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
