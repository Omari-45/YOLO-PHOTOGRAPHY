'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

const adminEmail = process.env.NEXT_PUBLIC_SUPABASE_ADMIN_EMAIL;

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.email === adminEmail) {
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

    if (data?.user?.email !== adminEmail) {
      setMessage('Only the owner may access the admin dashboard.');
      await supabase.auth.signOut();
      return;
    }

    router.push('/admin');
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
        </form>

        <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-950/80 p-5 text-sm text-slate-400">
          <p className="font-medium text-slate-100">Owner access only</p>
          <p className="mt-2">Use the owner email configured in <code className="rounded bg-slate-900 px-2 py-1 text-xs">NEXT_PUBLIC_SUPABASE_ADMIN_EMAIL</code>.</p>
        </div>
      </div>
    </main>
  );
}
