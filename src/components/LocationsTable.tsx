import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Circle, CircleCheck, CircleDashed, Plus, Search, Upload } from 'lucide-react';
import { attentionFor } from '@/lib/attention';
import { completionFor, levelFor } from '@/lib/completion';
import { compactUsd, facilityTypeLabel, fmtDate } from '@/lib/format';
import { newId, sortedDeeds, useDentimap } from '@/lib/store';
import type { FacilityType, Property } from '@/lib/types';
import { DocumentIntake, UPLOAD_EVENT } from './DocumentIntake';

type SortKey = 'type' | 'name' | 'owner' | 'assessed' | 'sale' | 'verified';
type LocState = 'confirmed' | 'unconfirmed' | 'missing';
type Filter = 'all' | LocState;

export const FOCUS_SEARCH = 'dentimap:focus-search';

const TYPE_ORDER = { valleygate_asc: 0, vfd_practice: 1, affiliate: 2 } as const;

export const byType = (a: Property, b: Property) => TYPE_ORDER[a.facilityType] - TYPE_ORDER[b.facilityType];

const stateMeta: Record<LocState, { label: string; Icon: typeof CircleCheck; cls: string }> = {
  confirmed: { label: 'Owner and value verified', Icon: CircleCheck, cls: 'text-dm-green' },
  unconfirmed: { label: 'Owner or value unverified', Icon: CircleDashed, cls: 'text-dm-amber' },
  missing: { label: 'Owner or value not found', Icon: Circle, cls: 'text-dm-dim' },
};

interface Row {
  p: Property;
  owner?: string;
  ownerSure: boolean;
  assessed?: number;
  assessedSure: boolean;
  state: LocState;
  verified: number;
  total: number;
  issues: string[];
  county: string;
  investment?: number;
  lastDeed?: string;
}

function Head({ label, k, sort, onSort, right, hideSmall }: { label: string; k: SortKey; sort: { key: SortKey; dir: 1 | -1 }; onSort: (k: SortKey) => void; right?: boolean; hideSmall?: boolean }) {
  const active = sort.key === k;
  const Icon = sort.dir === 1 ? ArrowUp : ArrowDown;
  return (
    <th className={`px-3 py-2 text-[12px] font-medium ${right ? 'text-right' : 'text-left'} ${hideSmall ? 'hidden sm:table-cell' : ''}`} aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button onClick={() => onSort(k)} className={`inline-flex items-center gap-1 rounded transition-colors hover:text-dm-text ${active ? 'text-dm-text' : 'text-dm-dim'}`}>
        {label}
        {active && <Icon className="h-3 w-3" aria-hidden />}
      </button>
    </th>
  );
}

export function LocationsTable() {
  const { properties, deeds, select, addProperty } = useDentimap();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [wide, setWide] = useState(false);
  const span = wide ? 9 : 6;
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'type', dir: 1 });
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    const focus = () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener(FOCUS_SEARCH, focus);
    return () => window.removeEventListener(FOCUS_SEARCH, focus);
  }, []);

  const rows = useMemo<Row[]>(
    () =>
      properties.map((p) => {
        const mine = deeds.filter((d) => d.propertyId === p.id);
        const holder = sortedDeeds(mine.filter((d) => d.deedType !== 'subdivision_plat')).slice(-1)[0];
        const assessed = p.metrics?.currentAssessedValue;
        const issues = attentionFor(p, deeds).issues;
        const assessedSure = levelFor(assessed !== undefined, p.meta?.assessedValue) === 'confirmed';
        const ownerSure = !!holder && holder.confidence === 'verified' && holder.isFormulaVerified;
        const blocking = issues.some((i) => !i.includes('note'));
        const state: LocState = !holder || assessed === undefined ? 'missing' : ownerSure && assessedSure && !blocking ? 'confirmed' : 'unconfirmed';
        const c = completionFor(p, deeds);
        const lastDeed = mine.map((d) => d.recordingDate).sort().slice(-1)[0];
        return {
          p, owner: holder?.grantee, ownerSure, assessed, assessedSure, state, verified: c.counts.confirmed, total: c.items.length, issues,
          county: p.address.county.replace(/ County$/, ''), investment: p.metrics?.projectInvestment, lastDeed,
        };
      }),
    [properties, deeds],
  );

  const counts = useMemo(
    () => ({
      all: rows.length,
      confirmed: rows.filter((r) => r.state === 'confirmed').length,
      unconfirmed: rows.filter((r) => r.state === 'unconfirmed').length,
      missing: rows.filter((r) => r.state === 'missing').length,
    }),
    [rows],
  );

  const totals = useMemo(() => {
    const withValue = rows.filter((r) => r.assessed !== undefined);
    return { sum: withValue.reduce((t, r) => t + (r.assessed ?? 0), 0), n: withValue.length };
  }, [rows]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const value = (r: Row): string | number => {
      switch (sort.key) {
        case 'name': return r.p.name;
        case 'owner': return r.owner ?? '￿';
        case 'assessed': return r.assessed ?? -1;
        case 'sale': return r.p.lastSale?.price ?? -1;
        case 'verified': return r.verified;
        default: return TYPE_ORDER[r.p.facilityType];
      }
    };
    return rows
      .filter((r) => {
        if (filter !== 'all' && r.state !== filter) return false;
        if (!needle) return true;
        const a = r.p.address;
        return [r.p.name, r.p.dbaName, r.owner, a.street, a.city, a.county, a.zip, a.parcelPin, a.state].join(' ').toLowerCase().includes(needle);
      })
      .map((r, i) => ({ r, i }))
      .sort((x, y) => {
        const av = value(x.r);
        const bv = value(y.r);
        const c = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return c * sort.dir || x.i - y.i;
      })
      .map(({ r }) => r);
  }, [rows, q, filter, sort]);

  const grouped = sort.key === 'type';
  const groups = useMemo(() => {
    if (!grouped) return [{ key: 'all', label: '', rows: visible }];
    const out: { key: string; label: string; rows: Row[] }[] = [];
    for (const type of ['valleygate_asc', 'vfd_practice', 'affiliate'] as FacilityType[]) {
      const inType = visible.filter((r) => r.p.facilityType === type && r.p.status === 'active');
      if (inType.length) out.push({ key: type, label: facilityTypeLabel[type], rows: inType });
    }
    const closed = visible.filter((r) => r.p.status === 'closed');
    if (closed.length) out.push({ key: 'closed', label: 'Closed', rows: closed });
    return out;
  }, [visible, grouped]);

  const onSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === 'assessed' || key === 'sale' || key === 'verified' ? -1 : 1 }));

  // arrow keys move focus between row buttons; Enter and Space open the focused row natively
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const buttons = [...(bodyRef.current?.querySelectorAll<HTMLButtonElement>('button[data-row]') ?? [])];
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    buttons[Math.min(buttons.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))]?.focus();
  };

  const create = () =>
    addProperty({
      id: newId('prop'),
      name: 'New location',
      facilityType: 'vfd_practice',
      status: 'active',
      address: { street: '', city: '', state: 'NC', zip: '', county: '', parcelPin: '' },
    });

  const chips: [Filter, string][] = [
    ['all', 'All'],
    ['missing', 'Not found'],
    ['unconfirmed', 'Unverified'],
    ['confirmed', 'Verified'],
  ];

  return (
    <main className="mx-auto max-w-[1280px] p-4 sm:p-6 lg:px-8 lg:py-7">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold leading-8 tracking-tight">
            Locations <span className="tnum font-normal text-dm-dim">{rows.length}</span>
          </h1>
          <p className="tnum text-label text-dm-muted">
            {totals.n ? `${compactUsd(totals.sum)} assessed across ${totals.n} of ${rows.length} locations` : 'No assessed values yet'}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
          <div className="relative min-w-0 basis-full sm:basis-auto">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dm-dim" aria-hidden />
            <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, owner, city, PIN" aria-label="Search locations" className="field w-full pl-9 sm:w-72" />
          </div>
          <button className="btn whitespace-nowrap" onClick={() => window.dispatchEvent(new Event(UPLOAD_EVENT))} title="Read deeds, county pages or scans. Matches fill blank fields only; nothing already saved is overwritten.">
            <Upload className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">Upload documents</span>
            <span className="sm:hidden">Upload</span>
          </button>
          <button className="btn btn-primary whitespace-nowrap" onClick={create}>
            <Plus className="h-4 w-4" aria-hidden /> Add location
          </button>
        </div>
      </div>

      <DocumentIntake />

      <div className="mb-3 flex flex-wrap items-center gap-1" role="group" aria-label="Filter by state">
        {chips.map(([id, label]) => (
          <button
            key={id}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={`tnum rounded-md px-2.5 py-1 text-label transition-colors ${filter === id ? 'bg-dm-hover font-medium text-dm-text' : 'text-dm-muted hover:bg-dm-hover/60 hover:text-dm-text'}`}
          >
            {label} <span className="text-dm-dim">{counts[id]}</span>
          </button>
        ))}
        <button aria-pressed={wide} onClick={() => setWide((w) => !w)} className="ml-auto rounded-md px-2.5 py-1 text-label text-dm-muted transition-colors hover:bg-dm-hover/60 hover:text-dm-text">
          {wide ? 'Fewer columns' : 'More columns'}
        </button>
      </div>

      <div className="scroll-thin overflow-x-auto rounded-lg border border-dm-border bg-dm-surface shadow-card" onKeyDown={onKeyDown}>
        <table className="w-full table-fixed border-collapse text-label sm:min-w-[720px]">
          <colgroup>
            <col className="w-10" />
            <col className="w-[52%] sm:w-[27%]" />
            <col className="hidden sm:table-column" />
            <col className="w-28" />
            <col className="hidden w-28 sm:table-column" />
            <col className="hidden w-24 sm:table-column" />
            {wide && (
              <>
                <col className="w-28" />
                <col className="w-28" />
                <col className="w-28" />
              </>
            )}
          </colgroup>
          <thead className="border-b border-dm-border bg-dm-raised/60">
            <tr>
              <th className="py-2 pl-4 text-left">
                <span className="sr-only">State</span>
              </th>
              <Head label="Location" k="name" sort={sort} onSort={onSort} />
              <Head label="Owner of record" k="owner" sort={sort} onSort={onSort} hideSmall />
              <Head label="Assessed" k="assessed" sort={sort} onSort={onSort} right />
              <Head label="Last sale" k="sale" sort={sort} onSort={onSort} right hideSmall />
              <Head label="Facts" k="verified" sort={sort} onSort={onSort} right hideSmall />
              {wide && (
                <>
                  <th className="px-3 py-2 text-left text-[12px] font-medium text-dm-dim">County</th>
                  <th className="px-3 py-2 text-right text-[12px] font-medium text-dm-dim">Investment</th>
                  <th className="px-3 py-2 pr-4 text-right text-[12px] font-medium text-dm-dim">Last deed</th>
                </>
              )}
            </tr>
          </thead>
          <tbody ref={bodyRef}>
            {groups.map((g) => (
              <GroupRows key={g.key} label={g.label} rows={g.rows} select={select} wide={wide} span={span} />
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={span} className="px-4 py-14 text-center text-body text-dm-dim">
                  {properties.length ? 'No locations match. Clear the search or pick All.' : 'No locations yet. Add one, or drop a deed above.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function GroupRows({ label, rows, select, wide, span }: { label: string; rows: Row[]; select: (id: string) => void; wide: boolean; span: number }) {
  return (
    <>
      {label && (
        <tr className="bg-dm-raised/60">
          <th colSpan={span} scope="colgroup" className="border-b border-dm-border px-4 py-1.5 text-left text-[12px] font-medium text-dm-muted">
            {label} <span className="tnum font-normal text-dm-dim">{rows.length}</span>
          </th>
        </tr>
      )}
      {rows.map((r) => {
        const { Icon, cls, label: stateLabel } = stateMeta[r.state];
        const reason = r.issues.length ? `${stateLabel}: ${r.issues.join(', ')}` : stateLabel;
        return (
          <tr key={r.p.id} onClick={() => select(r.p.id)} className="h-9 cursor-pointer border-b border-dm-border/70 transition-colors last:border-0 hover:bg-dm-hover/70 focus-within:bg-dm-hover">
            <td className="pl-4">
              <span title={reason}>
                <Icon className={`h-4 w-4 ${cls}`} aria-hidden />
                <span className="sr-only">{reason}</span>
              </span>
            </td>
            <td className="truncate px-3">
              <button
                data-row
                className="max-w-full truncate rounded text-left font-medium text-dm-text"
                onClick={(e) => {
                  e.stopPropagation();
                  select(r.p.id);
                }}
              >
                {r.p.name}
              </button>
              <span className="block truncate text-[12px] text-dm-dim sm:hidden">{r.owner ?? 'No owner on file'}</span>
            </td>
            <td className={`hidden truncate px-3 sm:table-cell ${r.owner ? (r.ownerSure ? 'text-dm-text' : 'text-dm-muted') : 'text-dm-dim'}`} title={r.owner && !r.ownerSure ? 'Owner not fully verified' : undefined}>
              {r.owner ?? 'No owner on file'}
            </td>
            <td
              className={`tnum px-3 text-right ${r.assessed === undefined ? 'text-dm-dim' : r.assessedSure ? 'text-dm-text' : 'text-dm-muted'}`}
              title={r.assessed !== undefined && !r.assessedSure ? 'Assessed value is unverified' : undefined}
            >
              {r.assessed !== undefined ? compactUsd(r.assessed) : '—'}
            </td>
            <td className={`tnum hidden px-3 text-right sm:table-cell ${r.p.lastSale?.price !== undefined ? 'text-dm-muted' : 'text-dm-dim'}`}>
              {r.p.lastSale?.price !== undefined ? compactUsd(r.p.lastSale.price) : '—'}
            </td>
            <td className="tnum hidden px-3 pr-4 text-right text-dm-muted sm:table-cell" title={`${r.verified} of ${r.total} facts verified`}>
              {r.verified}/{r.total}
            </td>
            {wide && (
              <>
                <td className="truncate px-3 text-dm-muted">{r.county || '—'}</td>
                <td className="tnum px-3 text-right text-dm-muted">{r.investment !== undefined ? compactUsd(r.investment) : '—'}</td>
                <td className="tnum px-3 pr-4 text-right text-dm-muted">{r.lastDeed ? fmtDate(r.lastDeed) : '—'}</td>
              </>
            )}
          </tr>
        );
      })}
    </>
  );
}
