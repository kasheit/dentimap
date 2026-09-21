import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle, ShieldQuestion } from 'lucide-react';
import type { FacilityStatus, VerificationState } from '@/lib/types';
import { statusLabel } from '@/lib/format';

export function Card({
  id,
  title,
  action,
  children,
  className = '',
}: {
  id?: string;
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-20 border-t border-dm-border pt-5 ${className}`}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-dm-text">{title}</h2>
        {action}
      </header>
      <div>{children}</div>
    </section>
  );
}

const statusDot: Record<FacilityStatus, string> = {
  active: 'bg-dm-green',
  pipeline_fitout: 'bg-dm-blue',
  pipeline_pending: 'bg-dm-amber',
  closed: 'bg-dm-dim',
};

export function StatusPill({ status }: { status: FacilityStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] text-dm-muted">
      <i className={`h-1.5 w-1.5 rounded-full ${statusDot[status]}`} />
      {statusLabel[status]}
    </span>
  );
}

const verifyMeta: Record<VerificationState, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  verified: { label: 'Verified', cls: 'border-dm-green/30 bg-dm-green/10 text-dm-green', Icon: CheckCircle2 },
  unverified: { label: 'Unverified', cls: 'border-dm-amber/30 bg-dm-amber/10 text-dm-amber', Icon: ShieldQuestion },
  unknown: { label: 'Unknown', cls: 'border-dm-border bg-dm-hover text-dm-muted', Icon: HelpCircle },
};

export function VerifyChip({ state }: { state: VerificationState }) {
  if (state === 'verified') return null;
  const { label, cls, Icon } = verifyMeta[state];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] ${cls}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export function FormulaChip({ consideration, stamps, ok, expected }: { consideration: number; stamps: number; ok: boolean; expected: number }) {
  const fmt = (n: number, d = 0) => `$${n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
  return ok ? (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-dm-green/30 bg-dm-green/10 px-2 py-1 tnum text-[11px] text-dm-green">
      <CheckCircle2 className="h-3 w-3" />
      {fmt(consideration)} / $500 = {fmt(stamps, 2)}
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border border-dm-red/30 bg-dm-red/10 px-2 py-1 tnum text-[11px] text-dm-red"
      title="North Carolina excise tax is $1 per $500 of consideration (G.S. 105-228.30)"
    >
      <AlertTriangle className="h-3 w-3" />
      {fmt(consideration)} / $500 = {fmt(expected, 2)} · stamped {fmt(stamps, 2)}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-dm-border px-4 py-8 text-center text-sm text-dm-dim">
      {children}
    </div>
  );
}

export function Fact({ label, children, mono, sub }: { label: string; children: ReactNode; mono?: boolean; sub?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dm-border/70 py-2 last:border-0">
      <dt className="shrink-0 text-[13px] text-dm-dim">{label}</dt>
      <dd className="min-w-0 text-right">
        <div className={`break-words text-[13px] ${mono ? 'font-mono' : 'tnum'}`}>{children}</div>
        {sub && <div className="mt-0.5 text-[12px] leading-snug">{sub}</div>}
      </dd>
    </div>
  );
}

export function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 text-[13px] font-semibold">{title}</h3>
      <dl>{children}</dl>
    </div>
  );
}
