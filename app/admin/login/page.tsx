'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

const adminEmail = process.env.NEXT_PUBLIC_SUPABASE_ADMIN_EMAIL;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function getAllowedAdminEmails() {
  const fallback = adminEmail ? [normalizeEmail(adminEmail)] : [];
  const { data, error } = await supabase
    .from('site_settings')
    .select('admin_emails')
    .limit(1)
    .maybeSingle();

  if (error) return fallback;
  const emails = (data?.admin_emails as string[] | null | undefined)?.map(normalizeEmail).filter(Boolean);
  return emails?.length ? emails : fallback;
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      const [{ data }, allowedEmails] = await Promise.all([
        supabase.auth.getSession(),
        getAllowedAdminEmails(),
      ]);
      const sessionEmail = normalizeEmail(data.session?.user?.email || '');
      if (sessionEmail && allowedEmails.includes(sessionEmail)) {
        router.replace('/admin');
      }
    }

    checkSession();
  }, [router]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    const allowedEmails = await getAllowedAdminEmails();
    const userEmail = normalizeEmail(data?.user?.email || '');

    if (!userEmail || !allowedEmails.includes(userEmail)) {
      setMessage('Only authorized admins may access the admin dashboard.');
      await supabase.auth.signOut();
      return;
    }

    router.push('/admin');
  }

  async function handleResetPassword() {
    const targetEmail = normalizeEmail((email || resetEmail).trim());

    if (!targetEmail) {
      setShowResetForm(true);
      setMessage('Enter your email to receive a password reset link.');
      return;
    }

    setResetLoading(true);
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/admin/login` : undefined,
    });

    setResetLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Password reset email sent! Check your inbox and spam folder.');
    setShowResetForm(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-white sm:px-10">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-slate-900/90 p-10 shadow-soft backdrop-blur-xl">
        <div className="mb-10 space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Yolo Photography Admin</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Secure Studio Access</h1>
          <p className="mx-auto max-w-xl text-sm leading-7 text-slate-300">
            Sign in with your Supabase credentials to manage the portfolio and view the owner dashboard.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="owner@example.com"
              className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              required
            />
          </div>

          {message ? <p className="text-sm text-rose-300">{message}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#b38f57] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="mt-4 flex flex-col items-center gap-3 text-center">
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-sm text-slate-400 transition hover:text-slate-100"
            >
              Forgot Password?
            </button>

            {showResetForm ? (
              <div className="w-full rounded-3xl border border-slate-800 bg-slate-950/90 p-4 text-left">
                <p className="mb-3 text-sm text-slate-400">Enter the email address where you want the reset link sent.</p>
                <label className="mb-2 block text-sm font-medium text-slate-200">Reset email</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  placeholder="owner@example.com"
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resetLoading}
                    className="inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#b38f57] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {resetLoading ? 'Sending...' : 'Send reset link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetForm(false);
                      setMessage('');
                    }}
                    className="text-sm text-slate-400 transition hover:text-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </form>

        <button
          type="button"
          onClick={() => router.push('/')}
          className="mt-8 text-sm font-semibold text-slate-300 transition hover:text-white"
        >
          Back to Home
        </button>
      </div>
    </main>
  );
}
