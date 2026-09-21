import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Fingerprint, Loader2, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/**
 * Single-owner gate: the app only offers to email a code to this address.
 * The real access control is the RLS policy on the Supabase tables
 * (auth.jwt() ->> 'email' = this address), not this UI restriction.
 */
const OWNER_EMAIL = 'barnesnook610@gmail.com';

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  const visible = user.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(user.length - visible.length, 3))}@${domain}`;
}

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-dm-bg">
      <Loader2 className="h-5 w-5 animate-spin text-dm-blue" />
    </div>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-dm-bg px-4">
      <div className="w-full max-w-sm rounded-xl border border-dm-border bg-dm-surface p-8">
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <MapPin className="h-5 w-5 text-dm-blue" />
          Dentimap
        </h1>
        <p className="mt-1 text-sm text-dm-muted">Owner access only.</p>
        {children}
      </div>
    </div>
  );
}

const primary =
  'mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-dm-blue/40 bg-dm-blue/10 px-4 py-2.5 text-sm font-medium text-dm-blue transition-colors hover:bg-dm-blue/20 disabled:opacity-50';
const link = 'mt-2 w-full text-[13px] text-dm-dim transition-colors hover:text-dm-text';

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);
  const [mode, setMode] = useState<'passkey' | 'email-request' | 'email-verify'>('passkey');
  const [code, setCode] = useState('');
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 'done' means past the passkey-registration nudge for this session, not "has a passkey".
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

  // No Supabase configured (local dev without env vars): nothing to protect.
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
          <p className="mt-6 text-[13px] leading-relaxed text-dm-muted">
            Set up a passkey to sign in next time with your fingerprint, face, or device PIN — no email code needed.
          </p>
          <button onClick={setUpPasskey} disabled={passkeyBusy} className={primary}>
            <Fingerprint className="h-4 w-4" />
            {passkeyBusy ? 'Setting up…' : 'Set up a passkey'}
          </button>
          <button onClick={() => setPasskeyPrompt('done')} className={link}>
            Skip for now
          </button>
          {error && <p className="mt-3 text-[13px] text-dm-red">{error}</p>}
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
    const { error: verifyError } = await client.auth.verifyOtp({ email: OWNER_EMAIL, token: code, type: 'email' });
    setVerifying(false);
    if (verifyError) setError(verifyError.message);
  };

  return (
    <AuthShell>
      {mode === 'passkey' && (
        <>
          <button onClick={signInPasskey} disabled={passkeyBusy} className={`${primary} mt-6`}>
            <Fingerprint className="h-4 w-4" />
            {passkeyBusy ? 'Waiting…' : 'Sign in with a passkey'}
          </button>
          <button
            onClick={() => {
              setMode('email-request');
              setError(null);
            }}
            className={link}
          >
            Use an email code instead
          </button>
        </>
      )}

      {mode === 'email-request' && (
        <>
          <p className="mt-6 text-[13px] leading-relaxed text-dm-muted">
            We'll email a one-time code to <span className="font-medium text-dm-text">{maskEmail(OWNER_EMAIL)}</span>.
          </p>
          <button onClick={sendCode} disabled={sending} className={primary}>
            {sending ? 'Sending…' : 'Send code'}
          </button>
          <button
            onClick={() => {
              setMode('passkey');
              setError(null);
            }}
            className={link}
          >
            Back to passkey sign-in
          </button>
        </>
      )}

      {mode === 'email-verify' && (
        <>
          <p className="mt-6 text-[13px] text-dm-muted">Enter the 6-digit code we just sent you.</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && verifyCode()}
            inputMode="numeric"
            autoFocus
            placeholder="123456"
            className="field mt-3 py-2 text-center tnum text-lg tracking-[0.3em]"
          />
          <button onClick={verifyCode} disabled={verifying || code.length < 6} className={primary}>
            {verifying ? 'Verifying…' : 'Verify & sign in'}
          </button>
          <button
            onClick={() => {
              setMode('email-request');
              setCode('');
              setError(null);
            }}
            className={link}
          >
            Start over
          </button>
        </>
      )}

      {error && <p className="mt-3 text-[13px] text-dm-red">{error}</p>}
    </AuthShell>
  );
}
