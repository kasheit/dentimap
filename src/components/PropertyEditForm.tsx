import { useState } from 'react';
import { facilityTypeLabel, statusLabel } from '@/lib/format';
import type { FacilityStatus, FacilityType, FieldMeta, Property, SourcedField, VerificationState } from '@/lib/types';
import { Card } from './Chips';

type Draft = {
  name: string;
  legalName: string;
  dbaName: string;
  facilityType: FacilityType;
  status: FacilityStatus;
  street: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  parcelPin: string;
  parcelUrl: string;
  currentAssessedValue: string;
  projectInvestment: string;
  footprintSqFt: string;
  targetOpening: string;
  operatingRooms: string;
  pacuBays: string;
  outpatientSharePercent: string;
  licensure: string;
  specialties: string;
};

type MetaDraft = Record<SourcedField, FieldMeta>;

const str = (n?: number | string) => (n === undefined ? '' : String(n));
const num = (s: string) => {
  const n = Number(s.replace(/[$,\s]/g, ''));
  return s.trim() !== '' && Number.isFinite(n) ? n : undefined;
};
const text = (s: string) => s.trim() || undefined;
// County is stored as "<Name> County" everywhere so filters and grouping never split "Wake" from "Wake County".
const stripCounty = (s: string) => s.trim().replace(/\s+County$/i, '');
const withCounty = (s: string) => (stripCounty(s) ? `${stripCounty(s)} County` : '');

function toDraft(p: Property): Draft {
  return {
    name: p.name,
    legalName: p.legalName ?? '',
    dbaName: p.dbaName ?? '',
    facilityType: p.facilityType,
    status: p.status,
    street: p.address.street,
    city: p.address.city,
    state: p.address.state,
    zip: p.address.zip,
    county: stripCounty(p.address.county),
    parcelPin: p.address.parcelPin,
    parcelUrl: p.parcelUrl ?? '',
    currentAssessedValue: str(p.metrics?.currentAssessedValue),
    projectInvestment: str(p.metrics?.projectInvestment),
    footprintSqFt: str(p.metrics?.footprintSqFt),
    targetOpening: p.metrics?.targetOpening ?? '',
    operatingRooms: str(p.clinicalSpecs?.operatingRooms),
    pacuBays: str(p.clinicalSpecs?.pacuBays),
    outpatientSharePercent: str(p.clinicalSpecs?.outpatientSharePercent),
    licensure: p.clinicalSpecs?.licensure ?? '',
    specialties: (p.clinicalSpecs?.specialties ?? []).join(', '),
  };
}

const blank: FieldMeta = { state: 'unknown' };
const toMeta = (p: Property): MetaDraft => ({
  parcelPin: p.meta?.parcelPin ?? blank,
  assessedValue: p.meta?.assessedValue ?? blank,
  projectInvestment: p.meta?.projectInvestment ?? blank,
});

function toPatch(d: Draft, meta: MetaDraft, p: Property): Partial<Property> {
  const specialties = d.specialties.split(',').map((s) => s.trim()).filter(Boolean);
  const specs = {
    operatingRooms: num(d.operatingRooms),
    pacuBays: num(d.pacuBays),
    outpatientSharePercent: num(d.outpatientSharePercent),
    licensure: text(d.licensure),
    specialties: specialties.length ? specialties : undefined,
  };
  const metrics = {
    ...p.metrics,
    currentAssessedValue: num(d.currentAssessedValue),
    projectInvestment: num(d.projectInvestment),
    footprintSqFt: num(d.footprintSqFt),
    targetOpening: text(d.targetOpening),
  };
  const hasSpecs = Object.values(specs).some((v) => v !== undefined);
  const keep = (k: SourcedField): FieldMeta | undefined => {
    const m = meta[k];
    const source = m.source?.trim() || undefined;
    return source || m.asOf || m.state !== 'unknown' ? { state: m.state, source, asOf: m.asOf || undefined } : undefined;
  };
  return {
    name: d.name.trim(),
    legalName: text(d.legalName),
    dbaName: text(d.dbaName),
    facilityType: d.facilityType,
    status: d.status,
    address: { street: d.street.trim(), city: d.city.trim(), state: d.state.trim(), zip: d.zip.trim(), county: withCounty(d.county), parcelPin: d.parcelPin.trim() },
    parcelUrl: text(d.parcelUrl),
    metrics,
    meta: { parcelPin: keep('parcelPin'), assessedValue: keep('assessedValue'), projectInvestment: keep('projectInvestment') },
    clinicalSpecs: hasSpecs ? specs : undefined,
  };
}

function Field({ label, span = '', children }: { label: string; span?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${span}`}>
      <span className="label mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function SourceRow({ label, meta, onMeta }: { label: string; meta: FieldMeta; onMeta: (m: FieldMeta) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[7.5rem_1fr_9rem]">
      <select className="field text-[13px]" value={meta.state} onChange={(e) => onMeta({ ...meta, state: e.target.value as VerificationState })} aria-label={`${label} verification`}>
        <option value="unknown">Unsourced</option>
        <option value="unverified">Unverified</option>
        <option value="verified">Verified</option>
      </select>
      <input className="field text-[13px]" placeholder="Source, e.g. Wake Co. tax card" value={meta.source ?? ''} onChange={(e) => onMeta({ ...meta, source: e.target.value })} aria-label={`${label} source`} />
      <input type="date" className="field text-[13px]" value={meta.asOf ?? ''} onChange={(e) => onMeta({ ...meta, asOf: e.target.value })} aria-label={`${label} as-of date`} />
    </div>
  );
}

export function PropertyEditForm({
  property: p,
  onSave,
  onCancel,
  onDelete,
}: {
  property: Property;
  onSave: (patch: Partial<Property>) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [d, setD] = useState<Draft>(() => toDraft(p));
  const [meta, setMeta] = useState<MetaDraft>(() => toMeta(p));
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));
  const setM = (k: SourcedField) => (m: FieldMeta) => setMeta((prev) => ({ ...prev, [k]: m }));
  const input = (k: keyof Draft, extra = '') => (
    <input className={`field ${extra}`} value={d[k]} onChange={(e) => set(k, e.target.value as never)} />
  );
  const canSave = d.name.trim().length > 0;

  return (
    <Card
      id="record"
      title="Edit facility"
      action={
        <div className="flex gap-2">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn" disabled={!canSave} onClick={() => onSave(toPatch(d, meta, p))}>Save changes</button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Facility name (how it appears in Dentimap)" span="sm:col-span-2">{input('name')}</Field>
          <Field label="Legal name (on business documents)">{input('legalName')}</Field>
          <Field label="Doing business as (trade name)">{input('dbaName')}</Field>
          <Field label="Type">
            <select className="field" value={d.facilityType} onChange={(e) => set('facilityType', e.target.value as FacilityType)}>
              {(Object.keys(facilityTypeLabel) as FacilityType[]).map((k) => <option key={k} value={k}>{facilityTypeLabel[k]}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="field" value={d.status} onChange={(e) => set('status', e.target.value as FacilityStatus)}>
              {(Object.keys(statusLabel) as FacilityStatus[]).map((k) => <option key={k} value={k}>{statusLabel[k]}</option>)}
            </select>
          </Field>
        </div>

        <div>
          <h3 className="mb-3 text-[13px] font-semibold">Location</h3>
          <div className="grid gap-4 sm:grid-cols-6">
            <Field label="Street" span="sm:col-span-6">{input('street')}</Field>
            <Field label="City" span="sm:col-span-3">{input('city')}</Field>
            <Field label="State" span="sm:col-span-1">{input('state')}</Field>
            <Field label="ZIP" span="sm:col-span-2">{input('zip')}</Field>
            <Field label="County" span="sm:col-span-3">{input('county')}</Field>
            <Field label="Parcel PIN" span="sm:col-span-3">{input('parcelPin', 'font-mono')}</Field>
            <div className="sm:col-span-6"><SourceRow label="Parcel PIN" meta={meta.parcelPin} onMeta={setM('parcelPin')} /></div>
            <Field label="County parcel record link (optional)" span="sm:col-span-6">{input('parcelUrl')}</Field>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-[13px] font-semibold">Values</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Field label="Assessed value ($)">{input('currentAssessedValue', 'tnum')}</Field>
              <SourceRow label="Assessed value" meta={meta.assessedValue} onMeta={setM('assessedValue')} />
            </div>
            <div className="space-y-2">
              <Field label="Project investment ($)">{input('projectInvestment', 'tnum')}</Field>
              <SourceRow label="Project investment" meta={meta.projectInvestment} onMeta={setM('projectInvestment')} />
            </div>
            <Field label="Footprint (sq ft)">{input('footprintSqFt', 'tnum')}</Field>
            <Field label="Target opening">{input('targetOpening')}</Field>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-[13px] font-semibold">Specifications</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Operating rooms">{input('operatingRooms', 'tnum')}</Field>
            <Field label="PACU bays">{input('pacuBays', 'tnum')}</Field>
            <Field label="Outpatient share (%)">{input('outpatientSharePercent', 'tnum')}</Field>
            <Field label="Licensure" span="sm:col-span-3">{input('licensure')}</Field>
            <Field label="Services (comma-separated)" span="sm:col-span-3">{input('specialties')}</Field>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span />
          {onDelete && (
            <button className="btn text-dm-red hover:text-dm-red" onClick={onDelete}>
              Delete facility
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
