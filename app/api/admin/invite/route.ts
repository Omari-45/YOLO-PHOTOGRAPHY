import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ownerEmail = 'davidomari006@gmail.com';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: 'Missing Supabase server environment variables.' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization') || '';
  const accessToken = authHeader.replace(/^Bearer\s+/i, '');

  if (!accessToken) {
    return NextResponse.json({ error: 'Admin session is required.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const invitedEmail = normalizeEmail(String(body?.email || ''));

  if (!invitedEmail || !invitedEmail.includes('@')) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  const requesterEmail = normalizeEmail(userData.user?.email || '');

  if (userError || !requesterEmail) {
    return NextResponse.json({ error: 'Unable to verify your admin session.' }, { status: 401 });
  }

  const { data: settings, error: settingsError } = await adminClient
    .from('site_settings')
    .select('id,admin_emails')
    .limit(1)
    .maybeSingle();

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 });
  }

  const allowedEmails = Array.from(new Set([
    ownerEmail,
    ...((settings?.admin_emails as string[] | null | undefined) || []),
  ].map(normalizeEmail).filter(Boolean)));

  if (!allowedEmails.includes(requesterEmail)) {
    return NextResponse.json({ error: 'Only authorized admins can invite new admins.' }, { status: 403 });
  }

  const nextEmails = Array.from(new Set([...allowedEmails, invitedEmail]));
  const { error: saveError } = settings?.id
    ? await adminClient.from('site_settings').update({ admin_emails: nextEmails, updated_at: new Date().toISOString() }).eq('id', settings.id)
    : await adminClient.from('site_settings').insert([{ site_name: 'YOLO Photography', admin_emails: nextEmails }]);

  if (saveError) {
    return NextResponse.json({ error: saveError.message }, { status: 500 });
  }

  const origin = request.nextUrl.origin;
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(invitedEmail, {
    redirectTo: `${origin}/admin/update-password`,
  });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
