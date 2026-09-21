import { useState } from 'react';
import { facilityTypeLabel, statusLabel } from '@/lib/format';
import type { FacilityStatus, FacilityType, Property } from '@/lib/types';
import { Card } from './Chips';

type Draft = {
  name: string;
  facilityType: FacilityType;
  status: FacilityStatus;
  street: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  parcelPin: string;
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

const str = (n?: number | string) => (n === undefined ? '' : String(n));
const num = (s: string) => {
  const n = Number(s.replace(/[$,\s]/g, ''));
  return s.trim() !== '' && Number.isFinite(n) ? n : undefined;
};
const text = (s: string) => s.trim() || undefined;

function toDraft(p: Property): Draft {
  return {
    name: p.name,
    facilityType: p.facilityType,
    status: p.status,
    street: p.address.street,
    city: p.address.city,
    state: p.address.state,
    zip: p.address.zip,
    county: p.address.county,
    parcelPin: p.address.parcelPin,
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

function toPatch(d: Draft, p: Property): Partial<Property> {
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
  return {
    name: d.name.trim(),
    facilityType: d.facilityType,
    status: d.status,
    address: { street: d.street.trim(), city: d.city.trim(), state: d.state.trim(), zip: d.zip.trim(), county: d.county.trim(), parcelPin: d.parcelPin.trim() },
    metrics,
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

export function PropertyEditForm({ property: p, onSave, onCancel }: { property: Property; onSave: (patch: Partial<Property>) => void; onCancel: () => void }) {
  const [d, setD] = useState<Draft>(() => toDraft(p));
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));
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
          <button className="btn" disabled={!canSave} onClick={() => onSave(toPatch(d, p))}>Save changes</button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Facility name" span="sm:col-span-2">{input('name')}</Field>
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
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-[13px] font-semibold">Values</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Assessed value ($)">{input('currentAssessedValue', 'tnum')}</Field>
            <Field label="Project investment ($)">{input('projectInvestment', 'tnum')}</Field>
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
        <p className="text-xs text-dm-dim">Landlord and operator are edited from Ownership Entities. Deeds and notes save as you add them.</p>
      </div>
    </Card>
  );
}
