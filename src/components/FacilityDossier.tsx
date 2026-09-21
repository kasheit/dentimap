import { useMemo } from 'react';
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

const SECTIONS = [
  ['record', 'Record'],
  ['ownership', 'Ownership'],
  ['title', 'Title chain'],
  ['specs', 'Specifications'],
  ['notes', 'Notes'],
  ['history', 'History'],
] as const;

export function FacilityDossier({ property: p }: { property: Property }) {
  const { deeds, entities } = useDentimap();
  const propDeeds = useMemo(() => deeds.filter((d) => d.propertyId === p.id), [deeds, p.id]);
  const landlord = entities.find((e) => e.id === p.landlordEntityId);
  const operator = entities.find((e) => e.id === p.operatingEntityId);
  const cs = p.clinicalSpecs;
  const hasSpecs = !!cs && (cs.operatingRooms !== undefined || cs.pacuBays !== undefined || cs.outpatientSharePercent !== undefined || !!cs.specialties?.length || !!cs.licensure);
  const noteCount = (p.noteLog?.length ?? 0) + (p.notes ? 1 : 0);
  const openNotes = (p.noteLog ?? []).filter((n) => n.tag !== 'note' && !n.resolved).length;

  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header className="min-w-0">
        <div className="flex items-center gap-3 text-[13px] text-dm-muted">
          <span>{facilityTypeLabel[p.facilityType]}</span>
          <span className="text-dm-border">|</span>
          <StatusPill status={p.status} />
        </div>
        <h1 className="mt-1.5 text-[28px] font-semibold leading-tight">{p.name}</h1>
        {p.dbaName && <p className="mt-1 text-[14px] text-dm-muted">d/b/a {p.dbaName}</p>}
      </header>

      <nav className="sticky top-[53px] z-30 -mx-1 flex gap-1 overflow-x-auto border-b border-dm-border bg-dm-bg/95 px-1 backdrop-blur scroll-thin" aria-label="Sections">
        {SECTIONS.map(([id, label]) => (
          <button key={id} onClick={() => jump(id)} className="whitespace-nowrap px-3 py-2.5 text-[13px] text-dm-muted transition-colors hover:text-dm-text">
            {label}
            {id === 'title' && <span className="ml-1.5 text-dm-dim">{propDeeds.length}</span>}
            {id === 'notes' && noteCount > 0 && <span className={`ml-1.5 ${openNotes ? 'text-dm-amber' : 'text-dm-dim'}`}>{openNotes || noteCount}</span>}
          </button>
        ))}
      </nav>

      <RecordCard p={p} />

      <Card id="ownership" title="Ownership & control">
        <OwnershipChain business={p} deeds={propDeeds} landlord={landlord} operator={operator} />
      </Card>

      <Card id="title" title="Title chain" action={<span className="text-[13px] text-dm-dim">{propDeeds.length} recorded instrument{propDeeds.length === 1 ? '' : 's'}</span>}>
        <div className="space-y-6">
          <DeedIngestionBuffer property={p} />
          <TitleChainTimeline deeds={propDeeds} />
        </div>
      </Card>

      <Card id="specs" title="Specifications">
        {hasSpecs && cs ? (
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
        ) : (
          <p className="text-[13px] text-dm-dim">No clinical specifications on file for this facility.</p>
        )}
      </Card>

      <Card id="notes" title="Notes" action={openNotes > 0 ? <span className="text-[13px] text-dm-amber">{openNotes} open</span> : undefined}>
        <NotesLog property={p} />
      </Card>

      <Card id="history" title="History">
        <HistoryLog propertyId={p.id} />
      </Card>
    </div>
  );
}
