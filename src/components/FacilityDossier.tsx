import { useMemo } from 'react';
import { completionFor } from '@/lib/completion';
import { facilityTypeLabel } from '@/lib/format';
import { useDentimap } from '@/lib/store';
import type { Property } from '@/lib/types';
import { Card, Fact, Group, StatusPill } from './Chips';
import { OwnershipChain } from './CorporateEntities';
import { DeedIngestionBuffer } from './DeedIngestionBuffer';
import { HistoryLog } from './HistoryLog';
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
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header className="min-w-0">
        <div className="flex items-center gap-3 text-[13px] text-dm-muted">
          <span>{facilityTypeLabel[p.facilityType]}</span>
          <span className="text-dm-border">|</span>
          <StatusPill status={p.status} />
        </div>
        <h1 className="mt-1.5 text-[28px] font-semibold leading-tight">{p.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
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


      <RecordCard p={p} />

      <Card id="ownership" title="Ownership">
        <OwnershipChain property={p} deeds={propDeeds} />
      </Card>

      <Card id="title" title="Title chain" action={<span className="text-[13px] text-dm-dim">{propDeeds.length} recorded instrument{propDeeds.length === 1 ? '' : 's'}</span>}>
        <div className="space-y-6">
          <DeedIngestionBuffer property={p} />
          <TitleChainTimeline deeds={propDeeds} />
        </div>
      </Card>


      {hasSpecs && cs && (
        <Card id="specs" title="Specifications">
          <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {(cs.operatingRooms !== undefined || cs.pacuBays !== undefined || cs.outpatientSharePercent !== undefined) && (
              <Group title="Capacity">
                {cs.operatingRooms !== undefined && <Fact label="Operating rooms">{cs.operatingRooms}</Fact>}
                {cs.pacuBays !== undefined && <Fact label="PACU bays">{cs.pacuBays}</Fact>}
                {cs.outpatientSharePercent !== undefined && <Fact label="Outpatient share">{cs.outpatientSharePercent}%</Fact>}
              </Group>
            )}
            {cs.licensure && (
              <Group title="Licensure">
                <Fact label="Status">{cs.licensure}</Fact>
              </Group>
            )}
            {cs.specialties && cs.specialties.length > 0 && (
              <div className="sm:col-span-2">
                <h3 className="mb-1 text-[13px] font-semibold">Services</h3>
                <p className="text-[14px] leading-relaxed text-dm-muted">{cs.specialties.join(' · ')}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card id="notes" title="Notes" action={openNotes > 0 ? <span className="text-[13px] text-dm-amber">{openNotes} open</span> : undefined}>
        <NotesLog property={p} />
      </Card>

      <details id="history" className="border-t border-dm-border pt-5">
        <summary className="cursor-pointer list-none text-[15px] font-semibold text-dm-text [&::-webkit-details-marker]:hidden">
          Activity <span className="ml-1 text-[13px] font-normal text-dm-dim">{activityCount}</span>
        </summary>
        <div className="mt-4">
          <HistoryLog propertyId={p.id} />
        </div>
      </details>
    </div>
  );
}
