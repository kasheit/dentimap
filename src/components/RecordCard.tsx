import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { addressLine, compactUsd, fmtDate, fmtMonth } from '@/lib/format';
import { sortedDeeds, useDentimap } from '@/lib/store';
import type { Property } from '@/lib/types';
import { Panel, DetailRow } from './Chips';
import { ConfirmLabel, EDIT_RECORD_EVENT } from './ConfirmLabel';
import { PropertyEditForm } from './PropertyEditForm';

type Tab = 'parcel' | 'valuation' | 'sale' | 'building';
const TABS: [Tab, string][] = [
  ['parcel', 'Parcel'],
  ['valuation', 'Valuation'],
  ['sale', 'Sale & deed'],
  ['building', 'Building'],
];

function Stat({ label, value, strong }: { label: string; value?: number; strong?: boolean }) {
  return (
    <div>
      <div className="text-label text-dm-dim">{label}</div>
      <div className={`tnum mt-0.5 text-2xl font-semibold ${strong ? 'text-dm-blue' : ''}`}>{value !== undefined ? compactUsd(value) : <span className="text-dm-dim">—</span>}</div>
    </div>
  );
}

export function RecordCard({ p }: { p: Property }) {
  const { updateProperty, deleteProperty, deeds } = useDentimap();
  // a location created with no address yet opens straight into the editor
  const [editing, setEditing] = useState(!p.address.street && !p.address.city);
  const [tab, setTab] = useState<Tab>('parcel');
  const m = p.metrics;
  const conveyances = sortedDeeds(deeds.filter((d) => d.propertyId === p.id && d.deedType !== 'subdivision_plat'));
  const lastDeed = conveyances[conveyances.length - 1];
  const total = m?.landValue !== undefined && m?.buildingValue !== undefined ? m.landValue + m.buildingValue : undefined;

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
    <ConfirmLabel property={p} field={field} label={text} has={has} showDetail={false} />
  );

  return (
    <Panel id="record" title="Property" action={<button className="btn" onClick={() => setEditing(true)}>Edit</button>}>
      <div role="tablist" className="scroll-thin -mt-1 mb-4 flex gap-1 overflow-x-auto border-b border-dm-border">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-body transition-colors ${
              tab === id ? 'border-dm-blue text-dm-text' : 'border-transparent text-dm-muted hover:text-dm-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'parcel' && (
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
                    <a href={p.parcelUrl} target="_blank" rel="noreferrer" className="ml-3 inline-flex items-center gap-1 font-sans text-label font-normal text-dm-blue hover:underline">
                      County record <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </>
              ) : undefined
            }
            status={status('parcelPin', 'Parcel PIN', !!p.address.parcelPin)}
          />
          <DetailRow label="REID" mono value={p.reid} />
          <DetailRow label="Land class" value={p.landClass} />
          <DetailRow label="Owner per county" value={p.countyOwner?.name} />
          <DetailRow label="Owner mailing address" value={p.countyOwner?.mailing} />
        </div>
      )}

      {tab === 'valuation' && (
        <div>
          <div className="mb-3 flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-dm-border/50 pb-5">
            <Stat label="Land value" value={m?.landValue} />
            <span className="pb-1 text-2xl text-dm-dim" aria-hidden>+</span>
            <Stat label="Building value" value={m?.buildingValue} />
            <span className="pb-1 text-2xl text-dm-dim" aria-hidden>=</span>
            <Stat label="Total value" value={total} strong />
          </div>
          <DetailRow
            label="Assessed value"
            value={m?.currentAssessedValue !== undefined ? compactUsd(m.currentAssessedValue) : undefined}
            status={status('assessedValue', 'Assessed value', m?.currentAssessedValue !== undefined)}
          />
          <DetailRow label="Project investment" value={m?.projectInvestment !== undefined ? compactUsd(m.projectInvestment) : undefined} />
        </div>
      )}

      {tab === 'sale' && (
        <div>
          <DetailRow label="Last sale date" value={p.lastSale?.date ? fmtDate(p.lastSale.date) : undefined} />
          <DetailRow label="Last sale price" value={p.lastSale?.price !== undefined ? compactUsd(p.lastSale.price) : undefined} />
          <DetailRow
            label="Deed book / page"
            mono
            value={p.countyDeed?.book || p.countyDeed?.page ? [p.countyDeed?.book, p.countyDeed?.page].filter(Boolean).join(' / ') : undefined}
          />
          <DetailRow label="Deed date" value={p.countyDeed?.date ? fmtDate(p.countyDeed.date) : undefined} />
          <DetailRow label="Acres" value={p.countyDeed?.acres !== undefined ? String(p.countyDeed.acres) : undefined} />
          <DetailRow label="Description" value={p.countyDeed?.description} />
          <DetailRow
            label="Latest deed on file"
            value={
              lastDeed && lastDeed.consideration > 0 ? (
                <>
                  {compactUsd(lastDeed.consideration)}
                  <span className="ml-2 text-label font-normal text-dm-dim">
                    {lastDeed.grantee} · {fmtMonth(lastDeed.recordingDate)}
                  </span>
                </>
              ) : undefined
            }
          />
        </div>
      )}

      {tab === 'building' && (
        <div>
          <DetailRow label="Heated area" value={p.building?.heatedAreaSqFt !== undefined ? `${p.building.heatedAreaSqFt.toLocaleString()} sq ft` : undefined} />
          <DetailRow label="Year built" value={p.building?.yearBuilt !== undefined ? String(p.building.yearBuilt) : undefined} />
          <DetailRow label="Use type" value={p.building?.useType} />
          <DetailRow label="Footprint" value={m?.footprintSqFt ? `${m.footprintSqFt.toLocaleString()} sq ft` : undefined} />
          <DetailRow label="Target opening" value={m?.targetOpening} />
        </div>
      )}
    </Panel>
  );
}
