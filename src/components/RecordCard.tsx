import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { addressLine, compactUsd } from '@/lib/format';
import { useDentimap } from '@/lib/store';
import type { Property } from '@/lib/types';
import { Card, DetailRow } from './Chips';
import { ConfirmLabel, EDIT_RECORD_EVENT } from './ConfirmLabel';
import { PropertyEditForm } from './PropertyEditForm';

export function RecordCard({ p }: { p: Property }) {
  const { updateProperty, deleteProperty } = useDentimap();
  // a location created with no address yet opens straight into the editor
  const [editing, setEditing] = useState(!p.address.street && !p.address.city);
  const m = p.metrics;

  // "Missing" labels elsewhere on the page open this editor.
  useEffect(() => {
    const open = () => {
      setEditing(true);
      document.getElementById('record')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener(EDIT_RECORD_EVENT, open);
    return () => window.removeEventListener(EDIT_RECORD_EVENT, open);
  }, []);

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
  const status = (field: 'address' | 'county' | 'parcelPin' | 'assessedValue', text: string, has: boolean) => (
    <ConfirmLabel property={p} field={field} label={text} has={has} showDetail={false} />
  );

  return (
    <Card id="record" title="Record" action={<button className="btn" onClick={() => setEditing(true)}>Edit</button>}>
      <div>
        <DetailRow label="Address" value={hasAddress ? addressLine(p.address) : undefined} status={status('address', 'Address', hasAddress)} />
        <DetailRow label="County" value={p.address.county.replace(/\s+County$/i, '') || undefined} status={status('county', 'County', !!p.address.county)} />
        <DetailRow
          label="Parcel PIN"
          mono
          value={
            p.address.parcelPin ? (
              <>
                {p.address.parcelPin}
                {p.parcelUrl && (
                  <a href={p.parcelUrl} target="_blank" rel="noreferrer" className="ml-3 inline-flex items-center gap-1 font-sans text-[13px] font-normal text-dm-blue hover:underline">
                    County record <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </>
            ) : undefined
          }
          status={status('parcelPin', 'Parcel PIN', !!p.address.parcelPin)}
        />
        <DetailRow
          label="Assessed value"
          value={m?.currentAssessedValue !== undefined ? compactUsd(m.currentAssessedValue) : undefined}
          status={status('assessedValue', 'Assessed value', m?.currentAssessedValue !== undefined)}
        />
        <DetailRow label="Project investment" value={m?.projectInvestment !== undefined ? compactUsd(m.projectInvestment) : undefined} />
        <DetailRow label="Footprint" value={m?.footprintSqFt ? `${m.footprintSqFt.toLocaleString()} sq ft` : undefined} />
        <DetailRow label="Target opening" value={m?.targetOpening} />
      </div>
    </Card>
  );
}
