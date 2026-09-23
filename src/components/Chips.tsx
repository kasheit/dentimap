import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { FacilityStatus, VerificationState } from '@/lib/types';
import { statusLabel } from '@/lib/format';

export function Panel({
  id,
  title,
  action,
  children,
  className = '',
}: {
  id?: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-20 min-w-0 rounded-lg border border-dm-border bg-dm-surface p-5 shadow-card ${className}`}>
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-body font-semibold text-dm-text">{title}</h2>
        {action}
      </header>
      <div>{children}</div>
    </section>
  );
}

const statusDot: Record<FacilityStatus, string> = {
  active: 'bg-dm-green',
  closed: 'bg-dm-dim',
};

export function StatusPill({ status }: { status: FacilityStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-label text-dm-muted">
      <i className={`h-1.5 w-1.5 rounded-full ${statusDot[status]}`} />
      {statusLabel[status]}
    </span>
  );
}

const verifyMeta: Record<Exclude<VerificationState, 'verified'>, { label: string; cls: string }> = {
  unverified: { label: 'Unverified', cls: 'text-dm-amber' },
  unknown: { label: 'Unknown', cls: 'text-dm-dim' },
};

export function VerifyChip({ state }: { state: VerificationState }) {
  if (state === 'verified') return null;
  const { label, cls } = verifyMeta[state];
  return (
    <span className={`inline-flex items-center gap-1.5 text-label ${cls}`}>
      <i className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function FormulaChip({ consideration, stamps, ok, expected }: { consideration: number; stamps: number; ok: boolean; expected: number }) {
  const fmt = (n: number, d = 0) => `$${n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
  return ok ? (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-dm-green/30 bg-dm-green/10 px-2 py-1 tnum text-label text-dm-green">
      <CheckCircle2 className="h-3 w-3" />
      {fmt(consideration)} / $500 = {fmt(stamps, 2)}
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border border-dm-red/30 bg-dm-red/10 px-2 py-1 tnum text-label text-dm-red"
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

const levelStyle = {
  confirmed: { dot: 'bg-dm-green', text: 'text-dm-green', label: 'Verified' },
  partial: { dot: 'bg-dm-amber', text: 'text-dm-amber', label: 'Unverified' },
  missing: { dot: 'bg-dm-red', text: 'text-dm-muted', label: 'Not found' },
} as const;

export function LevelLabel({
  level,
  detail,
  stale,
  onClick,
  expanded,
}: {
  level: 'confirmed' | 'partial' | 'missing';
  detail?: ReactNode;
  stale?: boolean;
  onClick?: () => void;
  expanded?: boolean;
}) {
  const s = levelStyle[level];
  const text = stale ? 'Recheck' : s.label;
  const body = (
    <>
      <i className={`inline-block h-1.5 w-1.5 rounded-full ${s.dot}`} />
      <span className={s.text}>{text}</span>
      {detail && <span className="text-dm-dim">· {detail}</span>}
    </>
  );
  const cls = 'inline-flex flex-wrap items-center justify-end gap-x-1.5 text-label';
  return onClick ? (
    <button type="button" onClick={onClick} aria-expanded={expanded} className={`${cls} rounded px-1.5 py-1 text-left transition-colors hover:bg-dm-hover`} title={level === 'missing' ? 'Fill this in' : 'Click to confirm'}>
      {body}
    </button>
  ) : (
    <span className={cls}>{body}</span>
  );
}

export function DetailRow({ label, value, mono, status }: { label: string; value?: ReactNode; mono?: boolean; status?: ReactNode }) {
  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-dm-border/60 py-2 last:border-0">
      <div className="text-[12px] text-dm-dim">{label}</div>
      <div className={`min-w-0 break-words font-medium ${mono ? 'font-mono text-label' : 'text-body'}`}>
        {value || <span className="font-normal text-dm-dim">—</span>}
      </div>
      {status ? <div className="max-w-[11rem] text-right">{status}</div> : <div />}
    </div>
  );
}
