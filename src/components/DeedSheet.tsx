import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { canSaveDraft, DeedForm, draftFromDeed, draftToDeed } from './DeedForm';
import type { Draft } from './DeedForm';
import type { DeedRecord } from '@/lib/types';
import { useState } from 'react';
import { fmtDate } from '@/lib/format';

/** Side sheet for editing one deed, so the chain and the rows stay where they are. */
export function DeedSheet({ deed, onSave, onClose }: { deed: DeedRecord; onSave: (next: DeedRecord) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<Draft>(() => draftFromDeed(deed));
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    sheetRef.current?.querySelector<HTMLElement>('input, select, textarea')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onMouseDown={onClose}>
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Edit deed recorded ${fmtDate(deed.recordingDate)}`}
        className="animate-sheet-in flex h-full w-[min(34rem,100vw)] flex-col border-l border-dm-border bg-dm-surface shadow-pop"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-dm-border px-5 py-3">
          <div className="min-w-0">
            <h2 className="text-body font-semibold">Edit deed</h2>
            <p className="tnum truncate text-label text-dm-muted">
              {fmtDate(deed.recordingDate)} &middot; {deed.grantor} to {deed.grantee}
            </p>
          </div>
          <button className="rounded p-1.5 text-dm-muted transition-colors hover:bg-dm-hover hover:text-dm-text" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="scroll-thin flex-1 overflow-y-auto p-5">
          <DeedForm draft={draft} onChange={setDraft} withConfidence />
        </div>
        <footer className="flex justify-end gap-2 border-t border-dm-border px-5 py-3">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={!canSaveDraft(draft)} onClick={() => onSave(draftToDeed(draft, deed))}>
            Save deed
          </button>
        </footer>
      </div>
    </div>
  );
}
