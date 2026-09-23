import { useEffect, useMemo, useState } from 'react';
import { completionFor } from '@/lib/completion';
import { useDentimap } from '@/lib/store';
import type { Property, SourcedField } from '@/lib/types';
import { Panel, StatusPill } from './Chips';
import { EDIT_RECORD_EVENT } from './ConfirmLabel';
import { FinancialsCard } from './FinancialsCard';
import { OwnershipCard } from './OwnershipCard';
import { DeedIngestionBuffer } from './DeedIngestionBuffer';
import { HistoryLog } from './HistoryLog';
import { KeyPeople } from './KeyPeople';
import { NotesLog } from './NotesLog';
import { RecordCard } from './RecordCard';
import { TitleChainTimeline } from './TitleChainTimeline';


type Tab = 'property' | 'title' | 'people' | 'activity';

export function FacilityDossier({ property: p }: { property: Property }) {
  const { deeds } = useDentimap();
  const completion = completionFor(p, deeds);
  const propDeeds = useMemo(() => deeds.filter((d) => d.propertyId === p.id), [deeds, p.id]);
  const activityCount = useDentimap((s) => s.activity.filter((a) => a.propertyId === p.id).length);
  const openNotes = (p.noteLog ?? []).filter((n) => n.tag !== 'note' && !n.resolved).length;


  const [tab, setTab] = useState<Tab>('property');
  const [editSignal, setEditSignal] = useState(0);
  const [focusField, setFocusField] = useState<SourcedField | undefined>();

  // "Missing" labels anywhere on the page open the property editor.
  useEffect(() => {
    const open = (e: Event) => {
      setTab('property');
      setFocusField((e as CustomEvent<{ field?: SourcedField }>).detail?.field);
      setEditSignal((n) => n + 1);
    };
    window.addEventListener(EDIT_RECORD_EVENT, open);
    return () => window.removeEventListener(EDIT_RECORD_EVENT, open);
  }, []);

  const tabs: [Tab, string, string | undefined][] = [
    ['property', 'Property', undefined],
    ['title', 'Title chain', propDeeds.length ? String(propDeeds.length) : undefined],
    ['people', 'People and notes', openNotes > 0 ? `${openNotes} open` : undefined],
    ['activity', 'Activity', activityCount ? String(activityCount) : undefined],
  ];

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-5">
      <header className="min-w-0">
        <h1 className="text-display font-semibold leading-tight">{p.name}</h1>
        <div className="mt-1.5 flex items-center gap-3 text-label text-dm-muted">
          <StatusPill status={p.status} />
          <span className="text-dm-dim">·</span>
          <span className="tnum">{completion.counts.confirmed} of {completion.items.length} verified</span>
        </div>
      </header>

      <div className="stagger grid items-start gap-5 lg:grid-cols-[3fr_2fr]">
        <FinancialsCard p={p} />
        <OwnershipCard p={p} deeds={propDeeds} onViewChain={() => setTab('title')} />
      </div>

      <div
        role="tablist"
        aria-label="Location sections"
        className="scroll-thin flex gap-1 overflow-x-auto border-b border-dm-border"
        onKeyDown={(e) => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          const i = tabs.findIndex(([id]) => id === tab);
          const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length][0];
          setTab(next);
          requestAnimationFrame(() => document.getElementById(`tab-${next}`)?.focus());
        }}
      >
        {tabs.map(([id, label, badge]) => (
          <button
            key={id}
            id={`tab-${id}`}
            role="tab"
            aria-selected={tab === id}
            aria-controls="tab-panel"
            tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-body transition-colors ${
              tab === id ? 'border-dm-blue text-dm-text' : 'border-transparent text-dm-muted hover:text-dm-text'
            }`}
          >
            {label}
            {badge && <span className={`ml-1.5 text-label ${id === 'people' ? 'text-dm-amber' : 'text-dm-dim'}`}>{badge}</span>}
          </button>
        ))}
      </div>

      <div id="tab-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="space-y-5">
      {tab === 'property' && (
        <div className="space-y-5">
          <RecordCard p={p} editSignal={editSignal} focusField={focusField} />
        </div>
      )}

      {tab === 'title' && (
        <Panel id="title" title="Title chain" action={<span className="text-label text-dm-dim">{propDeeds.length} recorded instrument{propDeeds.length === 1 ? '' : 's'}</span>}>
          <div className="space-y-6">
            <DeedIngestionBuffer property={p} />
            <TitleChainTimeline deeds={propDeeds} />
          </div>
        </Panel>
      )}

      {tab === 'people' && (
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <Panel id="people" title="Key people">
            <KeyPeople property={p} />
          </Panel>
          <Panel id="notes" title="Notes" action={openNotes > 0 ? <span className="text-label text-dm-amber">{openNotes} open</span> : undefined}>
            <NotesLog property={p} />
          </Panel>
        </div>
      )}

      {tab === 'activity' && (
        <Panel id="history" title="Activity">
          <HistoryLog propertyId={p.id} />
        </Panel>
      )}
      </div>
    </div>
  );
}
