import { useState } from 'react';
import { AlertTriangle, ClipboardPaste, Plus, Sparkles, X } from 'lucide-react';
import { checkExcise, expectedExcise, parseCountyDeedClipboard, SAMPLE_PASTE } from '@/lib/deedParser';
import type { ParsedDeedResult } from '@/lib/deedParser';
import { deedTypeLabel } from '@/lib/format';
import { useDentimap } from '@/lib/store';
import type { DeedRecord, DeedType, Property, VerificationState } from '@/lib/types';
import { FormulaChip } from './Chips';

interface Draft {
  recordingDate: string;
  deedType: DeedType;
  grantor: string;
  grantee: string;
  consideration: string;
  exciseTaxStamps: string;
  instrumentNumber: string;
  book: string;
  page: string;
  confidence: VerificationState;
  source: string;
}

const toDraft = (r: ParsedDeedResult): Draft => ({
  recordingDate: r.recordingDate ?? '',
  deedType: r.deedType,
  grantor: r.grantor ?? '',
  grantee: r.grantee ?? '',
  consideration: r.consideration?.toString() ?? '',
  exciseTaxStamps: r.exciseTaxStamps?.toString() ?? '',
  instrumentNumber: r.instrumentNumber ?? '',
  book: r.book ?? '',
  page: r.page ?? '',
  confidence: 'unverified',
  source: 'Pasted from county record',
});

const num = (s: string) => (s.trim() === '' || isNaN(Number(s)) ? undefined : Number(s));

function Token({ label, value }: { label: string; value?: string | number }) {
  const found = value !== undefined && value !== '';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 tnum text-[11px] ${
        found ? 'border-dm-blue/25 bg-dm-blue/[0.06] text-dm-blue' : 'border-dm-border text-dm-dim line-through decoration-dm-border'
      }`}
    >
      <span className="text-dm-dim no-underline">{label}</span>
      {found ? value : 'not found'}
    </span>
  );
}

export function DeedIngestionBuffer({ property }: { property: Property }) {
  const addDeed = useDentimap((s) => s.addDeed);
  const [raw, setRaw] = useState('');
  const [parsed, setParsed] = useState<ParsedDeedResult | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const parse = (text: string) => {
    const r = parseCountyDeedClipboard(text);
    setParsed(r);
    setDraft(toDraft(r));
  };

  const clear = () => {
    setRaw('');
    setParsed(null);
    setDraft(null);
  };

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const consideration = draft ? num(draft.consideration) : undefined;
  const stamps = draft ? num(draft.exciseTaxStamps) : undefined;
  const canCheck = consideration !== undefined && stamps !== undefined;
  const ok = canCheck && checkExcise(consideration, stamps);
  const canAdd = !!draft && /^\d{4}-\d{2}-\d{2}$/.test(draft.recordingDate) && draft.grantor.trim() !== '' && draft.grantee.trim() !== '';
  const pinMismatch =
    parsed?.parcelPin && property.address.parcelPin && parsed.parcelPin.replace(/\W/g, '') !== property.address.parcelPin.replace(/\W/g, '');

  const commit = () => {
    if (!draft || !canAdd) return;
    const c = consideration ?? 0;
    const s = stamps ?? 0;
    const deed: DeedRecord = {
      id: `deed-${Date.now().toString(36)}`,
      propertyId: property.id,
      recordingDate: draft.recordingDate,
      instrumentNumber: draft.instrumentNumber.trim() || undefined,
      book: draft.book.trim() || undefined,
      page: draft.page.trim() || undefined,
      deedType: draft.deedType,
      grantor: draft.grantor.trim(),
      grantee: draft.grantee.trim(),
      consideration: c,
      exciseTaxStamps: s,
      isFormulaVerified: checkExcise(c, s),
      confidence: draft.confidence,
      source: draft.source.trim() || 'Pasted from county record',
    };
    addDeed(deed);
    clear();
  };

  return (
    <div className="rounded-lg border border-dm-border bg-dm-bg">
      <div className="flex items-center justify-between gap-3 border-b border-dm-border px-4 py-2.5">
        <span className="flex items-center gap-2 text-xs font-medium text-dm-muted">
          <ClipboardPaste className="h-3.5 w-3.5" /> Paste county record
        </span>
        <button
          className="text-[11px] text-dm-blue transition-colors hover:text-dm-text"
          onClick={() => {
            setRaw(SAMPLE_PASTE);
            parse(SAMPLE_PASTE);
          }}
        >
          Load example
        </button>
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
          placeholder="Paste text copied from a County Register of Deeds or Tax Assessor page — recording date, book/page, grantor, grantee, consideration, excise tax…"
          className="field scroll-thin resize-y font-mono text-xs leading-relaxed"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn btn-primary" disabled={!raw.trim()} onClick={() => parse(raw)}>
            <Sparkles className="h-3.5 w-3.5" /> Parse
          </button>
          {(raw || draft) && (
            <button className="btn" onClick={clear}>
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        {parsed && draft && (
          <div className="space-y-4 border-t border-dm-border pt-4">
            <div className="flex flex-wrap gap-1.5">
              <Token label="date" value={parsed.recordingDate} />
              <Token label="type" value={deedTypeLabel[parsed.deedType]} />
              <Token label="inst" value={parsed.instrumentNumber} />
              <Token label="book/pg" value={parsed.book && parsed.page ? `${parsed.book}/${parsed.page}` : undefined} />
              <Token label="grantor" value={parsed.grantor} />
              <Token label="grantee" value={parsed.grantee} />
              <Token label="consid." value={parsed.consideration?.toLocaleString('en-US')} />
              <Token label="excise" value={parsed.exciseTaxStamps?.toLocaleString('en-US')} />
              <Token label="pin" value={parsed.parcelPin} />
            </div>

            {pinMismatch && (
              <p className="flex items-start gap-2 rounded-md border border-dm-amber/30 bg-dm-amber/10 px-3 py-2 text-xs text-dm-amber">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Parsed parcel PIN {parsed.parcelPin} does not match this facility’s PIN ({property.address.parcelPin}). Check that you’re adding this to the right property.
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1">
                <span className="label">Recording date</span>
                <input type="date" className="field tnum" value={draft.recordingDate} onChange={(e) => set('recordingDate', e.target.value)} />
              </label>
              <label className="space-y-1">
                <span className="label">Deed type</span>
                <select className="field" value={draft.deedType} onChange={(e) => set('deedType', e.target.value as DeedType)}>
                  {Object.entries(deedTypeLabel).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="label">Confidence</span>
                <select className="field" value={draft.confidence} onChange={(e) => set('confidence', e.target.value as VerificationState)}>
                  <option value="unverified">Unverified</option>
                  <option value="verified">Verified</option>
                  <option value="unknown">Unknown</option>
                </select>
              </label>
              <label className="space-y-1 sm:col-span-1">
                <span className="label">Grantor (seller)</span>
                <input className="field" value={draft.grantor} onChange={(e) => set('grantor', e.target.value)} />
              </label>
              <label className="space-y-1 sm:col-span-1 lg:col-span-2">
                <span className="label">Grantee (buyer)</span>
                <input className="field" value={draft.grantee} onChange={(e) => set('grantee', e.target.value)} />
              </label>
              <label className="space-y-1">
                <span className="label">Consideration (USD)</span>
                <input inputMode="decimal" className="field tnum" value={draft.consideration} onChange={(e) => set('consideration', e.target.value)} />
              </label>
              <label className="space-y-1">
                <span className="label">Excise stamps (USD)</span>
                <input inputMode="decimal" className="field tnum" value={draft.exciseTaxStamps} onChange={(e) => set('exciseTaxStamps', e.target.value)} />
              </label>
              <label className="space-y-1">
                <span className="label">Instrument #</span>
                <input className="field font-mono text-[13px]" value={draft.instrumentNumber} onChange={(e) => set('instrumentNumber', e.target.value)} />
              </label>
              <label className="space-y-1">
                <span className="label">Book</span>
                <input className="field font-mono text-[13px]" value={draft.book} onChange={(e) => set('book', e.target.value)} />
              </label>
              <label className="space-y-1">
                <span className="label">Page</span>
                <input className="field font-mono text-[13px]" value={draft.page} onChange={(e) => set('page', e.target.value)} />
              </label>
              <label className="space-y-1 sm:col-span-2 lg:col-span-2">
                <span className="label">Source</span>
                <input className="field" value={draft.source} onChange={(e) => set('source', e.target.value)} />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {canCheck ? (
                <FormulaChip consideration={consideration} stamps={stamps} ok={!!ok} expected={expectedExcise(consideration)} />
              ) : (
                <span className="tnum text-[11px] text-dm-dim">Enter consideration and excise stamps to check the $1 / $500 formula.</span>
              )}
              <button className="btn btn-primary" disabled={!canAdd} onClick={commit} title={canAdd ? '' : 'Needs a recording date, grantor and grantee'}>
                <Plus className="h-3.5 w-3.5" /> Add to title chain
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
