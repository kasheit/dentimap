import { useState } from 'react';
import { isStale, levelFor } from '@/lib/completion';
import { fmtDate, fmtMonth } from '@/lib/format';
import { useDentimap } from '@/lib/store';
import type { Property, SourcedField } from '@/lib/types';
import { LevelLabel } from './Chips';

export const EDIT_RECORD_EVENT = 'dentimap:edit-record';

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Confirmation status for one detail. Green is confirmed from records; yellow (or a verified
 * date older than a year) is click-to-confirm; red means nothing is there yet and opens the editor.
 */
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
      window.dispatchEvent(new Event(EDIT_RECORD_EVENT));
      return;
    }
    setSource(meta?.source ?? '');
    setAsOf(today());
    setOpen((o) => !o);
  };

  const confirm = () => {
    updateProperty(
      property.id,
      { meta: { ...property.meta, [field]: { state: 'verified', source: source.trim() || undefined, asOf: asOf || undefined } } },
      `Confirmed ${label}`,
    );
    setOpen(false);
  };

  return (
    <span className="relative inline-block">
      <span className="inline-flex items-center gap-3" title={has ? full : undefined}>
        <LevelLabel level={level} stale={stale} detail={has && showDetail ? detail : undefined} onClick={level === 'confirmed' ? undefined : onClick} />
        {extra}
      </span>
      {open && (
        <span className="absolute right-0 top-full z-20 mt-2 grid w-[min(32rem,88vw)] gap-2 rounded-md border border-dm-border bg-dm-surface p-3 text-left shadow-lg shadow-dm-text/15 sm:grid-cols-[1fr_9rem_auto]">
          <input className="field text-label" placeholder="Source, e.g. county tax card" value={source} onChange={(e) => setSource(e.target.value)} autoFocus />
          <input type="date" className="field text-label" value={asOf} onChange={(e) => setAsOf(e.target.value)} aria-label="As-of date" />
          <span className="flex gap-2">
            <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={confirm}>Confirm</button>
          </span>
        </span>
      )}
    </span>
  );
}
