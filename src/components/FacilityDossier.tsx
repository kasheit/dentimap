import { useEffect, useMemo, useState } from 'react';
import { Activity, ExternalLink, FileText, Image as ImageIcon, Landmark, NotebookPen, Stethoscope } from 'lucide-react';
import { addressLine, compactUsd, facilityTypeLabel } from '@/lib/format';
import { useDentimap } from '@/lib/store';
import type { Property } from '@/lib/types';
import { Card, StatusPill } from './Chips';
import { CorporateEntities } from './CorporateEntities';
import { DeedIngestionBuffer } from './DeedIngestionBuffer';
import { TitleChainTimeline } from './TitleChainTimeline';

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-dm-surface px-5 py-4">
      <div className="label">{label}</div>
      <div className="mt-1.5 font-mono text-xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-dm-dim">{sub}</div>}
    </div>
  );
}

function PhotoPlate({ property }: { property: Property }) {
  const updateProperty = useDentimap((s) => s.updateProperty);
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(property.photoUrl ?? '');
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setUrl(property.photoUrl ?? '');
    setBroken(false);
    setEditing(false);
  }, [property.id, property.photoUrl]);

  const showImg = property.photoUrl && !broken;

  return (
    <div className="overflow-hidden rounded-xl border border-dm-border bg-dm-surface">
      <div className="relative aspect-[21/7] w-full">
        {showImg ? (
          <img src={property.photoUrl} alt={property.name} onError={() => setBroken(true)} className="h-full w-full object-cover" />
        ) : (
          <svg viewBox="0 0 840 280" preserveAspectRatio="xMidYMid slice" className="h-full w-full" role="img" aria-label="No photo on file">
            <defs>
              <linearGradient id="plate" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#151922" />
                <stop offset="1" stopColor="#0a0e16" />
              </linearGradient>
              <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
                <path d="M28 0H0V28" fill="none" stroke="#232730" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="840" height="280" fill="url(#plate)" />
            <rect width="840" height="280" fill="url(#grid)" opacity="0.6" />
            <g fill="none" stroke="#38bdf8" strokeOpacity="0.55" strokeWidth="1.5">
              <path d="M300 220V120l70-40h100l70 40v100z" />
              <path d="M300 120h240M370 80v140M470 80v140" strokeOpacity="0.3" />
              <path d="M250 220h340" strokeOpacity="0.8" />
            </g>
          </svg>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-dm-bg/90 to-transparent px-4 pb-3 pt-8">
          <span className="font-mono text-[10px] uppercase tracking-wider text-dm-muted">
            {showImg ? 'Facility photography' : 'No photo on file'}
          </span>
          <button className="btn" onClick={() => setEditing((e) => !e)}>
            <ImageIcon className="h-3.5 w-3.5" /> {property.photoUrl ? 'Change' : 'Add photo'}
          </button>
        </div>
      </div>
      {editing && (
        <form
          className="flex gap-2 border-t border-dm-border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            updateProperty(property.id, { photoUrl: url.trim() || undefined });
            setEditing(false);
          }}
        >
          <input className="field font-mono text-xs" placeholder="https://… image URL" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button className="btn btn-primary" type="submit">Save</button>
        </form>
      )}
    </div>
  );
}

function Notes({ property }: { property: Property }) {
  const updateProperty = useDentimap((s) => s.updateProperty);
  const [value, setValue] = useState(property.notes ?? '');
  useEffect(() => setValue(property.notes ?? ''), [property.id, property.notes]);
  return (
    <textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => value !== (property.notes ?? '') && updateProperty(property.id, { notes: value.trim() || undefined })}
      rows={4}
      placeholder="Diligence notes, follow-ups, open questions…"
      className="field scroll-thin resize-y leading-relaxed"
    />
  );
}

function Spec({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold">{value ?? '—'}</div>
    </div>
  );
}

export function FacilityDossier({ property: p }: { property: Property }) {
  const { deeds, entities, properties } = useDentimap();
  const propDeeds = useMemo(() => deeds.filter((d) => d.propertyId === p.id), [deeds, p.id]);
  const landlord = entities.find((e) => e.id === p.landlordEntityId);
  const operator = entities.find((e) => e.id === p.operatingEntityId);
  const cs = p.clinicalSpecs;
  const stateCount = properties.filter((x) => x.address.state === p.address.state).length;
  const scope = cs?.operatingRooms !== undefined ? `${cs.operatingRooms} OR${cs.operatingRooms === 1 ? '' : 's'}${cs.pacuBays ? ` · ${cs.pacuBays} PACU` : ''}` : '—';
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine(p.address))}`;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-dm-blue/30 bg-dm-blue/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-dm-blue">
              {facilityTypeLabel[p.facilityType]}
            </span>
            <StatusPill status={p.status} />
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{p.name}</h1>
          <p className="mt-1 text-sm text-dm-muted">{addressLine(p.address)}</p>
          <p className="mt-1 font-mono text-[11px] text-dm-dim">
            {p.address.county} · Parcel {p.address.parcelPin || '—'}
          </p>
        </div>
        <a className="btn" href={mapUrl} target="_blank" rel="noreferrer">
          <ExternalLink className="h-3.5 w-3.5" /> View on map
        </a>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-dm-border bg-dm-border lg:grid-cols-4">
        <Metric label="Project investment" value={compactUsd(p.metrics?.projectInvestment)} />
        <Metric label="Assessed value" value={compactUsd(p.metrics?.currentAssessedValue)} sub={p.metrics?.footprintSqFt ? `${p.metrics.footprintSqFt.toLocaleString()} sq ft` : undefined} />
        <Metric label="Facility scope" value={scope} sub={cs?.specialties?.length ? `${cs.specialties.length} specialties` : undefined} />
        <Metric label={p.metrics?.targetOpening ? 'Target opening' : 'State footprint'} value={p.metrics?.targetOpening ?? `${stateCount} in ${p.address.state}`} sub={p.metrics?.targetOpening ? `${stateCount} network sites in ${p.address.state}` : undefined} />
      </div>

      <PhotoPlate property={p} />

      <Card title="Deeds & title chain" icon={<FileText className="h-3.5 w-3.5 text-dm-blue" />} action={<span className="font-mono text-[10px] text-dm-dim">{propDeeds.length} instrument{propDeeds.length === 1 ? '' : 's'}</span>}>
        <div className="space-y-6">
          <DeedIngestionBuffer property={p} />
          <TitleChainTimeline deeds={propDeeds} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {cs && (
          <Card title="Clinical specifications" icon={<Stethoscope className="h-3.5 w-3.5 text-dm-blue" />}>
            <div className="grid grid-cols-3 gap-4">
              <Spec label="Operating rooms" value={cs.operatingRooms} />
              <Spec label="PACU bays" value={cs.pacuBays} />
              <Spec label="Outpatient" value={cs.outpatientSharePercent !== undefined ? `${cs.outpatientSharePercent}%` : undefined} />
            </div>
            {cs.specialties && cs.specialties.length > 0 && (
              <div className="mt-5">
                <div className="label mb-2">Specialties</div>
                <div className="flex flex-wrap gap-1.5">
                  {cs.specialties.map((s) => (
                    <span key={s} className="rounded-full border border-dm-border bg-dm-bg px-2.5 py-1 text-xs text-dm-muted">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {cs.licensure && (
              <div className="mt-5 flex items-center gap-2 rounded-md border border-dm-border bg-dm-bg px-3 py-2 font-mono text-[11px] text-dm-muted">
                <Activity className="h-3.5 w-3.5 text-dm-green" /> {cs.licensure}
              </div>
            )}
          </Card>
        )}
        <Card title="Corporate entity structure" icon={<Landmark className="h-3.5 w-3.5 text-dm-blue" />} className={cs ? '' : 'lg:col-span-2'}>
          <CorporateEntities landlord={landlord} operator={operator} />
        </Card>
      </div>

      <Card title="Notes" icon={<NotebookPen className="h-3.5 w-3.5 text-dm-blue" />}>
        <Notes property={p} />
      </Card>
    </div>
  );
}
