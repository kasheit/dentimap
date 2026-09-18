import { useState, useMemo, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { SectionCard } from '@/components/SectionCard';
import { TierBadge } from '@/components/TierBadge';
import { CompletionIndicator } from '@/components/CompletionIndicator';
import { FlagBanner } from '@/components/FlagBanner';
import { EditableText } from '@/components/EditableText';
import { realEstateRows as initialRows, counties } from '@/data';
import type { CompletionState, RealEstateRow } from '@/types';

const landlordTypeLabels: Record<string, string> = {
  doctor: 'Doctor-affiliated LLC',
  corporate: 'Shared corporate holding entity',
  villagecare: 'Village Care Group',
};

export function RealEstateTab() {
  const [filter, setFilter] = useState('All');
  const [rows, setRows] = useState<RealEstateRow[]>(() => initialRows.map((r) => ({ ...r })));

  const updateRow = useCallback((id: string, patch: Partial<RealEstateRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);
  const updateRowCompletion = useCallback((id: string, state: CompletionState) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, completion: state } : r)));
  }, []);

  const filteredRows = useMemo(
    () => (filter === 'All' ? rows : rows.filter((r) => r.county === filter)),
    [filter, rows]
  );

  const renderEditableCell = (row: RealEstateRow, field: keyof RealEstateRow, mono = false, extraClass = '') => (
    <EditableText
      value={String(row[field])}
      onChange={(v) => updateRow(row.id, { [field]: v } as Partial<RealEstateRow>)}
      mono={mono}
      className={extraClass}
      inputClassName={`text-xs ${mono ? 'font-mono' : ''} w-full`}
    />
  );

  return (
    <div className="space-y-6">
      <FlagBanner
        tier="unverified"
        text="No confirmed real-estate holding entity found for VFD — landlord and parcel data below are simulated for structural mapping only."
      />

      <div className="flex flex-wrap gap-2">
        {counties.map((c) => {
          const active = filter === c;
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'bg-legal-bg text-legal-text ring-1 ring-legal-base/40'
                  : 'bg-card text-text-secondary border border-border hover:border-text-muted'
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      <SectionCard title="Real estate matrix" subtitle={`${filteredRows.length} site${filteredRows.length !== 1 ? 's' : ''} · all landlord data simulated`}>
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-4 text-[10px] font-semibold uppercase tracking-wide text-text-muted">Practice</th>
                <th className="pb-2 pr-4 text-[10px] font-semibold uppercase tracking-wide text-text-muted">Specialty</th>
                <th className="pb-2 pr-4 text-[10px] font-semibold uppercase tracking-wide text-text-muted">County</th>
                <th className="pb-2 pr-4 text-[10px] font-semibold uppercase tracking-wide text-text-muted">Sim. PIN</th>
                <th className="pb-2 pr-4 text-[10px] font-semibold uppercase tracking-wide text-text-muted text-right">Land</th>
                <th className="pb-2 pr-4 text-[10px] font-semibold uppercase tracking-wide text-text-muted text-right">Building</th>
                <th className="pb-2 pr-4 text-[10px] font-semibold uppercase tracking-wide text-text-muted">Landlord entity</th>
                <th className="pb-2 pr-4 text-[10px] font-semibold uppercase tracking-wide text-text-muted">Badge</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className="border-b border-border/50 hover:bg-nested/50 transition-colors">
                  <td className="py-3 pr-4 align-top">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />
                      <span className="text-sm text-text-primary">{renderEditableCell(row, 'practice')}</span>
                    </div>
                    <div className="mt-2 max-w-xs">
                      <CompletionIndicator state={row.completion} onChange={(s) => updateRowCompletion(row.id, s)} />
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-xs text-text-secondary align-top">{renderEditableCell(row, 'specialty')}</td>
                  <td className="py-3 pr-4 text-xs font-mono text-text-secondary align-top">{renderEditableCell(row, 'county', true)}</td>
                  <td className="py-3 pr-4 text-xs font-mono text-text-muted align-top">{renderEditableCell(row, 'simulatedPin', true)}</td>
                  <td className="py-3 pr-4 text-xs font-mono text-text-secondary text-right align-top">{renderEditableCell(row, 'landValue', true)}</td>
                  <td className="py-3 pr-4 text-xs font-mono text-text-secondary text-right align-top">{renderEditableCell(row, 'buildingValue', true)}</td>
                  <td className="py-3 pr-4 align-top">
                    <p className="text-xs font-mono text-text-primary">{renderEditableCell(row, 'landlordEntity', true)}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{landlordTypeLabels[row.landlordType]}</p>
                  </td>
                  <td className="py-3 pr-4 align-top">
                    <TierBadge tier={row.badge.tier} label={row.badge.label} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden space-y-3">
          {filteredRows.map((row) => (
            <div key={row.id} className="rounded-lg border border-border bg-nested p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-text-muted flex-shrink-0" />
                <span className="text-sm font-semibold text-text-primary">{renderEditableCell(row, 'practice')}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div><p className="text-[10px] text-text-muted uppercase">Specialty</p><p className="text-xs text-text-secondary">{renderEditableCell(row, 'specialty')}</p></div>
                <div><p className="text-[10px] text-text-muted uppercase">County</p><p className="text-xs font-mono text-text-secondary">{renderEditableCell(row, 'county', true)}</p></div>
                <div><p className="text-[10px] text-text-muted uppercase">Sim. PIN</p><p className="text-xs font-mono text-text-muted">{renderEditableCell(row, 'simulatedPin', true)}</p></div>
                <div><p className="text-[10px] text-text-muted uppercase">Land value</p><p className="text-xs font-mono text-text-secondary">{renderEditableCell(row, 'landValue', true)}</p></div>
                <div><p className="text-[10px] text-text-muted uppercase">Building value</p><p className="text-xs font-mono text-text-secondary">{renderEditableCell(row, 'buildingValue', true)}</p></div>
              </div>
              <div className="mt-3">
                <p className="text-[10px] text-text-muted uppercase">Landlord entity</p>
                <p className="text-xs font-mono text-text-primary">{renderEditableCell(row, 'landlordEntity', true)}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{landlordTypeLabels[row.landlordType]}</p>
              </div>
              <div className="mt-3"><TierBadge tier={row.badge.tier} label={row.badge.label} /></div>
              <div className="mt-3 border-t border-border pt-3">
                <CompletionIndicator state={row.completion} onChange={(s) => updateRowCompletion(row.id, s)} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
