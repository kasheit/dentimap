import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { attentionFor } from '@/lib/attention';
import { completionFor } from '@/lib/completion';
import { newId, useDentimap } from '@/lib/store';
import type { Property } from '@/lib/types';
import { StatusPill } from './Chips';

type Filter = 'all' | 'valleygate_asc' | 'vfd_practice' | 'attention';
type Sort = 'default' | 'name' | 'status' | 'county';

const STATUS_ORDER = { active: 0, pipeline_fitout: 1, pipeline_pending: 2, closed: 3 } as const;

export const FOCUS_SEARCH = 'dentimap:focus-search';

function Row({ p, active, onClick, issues, percent }: { p: Property; active: boolean; onClick: () => void; issues: string[]; percent: number }) {
  return (
    <button
      data-active={active}
      onClick={onClick}
      className={`group relative block w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
        active ? 'border-dm-blue/40 bg-dm-blue/[0.06]' : 'border-transparent hover:border-dm-border hover:bg-dm-hover'
      }`}
    >
      {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-dm-blue" />}
      <div className="flex items-start justify-between gap-2">
        <span className={`text-[13px] font-medium ${active ? 'text-dm-text' : 'text-dm-muted group-hover:text-dm-text'}`}>
          {p.name}
          {issues.length > 0 && <i className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-dm-amber align-middle" title={issues.join(' · ')} />}
        </span>
        <StatusPill status={p.status} />
      </div>
      <div className="mt-0.5 flex items-center justify-between gap-2 tnum text-[11px] text-dm-dim">
        <span>{p.address.city || 'No city'}{p.address.state ? `, ${p.address.state}` : ''}</span>
        <span className={percent >= 80 ? 'text-dm-green' : percent >= 40 ? 'text-dm-amber' : 'text-dm-red'}>{percent}%</span>
      </div>
    </button>
  );
}

export function Sidebar() {
  const { properties, deeds, selectedPropertyId, select, addProperty } = useDentimap();
  const [sort, setSort] = useState<Sort>('default');
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
      attention: properties.filter((p) => {
        const a = attentionFor(p, deeds);
        return a.issues.length > 0 || a.pipeline;
      }).length,
      valleygate_asc: properties.filter((p) => p.facilityType === 'valleygate_asc').length,
      vfd_practice: properties.filter((p) => p.facilityType === 'vfd_practice').length,
    }),
    [properties, deeds],
  );

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = properties.filter((p) => {
      if (filter === 'attention') {
        const a = attentionFor(p, deeds);
        if (!a.issues.length && !a.pipeline) return false;
      } else if (filter !== 'all' && p.facilityType !== filter) return false;
      if (!needle) return true;
      return [p.name, p.address.street, p.address.city, p.address.county, p.address.zip, p.address.parcelPin, p.address.state]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
    const by: Record<Sort, ((a: Property, b: Property) => number) | null> = {
      default: null,
      name: (a, b) => a.name.localeCompare(b.name),
      status: (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.name.localeCompare(b.name),
      county: (a, b) => a.address.county.localeCompare(b.address.county) || a.name.localeCompare(b.name),
    };
    const cmp = by[sort];
    return cmp ? [...list].sort(cmp) : list;
  }, [properties, deeds, q, filter, sort]);

  const groups = [
    { title: 'Valleygate Dental Surgery Centers', items: visible.filter((p) => p.facilityType === 'valleygate_asc') },
    { title: 'Affiliated Clinical Practices', items: visible.filter((p) => p.facilityType === 'vfd_practice') },
    { title: 'Affiliates', items: visible.filter((p) => p.facilityType === 'affiliate') },
  ].filter((g) => g.items.length);

  const ordered = groups.flatMap((g) => g.items);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [selectedPropertyId]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    if ((e.target as HTMLElement).tagName === 'SELECT') return;
    if (!ordered.length) return;
    e.preventDefault();
    const i = ordered.findIndex((p) => p.id === selectedPropertyId);
    const next = e.key === 'ArrowDown' ? Math.min(ordered.length - 1, i + 1) : Math.max(0, i === -1 ? 0 : i - 1);
    select(ordered[next].id);
  };

  const create = () =>
    addProperty({
      id: newId('prop'),
      name: 'New facility',
      facilityType: 'vfd_practice',
      status: 'active',
      address: { street: '', city: '', state: 'NC', zip: '', county: '', parcelPin: '' },
    });

  const chip = (id: Filter, label: string) => (
    <button
      key={id}
      onClick={() => setFilter(id)}
      className={`whitespace-nowrap tnum text-[12px] transition-colors ${
        filter === id ? 'text-dm-text underline decoration-dm-blue decoration-2 underline-offset-[6px]' : 'text-dm-dim hover:text-dm-muted'
      }`}
    >
      {label} ({counts[id]})
    </button>
  );

  return (
    <aside onKeyDown={onKeyDown} className="flex min-h-0 flex-col border-b border-dm-border bg-dm-bg lg:w-96 lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="space-y-3 border-b border-dm-border p-4">
        <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dm-dim" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search facilities, PINs…  ( / )"
            className="field pl-9"
          />
        </div>
          <button className="btn shrink-0 px-2.5" onClick={create} title="Add a facility" aria-label="Add a facility">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {chip('all', 'All')}
          {chip('valleygate_asc', 'Valleygate ASC')}
          {chip('vfd_practice', 'VFD')}
          {chip('attention', 'Needs attention')}
        </div>
        <label className="flex items-center gap-2 text-[12px] text-dm-dim">
          Sort
          <select className="bg-transparent text-dm-muted outline-none" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="default">Original order</option>
            <option value="name">Name</option>
            <option value="status">Status</option>
            <option value="county">County</option>
          </select>
        </label>
      </div>
      <div ref={listRef} className="scroll-thin max-h-72 flex-1 space-y-5 overflow-y-auto p-3 lg:max-h-none">
        {groups.map((g) => (
          <div key={g.title}>
            <h3 className="label mb-1.5 px-3">{g.title}</h3>
            <div className="space-y-0.5">
              {g.items.map((p) => (
                <Row key={p.id} p={p} percent={completionFor(p, deeds).percent} issues={attentionFor(p, deeds).issues} active={p.id === selectedPropertyId} onClick={() => select(p.id)} />
              ))}
            </div>
          </div>
        ))}
        {!groups.length && <p className="px-3 py-6 text-center text-sm text-dm-dim">No facilities match “{q}”.</p>}
      </div>
    </aside>
  );
}
