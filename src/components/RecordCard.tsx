import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { addressLine, fmtDate } from '@/lib/format';
import { safeUrl, sourcesOf } from '@/lib/sources';
import { useDentimap } from '@/lib/store';
import type { Property, SourcedField } from '@/lib/types';
import { Panel, DetailRow } from './Chips';
import { ConfirmLabel } from './ConfirmLabel';
import { PropertyEditForm } from './PropertyEditForm';

/** `editSignal` opens the editor each time it changes (the dossier bumps it when a "Missing" label is clicked). */
export function RecordCard({ p, editSignal = 0, focusField }: { p: Property; editSignal?: number; focusField?: SourcedField }) {
  const { updateProperty, deleteProperty } = useDentimap();
  // a location created with no address yet opens straight into the editor
  const [editing, setEditing] = useState(!p.address.street && !p.address.city);
  useEffect(() => {
    if (editSignal > 0) setEditing(true);
  }, [editSignal]);
  const m = p.metrics;

  if (editing) {
    return (
      <PropertyEditForm
        property={p}
        focusField={focusField}
        onCancel={() => setEditing(false)}
        onSave={(patch) => {
          updateProperty(p.id, patch, 'Property details edited');
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
    <ConfirmLabel property={p} field={field} label={text} has={has} />
  );

  return (
    <Panel id="record" title="Property" action={<button className="btn" onClick={() => setEditing(true)}>Edit</button>}>
      <div className="grid gap-x-12 gap-y-6 lg:grid-cols-2">
        <div>
          <div className="mb-1 border-b border-dm-border/70 pb-1.5 text-label font-medium text-dm-muted">Parcel</div>
          <DetailRow label="Address" value={hasAddress ? addressLine(p.address) : undefined} status={status('address', 'Address', hasAddress)} />
          <DetailRow label="County" value={p.address.county.replace(/\s+County$/i, '') || undefined} status={status('county', 'County', !!p.address.county)} />
          <DetailRow
            label="Parcel PIN"
            mono
            value={p.address.parcelPin || undefined}
            status={status('parcelPin', 'Parcel PIN', !!p.address.parcelPin)}
          />
          <DetailRow
            label="Sources"
            value={
              sourcesOf(p).length ? (
                <div className="flex flex-col gap-1">
                  {sourcesOf(p).map((s) => (
                    <a key={s.url} href={safeUrl(s.url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-normal text-dm-blue hover:underline">
                      {s.label} <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              ) : undefined
            }
          />
          <DetailRow label="Footprint" value={m?.footprintSqFt ? `${m.footprintSqFt.toLocaleString()} sq ft` : undefined} />
          <DetailRow label="Target opening" value={m?.targetOpening} />
        </div>

        <div>
          <div className="mb-1 border-b border-dm-border/70 pb-1.5 text-label font-medium text-dm-muted">Deed details</div>
          <DetailRow
            label="Deed book / page"
            mono
            value={p.countyDeed?.book || p.countyDeed?.page ? [p.countyDeed?.book, p.countyDeed?.page].filter(Boolean).join(' / ') : undefined}
          />
          <DetailRow label="Deed date" value={p.countyDeed?.date ? fmtDate(p.countyDeed.date) : undefined} />
        </div>
      </div>
    </Panel>
  );
}
