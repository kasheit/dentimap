import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { canSaveDraft, DeedForm, draftFromDeed, draftToDeed } from './DeedForm';
import type { Draft } from './DeedForm';
import type { DeedRecord } from '@/lib/types';
import { fmtDate } from '@/lib/format';

/** Side sheet for editing or adding one deed, so the chain and the rows stay where they are. */
export function DeedSheet({
  deed,
  isNew = false,
  hint,
  onSave,
  onClose,
}: {
  deed: DeedRecord;
  isNew?: boolean;
  hint?: string;
  onSave: (next: DeedRecord) => void;
  onClose: () => void;
}) {
  const initial = useMemo(() => draftFromDeed(deed), [deed]);
  const [draft, setDraft] = useState<Draft>(initial);
  const [confirming, setConfirming] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const valid = canSaveDraft(draft);
  const save = () => valid && onSave(draftToDeed(draft, deed));
  const attemptClose = () => (dirty ? setConfirming(true) : closeRef.current());
  const attemptRef = useRef(attemptClose);
  attemptRef.current = attemptClose;
  const saveRef = useRef(save);
  saveRef.current = save;

  // focus in on open, back to the opener on close (runs once, so typing is never interrupted)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    sheetRef.current?.querySelector<HTMLElement>('input, select, textarea')?.focus();
    return () => previous?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        attemptRef.current();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        saveRef.current();
      } else if (e.key === 'Tab' && sheetRef.current) {
        const focusable = [...sheetRef.current.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])')].filter((el) => !el.hasAttribute('disabled'));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !sheetRef.current.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !sheetRef.current.contains(active))) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onMouseDown={() => attemptRef.current()}>
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? 'Add missing deed' : `Edit deed recorded ${fmtDate(deed.recordingDate)}`}
        className="animate-sheet-in flex h-full w-[min(36rem,100vw)] flex-col border-l border-dm-border bg-dm-surface shadow-pop"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-dm-border px-5 py-3">
          <div className="min-w-0">
            <h2 className="text-body font-semibold">{isNew ? 'Add missing deed' : 'Edit deed'}</h2>
            <p className="tnum truncate text-label text-dm-muted">
              {isNew ? hint : `${fmtDate(deed.recordingDate)} · ${deed.grantor} to ${deed.grantee}`}
            </p>
          </div>
          <button className="rounded p-1.5 text-dm-muted transition-colors hover:bg-dm-hover hover:text-dm-text" onClick={attemptClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="scroll-thin flex-1 overflow-y-auto p-5">
          <DeedForm draft={draft} onChange={setDraft} withConfidence />
        </div>
        <footer className="border-t border-dm-border px-5 py-3">
          {confirming ? (
            <div role="alertdialog" aria-label="Discard changes" className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-label text-dm-muted">Discard your changes to this deed?</span>
              <span className="flex gap-2">
                <button className="btn" onClick={() => setConfirming(false)} autoFocus>
                  Keep editing
                </button>
                <button className="btn border-dm-red/40 text-dm-red" onClick={() => closeRef.current()}>
                  Discard
                </button>
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <span className="text-label text-dm-dim">{valid ? 'Ctrl+Enter saves' : 'Needs a recording date, grantor and grantee'}</span>
              <span className="flex gap-2">
                <button className="btn" onClick={attemptClose}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={save} aria-disabled={!valid} disabled={!valid}>
                  {isNew ? 'Add deed' : 'Save deed'}
                </button>
              </span>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
