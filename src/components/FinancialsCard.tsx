import { compactUsd, fmtDate } from '@/lib/format';
import { levelFor } from '@/lib/completion';
import type { Property, SourcedField } from '@/lib/types';
import { ConfirmLabel, ProvenanceTag } from './ConfirmLabel';

function Figure({ label, value, sub, p, field }: { label: string; value?: number; sub?: string; p: Property; field: SourcedField }) {
  return (
    <div className="min-w-0">
      <div className="text-label text-dm-dim">{label}</div>
      <div className="tnum mt-0.5 text-title font-semibold" title={value !== undefined ? `$${value.toLocaleString('en-US')}` : undefined}>
        {value !== undefined ? compactUsd(value) : <span className="text-dm-dim">—</span>}
      </div>
      {sub && <div className="text-label text-dm-dim">{sub}</div>}
      {value !== undefined && <ProvenanceTag property={p} field={field} />}
    </div>
  );
}

export function FinancialsCard({ p }: { p: Property }) {
  const m = p.metrics;
  const assessed = m?.currentAssessedValue;
  const land = m?.landValue;
  const building = m?.buildingValue;
  const split = land !== undefined && building !== undefined && land + building > 0 ? Math.round((land / (land + building)) * 100) : undefined;
  const confirmed = levelFor(assessed !== undefined, p.meta?.assessedValue) === 'confirmed';

  return (
    <section id="financials" className="min-w-0 rounded-lg border border-dm-border bg-dm-surface p-5 shadow-card">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-body font-semibold text-dm-text">Financials</h2>
        <ConfirmLabel property={p} field="assessedValue" label="Assessed value" has={assessed !== undefined} showDetail={false} />
      </header>

      <div className="mt-3">
        <div className="text-label text-dm-dim">Assessed value</div>
        <div
          className={`tnum text-[44px] font-semibold leading-[50px] tracking-[-0.03em] ${assessed !== undefined && confirmed ? 'text-dm-blue' : 'text-dm-muted'}`}
          title={assessed !== undefined ? `$${assessed.toLocaleString('en-US')}` : undefined}
        >
          {assessed !== undefined ? compactUsd(assessed) : <span className="text-dm-dim">—</span>}
        </div>
        {assessed !== undefined && <ProvenanceTag property={p} field="assessedValue" />}
      </div>

      {split !== undefined && (
        <div className="mt-4">
          <div className="flex h-1.5 overflow-hidden rounded-full bg-dm-border" aria-hidden>
            <div className="bg-dm-blue" style={{ width: `${split}%` }} />
            <div className="bg-dm-blue/40" style={{ width: `${100 - split}%` }} />
          </div>
          <div className="tnum mt-1 text-label text-dm-dim">Land {split}% · building {100 - split}%</div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-dm-border pt-4 sm:grid-cols-4">
        <Figure label="Land" value={land} p={p} field="assessedValue" />
        <Figure label="Building" value={building} p={p} field="assessedValue" />
        <Figure label="Last sale" value={p.lastSale?.price} sub={p.lastSale?.date ? fmtDate(p.lastSale.date) : undefined} p={p} field="lastSale" />
        <Figure label="Investment" value={m?.projectInvestment} p={p} field="projectInvestment" />
      </div>
    </section>
  );
}
