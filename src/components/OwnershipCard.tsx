import { ChevronRight } from 'lucide-react';
import { compactUsd, fmtDate } from '@/lib/format';
import { chainBreaks, sortedDeeds } from '@/lib/store';
import type { DeedRecord, Property, SourcedField } from '@/lib/types';
import { ConfirmLabel, EDIT_RECORD_EVENT } from './ConfirmLabel';
import { DetailRow, LevelLabel } from './Chips';

export function OwnershipCard({ p, deeds, onViewChain }: { p: Property; deeds: DeedRecord[]; onViewChain: () => void }) {
  const conveyances = sortedDeeds(deeds.filter((d) => d.deedType !== 'subdivision_plat'));
  const holder = conveyances[conveyances.length - 1];
  const breaks = chainBreaks(conveyances).length;
  const badStamps = conveyances.filter((d) => !d.isFormulaVerified).length;
  const doubt = [breaks ? (breaks === 1 ? 'chain gap' : `${breaks} chain gaps`) : '', badStamps ? 'stamp mismatch' : ''].filter(Boolean).join(' and ');
  const gapIds = new Set(chainBreaks(conveyances).map((b) => b.deedId));
  const shown = conveyances.slice(-3);
  const hidden = conveyances.length - shown.length;
  const entityRows: { field: SourcedField; label: string; full: string; value?: string; mono?: boolean }[] = [
    { field: 'legalName', label: 'Legal name', full: 'Legal name', value: p.legalName },
    { field: 'dbaName', label: 'DBA', full: 'Doing business as', value: p.dbaName },
    { field: 'sosId', label: 'SOS ID', full: 'Business SOS ID', value: p.sosId, mono: true },
    { field: 'firstFilingDate', label: 'First filing', full: 'First filing date', value: p.firstFilingDate ? fmtDate(p.firstFilingDate) : undefined },
  ];
  const status = (field: SourcedField, label: string, has: boolean) => <ConfirmLabel property={p} field={field} label={label} has={has} />;

  return (
    <section id="ownership" className="min-w-0 rounded-lg border border-dm-border bg-dm-surface p-5 shadow-card">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-body font-semibold text-dm-text">Ownership</h2>
        <LevelLabel
          level={holder ? (holder.confidence === 'verified' && !doubt ? 'confirmed' : 'partial') : 'missing'}
          detail={holder ? doubt || undefined : 'no deed on file'}
        />
      </header>

      <div className="mt-3">
        <div className="text-label text-dm-dim">Owner of record</div>
        <div className="mt-0.5 text-[22px] font-semibold leading-7">{holder ? holder.grantee : <span className="text-dm-dim">—</span>}</div>
        {holder && (
          <div className="text-label text-dm-dim">
            since {fmtDate(holder.recordingDate)}
            {holder.source ? ` · ${holder.source}` : ' · no source'}
          </div>
        )}
        {holder && doubt && (
          <button type="button" onClick={onViewChain} className="mt-1 text-label text-dm-amber underline underline-offset-2 hover:text-dm-text">
            {doubt.charAt(0).toUpperCase() + doubt.slice(1)}, view title chain
          </button>
        )}
      </div>

      {conveyances.length > 1 && (
        <ol className="scroll-thin mt-4 flex items-center gap-1 overflow-x-auto pb-1" aria-label="Ownership chain, oldest to newest">
          {shown.map((d, i) => {
            const last = i === shown.length - 1;
            const gap = gapIds.has(d.id);
            const badStamp = !d.isFormulaVerified;
            return (
              <li key={d.id} className="flex shrink-0 items-center gap-1">
                {(i > 0 || hidden > 0) && (
                  <span className={gap ? 'text-dm-amber' : 'text-dm-dim'} title={gap ? 'This deed’s grantor does not match the previous grantee' : undefined}>
                    <ChevronRight className="h-3.5 w-3.5" aria-label={gap ? 'chain gap' : 'then'} />
                  </span>
                )}
                {i === 0 && hidden > 0 && <span className="tnum mr-1 text-[12px] text-dm-dim">+{hidden}</span>}
                <button
                  type="button"
                  onClick={onViewChain}
                  title={badStamp ? 'Excise stamps do not match the price' : 'View title chain'}
                  className={`max-w-[10.5rem] rounded-md border px-2 py-1 text-left transition-colors hover:bg-dm-hover ${last ? 'border-dm-blue/50 bg-dm-blue/5' : 'border-dm-border'} ${badStamp ? 'border-dm-amber' : ''}`}
                >
                  <span className={`block truncate text-label ${last ? 'font-medium text-dm-text' : 'text-dm-muted'}`}>{d.grantee}</span>
                  <span className="tnum block text-[12px] text-dm-dim">
                    {new Date(d.recordingDate).getUTCFullYear()}
                    {d.consideration > 0 ? ` · ${compactUsd(d.consideration)}` : ''}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-4">
        <div className="border-b border-dm-border/70 pb-1 text-[12px] font-medium text-dm-muted">Business entity</div>
        {entityRows.filter((r) => r.value).map((r) => (
          <DetailRow key={r.field} label={r.label} mono={r.mono} value={r.value} status={status(r.field, r.full, true)} />
        ))}
        {entityRows.some((r) => !r.value) && (
          <div className="flex items-center justify-between gap-3 py-2 text-label text-dm-muted">
            <span>Not found: {entityRows.filter((r) => !r.value).map((r) => r.label).join(', ')}</span>
            <button
              type="button"
              className="rounded text-dm-blue hover:underline"
              onClick={() => window.dispatchEvent(new CustomEvent(EDIT_RECORD_EVENT, { detail: { field: entityRows.find((r) => !r.value)?.field } }))}
            >
              Add
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
