import { fmtDate } from '@/lib/format';
import { entityFor } from '@/lib/entities';
import { chainBreaks, newId, sortedDeeds, useDentimap } from '@/lib/store';
import type { DeedRecord, Property, SourcedField } from '@/lib/types';
import { ChainStrip } from './ChainStrip';
import type { MissingDeed } from './ChainStrip';
import { ConfirmLabel, EDIT_RECORD_EVENT } from './ConfirmLabel';
import { DetailRow, LevelLabel } from './Chips';

export function OwnershipCard({
  p,
  deeds,
  onSelectDeed,
  onAddMissing,
  onViewChain,
}: {
  p: Property;
  deeds: DeedRecord[];
  onSelectDeed: (deedId: string) => void;
  onAddMissing: (missing: MissingDeed) => void;
  onViewChain: () => void;
}) {
  const conveyances = sortedDeeds(deeds.filter((d) => d.deedType !== 'subdivision_plat'));
  const holder = conveyances[conveyances.length - 1];
  const { entities, addEntity, updateDeed, openEntity } = useDentimap();
  const ownerEntity = holder ? entityFor(entities, holder.grantee, holder.granteeEntityId) : undefined;
  const createOwnerEntity = () => {
    if (!holder) return;
    const id = newId('entity');
    addEntity({ id, name: holder.grantee, entityType: 'landlord_holding', jurisdiction: 'North Carolina', associatedPropertyIds: [p.id] });
    updateDeed(holder.id, { ...holder, granteeEntityId: id });
  };
  const breaks = chainBreaks(conveyances).length;
  const badStamps = conveyances.filter((d) => !d.isFormulaVerified).length;
  const doubt = [breaks ? (breaks === 1 ? 'chain gap' : `${breaks} chain gaps`) : '', badStamps ? 'stamp mismatch' : ''].filter(Boolean).join(' and ');
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
        <div className="mt-0.5 text-[22px] font-semibold leading-7">
          {holder ? (
            ownerEntity ? (
              <button type="button" className="rounded text-left hover:text-dm-blue" onClick={() => openEntity(ownerEntity.id)} title="Open this entity">
                {holder.grantee}
              </button>
            ) : (
              holder.grantee
            )
          ) : (
            <span className="text-dm-dim">—</span>
          )}
        </div>
        {holder && (
          <div className="text-label text-dm-dim">
            since {fmtDate(holder.recordingDate)}
            {holder.source ? ` · ${holder.source}` : ' · no source'}
          </div>
        )}
        {holder && (
          <div className="mt-1 text-label text-dm-muted">
            {ownerEntity ? (
              <>
                {[ownerEntity.sosId && `SOS ${ownerEntity.sosId}`, ownerEntity.formationDate && `formed ${fmtDate(ownerEntity.formationDate)}`].filter(Boolean).join(' · ') || 'No SOS ID on file'}
                {' · '}
                <button type="button" className="rounded text-dm-blue hover:underline" onClick={() => openEntity(ownerEntity.id)}>
                  View entity
                </button>
              </>
            ) : (
              <button type="button" className="rounded text-dm-blue hover:underline" onClick={createOwnerEntity}>
                Create entity from owner
              </button>
            )}
          </div>
        )}
      </div>

      {conveyances.length > 0 && (
        <div className="mt-4 border-t border-dm-border pt-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-[12px] font-medium text-dm-muted">Title chain</span>
            {conveyances.length > 1 && (
              <button type="button" className="rounded text-label text-dm-blue hover:underline" onClick={onViewChain}>
                All deeds
              </button>
            )}
          </div>
          <ChainStrip deeds={deeds} max={2} onSelect={onSelectDeed} onAddMissing={onAddMissing} hideCurrentName />
        </div>
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
