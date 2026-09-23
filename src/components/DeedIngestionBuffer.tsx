import { useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { parseCountyDeedClipboard, splitDeedBlocks } from '@/lib/deedParser';
import type { ParsedDeedResult } from '@/lib/deedParser';
import { deedTypeLabel, fmtDate } from '@/lib/format';
import { isSupportedDocument, readDocumentText } from '@/lib/documents';
import { isImageFile } from '@/lib/ocr';
import { newId, useDentimap } from '@/lib/store';
import type { Property } from '@/lib/types';
import { describeFound, propertyPatch } from '@/lib/countyPage';
import { canSaveDraft, DeedForm, draftFromParsed, draftToDeed } from './DeedForm';
import type { Draft } from './DeedForm';

function Token({ label, value }: { label: string; value?: string | number }) {
  const found = value !== undefined && value !== '';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-label ${
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
  const updateProperty = useDentimap((s) => s.updateProperty);
  const fileRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState<number | null>(null);
  const [fromImage, setFromImage] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const [raw, setRaw] = useState('');
  const [queue, setQueue] = useState<ParsedDeedResult[]>([]);
  const [total, setTotal] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);

  const parsed = queue[0];
  const foundLabels = parsed ? describeFound(parsed) : [];

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

  const readImage = async (file: File) => {
    setOcrError(null);
    setReading(0);
    try {
      const text = await readDocumentText(file, setReading);
      setRaw(text);
      parse(text);
      setFromImage(true);
      setApplied(false);
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : 'Could not read that file.');
    } finally {
      setReading(null);
    }
  };

  const clear = () => {
    setFromImage(false);
    setApplied(false);
    setOcrError(null);
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
        <span className="text-label font-medium text-dm-muted">Paste a deed or county page</span>
      </div>
      <div className="space-y-3 p-4">
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const img = [...e.dataTransfer.files].find(isSupportedDocument);
            if (img) {
              e.preventDefault();
              readImage(img);
            }
          }}
          onPaste={(e) => {
            const img = [...e.clipboardData.files].find(isImageFile);
            if (img) {
              e.preventDefault();
              readImage(img);
              return;
            }
            const t = e.clipboardData.getData('text');
            if (t) {
              e.preventDefault();
              setRaw(t);
              parse(t);
            }
          }}
          rows={5}
          spellCheck={false}
          placeholder="Paste a deed record, or paste or drop a screenshot"
          className="field scroll-thin resize-y font-mono text-label leading-relaxed"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn" disabled={!raw.trim() || reading !== null} onClick={() => parse(raw)}>
            Read fields
          </button>
          <input ref={fileRef} type="file" accept="image/*,application/pdf,text/plain,.pdf,.txt" hidden onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) readImage(f);
            if (fileRef.current) fileRef.current.value = '';
          }} />
          <button className="btn" disabled={reading !== null} onClick={() => fileRef.current?.click()}>
            Upload file
          </button>
          {reading !== null && <span className="text-label text-dm-muted">Reading file… {Math.round(reading * 100)}%</span>}
          {(raw || draft) && (
            <button className="btn" onClick={clear}>
              Clear
            </button>
          )}
        </div>

        {ocrError && <p className="text-label text-dm-red">{ocrError}</p>}

        {parsed && draft && (
          <div className="space-y-4 border-t border-dm-border pt-4">
            {fromImage && <p className="text-label text-dm-muted">Read from a file. Check every field against the original before adding.</p>}
            {parsed.saleDate && parsed.recordingDate && parsed.saleDate !== parsed.recordingDate && (
              <p className="flex items-start gap-2 rounded-md border border-dm-amber/30 bg-dm-amber/10 px-3 py-2 text-label text-dm-amber">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                This page shows a sale on {fmtDate(parsed.saleDate)} and a deed dated {fmtDate(parsed.recordingDate)}. The price may belong to the sale, not that deed. Check it before adding.
              </p>
            )}
            {!applied && foundLabels.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dm-border px-3 py-2.5 text-label">
                <span className="text-dm-muted">Also found on this page: {foundLabels.join(' · ')}</span>
                <button
                  className="btn"
                  onClick={() => {
                    updateProperty(property.id, propertyPatch(parsed, property), 'Details applied from a county record');
                    setApplied(true);
                  }}
                >
                  Update location details
                </button>
              </div>
            )}
            {total > 1 && (
              <div className="flex items-center justify-between text-label text-dm-muted">
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
              <p className="flex items-start gap-2 rounded-md border border-dm-amber/30 bg-dm-amber/10 px-3 py-2 text-label text-dm-amber">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Parsed parcel PIN {parsed.parcelPin} does not match this location’s PIN ({property.address.parcelPin}). Check that you’re adding this to the right property.
              </p>
            )}

            <DeedForm draft={draft} onChange={setDraft} />

            <div className="flex justify-end">
              <button className="btn btn-primary" disabled={!canSaveDraft(draft)} onClick={commit} title={canSaveDraft(draft) ? '' : 'Needs a recording date, grantor and grantee'}>
                Save deed to title chain
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
