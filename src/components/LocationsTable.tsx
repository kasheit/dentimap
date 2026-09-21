import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Search } from 'lucide-react';
import { attentionFor } from '@/lib/attention';
import { completionFor } from '@/lib/completion';
import { addressLine, compactUsd, facilityTypeLabel } from '@/lib/format';
import { newId, useDentimap } from '@/lib/store';
import type { FacilityStatus, Property } from '@/lib/types';
import { StatusPill } from './Chips';

type TypeFilter = 'all' | 'valleygate_asc' | 'vfd_practice' | 'attention';
type StatusFilter = 'all' | 'active' | 'pipeline' | 'closed';
type SortKey = 'type' | 'name' | 'city' | 'status' | 'complete';

export const FOCUS_SEARCH = 'dentimap:focus-search';

const TYPE_ORDER = { valleygate_asc: 0, vfd_practice: 1, affiliate: 2 } as const;
const STATUS_ORDER: Record<FacilityStatus, number> = { active: 0, pipeline_fitout: 1, pipeline_pending: 2, closed: 3 };
const statusGroup = (s: FacilityStatus): StatusFilter => (s === 'active' ? 'active' : s === 'closed' ? 'closed' : 'pipeline');

export const byType = (a: Property, b: Property) => TYPE_ORDER[a.facilityType] - TYPE_ORDER[b.facilityType];

function Head({ label, k, sort, onSort, right }: { label: string; k: SortKey; sort: { key: SortKey; dir: 1 | -1 }; onSort: (k: SortKey) => void; right?: boolean }) {
  const active = sort.key === k;
  const Icon = !active ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
  return (
    <th className={`px-4 py-3 font-medium ${right ? 'text-right' : 'text-left'}`} aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button onClick={() => onSort(k)} className={`inline-flex items-center gap-1.5 uppercase tracking-[0.08em] transition-colors hover:text-dm-text ${active ? 'text-dm-text' : ''}`}>
        {label}
        <Icon className={`h-3 w-3 ${active ? 'text-dm-text' : 'opacity-50'}`} />
      </button>
    </th>
  );
}

export function LocationsTable() {
  const { properties, deeds, select, addProperty } = useDentimap();
  const [q, setQ] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'type', dir: 1 });
  const [previewId, setPreviewId] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focus = () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener(FOCUS_SEARCH, focus);
    return () => window.removeEventListener(FOCUS_SEARCH, focus);
  }, []);

  const rows = useMemo(
    () =>
      properties.map((p) => {
        const a = attentionFor(p, deeds);
        const c = completionFor(p, deeds);
        return { p, percent: c.percent, counts: c.counts, issues: a.issues, needs: a.issues.length > 0 || a.pipeline };
      }),
    [properties, deeds],
  );

  const kpis = useMemo(() => {
    const sum = (pick: (p: Property) => number | undefined) => properties.reduce((t, p) => t + (pick(p) ?? 0), 0);
    const assessed = sum((p) => p.metrics?.currentAssessedValue);
    const investment = sum((p) => p.metrics?.projectInvestment);
    const complete = rows.length ? Math.round(rows.reduce((t, r) => t + r.percent, 0) / rows.length) : 0;
    return [
      ['Locations', String(properties.length)],
      ['Avg. complete', `${complete}%`],
      ['Assessed', compactUsd(assessed || undefined)],
      ['Investment', compactUsd(investment || undefined)],
    ];
  }, [properties, rows]);

  const counts = useMemo(
    () => ({
      type: {
        all: rows.length,
        valleygate_asc: rows.filter((r) => r.p.facilityType === 'valleygate_asc').length,
        vfd_practice: rows.filter((r) => r.p.facilityType === 'vfd_practice').length,
        attention: rows.filter((r) => r.needs).length,
      } as Record<TypeFilter, number>,
      status: {
        all: rows.length,
        active: rows.filter((r) => statusGroup(r.p.status) === 'active').length,
        pipeline: rows.filter((r) => statusGroup(r.p.status) === 'pipeline').length,
        closed: rows.filter((r) => statusGroup(r.p.status) === 'closed').length,
      } as Record<StatusFilter, number>,
    }),
    [rows],
  );

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const value = (r: (typeof rows)[number]): string | number => {
      switch (sort.key) {
        case 'name': return r.p.name;
        case 'city': return r.p.address.city;
        case 'status': return STATUS_ORDER[r.p.status];
        case 'complete': return r.percent;
        default: return TYPE_ORDER[r.p.facilityType];
      }
    };
    return rows
      .filter((r) => {
        if (type === 'attention' ? !r.needs : type !== 'all' && r.p.facilityType !== type) return false;
        if (status !== 'all' && statusGroup(r.p.status) !== status) return false;
        if (!needle) return true;
        const a = r.p.address;
        return [r.p.name, r.p.dbaName, a.street, a.city, a.county, a.zip, a.parcelPin, a.state].join(' ').toLowerCase().includes(needle);
      })
      .map((r, i) => ({ r, i }))
      .sort((x, y) => {
        const av = value(x.r);
        const bv = value(y.r);
        const c = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return c * sort.dir || x.i - y.i;
      })
      .map(({ r }) => r);
  }, [rows, q, type, status, sort]);

  const preview = visible.find((r) => r.p.id === previewId) ?? visible[0];

  // one click previews on wide screens; on narrow ones there is no pane, so it opens straight away
  const pick = (id: string) => (window.matchMedia('(min-width: 1024px)').matches ? setPreviewId(id) : select(id));

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT' || !preview) return;
    const i = visible.findIndex((r) => r.p.id === preview.p.id);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setPreviewId(visible[Math.min(visible.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))].p.id);
    } else if (e.key === 'Enter') {
      select(preview.p.id);
    }
  };

  const onSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  const create = () =>
    addProperty({
      id: newId('prop'),
      name: 'New location',
      facilityType: 'vfd_practice',
      status: 'active',
      address: { street: '', city: '', state: 'NC', zip: '', county: '', parcelPin: '' },
    });

  const chips = <T extends string>(label: string, ids: readonly T[], names: Record<T, string>, active: T, set: (v: T) => void, count: Record<T, number>) => (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5" role="group" aria-label={label}>
      <span className="label">{label}</span>
      {ids.map((id) => (
        <button key={id} aria-pressed={active === id} onClick={() => set(id)} className="tab-chip tnum">
          {names[id]} ({count[id]})
        </button>
      ))}
    </div>
  );

  return (
    <main className="mx-auto max-w-[1680px] p-4 sm:p-6 lg:p-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Locations</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dm-dim" />
            <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, city, PIN" className="field w-64 pl-9 pr-8" />
            <span className="kbd pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">/</span>
          </div>
          <button className="btn" onClick={create} title="Add a location">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 overflow-hidden rounded-lg border border-dm-border bg-dm-surface sm:grid-cols-4">
        {kpis.map(([label, value]) => (
          <div key={label} className="border-dm-border px-4 py-3 [&:not(:last-child)]:sm:border-r">
            <div className="eyebrow">{label}</div>
            <div className="tnum mt-0.5 font-mono text-2xl font-medium">{value}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-8 gap-y-3">
        {chips('Type', ['all', 'valleygate_asc', 'vfd_practice', 'attention'] as const, { all: 'All', valleygate_asc: 'Valleygate', vfd_practice: 'VFD', attention: 'Needs attention' }, type, setType, counts.type)}
        {chips('Status', ['all', 'active', 'pipeline', 'closed'] as const, { all: 'All', active: 'Active', pipeline: 'Pipeline', closed: 'Closed' }, status, setStatus, counts.status)}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]" onKeyDown={onKeyDown}>
        <div tabIndex={0} className="scroll-thin overflow-x-auto rounded-lg border border-dm-border bg-dm-surface outline-none focus-visible:border-dm-muted">
          <table className="w-full min-w-[560px] border-collapse text-label">
            <thead className="eyebrow border-b border-dm-border">
              <tr>
                <Head label="Location" k="name" sort={sort} onSort={onSort} />
                <Head label="City" k="city" sort={sort} onSort={onSort} />
                <Head label="Status" k="status" sort={sort} onSort={onSort} />
                <Head label="Done" k="complete" sort={sort} onSort={onSort} />
              </tr>
            </thead>
            <tbody>
              {visible.map(({ p, percent, issues }) => {
                const on = p.id === preview?.p.id;
                return (
                  <tr
                    key={p.id}
                    onClick={() => pick(p.id)}
                    onDoubleClick={() => select(p.id)}
                    aria-selected={on}
                    className={`cursor-pointer border-b border-dm-border/60 transition-colors last:border-0 ${on ? 'bg-dm-hover lg:shadow-[inset_2px_0_0_rgb(var(--dm-text))]' : 'hover:bg-dm-hover/60'}`}
                  >
                    <td className="px-4 py-2.5">
                      <div className="text-body font-medium text-dm-text">
                        {p.name}
                        {issues.length > 0 && <i className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-dm-amber align-middle" title={issues.join(' · ')} />}
                      </div>
                      <div className="text-dm-dim">{facilityTypeLabel[p.facilityType]}</div>
                    </td>
                    <td className="px-4 py-2.5 text-dm-muted">
                      {p.address.city || '—'}
                      {p.address.state ? `, ${p.address.state}` : ''}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="tnum px-4 py-2.5 font-mono text-dm-muted">{percent}%</td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-body text-dm-dim">
                    {properties.length ? 'No matches.' : 'No locations.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {preview && (
          <aside className="hidden space-y-4 rounded-lg border border-dm-border bg-dm-surface p-5 lg:sticky lg:top-20 lg:block" aria-label="Location preview">
            <div>
              <StatusPill status={preview.p.status} />
              <h2 className="mt-2 text-title font-semibold">{preview.p.name}</h2>
              <p className="mt-0.5 text-label text-dm-dim">
                {facilityTypeLabel[preview.p.facilityType]}
                {preview.p.dbaName ? ` · d/b/a ${preview.p.dbaName}` : ''}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-dm-border bg-dm-border">
              {[
                ['Assessed', compactUsd(preview.p.metrics?.currentAssessedValue)],
                ['Investment', compactUsd(preview.p.metrics?.projectInvestment)],
                ['Last sale', compactUsd(preview.p.lastSale?.price)],
                ['Complete', `${preview.percent}%`],
              ].map(([label, value]) => (
                <div key={label} className="bg-dm-surface px-3 py-2">
                  <div className="eyebrow">{label}</div>
                  <div className="tnum mt-0.5 font-mono text-title font-medium">{value}</div>
                </div>
              ))}
            </div>
            <dl className="space-y-1.5 text-label">
              <div className="flex justify-between gap-3">
                <dt className="text-dm-dim">Address</dt>
                <dd className="text-right">{preview.p.address.street ? addressLine(preview.p.address) : '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-dm-dim">Parcel PIN</dt>
                <dd className="font-mono">{preview.p.address.parcelPin || '—'}</dd>
              </div>
            </dl>
            <p className="text-label">
              <span className="text-dm-green">{preview.counts.confirmed} confirmed</span> · <span className="text-dm-amber">{preview.counts.partial} unconfirmed</span> ·{' '}
              <span className="text-dm-red">{preview.counts.missing} missing</span>
            </p>
            {preview.issues.length > 0 && (
              <ul className="space-y-1 text-label text-dm-muted">
                {preview.issues.map((i) => (
                  <li key={i} className="flex items-center gap-2">
                    <i className="h-1.5 w-1.5 rounded-full bg-dm-amber" />
                    {i}
                  </li>
                ))}
              </ul>
            )}
            <button className="btn btn-primary w-full justify-center" onClick={() => select(preview.p.id)}>
              Open location
            </button>
          </aside>
        )}
      </div>
    </main>
  );
}
