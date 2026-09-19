import { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { addressLine, compactUsd, facilityTypeLabel } from '@/lib/format';
import { useDentimap } from '@/lib/store';
import type { Property } from '@/lib/types';
import { Card, StatusPill } from './Chips';
import { CorporateEntities } from './CorporateEntities';
import { DeedIngestionBuffer } from './DeedIngestionBuffer';
import { TitleChainTimeline } from './TitleChainTimeline';

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

function Fact({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dm-border/70 py-2 last:border-0">
      <dt className="text-[13px] text-dm-dim">{label}</dt>
      <dd className={`text-right text-[13px] ${mono ? 'font-mono' : 'tnum'}`}>{children}</dd>
    </div>
  );
}

export function FacilityDossier({ property: p }: { property: Property }) {
  const { deeds, entities, properties } = useDentimap();
  const propDeeds = useMemo(() => deeds.filter((d) => d.propertyId === p.id), [deeds, p.id]);
  const landlord = entities.find((e) => e.id === p.landlordEntityId);
  const operator = entities.find((e) => e.id === p.operatingEntityId);
  const cs = p.clinicalSpecs;
  const m = p.metrics;
  const stateCount = properties.filter((x) => x.address.state === p.address.state).length;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine(p.address))}`;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 text-[13px] text-dm-muted">
            <span>{facilityTypeLabel[p.facilityType]}</span>
            <span className="text-dm-border">|</span>
            <StatusPill status={p.status} />
          </div>
          <h1 className="mt-1.5 text-[28px] font-semibold leading-tight">{p.name}</h1>
          <p className="mt-1 text-[15px] text-dm-muted">{addressLine(p.address)}</p>
        </div>
        <a className="btn" href={mapUrl} target="_blank" rel="noreferrer">
          <ExternalLink className="h-3.5 w-3.5" /> Open in Maps
        </a>
      </header>

      <Card title="Record">
        <dl className="grid gap-x-10 sm:grid-cols-2">
          <div>
            <Fact label="Parcel PIN" mono>{p.address.parcelPin || '—'}</Fact>
            <Fact label="County">{p.address.county}</Fact>
            <Fact label={`Sites in ${p.address.state}`}>{stateCount}</Fact>
          </div>
          <div>
            <Fact label="Assessed value">{compactUsd(m?.currentAssessedValue)}</Fact>
            <Fact label="Project investment">{compactUsd(m?.projectInvestment)}</Fact>
            <Fact label={m?.targetOpening ? 'Target opening' : 'Footprint'}>
              {m?.targetOpening ?? (m?.footprintSqFt ? `${m.footprintSqFt.toLocaleString()} sq ft` : '—')}
            </Fact>
          </div>
        </dl>
      </Card>

      <Card title="Title chain" action={<span className="text-[13px] text-dm-dim">{propDeeds.length} recorded instrument{propDeeds.length === 1 ? '' : 's'}</span>}>
        <div className="space-y-6">
          <DeedIngestionBuffer property={p} />
          <TitleChainTimeline deeds={propDeeds} />
        </div>
      </Card>

      <div className={`grid gap-6 ${cs ? 'lg:grid-cols-2' : ''}`}>
        {cs && (
          <Card title="Clinical">
            <dl>
              <Fact label="Operating rooms">{cs.operatingRooms ?? '—'}</Fact>
              <Fact label="PACU bays">{cs.pacuBays ?? '—'}</Fact>
              <Fact label="Outpatient share">{cs.outpatientSharePercent !== undefined ? `${cs.outpatientSharePercent}%` : '—'}</Fact>
              {cs.licensure && <Fact label="Licensure">{cs.licensure}</Fact>}
            </dl>
            {cs.specialties && cs.specialties.length > 0 && (
              <p className="mt-4 text-[13px] leading-relaxed text-dm-muted">
                <span className="text-dm-dim">Specialties: </span>
                {cs.specialties.join(', ')}
              </p>
            )}
          </Card>
        )}
        <Card title="Ownership">
          <CorporateEntities landlord={landlord} operator={operator} />
        </Card>
      </div>

      <Card title="Notes">
        <Notes property={p} />
      </Card>
    </div>
  );
}
