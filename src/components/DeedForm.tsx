import { checkExcise, expectedExcise } from '@/lib/deedParser';
import type { ParsedDeedResult } from '@/lib/deedParser';
import { deedTypeLabel } from '@/lib/format';
import type { DeedRecord, DeedType, VerificationState } from '@/lib/types';
import { FormulaChip } from './Chips';
import { PartyPicker } from './PartyPicker';
import type { PartyValue } from './PartyPicker';

export interface Draft {
  recordingDate: string;
  deedType: DeedType;
  grantor: string;
  grantorEntityId?: string;
  grantorPersonId?: string;
  grantee: string;
  granteeEntityId?: string;
  granteePersonId?: string;
  consideration: string;
  exciseTaxStamps: string;
  instrumentNumber: string;
  book: string;
  page: string;
  confidence: VerificationState;
  source: string;
  documentUrl: string;
}

export const draftFromParsed = (r: ParsedDeedResult): Draft => ({
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
  source: '',
  documentUrl: '',
});

export const draftFromDeed = (d: DeedRecord): Draft => ({
  recordingDate: d.recordingDate,
  deedType: d.deedType,
  grantor: d.grantor,
  grantorEntityId: d.grantorEntityId,
  grantorPersonId: d.grantorPersonId,
  grantee: d.grantee,
  granteeEntityId: d.granteeEntityId,
  granteePersonId: d.granteePersonId,
  consideration: String(d.consideration),
  exciseTaxStamps: String(d.exciseTaxStamps),
  instrumentNumber: d.instrumentNumber ?? '',
  book: d.book ?? '',
  page: d.page ?? '',
  confidence: d.confidence,
  source: d.source,
  documentUrl: d.documentUrl ?? '',
});

const num = (s: string) => (s.trim() === '' || isNaN(Number(s)) ? undefined : Number(s));

export const canSaveDraft = (d: Draft) =>
  /^\d{4}-\d{2}-\d{2}$/.test(d.recordingDate) && d.grantor.trim() !== '' && d.grantee.trim() !== '';

export function draftToDeed(d: Draft, base: Pick<DeedRecord, 'id' | 'propertyId'> & Partial<DeedRecord>): DeedRecord {
  const c = num(d.consideration) ?? 0;
  const s = num(d.exciseTaxStamps) ?? 0;
  return {
    ...base,
    recordingDate: d.recordingDate,
    instrumentNumber: d.instrumentNumber.trim() || undefined,
    book: d.book.trim() || undefined,
    page: d.page.trim() || undefined,
    deedType: d.deedType,
    grantor: d.grantor.trim(),
    grantorEntityId: d.grantorEntityId,
    grantorPersonId: d.grantorPersonId,
    grantee: d.grantee.trim(),
    granteeEntityId: d.granteeEntityId,
    granteePersonId: d.granteePersonId,
    consideration: c,
    exciseTaxStamps: s,
    isFormulaVerified: checkExcise(c, s),
    confidence: d.confidence,
    source: d.source.trim(),
    documentUrl: d.documentUrl.trim() || undefined,
  };
}

export function DeedForm({ draft, onChange, withConfidence }: { draft: Draft; onChange: (d: Draft) => void; withConfidence?: boolean }) {
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...draft, [k]: v });
  const c = num(draft.consideration);
  const s = num(draft.exciseTaxStamps);
  const canCheck = c !== undefined && s !== undefined;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-1">
          <span className="label">Recording date</span>
          <input type="date" className="field" value={draft.recordingDate} onChange={(e) => set('recordingDate', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="label">Deed type</span>
          <select className="field" value={draft.deedType} onChange={(e) => set('deedType', e.target.value as DeedType)}>
            {Object.entries(deedTypeLabel).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        {withConfidence ? (
          <label className="space-y-1">
            <span className="label">Verification</span>
            <select className="field" value={draft.confidence} onChange={(e) => set('confidence', e.target.value as VerificationState)}>
              <option value="unverified">Unverified</option>
              <option value="verified">Verified</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
        ) : (
          <span />
        )}
        <PartyPicker
          label="Grantor"
          value={{ name: draft.grantor, entityId: draft.grantorEntityId, personId: draft.grantorPersonId }}
          onChange={(v: PartyValue) => onChange({ ...draft, grantor: v.name, grantorEntityId: v.entityId, grantorPersonId: v.personId })}
        />
        <div className="lg:col-span-2">
          <PartyPicker
            label="Grantee"
            value={{ name: draft.grantee, entityId: draft.granteeEntityId, personId: draft.granteePersonId }}
            onChange={(v: PartyValue) => onChange({ ...draft, grantee: v.name, granteeEntityId: v.entityId, granteePersonId: v.personId })}
          />
        </div>
        <label className="space-y-1">
          <span className="label">Consideration</span>
          <input inputMode="decimal" className="field tnum" value={draft.consideration} onChange={(e) => set('consideration', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="label">Excise stamps</span>
          <input inputMode="decimal" className="field tnum" value={draft.exciseTaxStamps} onChange={(e) => set('exciseTaxStamps', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="label">Instrument #</span>
          <input className="field font-mono text-label" value={draft.instrumentNumber} onChange={(e) => set('instrumentNumber', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="label">Book</span>
          <input className="field font-mono text-label" value={draft.book} onChange={(e) => set('book', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="label">Page</span>
          <input className="field font-mono text-label" value={draft.page} onChange={(e) => set('page', e.target.value)} />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="label">Source (optional)</span>
          <input className="field" value={draft.source} onChange={(e) => set('source', e.target.value)} />
        </label>
        <label className="space-y-1 sm:col-span-2 lg:col-span-3">
          <span className="label">Document link</span>
          <input className="field text-label" placeholder="https://… link to the recorded instrument" value={draft.documentUrl} onChange={(e) => set('documentUrl', e.target.value)} />
        </label>
      </div>
      <div>
        {canCheck && !checkExcise(c, s) && <FormulaChip consideration={c} stamps={s} ok={false} expected={expectedExcise(c)} />}
      </div>
    </div>
  );
}
