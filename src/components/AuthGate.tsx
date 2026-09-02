import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Fingerprint, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/**
 * Single-owner gate: the app only ever offers to email a code to this
 * address — there's no free-text email field, so this page can't be used
 * to spam or probe other addresses. The real access control is the RLS
 * policy on `locations` (auth.jwt() ->> 'email' = this same address), not
 * this UI restriction — anyone could still call the Supabase auth API
 * directly with their own email, but RLS then denies them regardless.
 */
const OWNER_EMAIL = 'barnesnook610@gmail.com';

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  const visible = user.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(user.length - visible.length, 3))}@${domain}`;
}

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-navy-950">
      <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
    </div>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-navy-950">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-card dark:border-navy-700 dark:bg-navy-800">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500 text-navy-900 shadow-lg shadow-teal-500/20">
          <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <h1 className="mt-4 font-brand text-2xl font-bold text-navy-800 dark:text-white">Dentimap</h1>
        <p className="mt-1 text-sm text-navy-500 dark:text-navy-300">Owner access only.</p>
        {children}
      </div>
    </div>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);
  const [mode, setMode] = useState<'passkey' | 'email-request' | 'email-verify'>('passkey');
  const [code, setCode] = useState('');
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Post-login nudge to register a passkey, shown once per sign-in when the
  // user doesn't already have one. 'checking' | 'offer' | 'done' (done means
  // "past this step for the current session", not "has a passkey").
  const [passkeyPrompt, setPasskeyPrompt] = useState<'checking' | 'offer' | 'done'>('checking');

  useEffect(() => {
    if (!supabase) {
      setChecked(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecked(true);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setPasskeyPrompt('checking');
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session) return;
    let cancelled = false;
    supabase.auth.passkey.list().then(({ data }) => {
      if (cancelled) return;
      setPasskeyPrompt(data && data.length > 0 ? 'done' : 'offer');
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  // No Supabase configured (local dev without env vars) — nothing to
  // protect, so skip the gate and let the app fall back to seed data.
  if (!supabase) return <>{children}</>;
  if (!checked) return <FullScreenLoader />;

  const client = supabase;

  if (session) {
    if (passkeyPrompt === 'checking') return <FullScreenLoader />;
    if (passkeyPrompt === 'offer') {
      const setUpPasskey = async () => {
        setPasskeyBusy(true);
        setError(null);
        const { error: registerError } = await client.auth.registerPasskey();
        setPasskeyBusy(false);
        if (registerError) setError(registerError.message);
        else setPasskeyPrompt('done');
      };
      return (
        <AuthShell>
          <p className="mt-6 text-[13px] leading-relaxed text-navy-500 dark:text-navy-300">
            Set up a passkey so you can sign in next time with your fingerprint, face, or device
            PIN — no email code needed.
          </p>
          <button
            onClick={setUpPasskey}
            disabled={passkeyBusy}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
          >
            <Fingerprint className="h-4 w-4" />
            {passkeyBusy ? 'Setting up…' : 'Set up a passkey'}
          </button>
          <button
            onClick={() => setPasskeyPrompt('done')}
            className="mt-2 w-full text-[13px] text-navy-400 transition-colors hover:text-navy-600 dark:text-navy-300 dark:hover:text-white"
          >
            Skip for now
          </button>
          {error && <p className="mt-3 text-[13px] text-rose-600 dark:text-rose-400">{error}</p>}
        </AuthShell>
      );
    }
    return <>{children}</>;
  }

  const signInPasskey = async () => {
    setPasskeyBusy(true);
    setError(null);
    const { error: passkeyError } = await client.auth.signInWithPasskey();
    setPasskeyBusy(false);
    if (passkeyError) setError(passkeyError.message);
  };

  const sendCode = async () => {
    setSending(true);
    setError(null);
    const { error: sendError } = await client.auth.signInWithOtp({ email: OWNER_EMAIL });
    setSending(false);
    if (sendError) setError(sendError.message);
    else setMode('email-verify');
  };

  const verifyCode = async () => {
    setVerifying(true);
    setError(null);
    const { error: verifyError } = await client.auth.verifyOtp({
      email: OWNER_EMAIL,
      token: code,
      type: 'email',
    });
    setVerifying(false);
    if (verifyError) setError(verifyError.message);
  };

  return (
    <AuthShell>
      {mode === 'passkey' && (
        <>
          <button
            onClick={signInPasskey}
            disabled={passkeyBusy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
          >
            <Fingerprint className="h-4 w-4" />
            {passkeyBusy ? 'Waiting…' : 'Sign in with a passkey'}
          </button>
          <button
            onClick={() => {
              setMode('email-request');
              setError(null);
            }}
            className="mt-2 w-full text-[13px] text-navy-400 transition-colors hover:text-navy-600 dark:text-navy-300 dark:hover:text-white"
          >
            Use an email code instead
          </button>
        </>
      )}

      {mode === 'email-request' && (
        <>
          <p className="mt-6 text-[13px] leading-relaxed text-navy-500 dark:text-navy-300">
            We'll email a one-time code to{' '}
            <span className="font-medium text-navy-700 dark:text-navy-100">
              {maskEmail(OWNER_EMAIL)}
            </span>
            .
          </p>
          <button
            onClick={sendCode}
            disabled={sending}
            className="mt-4 w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Send code'}
          </button>
          <button
            onClick={() => {
              setMode('passkey');
              setError(null);
            }}
            className="mt-2 w-full text-[13px] text-navy-400 transition-colors hover:text-navy-600 dark:text-navy-300 dark:hover:text-white"
          >
            Back to passkey sign-in
          </button>
        </>
      )}

      {mode === 'email-verify' && (
        <>
          <p className="mt-6 text-[13px] text-navy-500 dark:text-navy-300">
            Enter the 6-digit code we just sent you.
          </p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && verifyCode()}
            inputMode="numeric"
            autoFocus
            placeholder="123456"
            className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-center font-mono text-lg tracking-[0.3em] text-navy-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 dark:border-navy-600 dark:bg-navy-900 dark:text-white"
          />
          <button
            onClick={verifyCode}
            disabled={verifying || code.length < 6}
            className="mt-3 w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
          >
            {verifying ? 'Verifying…' : 'Verify & sign in'}
          </button>
          <button
            onClick={() => {
              setMode('email-request');
              setCode('');
              setError(null);
            }}
            className="mt-2 w-full text-[13px] text-navy-400 transition-colors hover:text-navy-600 dark:text-navy-300 dark:hover:text-white"
          >
            Start over
          </button>
        </>
      )}

      {error && <p className="mt-3 text-[13px] text-rose-600 dark:text-rose-400">{error}</p>}
    </AuthShell>
  );
}
