import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { compactUsd, facilityTypeLabel, fmtDate, statusLabel } from '@/lib/format';
import { useDentimap } from '@/lib/store';
import type { DeedRecord, FacilityStatus, Property } from '@/lib/types';

type SortKey = 'name' | 'county' | 'assessed' | 'investment';

const statusTone: Record<FacilityStatus, string> = {
  active: 'text-dm-green',
  pipeline_fitout: 'text-dm-blue',
  pipeline_pending: 'text-dm-amber',
  closed: 'text-dm-dim',
};


function latestDeed(deeds: DeedRecord[], propertyId: string) {
  return deeds
    .filter((d) => d.propertyId === propertyId)
    .sort((a, b) => b.recordingDate.localeCompare(a.recordingDate))[0];
}

function SortHead({ label, k, sort, onSort, right }: { label: string; k: SortKey; sort: { key: SortKey; dir: 1 | -1 }; onSort: (k: SortKey) => void; right?: boolean }) {
  const active = sort.key === k;
  const Icon = !active ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
  return (
    <th className={`px-4 py-3 font-medium ${right ? 'text-right' : 'text-left'}`} aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button onClick={() => onSort(k)} className={`inline-flex items-center gap-1.5 transition-colors hover:text-dm-text ${active ? 'text-dm-text' : ''}`}>
        {label}
        <Icon className={`h-3 w-3 ${active ? 'text-dm-blue' : 'opacity-50'}`} />
      </button>
    </th>
  );
}

export function MatrixView() {
  const { properties, deeds, openProperty } = useDentimap();
  const [county, setCounty] = useState('All');
  const [type, setType] = useState('All');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'name', dir: 1 });

  const counties = useMemo(() => ['All', ...[...new Set(properties.map((p) => p.address.county))].sort()], [properties]);
  const types = useMemo(() => ['All', ...[...new Set(properties.map((p) => p.facilityType))]], [properties]);

  const rows = useMemo(() => {
    const value = (p: Property): string | number => {
      switch (sort.key) {
        case 'county': return p.address.county;
        case 'assessed': return p.metrics?.currentAssessedValue ?? -1;
        case 'investment': return p.metrics?.projectInvestment ?? -1;
        default: return p.name;
      }
    };
    return properties
      .filter((p) => (county === 'All' || p.address.county === county) && (type === 'All' || p.facilityType === type))
      .sort((a, b) => {
        const av = value(a);
        const bv = value(b);
        return (typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))) * sort.dir;
      });
  }, [properties, county, type, sort]);


  const onSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  return (
    <main className="mx-auto max-w-[1680px] p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Matrix</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5" role="group" aria-label="Filter by county">
          <span className="label">County</span>
          {counties.map((c) => (
            <button key={c} aria-pressed={county === c} className="tab-chip" onClick={() => setCounty(c)}>{c.replace(/ County$/, '')}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5" role="group" aria-label="Filter by type">
          <span className="label">Type</span>
          {types.map((t) => (
            <button key={t} aria-pressed={type === t} className="tab-chip" onClick={() => setType(t)}>
              {t === 'All' ? 'All' : facilityTypeLabel[t as keyof typeof facilityTypeLabel]}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[calc(100vh-13rem)] overflow-auto rounded-xl border border-dm-border bg-dm-surface scroll-thin">
        <table className="w-full min-w-[820px] border-collapse text-label">
          <thead className="sticky top-0 z-10 bg-dm-surface">
            <tr className="eyebrow border-b border-dm-border bg-dm-surface">
              <SortHead label="Location" k="name" sort={sort} onSort={onSort} />
              <SortHead label="County" k="county" sort={sort} onSort={onSort} />
              <th className="px-4 py-3 text-left font-medium">Parcel PIN</th>
              <SortHead label="Assessed" k="assessed" sort={sort} onSort={onSort} right />
              <SortHead label="Investment" k="investment" sort={sort} onSort={onSort} right />
              <th className="px-4 py-3 text-left font-medium">Last deed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const deed = latestDeed(deeds, p.id);
              return (
                <tr key={p.id} className="border-b border-dm-border/60 transition-colors last:border-0 hover:bg-dm-hover">
                  <td className="px-4 py-3">
                    <button onClick={() => openProperty(p.id)} className="text-left font-medium text-dm-text hover:text-dm-blue hover:underline">{p.name}</button>
                    {p.dbaName && <div className="mt-0.5 text-label text-dm-muted">d/b/a {p.dbaName}</div>}
                    <div className="mt-0.5 text-label text-dm-dim">
                      {facilityTypeLabel[p.facilityType]} · <span className={statusTone[p.status]}>{statusLabel[p.status]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-dm-muted">{p.address.county.replace(/ County$/, '')}<div className="text-label text-dm-dim">{p.address.city}, {p.address.state}</div></td>
                  <td className="px-4 py-3 font-mono text-label text-dm-muted">{p.address.parcelPin || '—'}</td>
                  <td className="px-4 py-3 text-right tnum">{compactUsd(p.metrics?.currentAssessedValue)}</td>
                  <td className="px-4 py-3 text-right tnum">{compactUsd(p.metrics?.projectInvestment)}</td>
                  <td className="px-4 py-3 tnum text-label text-dm-muted">{deed ? fmtDate(deed.recordingDate) : '—'}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-dm-dim">No locations match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
