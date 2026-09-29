import { compactUsd, fmtDate } from '@/lib/format';
import { levelFor } from '@/lib/completion';
import { useCountUp } from '@/lib/useCountUp';
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
  const confirmed = levelFor(assessed !== undefined, p.meta?.assessedValue) === 'confirmed';
  const displayed = useCountUp(assessed);

  return (
    <section id="financials" className="lift min-w-0 rounded-lg border border-dm-border bg-dm-surface p-5 shadow-card">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-body font-semibold text-dm-text">Financials</h2>
        <ConfirmLabel property={p} field="assessedValue" label="Assessed value" has={assessed !== undefined} showDetail={false} />
      </header>

      <div className="mt-3">
        <div className="text-label text-dm-dim">Assessed value</div>
        <div
          className={`tnum text-[52px] font-semibold leading-[58px] tracking-[-0.03em] ${assessed !== undefined && confirmed ? 'text-dm-blue' : 'text-dm-muted'}`}
          title={assessed !== undefined ? `$${assessed.toLocaleString('en-US')}` : undefined}
        >
          {displayed !== undefined ? compactUsd(displayed) : <span className="text-dm-dim">—</span>}
        </div>
        {assessed !== undefined && <ProvenanceTag property={p} field="assessedValue" />}
      </div>

      {(() => {
        const figures = [
          { label: 'Last sale', value: p.lastSale?.price, sub: p.lastSale?.date ? fmtDate(p.lastSale.date) : undefined, field: 'lastSale' as const },
          { label: 'Investment', value: m?.projectInvestment, field: 'projectInvestment' as const },
        ];
        const have = figures.filter((f) => f.value !== undefined);
        const missing = figures.filter((f) => f.value === undefined).map((f) => f.label);
        return (
          <div className="mt-5 border-t border-dm-border pt-4">
            {have.length > 0 && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                {have.map((f) => (
                  <Figure key={f.label} label={f.label} value={f.value} sub={f.sub} p={p} field={f.field} />
                ))}
              </div>
            )}
            {missing.length > 0 && <p className={`text-label text-dm-dim ${have.length ? 'mt-3' : ''}`}>Not on file: {missing.join(', ')}</p>}
          </div>
        );
      })()}
    </section>
  );
}
