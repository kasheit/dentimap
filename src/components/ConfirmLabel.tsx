import { useEffect, useRef, useState } from 'react';
import { isStale, levelFor } from '@/lib/completion';
import { fmtDate, fmtMonth } from '@/lib/format';
import { useDentimap } from '@/lib/store';
import type { Property, SourcedField } from '@/lib/types';
import { LevelLabel } from './Chips';

export const EDIT_RECORD_EVENT = 'dentimap:edit-record';

const today = () => new Date().toISOString().slice(0, 10);

export function ConfirmLabel({ property, field, label, has, extra, showDetail = true }: { property: Property; field: SourcedField; label: string; has: boolean; extra?: React.ReactNode; showDetail?: boolean }) {
  const updateProperty = useDentimap((s) => s.updateProperty);
  const meta = property.meta?.[field];
  const level = levelFor(has, meta);
  const stale = level === 'partial' && isStale(meta);
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState(meta?.source ?? '');
  const [asOf, setAsOf] = useState(today());

  const full = [meta?.source, meta?.asOf ? `as of ${fmtDate(meta.asOf)}` : undefined].filter(Boolean).join(' · ') || undefined;
  const detail = [meta?.source, meta?.asOf ? fmtMonth(meta.asOf) : undefined].filter(Boolean).join(' · ') || undefined;

  const onClick = () => {
    if (level === 'confirmed') return;
    if (level === 'missing') {
      window.dispatchEvent(new CustomEvent(EDIT_RECORD_EVENT, { detail: { field } }));
      return;
    }
    setSource(meta?.source ?? '');
    setAsOf(today());
    setOpen((o) => !o);
  };

  const [error, setError] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const close = () => {
    setOpen(false);
    setError(false);
    triggerRef.current?.querySelector('button')?.focus();
  };
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const confirm = () => {
    if (!source.trim()) {
      setError(true);
      return;
    }
    updateProperty(
      property.id,
      { meta: { ...property.meta, [field]: { state: 'verified', source: source.trim(), asOf: asOf || undefined } } },
      `Confirmed ${label}`,
    );
    close();
  };

  return (
    <span className="relative inline-block">
      <span ref={triggerRef} className="inline-flex items-center gap-3" title={has ? full : undefined}>
        <LevelLabel level={level} stale={stale} detail={has && showDetail ? detail : undefined} onClick={level === 'confirmed' ? undefined : onClick} expanded={level === 'partial' ? open : undefined} />
        {extra}
      </span>
      {open && (
        <span className="absolute right-0 top-full z-20 mt-2 grid w-[min(32rem,88vw)] gap-2 rounded-md border border-dm-border bg-dm-surface p-3 text-left shadow-pop sm:grid-cols-[1fr_9rem_auto]">
          <span className="block">
            <input
              className="field text-label"
              placeholder="Source, e.g. county tax card"
              aria-label={`Source for ${label}`}
              aria-invalid={error}
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setError(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && confirm()}
              autoFocus
            />
            {error && <span className="mt-1 block text-label text-dm-red">Add where this came from</span>}
          </span>
          <input type="date" className="field text-label" value={asOf} onChange={(e) => setAsOf(e.target.value)} aria-label="As-of date" />
          <span className="flex gap-2">
            <button className="btn" onClick={close}>Cancel</button>
            <button className="btn btn-primary" onClick={confirm}>Confirm</button>
          </span>
        </span>
      )}
    </span>
  );
}

/** The source and as-of date for a field, printed inline; an unsourced value says so instead of looking authoritative. */
export function ProvenanceTag({ property, field }: { property: Property; field: SourcedField }) {
  const meta = property.meta?.[field];
  const text = [meta?.source, meta?.asOf ? fmtMonth(meta.asOf) : undefined].filter(Boolean).join(' · ');
  return text ? (
    <span className="text-label text-dm-muted">{text}</span>
  ) : (
    <span className="text-label text-dm-amber underline decoration-dashed underline-offset-2">No source</span>
  );
}
