import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { fmtDate, personRoleLabel } from '@/lib/format';
import { useDentimap } from '@/lib/store';

interface Result {
  key: string;
  kind: 'Location' | 'Person' | 'Entity' | 'Deed';
  title: string;
  sub: string;
  go: () => void;
}

export const OPEN_SEARCH_EVENT = 'dentimap:open-search';

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { properties, people, entities, deeds, openProperty, openPerson, setTab } = useDentimap();
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

  const results = useMemo<Result[]>(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const words = needle.split(/\s+/);
    const hit = (s: string) => words.every((w) => s.toLowerCase().includes(w));
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
        out.push({ key: d.id, kind: 'Deed', title: `${d.grantor} → ${d.grantee}`, sub: `${fmtDate(d.recordingDate)} · ${propName(d.propertyId)}`, go: () => openProperty(d.propertyId) });
      }
    }
    return out.slice(0, 30);
  }, [q, properties, people, entities, deeds, openProperty, openPerson, setTab]);

  useEffect(() => setIdx(0), [q]);

  if (!open) return null;

  const choose = (r?: Result) => {
    if (!r) return;
    r.go();
    onClose();
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
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 px-4 pt-[12vh]" onMouseDown={onClose} role="dialog" aria-label="Search">
      <div className="w-full max-w-xl animate-scale-in overflow-hidden rounded-lg border border-dm-border bg-dm-surface shadow-xl shadow-black/60" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKeyDown}>
        <div className="relative border-b border-dm-border">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dm-dim" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search locations, people, entities, deeds"
            className="w-full bg-transparent py-3.5 pl-11 pr-4 text-body outline-none placeholder:text-dm-dim"
          />
        </div>
        <ul className="scroll-thin max-h-[50vh] overflow-y-auto p-2">
          {results.map((r, i) => (
            <li key={`${r.kind}-${r.key}`}>
              <button
                onMouseEnter={() => setIdx(i)}
                onClick={() => choose(r)}
                className={`flex w-full items-baseline gap-3 rounded-md px-3 py-2 text-left ${i === idx ? 'bg-dm-hover' : ''}`}
              >
                <span className="w-16 shrink-0 text-label text-dm-dim">{r.kind}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body">{r.title}</span>
                  {r.sub && <span className="block truncate text-label text-dm-dim">{r.sub}</span>}
                </span>
              </button>
            </li>
          ))}
          {q.trim() && results.length === 0 && <li className="px-3 py-6 text-center text-sm text-dm-dim">No matches.</li>}
          {!q.trim() && <li className="px-3 py-6 text-center text-sm text-dm-dim">Type to search.</li>}
        </ul>
      </div>
    </div>
  );
}
