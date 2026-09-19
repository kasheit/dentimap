import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useDentimap } from '@/lib/store';
import type { Property } from '@/lib/types';
import { StatusPill } from './Chips';

type Filter = 'all' | 'valleygate_asc' | 'vfd_practice';

export const FOCUS_SEARCH = 'dentimap:focus-search';

function Row({ p, active, onClick }: { p: Property; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group relative block w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
        active ? 'border-dm-blue/40 bg-dm-blue/[0.06]' : 'border-transparent hover:border-dm-border hover:bg-dm-hover'
      }`}
    >
      {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-dm-blue" />}
      <div className="flex items-start justify-between gap-2">
        <span className={`text-[13px] font-medium ${active ? 'text-dm-text' : 'text-dm-muted group-hover:text-dm-text'}`}>{p.name}</span>
        <StatusPill status={p.status} />
      </div>
      <div className="mt-0.5 tnum text-[11px] text-dm-dim">
        {p.address.city}, {p.address.state} · {p.address.county.replace(' County', '')}
      </div>
    </button>
  );
}

export function Sidebar() {
  const { properties, selectedPropertyId, select } = useDentimap();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focus = () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener(FOCUS_SEARCH, focus);
    return () => window.removeEventListener(FOCUS_SEARCH, focus);
  }, []);

  const counts = useMemo(
    () => ({
      all: properties.length,
      valleygate_asc: properties.filter((p) => p.facilityType === 'valleygate_asc').length,
      vfd_practice: properties.filter((p) => p.facilityType === 'vfd_practice').length,
    }),
    [properties],
  );

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return properties.filter((p) => {
      if (filter !== 'all' && p.facilityType !== filter) return false;
      if (!needle) return true;
      return [p.name, p.address.street, p.address.city, p.address.county, p.address.zip, p.address.parcelPin, p.address.state]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [properties, q, filter]);

  const groups = [
    { title: 'Valleygate Dental Surgery Centers', items: visible.filter((p) => p.facilityType === 'valleygate_asc') },
    { title: 'Affiliated Clinical Practices', items: visible.filter((p) => p.facilityType === 'vfd_practice') },
    { title: 'Affiliates', items: visible.filter((p) => p.facilityType === 'affiliate') },
  ].filter((g) => g.items.length);

  const chip = (id: Filter, label: string) => (
    <button
      key={id}
      onClick={() => setFilter(id)}
      className={`whitespace-nowrap rounded-full border px-2.5 py-1 tnum text-[11px] transition-colors ${
        filter === id ? 'border-dm-blue/40 bg-dm-blue/10 text-dm-blue' : 'border-dm-border text-dm-dim hover:text-dm-muted'
      }`}
    >
      {label} ({counts[id]})
    </button>
  );

  return (
    <aside className="flex min-h-0 flex-col border-b border-dm-border bg-dm-bg lg:w-96 lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="space-y-3 border-b border-dm-border p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dm-dim" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search facilities, cities, PINs…"
            className="field pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {chip('all', 'All')}
          {chip('valleygate_asc', 'Valleygate ASC')}
          {chip('vfd_practice', 'VFD')}
        </div>
      </div>
      <div className="scroll-thin max-h-72 flex-1 space-y-5 overflow-y-auto p-3 lg:max-h-none">
        {groups.map((g) => (
          <div key={g.title}>
            <h3 className="label mb-1.5 px-3">{g.title}</h3>
            <div className="space-y-0.5">
              {g.items.map((p) => (
                <Row key={p.id} p={p} active={p.id === selectedPropertyId} onClick={() => select(p.id)} />
              ))}
            </div>
          </div>
        ))}
        {!groups.length && <p className="px-3 py-6 text-center text-sm text-dm-dim">No facilities match “{q}”.</p>}
      </div>
    </aside>
  );
}
