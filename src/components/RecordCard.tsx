import { useState } from 'react';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { addressLine, compactUsd, facilityTypeLabel, fmtDate, statusLabel } from '@/lib/format';
import { useDentimap } from '@/lib/store';
import type { FacilityStatus, FacilityType, FieldMeta, Property, SourcedField, VerificationState } from '@/lib/types';
import { Card, Fact } from './Chips';

const FIELDS: { key: SourcedField; label: string }[] = [
  { key: 'parcelPin', label: 'Parcel PIN' },
  { key: 'assessedValue', label: 'Assessed value' },
  { key: 'projectInvestment', label: 'Project investment' },
];

function SourceNote({ meta, hasValue }: { meta?: FieldMeta; hasValue: boolean }) {
  if (!hasValue) return null;
  if (!meta || (meta.state === 'unknown' && !meta.source && !meta.asOf)) {
    return <span className="text-dm-amber">Unsourced</span>;
  }
  const tone = meta.state === 'verified' ? 'text-dm-green' : meta.state === 'unverified' ? 'text-dm-amber' : 'text-dm-dim';
  const label = meta.state === 'verified' ? 'Verified' : meta.state === 'unverified' ? 'Unverified' : 'Source';
  return (
    <span className="text-dm-dim">
      <span className={tone}>{label}</span>
      {meta.source && <> · {meta.source}</>}
      {meta.asOf && <> · as of {fmtDate(meta.asOf)}</>}
    </span>
  );
}

const str = (n?: number) => (n === undefined ? '' : String(n));
const num = (s: string) => (s.trim() === '' || isNaN(Number(s.replace(/[$,]/g, ''))) ? undefined : Number(s.replace(/[$,]/g, '')));

function MetaRow({ label, value, onValue, meta, onMeta, mono }: { label: string; value: string; onValue: (v: string) => void; meta: FieldMeta; onMeta: (m: FieldMeta) => void; mono?: boolean }) {
  return (
    <div className="space-y-1.5 rounded-md border border-dm-border/70 p-3">
      <label className="block space-y-1">
        <span className="label">{label}</span>
        <input className={`field ${mono ? 'font-mono text-[13px]' : 'tnum'}`} value={value} onChange={(e) => onValue(e.target.value)} />
      </label>
      <div className="grid grid-cols-[7rem_1fr_9rem] gap-2">
        <select className="field text-[13px]" value={meta.state} onChange={(e) => onMeta({ ...meta, state: e.target.value as VerificationState })} aria-label={`${label} verification`}>
          <option value="unknown">Unsourced</option>
          <option value="unverified">Unverified</option>
          <option value="verified">Verified</option>
        </select>
        <input className="field text-[13px]" placeholder="Source (e.g. Wake Co. tax card)" value={meta.source ?? ''} onChange={(e) => onMeta({ ...meta, source: e.target.value })} />
        <input type="date" className="field text-[13px]" value={meta.asOf ?? ''} onChange={(e) => onMeta({ ...meta, asOf: e.target.value })} aria-label={`${label} as-of date`} />
      </div>
    </div>
  );
}

function Editor({ p, onDone }: { p: Property; onDone: () => void }) {
  const { updateProperty, deleteProperty } = useDentimap();
  const m = p.metrics;
  const [d, setD] = useState({
    name: p.name,
    legalName: p.legalName ?? '',
    dbaName: p.dbaName ?? '',
    facilityType: p.facilityType,
    status: p.status,
    street: p.address.street,
    city: p.address.city,
    state: p.address.state,
    zip: p.address.zip,
    county: p.address.county.replace(/\s+County$/i, ''),
    parcelPin: p.address.parcelPin,
    parcelUrl: p.parcelUrl ?? '',
    assessedValue: str(m?.currentAssessedValue),
    projectInvestment: str(m?.projectInvestment),
    footprint: str(m?.footprintSqFt),
    targetOpening: m?.targetOpening ?? '',
  });
  const blank: FieldMeta = { state: 'unknown' };
  const [meta, setMeta] = useState<Record<SourcedField, FieldMeta>>({
    parcelPin: p.meta?.parcelPin ?? blank,
    assessedValue: p.meta?.assessedValue ?? blank,
    projectInvestment: p.meta?.projectInvestment ?? blank,
  });
  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => setD((x) => ({ ...x, [k]: v }));
  const field = (label: string, k: keyof typeof d, extra = '') => (
    <label className={`space-y-1 ${extra}`}>
      <span className="label">{label}</span>
      <input className="field" value={d[k] as string} onChange={(e) => set(k, e.target.value as never)} />
    </label>
  );

  const save = () => {
    const county = d.county.trim();
    const keep = (k: SourcedField) => {
      const x = meta[k];
      return x.source?.trim() || x.asOf || x.state !== 'unknown' ? { ...x, source: x.source?.trim() || undefined, asOf: x.asOf || undefined } : undefined;
    };
    updateProperty(
      p.id,
      {
        name: d.name.trim() || 'Untitled facility',
        legalName: d.legalName.trim() || undefined,
        dbaName: d.dbaName.trim() || undefined,
        facilityType: d.facilityType,
        status: d.status,
        address: {
          street: d.street.trim(),
          city: d.city.trim(),
          state: d.state.trim(),
          zip: d.zip.trim(),
          county: county ? `${county} County` : '',
          parcelPin: d.parcelPin.trim(),
        },
        parcelUrl: d.parcelUrl.trim() || undefined,
        metrics: {
          ...m,
          currentAssessedValue: num(d.assessedValue),
          projectInvestment: num(d.projectInvestment),
          footprintSqFt: num(d.footprint),
          targetOpening: d.targetOpening.trim() || undefined,
        },
        meta: { parcelPin: keep('parcelPin'), assessedValue: keep('assessedValue'), projectInvestment: keep('projectInvestment') },
      },
      'Record edited',
    );
    onDone();
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {field('Display name', 'name')}
        <label className="space-y-1">
          <span className="label">Type</span>
          <select className="field" value={d.facilityType} onChange={(e) => set('facilityType', e.target.value as FacilityType)}>
            {(Object.keys(facilityTypeLabel) as FacilityType[]).map((k) => (
              <option key={k} value={k}>{facilityTypeLabel[k]}</option>
            ))}
          </select>
        </label>
        {field('Legal name (on business documents)', 'legalName')}
        {field('Doing business as (trade name)', 'dbaName')}
        <label className="space-y-1">
          <span className="label">Status</span>
          <select className="field" value={d.status} onChange={(e) => set('status', e.target.value as FacilityStatus)}>
            {(Object.keys(statusLabel) as FacilityStatus[]).map((k) => (
              <option key={k} value={k}>{statusLabel[k]}</option>
            ))}
          </select>
        </label>
        {field('Target opening', 'targetOpening')}
      </div>

      <div className="grid gap-3 sm:grid-cols-6">
        {field('Street', 'street', 'sm:col-span-3')}
        {field('City', 'city', 'sm:col-span-2')}
        {field('State', 'state')}
        {field('ZIP', 'zip', 'sm:col-span-2')}
        {field('County', 'county', 'sm:col-span-2')}
        {field('Footprint (sq ft)', 'footprint', 'sm:col-span-2')}
      </div>

      <div className="space-y-3">
        <MetaRow label="Parcel PIN" mono value={d.parcelPin} onValue={(v) => set('parcelPin', v)} meta={meta.parcelPin} onMeta={(x) => setMeta((s) => ({ ...s, parcelPin: x }))} />
        <MetaRow label="Assessed value (USD)" value={d.assessedValue} onValue={(v) => set('assessedValue', v)} meta={meta.assessedValue} onMeta={(x) => setMeta((s) => ({ ...s, assessedValue: x }))} />
        <MetaRow label="Project investment (USD)" value={d.projectInvestment} onValue={(v) => set('projectInvestment', v)} meta={meta.projectInvestment} onMeta={(x) => setMeta((s) => ({ ...s, projectInvestment: x }))} />
        {field('County parcel record link (optional)', 'parcelUrl')}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          className="btn text-dm-red hover:text-dm-red"
          onClick={() => {
            if (confirm(`Delete "${p.name}" and all of its deeds? This cannot be undone.`)) deleteProperty(p.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete facility
        </button>
        <div className="flex gap-2">
          <button className="btn" onClick={onDone}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}

export function RecordCard({ p }: { p: Property }) {
  const [editing, setEditing] = useState(!p.address.street && !p.address.city);
  const m = p.metrics;
  const meta = p.meta ?? {};

  return (
    <Card
      id="record"
      title="Record"
      action={
        !editing && (
          <button className="btn" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )
      }
    >
      {editing ? (
        <Editor p={p} onDone={() => setEditing(false)} />
      ) : (
        <dl className="grid gap-x-10 sm:grid-cols-2">
          <div>
            <Fact label="Legal name">{p.legalName || <span className="text-dm-dim">—</span>}</Fact>
            <Fact label="Doing business as">{p.dbaName || <span className="text-dm-dim">—</span>}</Fact>
            <Fact label="Address">{addressLine(p.address)}</Fact>
            <Fact label="County">{p.address.county.replace(/\s+County$/i, '') || '—'}</Fact>
            <Fact
              label="Parcel PIN"
              mono
              sub={
                <>
                  <SourceNote meta={meta.parcelPin} hasValue={!!p.address.parcelPin} />
                  {p.parcelUrl && (
                    <a href={p.parcelUrl} target="_blank" rel="noreferrer" className="ml-3 inline-flex items-center gap-1 text-dm-blue hover:underline">
                      County record <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </>
              }
            >
              {p.address.parcelPin || '—'}
            </Fact>
          </div>
          <div>
            <Fact label="Assessed value" sub={<SourceNote meta={meta.assessedValue} hasValue={m?.currentAssessedValue !== undefined} />}>
              {compactUsd(m?.currentAssessedValue)}
            </Fact>
            <Fact label="Project investment" sub={<SourceNote meta={meta.projectInvestment} hasValue={m?.projectInvestment !== undefined} />}>
              {compactUsd(m?.projectInvestment)}
            </Fact>
            <Fact label="Footprint">{m?.footprintSqFt ? `${m.footprintSqFt.toLocaleString()} sq ft` : '—'}</Fact>
            <Fact label="Target opening">{m?.targetOpening ?? '—'}</Fact>
          </div>
        </dl>
      )}
    </Card>
  );
}
