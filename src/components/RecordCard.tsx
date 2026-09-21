import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { addressLine, compactUsd, fmtDate } from '@/lib/format';
import { useDentimap } from '@/lib/store';
import type { FieldMeta, Property } from '@/lib/types';
import { Card, Fact } from './Chips';
import { PropertyEditForm } from './PropertyEditForm';

function SourceNote({ meta, hasValue }: { meta?: FieldMeta; hasValue: boolean }) {
  if (!hasValue) return null;
  if (!meta || (meta.state === 'unknown' && !meta.source && !meta.asOf)) return null;
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

export function RecordCard({ p }: { p: Property }) {
  const { updateProperty, deleteProperty } = useDentimap();
  // a facility created with no address yet opens straight into the editor
  const [editing, setEditing] = useState(!p.address.street && !p.address.city);
  const m = p.metrics;
  const meta = p.meta ?? {};
  const dash = <span className="text-dm-dim">—</span>;
  const unsourced = [
    [!!p.address.parcelPin, meta.parcelPin],
    [m?.currentAssessedValue !== undefined, meta.assessedValue],
    [m?.projectInvestment !== undefined, meta.projectInvestment],
  ].filter(([has, mt]) => has && (!mt || ((mt as { state: string; source?: string; asOf?: string }).state === 'unknown' && !(mt as { source?: string }).source && !(mt as { asOf?: string }).asOf))).length;

  if (editing) {
    return (
      <PropertyEditForm
        property={p}
        onCancel={() => setEditing(false)}
        onSave={(patch) => {
          updateProperty(p.id, patch, 'Record edited');
          setEditing(false);
        }}
        onDelete={() => {
          if (confirm(`Delete "${p.name}" and all of its deeds? This cannot be undone.`)) deleteProperty(p.id);
        }}
      />
    );
  }

  return (
    <Card
      id="record"
      title="Record"
      action={
        <div className="flex items-center gap-4">
          {unsourced > 0 && <span className="text-[13px] text-dm-dim">{unsourced} unsourced</span>}
          <button className="btn" onClick={() => setEditing(true)}>Edit</button>
        </div>
      }
    >
      <dl className="grid gap-x-10 sm:grid-cols-2">
        <div>
          <Fact label="Legal name">{p.legalName || dash}</Fact>
          <Fact label="Doing business as">{p.dbaName || dash}</Fact>
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
    </Card>
  );
}
