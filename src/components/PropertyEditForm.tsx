import { useState } from 'react';
import { facilityTypeLabel, statusLabel } from '@/lib/format';
import type { FacilityStatus, FacilityType, FieldMeta, Property, SourcedField, VerificationState } from '@/lib/types';
import { Panel } from './Chips';

type Draft = {
  name: string;
  legalName: string;
  dbaName: string;
  sosId: string;
  firstFilingDate: string;
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
  landValue: string;
  buildingValue: string;
  footprintSqFt: string;
  targetOpening: string;
  reid: string;
  landClass: string;
  ownerName: string;
  ownerMailing: string;
  saleDate: string;
  salePrice: string;
  deedBook: string;
  deedPage: string;
  deedDate: string;
  deedAcres: string;
  deedDescription: string;
  heatedArea: string;
  yearBuilt: string;
  useType: string;
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
    sosId: p.sosId ?? '',
    firstFilingDate: p.firstFilingDate ?? '',
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
    landValue: str(p.metrics?.landValue),
    buildingValue: str(p.metrics?.buildingValue),
    footprintSqFt: str(p.metrics?.footprintSqFt),
    targetOpening: p.metrics?.targetOpening ?? '',
    reid: p.reid ?? '',
    landClass: p.landClass ?? '',
    ownerName: p.countyOwner?.name ?? '',
    ownerMailing: p.countyOwner?.mailing ?? '',
    saleDate: p.lastSale?.date ?? '',
    salePrice: str(p.lastSale?.price),
    deedBook: p.countyDeed?.book ?? '',
    deedPage: p.countyDeed?.page ?? '',
    deedDate: p.countyDeed?.date ?? '',
    deedAcres: str(p.countyDeed?.acres),
    deedDescription: p.countyDeed?.description ?? '',
    heatedArea: str(p.building?.heatedAreaSqFt),
    yearBuilt: str(p.building?.yearBuilt),
    useType: p.building?.useType ?? '',
    operatingRooms: str(p.clinicalSpecs?.operatingRooms),
    pacuBays: str(p.clinicalSpecs?.pacuBays),
    outpatientSharePercent: str(p.clinicalSpecs?.outpatientSharePercent),
    licensure: p.clinicalSpecs?.licensure ?? '',
    specialties: (p.clinicalSpecs?.specialties ?? []).join(', '),
  };
}

const blank: FieldMeta = { state: 'unknown' };
const META_KEYS: SourcedField[] = ['legalName', 'dbaName', 'sosId', 'firstFilingDate', 'address', 'county', 'parcelPin', 'assessedValue', 'projectInvestment', 'landlord', 'operator'];
const toMeta = (p: Property): MetaDraft =>
  Object.fromEntries(META_KEYS.map((k) => [k, p.meta?.[k] ?? blank])) as MetaDraft;

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
    landValue: num(d.landValue),
    buildingValue: num(d.buildingValue),
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
    sosId: text(d.sosId),
    firstFilingDate: text(d.firstFilingDate),
    facilityType: d.facilityType,
    status: d.status,
    address: { street: d.street.trim(), city: d.city.trim(), state: d.state.trim(), zip: d.zip.trim(), county: withCounty(d.county), parcelPin: d.parcelPin.trim() },
    parcelUrl: text(d.parcelUrl),
    reid: text(d.reid),
    landClass: text(d.landClass),
    countyOwner: d.ownerName.trim() || d.ownerMailing.trim() ? { name: text(d.ownerName), mailing: text(d.ownerMailing) } : undefined,
    lastSale: d.saleDate || d.salePrice.trim() ? { date: text(d.saleDate), price: num(d.salePrice) } : undefined,
    countyDeed:
      d.deedBook.trim() || d.deedPage.trim() || d.deedDate || d.deedAcres.trim() || d.deedDescription.trim()
        ? { book: text(d.deedBook), page: text(d.deedPage), date: text(d.deedDate), acres: num(d.deedAcres), description: text(d.deedDescription) }
        : undefined,
    building:
      d.heatedArea.trim() || d.yearBuilt.trim() || d.useType.trim()
        ? { heatedAreaSqFt: num(d.heatedArea), yearBuilt: num(d.yearBuilt), useType: text(d.useType) }
        : undefined,
    metrics,
    meta: Object.fromEntries(META_KEYS.map((k) => [k, keep(k)]).filter(([, v]) => v !== undefined)) as Property['meta'],
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
      <select className="field text-label" value={meta.state} onChange={(e) => onMeta({ ...meta, state: e.target.value as VerificationState })} aria-label={`${label} verification`}>
        <option value="unknown">Unsourced</option>
        <option value="unverified">Unverified</option>
        <option value="verified">Verified</option>
      </select>
      <input className="field text-label" placeholder="Source, e.g. Wake Co. tax card" value={meta.source ?? ''} onChange={(e) => onMeta({ ...meta, source: e.target.value })} aria-label={`${label} source`} />
      <input type="date" className="field text-label" value={meta.asOf ?? ''} onChange={(e) => onMeta({ ...meta, asOf: e.target.value })} aria-label={`${label} as-of date`} />
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
    <Panel
      id="record"
      className="col-span-full"
      title="Edit location"
      action={
        <div className="flex gap-2">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" disabled={!canSave} onClick={() => onSave(toPatch(d, meta, p))}>Save changes</button>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
        <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" span="sm:col-span-2">{input('name')}</Field>
          <div className="space-y-2">
            <Field label="Legal name">{input('legalName')}</Field>
            <SourceRow label="Legal name" meta={meta.legalName} onMeta={setM('legalName')} />
          </div>
          <div className="space-y-2">
            <Field label="Doing business as">{input('dbaName')}</Field>
            <SourceRow label="Doing business as" meta={meta.dbaName} onMeta={setM('dbaName')} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Field label="Business SOS ID">{input('sosId', 'font-mono')}</Field>
            <SourceRow label="Business SOS ID" meta={meta.sosId} onMeta={setM('sosId')} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Field label="First filing date">
              <input type="date" className="field" value={d.firstFilingDate} onChange={(e) => set('firstFilingDate', e.target.value)} />
            </Field>
            <SourceRow label="First filing date" meta={meta.firstFilingDate} onMeta={setM('firstFilingDate')} />
          </div>
          <Field label="Type">
            <select className="field" value={d.facilityType} onChange={(e) => set('facilityType', e.target.value as FacilityType)}>
              {(Object.keys(facilityTypeLabel) as FacilityType[]).map((k) => <option key={k} value={k}>{facilityTypeLabel[k]}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="field" value={d.status === 'pipeline_fitout' ? 'pipeline_pending' : d.status} onChange={(e) => set('status', e.target.value as FacilityStatus)}>
              {(['active', 'pipeline_pending', 'closed'] as FacilityStatus[]).map((k) => <option key={k} value={k}>{statusLabel[k]}</option>)}
            </select>
          </Field>
        </div>

        <div>
          <h3 className="mb-3 text-label font-semibold">Location</h3>
          <div className="grid gap-4 sm:grid-cols-6">
            <Field label="Street" span="sm:col-span-6">{input('street')}</Field>
            <Field label="City" span="sm:col-span-3">{input('city')}</Field>
            <Field label="State" span="sm:col-span-1">{input('state')}</Field>
            <Field label="ZIP" span="sm:col-span-2">{input('zip')}</Field>
            <div className="sm:col-span-6"><SourceRow label="Address" meta={meta.address} onMeta={setM('address')} /></div>
            <Field label="County" span="sm:col-span-6">{input('county')}</Field>
            <div className="sm:col-span-6"><SourceRow label="County" meta={meta.county} onMeta={setM('county')} /></div>
            <Field label="Parcel PIN" span="sm:col-span-3">{input('parcelPin', 'font-mono')}</Field>
            <div className="sm:col-span-6"><SourceRow label="Parcel PIN" meta={meta.parcelPin} onMeta={setM('parcelPin')} /></div>
            <Field label="County record link" span="sm:col-span-6">{input('parcelUrl')}</Field>
            <Field label="REID" span="sm:col-span-3">{input('reid', 'font-mono')}</Field>
            <Field label="Land class" span="sm:col-span-3">{input('landClass')}</Field>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-label font-semibold">Owner per county</h3>
          <div className="grid gap-4">
            <Field label="Name">{input('ownerName')}</Field>
            <Field label="Mailing address">{input('ownerMailing')}</Field>
          </div>
        </div>

        </div>
        <div className="space-y-6">
        <div>
          <h3 className="mb-3 text-label font-semibold">Values</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Field label="Assessed value">{input('currentAssessedValue', 'tnum')}</Field>
              <SourceRow label="Assessed value" meta={meta.assessedValue} onMeta={setM('assessedValue')} />
            </div>
            <div className="space-y-2">
              <Field label="Project investment">{input('projectInvestment', 'tnum')}</Field>
              <SourceRow label="Project investment" meta={meta.projectInvestment} onMeta={setM('projectInvestment')} />
            </div>
            <Field label="Land value">{input('landValue', 'tnum')}</Field>
            <Field label="Building value">{input('buildingValue', 'tnum')}</Field>
            <div className="text-label text-dm-dim sm:col-span-2">
              Total value{' '}
              <span className="tnum font-medium text-dm-text">
                {num(d.landValue) !== undefined && num(d.buildingValue) !== undefined ? `$${((num(d.landValue) ?? 0) + (num(d.buildingValue) ?? 0)).toLocaleString('en-US')}` : '—'}
              </span>{' '}
              (land + building)
            </div>
            <Field label="Footprint, sq ft">{input('footprintSqFt', 'tnum')}</Field>
            <Field label="Target opening">{input('targetOpening')}</Field>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-label font-semibold">Specifications</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Operating rooms">{input('operatingRooms', 'tnum')}</Field>
            <Field label="PACU bays">{input('pacuBays', 'tnum')}</Field>
            <Field label="Outpatient share, %">{input('outpatientSharePercent', 'tnum')}</Field>
            <Field label="Licensure" span="sm:col-span-3">{input('licensure')}</Field>
            <Field label="Services, comma-separated" span="sm:col-span-3">{input('specialties')}</Field>
          </div>
        </div>

        </div>

        <div>
          <h3 className="mb-3 text-label font-semibold">Last sale and deed</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date sold"><input type="date" className="field" value={d.saleDate} onChange={(e) => set('saleDate', e.target.value)} /></Field>
            <Field label="Sale price">{input('salePrice', 'tnum')}</Field>
            <Field label="Deed book">{input('deedBook', 'font-mono')}</Field>
            <Field label="Deed page">{input('deedPage', 'font-mono')}</Field>
            <Field label="Deed date"><input type="date" className="field" value={d.deedDate} onChange={(e) => set('deedDate', e.target.value)} /></Field>
            <Field label="Acres">{input('deedAcres', 'tnum')}</Field>
            <Field label="Property description" span="sm:col-span-2">{input('deedDescription')}</Field>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-label font-semibold">Building</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Heated area, sq ft">{input('heatedArea', 'tnum')}</Field>
            <Field label="Year built">{input('yearBuilt', 'tnum')}</Field>
            <Field label="Use type">{input('useType')}</Field>
          </div>
        </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span />
          {onDelete && (
            <button className="btn text-dm-red hover:text-dm-red" onClick={onDelete}>
              Delete location
            </button>
          )}
        </div>
      </div>
    </Panel>
  );
}
