import { useEffect, useMemo, useState } from 'react';
import { completionFor } from '@/lib/completion';
import { newId, useDentimap } from '@/lib/store';
import { fmtDate } from '@/lib/format';
import type { DeedRecord, Property, SourcedField } from '@/lib/types';
import { Panel, StatusPill } from './Chips';
import { ChainStrip } from './ChainStrip';
import type { MissingDeed } from './ChainStrip';
import { DeedSheet } from './DeedSheet';
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


  const requested = useDentimap((s) => s.dossierTab);
  const clearRequested = useDentimap((s) => s.clearDossierTab);
  const [tab, setTab] = useState<Tab>(requested ?? 'property');
  useEffect(() => {
    if (requested) clearRequested();
  }, [requested, clearRequested]);
  const [editSignal, setEditSignal] = useState(0);
  const addDeed = useDentimap((s) => s.addDeed);
  const updateDeed = useDentimap((s) => s.updateDeed);
  const [sheet, setSheet] = useState<{ deed: DeedRecord; isNew: boolean; hint?: string } | null>(null);
  const [adding, setAdding] = useState(false);

  const editDeed = (id: string) => {
    const deed = propDeeds.find((d) => d.id === id);
    if (deed) setSheet({ deed, isNew: false });
  };
  const addMissing = (m: MissingDeed) =>
    setSheet({
      isNew: true,
      hint: `Between ${fmtDate(m.after)} and ${fmtDate(m.before)}`,
      deed: { id: newId('deed'), propertyId: p.id, recordingDate: '', deedType: 'warranty_deed', grantor: m.from, grantee: m.to, consideration: 0, exciseTaxStamps: 0, isFormulaVerified: false, confidence: 'unverified', source: '' },
    });
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
          {p.metrics?.targetOpening && (
            <>
              <span className="text-dm-dim">·</span>
              <span>Target opening {p.metrics.targetOpening}</span>
            </>
          )}
          <span className="text-dm-dim">·</span>
          <span className="tnum">{completion.counts.confirmed} of {completion.items.length} verified</span>
        </div>
      </header>

      <div className="stagger grid items-start gap-5 lg:grid-cols-[3fr_2fr]">
        <FinancialsCard p={p} />
        <OwnershipCard p={p} deeds={propDeeds} />
      </div>

      {propDeeds.some((d) => d.deedType !== 'subdivision_plat') && (
        <section id="chain" className="min-w-0 rounded-lg border border-dm-border bg-dm-surface p-5 shadow-card">
          <header className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-body font-semibold text-dm-text">Ownership chain</h2>
            <button type="button" className="rounded text-label text-dm-blue hover:underline" onClick={() => setTab('title')}>
              All deeds
            </button>
          </header>
          <ChainStrip deeds={propDeeds} max={4} onSelect={editDeed} onAddMissing={addMissing} />
        </section>
      )}

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
        <Panel
          id="title"
          title="Deeds"
          action={
            <span className="flex items-center gap-3">
              <span className="text-label text-dm-dim">
                {propDeeds.length} recorded instrument{propDeeds.length === 1 ? '' : 's'}
              </span>
              <button className="btn" aria-expanded={adding || !propDeeds.length} onClick={() => setAdding((v) => !v)}>
                {adding || !propDeeds.length ? 'Hide' : 'Add deed'}
              </button>
            </span>
          }
        >
          <div className="space-y-5">
            {(adding || !propDeeds.length) && <DeedIngestionBuffer property={p} />}
            <TitleChainTimeline deeds={propDeeds} onEdit={editDeed} />
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

      {sheet && (
        <DeedSheet
          key={sheet.deed.id}
          deed={sheet.deed}
          isNew={sheet.isNew}
          hint={sheet.hint}
          onClose={() => setSheet(null)}
          onSave={(next) => {
            if (sheet.isNew) addDeed(next);
            else updateDeed(sheet.deed.id, next);
            setSheet(null);
          }}
        />
      )}
    </div>
  );
}
