import { useMemo } from 'react';
import { completionFor } from '@/lib/completion';
import { facilityTypeLabel } from '@/lib/format';
import { useDentimap } from '@/lib/store';
import type { Property } from '@/lib/types';
import { DetailRow, Panel, StatusPill } from './Chips';
import { OwnershipChain } from './CorporateEntities';
import { DeedIngestionBuffer } from './DeedIngestionBuffer';
import { HistoryLog } from './HistoryLog';
import { KeyPeople } from './KeyPeople';
import { NotesLog } from './NotesLog';
import { RecordCard } from './RecordCard';
import { TitleChainTimeline } from './TitleChainTimeline';


export function FacilityDossier({ property: p }: { property: Property }) {
  const { deeds } = useDentimap();
  const completion = completionFor(p, deeds);
  const propDeeds = useMemo(() => deeds.filter((d) => d.propertyId === p.id), [deeds, p.id]);
  const cs = p.clinicalSpecs;
  const hasSpecs = !!cs && (cs.operatingRooms !== undefined || cs.pacuBays !== undefined || cs.outpatientSharePercent !== undefined || !!cs.specialties?.length || !!cs.licensure);
  const activityCount = useDentimap((s) => s.activity.filter((a) => a.propertyId === p.id).length);
  const openNotes = (p.noteLog ?? []).filter((n) => n.tag !== 'note' && !n.resolved).length;


  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <header className="min-w-0">
        <div className="flex items-center gap-3 text-label text-dm-muted">
          <span>{facilityTypeLabel[p.facilityType]}</span>
          <span className="text-dm-dim">·</span>
          <StatusPill status={p.status} />
        </div>
        <h1 className="mt-1.5 text-display font-semibold leading-tight">{p.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-label">
          <div className="flex items-center gap-2" title="Confirmed counts fully, unconfirmed counts half, missing counts zero">
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-dm-border">
              <div className="flex h-full">
                <div className="bg-dm-green" style={{ width: `${(completion.counts.confirmed / completion.items.length) * 100}%` }} />
                <div className="bg-dm-amber" style={{ width: `${(completion.counts.partial / completion.items.length) * 100}%` }} />
              </div>
            </div>
            <span className="tnum font-medium">{completion.percent}% complete</span>
          </div>
          <span className="text-dm-dim">
            <span className="text-dm-green">{completion.counts.confirmed} confirmed</span> · <span className="text-dm-amber">{completion.counts.partial} unconfirmed</span> · <span className="text-dm-red">{completion.counts.missing} missing</span>
          </span>
        </div>
      </header>


      <div className="grid items-start gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        <RecordCard p={p} />

        <div className="min-w-0 space-y-5">
          <Panel id="ownership" title="Ownership">
            <OwnershipChain property={p} deeds={propDeeds} />
          </Panel>
          <Panel id="people" title="Key people">
            <KeyPeople property={p} />
          </Panel>
        </div>

        <Panel id="notes" title="Notes" className="lg:col-span-2 2xl:col-span-1" action={openNotes > 0 ? <span className="text-label text-dm-amber">{openNotes} open</span> : undefined}>
          <NotesLog property={p} />
        </Panel>

        <Panel id="title" title="Title chain" className="lg:col-span-2 2xl:col-span-3" action={<span className="text-label text-dm-dim">{propDeeds.length} recorded instrument{propDeeds.length === 1 ? '' : 's'}</span>}>
          <div className="space-y-6">
            <DeedIngestionBuffer property={p} />
            <TitleChainTimeline deeds={propDeeds} />
          </div>
        </Panel>
      </div>

      {hasSpecs && cs && (
        <Panel id="specs" title="Specifications">
          <div className="grid gap-x-10 sm:grid-cols-2">
            {cs.operatingRooms !== undefined && <DetailRow label="Operating rooms" value={String(cs.operatingRooms)} />}
            {cs.pacuBays !== undefined && <DetailRow label="PACU bays" value={String(cs.pacuBays)} />}
            {cs.outpatientSharePercent !== undefined && <DetailRow label="Outpatient share" value={`${cs.outpatientSharePercent}%`} />}
            {cs.licensure && <DetailRow label="Licensure" value={cs.licensure} />}
            {cs.specialties && cs.specialties.length > 0 && <DetailRow label="Services" value={cs.specialties.join(' · ')} />}
          </div>
        </Panel>
      )}

      <details id="history" className="rounded-xl border border-dm-border/70 bg-dm-surface p-5">
        <summary className="cursor-pointer list-none text-body font-semibold text-dm-text [&::-webkit-details-marker]:hidden">
          Activity <span className="ml-1 text-label font-normal text-dm-dim">{activityCount}</span>
        </summary>
        <div className="mt-4">
          <HistoryLog propertyId={p.id} />
        </div>
      </details>
    </div>
  );
}
