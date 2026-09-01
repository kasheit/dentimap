import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Loader2, ShieldCheck } from 'lucide-react';
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

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  // No Supabase configured (local dev without env vars) — nothing to
  // protect, so skip the gate and let the app fall back to seed data.
  if (!supabase) return <>{children}</>;
  if (!checked) return <FullScreenLoader />;
  if (session) return <>{children}</>;

  const client = supabase;

  const sendCode = async () => {
    setSending(true);
    setError(null);
    const { error: sendError } = await client.auth.signInWithOtp({ email: OWNER_EMAIL });
    setSending(false);
    if (sendError) setError(sendError.message);
    else setStep('verify');
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-navy-950">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-card dark:border-navy-700 dark:bg-navy-800">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500 text-navy-900 shadow-lg shadow-teal-500/20">
          <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <h1 className="mt-4 font-brand text-2xl font-bold text-navy-800 dark:text-white">Dentimap</h1>
        <p className="mt-1 text-sm text-navy-500 dark:text-navy-300">Owner access only.</p>

        {step === 'request' ? (
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
          </>
        ) : (
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
                setStep('request');
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
      </div>
    </div>
  );
}
