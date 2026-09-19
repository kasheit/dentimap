import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle, ShieldQuestion } from 'lucide-react';
import type { FacilityStatus, VerificationState } from '@/lib/types';
import { statusLabel } from '@/lib/format';

export function Card({
  id,
  title,
  icon,
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
    <section id={id} className={`scroll-mt-28 rounded-xl border border-dm-border bg-dm-surface ${className}`}>
      <header className="flex items-center justify-between gap-3 border-b border-dm-border px-5 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-dm-text">
          {icon}
          {title}
        </h2>
        {action}
      </header>
      <div className="p-5">{children}</div>
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
