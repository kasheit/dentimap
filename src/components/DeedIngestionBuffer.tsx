import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { parseCountyDeedClipboard, splitDeedBlocks } from '@/lib/deedParser';
import type { ParsedDeedResult } from '@/lib/deedParser';
import { deedTypeLabel } from '@/lib/format';
import { newId, useDentimap } from '@/lib/store';
import type { Property } from '@/lib/types';
import { canSaveDraft, DeedForm, draftFromParsed, draftToDeed } from './DeedForm';
import type { Draft } from './DeedForm';

function Token({ label, value }: { label: string; value?: string | number }) {
  const found = value !== undefined && value !== '';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[12px] ${
        found ? 'border-dm-border bg-dm-surface text-dm-text' : 'border-dm-border/60 text-dm-dim'
      }`}
    >
      <span className="text-dm-dim">{label}</span>
      {found ? value : 'not found'}
    </span>
  );
}

export function DeedIngestionBuffer({ property }: { property: Property }) {
  const addDeed = useDentimap((s) => s.addDeed);
  const [raw, setRaw] = useState('');
  const [queue, setQueue] = useState<ParsedDeedResult[]>([]);
  const [total, setTotal] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);

  const parsed = queue[0];

  const load = (q: ParsedDeedResult[]) => {
    setQueue(q);
    setTotal(q.length);
    setDraft(q[0] ? draftFromParsed(q[0]) : null);
  };

  const parse = (text: string) => {
    // Blocks with nothing recognisable (no party, price or date) are dropped when there are several.
    const results = splitDeedBlocks(text).map(parseCountyDeedClipboard);
    const useful = results.filter((r) => r.grantor || r.grantee || r.consideration !== undefined || r.recordingDate);
    load(useful.length ? useful : results.slice(0, 1));
  };

  const clear = () => {
    setRaw('');
    setQueue([]);
    setTotal(0);
    setDraft(null);
  };

  const advance = () => {
    const rest = queue.slice(1);
    if (!rest.length) return clear();
    setQueue(rest);
    setDraft(draftFromParsed(rest[0]));
  };

  const pinMismatch =
    parsed?.parcelPin && property.address.parcelPin && parsed.parcelPin.replace(/\W/g, '') !== property.address.parcelPin.replace(/\W/g, '');

  const commit = () => {
    if (!draft || !canSaveDraft(draft)) return;
    addDeed(draftToDeed(draft, { id: newId('deed'), propertyId: property.id }));
    advance();
  };

  return (
    <div className="rounded-lg border border-dm-border bg-dm-bg">
      <div className="flex items-center justify-between gap-3 border-b border-dm-border px-4 py-2.5">
        <span className="text-[13px] font-medium text-dm-muted">Paste county record</span>
      </div>
      <div className="space-y-3 p-4">
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onPaste={(e) => {
            const t = e.clipboardData.getData('text');
            if (t) {
              e.preventDefault();
              setRaw(t);
              parse(t);
            }
          }}
          rows={5}
          spellCheck={false}
          placeholder="Paste a deed record"
          className="field scroll-thin resize-y font-mono text-xs leading-relaxed"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn" disabled={!raw.trim()} onClick={() => parse(raw)}>
            Parse
          </button>
          {(raw || draft) && (
            <button className="btn" onClick={clear}>
              Clear
            </button>
          )}
        </div>

        {parsed && draft && (
          <div className="space-y-4 border-t border-dm-border pt-4">
            {total > 1 && (
              <div className="flex items-center justify-between text-[13px] text-dm-muted">
                <span>
                  Record {total - queue.length + 1} of {total}
                </span>
                <button className="btn" onClick={advance}>
                  Skip this one
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              <Token label="date" value={parsed.recordingDate} />
              <Token label="type" value={deedTypeLabel[parsed.deedType]} />
              <Token label="instrument" value={parsed.instrumentNumber} />
              <Token label="book/page" value={parsed.book && parsed.page ? `${parsed.book}/${parsed.page}` : undefined} />
              <Token label="grantor" value={parsed.grantor} />
              <Token label="grantee" value={parsed.grantee} />
              <Token label="consideration" value={parsed.consideration?.toLocaleString('en-US')} />
              <Token label="excise" value={parsed.exciseTaxStamps?.toLocaleString('en-US')} />
              <Token label="PIN" value={parsed.parcelPin} />
            </div>

            {pinMismatch && (
              <p className="flex items-start gap-2 rounded-md border border-dm-amber/30 bg-dm-amber/10 px-3 py-2 text-[13px] text-dm-amber">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Parsed parcel PIN {parsed.parcelPin} does not match this facility’s PIN ({property.address.parcelPin}). Check that you’re adding this to the right property.
              </p>
            )}

            <DeedForm draft={draft} onChange={setDraft} />

            <div className="flex justify-end">
              <button className="btn btn-primary" disabled={!canSaveDraft(draft)} onClick={commit} title={canSaveDraft(draft) ? '' : 'Needs a recording date, grantor and grantee'}>
                Add to title chain
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
