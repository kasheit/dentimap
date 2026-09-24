import { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Search } from 'lucide-react';
import { exportJson } from '@/lib/exporters';
import { fmtDate, personRoleLabel } from '@/lib/format';
import { newId, useDentimap } from '@/lib/store';
import { UPLOAD_EVENT } from './DocumentIntake';

type Kind = 'Location' | 'Person' | 'Entity' | 'Deed' | 'Term' | 'Action';

interface Result {
  key: string;
  kind: Kind;
  title: string;
  sub: string;
  go: () => void;
}

export const OPEN_SEARCH_EVENT = 'dentimap:open-search';

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { properties, people, entities, deeds, glossary, openProperty, openPerson, setTab, select, addProperty, addEntity } = useDentimap();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const actions = useMemo<Result[]>(() => {
    const go = (tab: Parameters<typeof setTab>[0]) => () => setTab(tab);
    const base: Result[] = [
      {
        key: 'add-location',
        kind: 'Action',
        title: 'Add location',
        sub: 'Create a new location and open it',
        go: () => {
          const id = newId('prop');
          addProperty({ id, name: 'New location', facilityType: 'vfd_practice', status: 'active', address: { street: '', city: '', state: 'NC', zip: '', county: '', parcelPin: '' } });
          openProperty(id);
        },
      },
      {
        key: 'upload',
        kind: 'Action',
        title: 'Upload documents',
        sub: 'Read deeds, county pages or scans',
        go: () => {
          select('');
          setTab('properties');
          setTimeout(() => window.dispatchEvent(new Event(UPLOAD_EVENT)), 200);
        },
      },
      {
        key: 'add-entity',
        kind: 'Action',
        title: 'Add entity',
        sub: 'Create a new LLC or company',
        go: () => {
          addEntity({ id: newId('entity'), name: 'New entity', entityType: 'landlord_holding', jurisdiction: 'North Carolina', associatedPropertyIds: [] });
          setTab('entities');
        },
      },
      {
        key: 'backup',
        kind: 'Action',
        title: 'Back up data',
        sub: 'Download a full JSON backup',
        go: () => {
          const { properties: pr, deeds: de, entities: en, people: pe, activity, glossary: gl } = useDentimap.getState();
          exportJson({ properties: pr, deeds: de, entities: en, people: pe, activity, glossary: gl });
        },
      },
      { key: 'go-home', kind: 'Action', title: 'Go to Next up', sub: 'Home', go: go('home') },
      { key: 'go-locations', kind: 'Action', title: 'Go to Locations', sub: 'The list of every location', go: () => { select(''); setTab('properties'); } },
      { key: 'go-entities', kind: 'Action', title: 'Go to Entities', sub: 'Who holds what', go: go('entities') },
      { key: 'go-people', kind: 'Action', title: 'Go to People', sub: 'Contacts and roles', go: go('people') },
      { key: 'go-deeds', kind: 'Action', title: 'Go to Deeds', sub: 'Every recorded instrument', go: go('deeds') },
      { key: 'go-glossary', kind: 'Action', title: 'Go to Glossary', sub: 'Terms and acronyms', go: go('glossary') },
    ];
    // one "Add deed to ..." per location, found only by typing
    const deedActions: Result[] = properties.map((p) => ({ key: `deed-${p.id}`, kind: 'Action', title: `Add deed to ${p.name}`, sub: 'Opens the title chain', go: () => openProperty(p.id, 'title') }));
    return [...base, ...deedActions];
  }, [properties, addProperty, addEntity, openProperty, select, setTab]);

  const results = useMemo<Result[]>(() => {
    const raw = q.trim();
    const actionsOnly = raw.startsWith('>');
    const needle = (actionsOnly ? raw.slice(1) : raw).trim().toLowerCase();
    const words = needle.split(/\s+/).filter(Boolean);
    const hit = (s: string) => words.every((w) => s.toLowerCase().includes(w));
    const matchedActions = actions.filter((a) => (words.length ? hit(`${a.title} ${a.sub}`) : !a.key.startsWith('deed-')));
    if (!needle) return matchedActions.slice(0, 8);
    if (actionsOnly) return matchedActions.slice(0, 12);

    const propName = (id: string) => properties.find((p) => p.id === id)?.name ?? '';
    const out: Result[] = [];
    for (const p of properties) {
      if (hit([p.name, p.legalName, p.dbaName, p.sosId, p.address.street, p.address.city, p.address.zip, p.address.county, p.address.parcelPin].filter(Boolean).join(' '))) {
        out.push({ key: p.id, kind: 'Location', title: p.name, sub: [p.address.city, p.address.state, p.address.parcelPin].filter(Boolean).join(' · '), go: () => openProperty(p.id) });
      }
    }
    for (const p of people) {
      if (hit([p.name, p.title, p.relevance, ...p.roles.map((r) => personRoleLabel[r])].filter(Boolean).join(' '))) {
        out.push({ key: p.id, kind: 'Person', title: p.name, sub: p.roles.map((r) => personRoleLabel[r]).join(' · '), go: () => openPerson(p.id) });
      }
    }
    for (const e of entities) {
      if (hit([e.name, e.dbaName, e.sosId].filter(Boolean).join(' '))) {
        out.push({ key: e.id, kind: 'Entity', title: e.name, sub: [e.dbaName && `d/b/a ${e.dbaName}`, e.sosId && `SOS ${e.sosId}`].filter(Boolean).join(' · '), go: () => setTab('entities') });
      }
    }
    for (const d of deeds) {
      if (hit([d.grantor, d.grantee, d.instrumentNumber, d.book && d.page ? `${d.book} ${d.page}` : '', d.source].filter(Boolean).join(' '))) {
        out.push({ key: d.id, kind: 'Deed', title: `${d.grantor} → ${d.grantee}`, sub: `${fmtDate(d.recordingDate)} · ${propName(d.propertyId)}`, go: () => openProperty(d.propertyId, 'title') });
      }
    }
    for (const t of glossary) {
      if (hit([t.term, t.expansion, t.definition].filter(Boolean).join(' '))) {
        out.push({ key: t.id, kind: 'Term', title: t.term, sub: t.expansion ?? t.definition, go: () => setTab('glossary') });
      }
    }
    return [...out.slice(0, 24), ...matchedActions.slice(0, 5)];
  }, [q, actions, properties, people, entities, deeds, glossary, openProperty, openPerson, setTab]);

  useEffect(() => setIdx(0), [q]);

  if (!open) return null;

  const choose = (r?: Result) => {
    if (!r) return;
    onClose();
    r.go();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIdx((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') choose(results[idx]);
  };

  return (
    <div className="animate-fade-in fixed inset-0 z-[60] flex items-start justify-center bg-black/30 px-4 pt-[12vh]" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label="Search and commands">
      <div className="animate-scale-in w-full max-w-xl origin-top overflow-hidden rounded-lg border border-dm-border bg-dm-surface shadow-pop" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKeyDown}>
        <div className="relative border-b border-dm-border">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dm-dim" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search or run a command"
            placeholder="Search, or type > for commands"
            className="w-full bg-transparent py-3.5 pl-11 pr-4 text-body outline-none placeholder:text-dm-dim"
          />
        </div>
        <ul role="listbox" className="scroll-thin max-h-[50vh] overflow-y-auto p-2">
          {!q.trim() && <li className="px-3 pb-1 pt-1 text-[12px] font-medium text-dm-dim">Commands</li>}
          {results.map((r, i) => (
            <li key={`${r.kind}-${r.key}`}>
              <button
                role="option"
                aria-selected={i === idx}
                onMouseEnter={() => setIdx(i)}
                onClick={() => choose(r)}
                className={`flex w-full items-baseline gap-3 rounded-md px-3 py-2 text-left transition-colors duration-150 ${i === idx ? 'bg-dm-hover' : ''}`}
              >
                <span className="w-16 shrink-0 text-label text-dm-dim">{r.kind === 'Action' ? 'Command' : r.kind}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body">{r.title}</span>
                  {r.sub && <span className="block truncate text-label text-dm-muted">{r.sub}</span>}
                </span>
                {i === idx && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 self-center text-dm-dim" aria-hidden />}
              </button>
            </li>
          ))}
          {q.trim() && results.length === 0 && <li className="px-3 py-6 text-center text-sm text-dm-dim">No matches.</li>}
        </ul>
      </div>
    </div>
  );
}
