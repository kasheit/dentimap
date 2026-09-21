import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, CircleAlert, CircleCheck, CircleHelp } from 'lucide-react';
import { compactUsd, facilityTypeLabel, fmtDate, statusLabel } from '@/lib/format';
import { useDentimap } from '@/lib/store';
import type { DeedRecord, FacilityStatus, Property } from '@/lib/types';

type SortKey = 'name' | 'county' | 'assessed' | 'investment' | 'landlord';
type DeedCheck = 'match' | 'mismatch' | 'no-deed' | 'no-landlord';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const statusTone: Record<FacilityStatus, string> = {
  active: 'text-dm-green',
  pipeline_fitout: 'text-dm-blue',
  pipeline_pending: 'text-dm-amber',
  closed: 'text-dm-dim',
};

const checkMeta: Record<DeedCheck, { label: string; tone: string; icon: typeof CircleCheck }> = {
  match: { label: 'Deed holder matches landlord', tone: 'text-dm-green', icon: CircleCheck },
  mismatch: { label: 'Deed holder differs from landlord', tone: 'text-dm-red', icon: CircleAlert },
  'no-deed': { label: 'No deed on file', tone: 'text-dm-amber', icon: CircleHelp },
  'no-landlord': { label: 'No landlord linked', tone: 'text-dm-dim', icon: CircleHelp },
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
  const { properties, entities, deeds, openProperty } = useDentimap();
  const [county, setCounty] = useState('All');
  const [type, setType] = useState('All');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'name', dir: 1 });

  const entityName = (id?: string) => entities.find((e) => e.id === id)?.name;
  const counties = useMemo(() => ['All', ...[...new Set(properties.map((p) => p.address.county))].sort()], [properties]);
  const types = useMemo(() => ['All', ...[...new Set(properties.map((p) => p.facilityType))]], [properties]);

  const rows = useMemo(() => {
    const value = (p: Property): string | number => {
      switch (sort.key) {
        case 'county': return p.address.county;
        case 'assessed': return p.metrics?.currentAssessedValue ?? -1;
        case 'investment': return p.metrics?.projectInvestment ?? -1;
        case 'landlord': return entities.find((e) => e.id === p.landlordEntityId)?.name ?? '';
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
  }, [properties, entities, county, type, sort]);

  const totals = useMemo(
    () => ({
      assessed: rows.reduce((n, p) => n + (p.metrics?.currentAssessedValue ?? 0), 0),
      investment: rows.reduce((n, p) => n + (p.metrics?.projectInvestment ?? 0), 0),
      assessedCount: rows.filter((p) => p.metrics?.currentAssessedValue !== undefined).length,
    }),
    [rows],
  );

  const onSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  const chip = (active: boolean) =>
    `text-xs transition-colors ${
      active ? 'text-dm-text underline decoration-dm-blue decoration-2 underline-offset-[6px]' : 'text-dm-dim hover:text-dm-muted'
    }`;

  return (
    <main className="mx-auto max-w-[1680px] p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Real estate matrix</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5" role="group" aria-label="Filter by county">
          <span className="label">County</span>
          {counties.map((c) => (
            <button key={c} className={chip(county === c)} onClick={() => setCounty(c)}>{c.replace(/ County$/, '')}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5" role="group" aria-label="Filter by facility type">
          <span className="label">Type</span>
          {types.map((t) => (
            <button key={t} className={chip(type === t)} onClick={() => setType(t)}>
              {t === 'All' ? 'All' : facilityTypeLabel[t as keyof typeof facilityTypeLabel]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-dm-border bg-dm-surface scroll-thin">
        <table className="w-full min-w-[1080px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-dm-border text-xs text-dm-dim">
              <SortHead label="Facility" k="name" sort={sort} onSort={onSort} />
              <SortHead label="County" k="county" sort={sort} onSort={onSort} />
              <th className="px-4 py-3 text-left font-medium">Parcel PIN</th>
              <SortHead label="Assessed" k="assessed" sort={sort} onSort={onSort} right />
              <SortHead label="Investment" k="investment" sort={sort} onSort={onSort} right />
              <SortHead label="Landlord" k="landlord" sort={sort} onSort={onSort} />
              <th className="px-4 py-3 text-left font-medium">Operator</th>
              <th className="px-4 py-3 text-left font-medium">Last deed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const deed = latestDeed(deeds, p.id);
              const landlord = entityName(p.landlordEntityId);
              const check: DeedCheck = !landlord ? 'no-landlord' : !deed ? 'no-deed' : norm(deed.grantee) === norm(landlord) ? 'match' : 'mismatch';
              const { label, tone, icon: Icon } = checkMeta[check];
              return (
                <tr key={p.id} className="border-b border-dm-border/60 transition-colors last:border-0 hover:bg-dm-hover">
                  <td className="px-4 py-3">
                    <button onClick={() => openProperty(p.id)} className="text-left font-medium text-dm-text hover:text-dm-blue hover:underline">{p.name}</button>
                    {p.dbaName && <div className="mt-0.5 text-xs text-dm-muted">d/b/a {p.dbaName}</div>}
                    <div className="mt-0.5 text-xs text-dm-dim">
                      {facilityTypeLabel[p.facilityType]} · <span className={statusTone[p.status]}>{statusLabel[p.status]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-dm-muted">{p.address.county.replace(/ County$/, '')}<div className="text-xs text-dm-dim">{p.address.city}, {p.address.state}</div></td>
                  <td className="px-4 py-3 font-mono text-xs text-dm-muted">{p.address.parcelPin || '—'}</td>
                  <td className="px-4 py-3 text-right tnum">{compactUsd(p.metrics?.currentAssessedValue)}</td>
                  <td className="px-4 py-3 text-right tnum">{compactUsd(p.metrics?.projectInvestment)}</td>
                  <td className="px-4 py-3">{landlord ?? <span className="text-dm-dim">Not linked</span>}</td>
                  <td className="px-4 py-3">{entityName(p.operatingEntityId) ?? <span className="text-dm-dim">Not linked</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 ${tone}`} title={label}>
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="tnum text-xs">{deed ? fmtDate(deed.recordingDate) : 'None'}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-dm-dim">No facilities match these filters.</td></tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-dm-border bg-dm-bg/40 text-xs text-dm-muted">
                <td className="px-4 py-3 font-medium" colSpan={3}>{rows.length} {rows.length === 1 ? 'facility' : 'facilities'}</td>
                <td className="px-4 py-3 text-right tnum" title={`${totals.assessedCount} of ${rows.length} have an assessed value`}>
                  {compactUsd(totals.assessed)}
                  <div className="text-[11px] text-dm-dim">{totals.assessedCount} of {rows.length} assessed</div>
                </td>
                <td className="px-4 py-3 text-right tnum">{compactUsd(totals.investment)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </main>
  );
}
