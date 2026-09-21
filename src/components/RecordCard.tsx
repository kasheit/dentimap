import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { levelFor } from '@/lib/completion';
import { addressLine, compactUsd, fmtDate } from '@/lib/format';
import { useDentimap } from '@/lib/store';
import type { FieldMeta, Property } from '@/lib/types';
import { Card, Fact, LevelLabel } from './Chips';
import { PropertyEditForm } from './PropertyEditForm';

const detail = (meta?: FieldMeta) => {
  const parts = [meta?.source, meta?.asOf ? `as of ${fmtDate(meta.asOf)}` : undefined].filter(Boolean);
  return parts.length ? parts.join(' · ') : undefined;
};

export function RecordCard({ p }: { p: Property }) {
  const { updateProperty, deleteProperty } = useDentimap();
  // a facility created with no address yet opens straight into the editor
  const [editing, setEditing] = useState(!p.address.street && !p.address.city);
  const m = p.metrics;
  const meta = p.meta ?? {};
  const label = (has: boolean, mt?: FieldMeta) => <LevelLabel level={levelFor(has, mt)} detail={has ? detail(mt) : undefined} />;

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

  const hasAddress = !!(p.address.street && p.address.city && p.address.zip);

  return (
    <Card
      id="record"
      title="Record"
      action={
        <button className="btn" onClick={() => setEditing(true)}>Edit</button>
      }
    >
      <dl className="grid gap-x-10 sm:grid-cols-2">
        <div>
          <Fact label="Address" sub={label(hasAddress, meta.address)}>{hasAddress ? addressLine(p.address) : '—'}</Fact>
          <Fact label="County" sub={label(!!p.address.county, meta.county)}>{p.address.county.replace(/\s+County$/i, '') || '—'}</Fact>
          <Fact
            label="Parcel PIN"
            mono
            sub={
              <>
                {label(!!p.address.parcelPin, meta.parcelPin)}
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
          <Fact label="Assessed value" sub={label(m?.currentAssessedValue !== undefined, meta.assessedValue)}>
            {compactUsd(m?.currentAssessedValue)}
          </Fact>
          <Fact label="Project investment">{compactUsd(m?.projectInvestment)}</Fact>
          <Fact label="Footprint">{m?.footprintSqFt ? `${m.footprintSqFt.toLocaleString()} sq ft` : '—'}</Fact>
          <Fact label="Target opening">{m?.targetOpening ?? '—'}</Fact>
        </div>
      </dl>
    </Card>
  );
}
