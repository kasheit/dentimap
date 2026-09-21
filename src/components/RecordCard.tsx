import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { addressLine, compactUsd } from '@/lib/format';
import { useDentimap } from '@/lib/store';
import type { Property } from '@/lib/types';
import { Card, Fact } from './Chips';
import { ConfirmLabel, EDIT_RECORD_EVENT } from './ConfirmLabel';
import { PropertyEditForm } from './PropertyEditForm';

export function RecordCard({ p }: { p: Property }) {
  const { updateProperty, deleteProperty } = useDentimap();
  // a facility created with no address yet opens straight into the editor
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
  const label = (field: 'address' | 'county' | 'parcelPin' | 'assessedValue', text: string, has: boolean, extra?: React.ReactNode) => (
    <ConfirmLabel property={p} field={field} label={text} has={has} extra={extra} />
  );

  return (
    <Card id="record" title="Record" action={<button className="btn" onClick={() => setEditing(true)}>Edit</button>}>
      <dl className="grid gap-x-10 sm:grid-cols-2">
        <div>
          <Fact label="Address" sub={label('address', 'Address', hasAddress)}>{hasAddress ? addressLine(p.address) : '—'}</Fact>
          <Fact label="County" sub={label('county', 'County', !!p.address.county)}>{p.address.county.replace(/\s+County$/i, '') || '—'}</Fact>
          <Fact
            label="Parcel PIN"
            mono
            sub={label(
              'parcelPin',
              'Parcel PIN',
              !!p.address.parcelPin,
              p.parcelUrl && (
                <a href={p.parcelUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] text-dm-blue hover:underline">
                  County record <ExternalLink className="h-3 w-3" />
                </a>
              ),
            )}
          >
            {p.address.parcelPin || '—'}
          </Fact>
        </div>
        <div>
          <Fact label="Assessed value" sub={label('assessedValue', 'Assessed value', m?.currentAssessedValue !== undefined)}>
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
