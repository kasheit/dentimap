import { AlertTriangle } from 'lucide-react';
import { levelFor } from '@/lib/completion';
import { entityTypeLabel, fmtDate } from '@/lib/format';
import { sortedDeeds, useDentimap } from '@/lib/store';
import type { DeedRecord, FieldMeta, LegalEntity, Property } from '@/lib/types';
import { LevelLabel } from './Chips';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const detail = (meta?: FieldMeta) => {
  const parts = [meta?.source, meta?.asOf ? `as of ${fmtDate(meta.asOf)}` : undefined].filter(Boolean);
  return parts.length ? parts.join(' · ') : undefined;
};

function Step({ role, last, children }: { role: string; last?: boolean; children: React.ReactNode }) {
  return (
    <li className="relative grid grid-cols-[7.5rem_1fr] gap-4 pb-5 last:pb-0 sm:grid-cols-[9rem_1fr]">
      {!last && <span className="absolute bottom-0 left-[7.5rem] top-2 hidden w-px bg-dm-border sm:left-[9rem]" aria-hidden />}
      <div className="pt-0.5 text-[13px] text-dm-dim">{role}</div>
      <div className="relative min-w-0 pl-5">
        <span className="absolute -left-[3px] top-2 h-[7px] w-[7px] rounded-full bg-dm-dim" aria-hidden />
        {children}
      </div>
    </li>
  );
}

function Named({ label, value, meta }: { label: string; value?: string; meta?: FieldMeta }) {
  return (
    <div className="first:mt-0 mt-3">
      <div className="text-[13px] text-dm-dim">{label}</div>
      <div className="text-[15px] font-medium">{value || <span className="font-normal text-dm-dim">—</span>}</div>
      <div className="mt-0.5">
        <LevelLabel level={levelFor(!!value, meta)} detail={value ? detail(meta) : undefined} />
      </div>
    </div>
  );
}

function EntityLine({ entity, meta }: { entity?: LegalEntity; meta?: FieldMeta }) {
  const setTab = useDentimap((s) => s.setTab);
  return (
    <>
      {entity ? (
        <>
          <button onClick={() => setTab('entities')} className="text-left text-[15px] font-medium transition-colors hover:text-dm-blue">
            {entity.name}
          </button>
          {entity.dbaName && <div className="mt-0.5 text-[13px] text-dm-muted">d/b/a {entity.dbaName}</div>}
          <div className="mt-0.5 text-[13px] text-dm-dim">
            {entityTypeLabel[entity.entityType]} · {entity.jurisdiction}
            {entity.sosId && (
              <>
                {' '}· SOS <span className="font-mono text-xs">{entity.sosId}</span>
              </>
            )}
          </div>
        </>
      ) : (
        <p className="text-[15px] text-dm-dim">—</p>
      )}
      <div className="mt-0.5">
        <LevelLabel level={levelFor(!!entity, meta)} detail={entity ? detail(meta) : undefined} />
      </div>
    </>
  );
}

export function OwnershipChain({
  property,
  deeds,
  landlord,
  operator,
}: {
  property: Property;
  deeds: DeedRecord[];
  landlord?: LegalEntity;
  operator?: LegalEntity;
}) {
  const conveyances = sortedDeeds(deeds.filter((d) => d.deedType !== 'subdivision_plat'));
  const holder = conveyances[conveyances.length - 1];
  const match = holder && landlord ? norm(holder.grantee) === norm(landlord.name) : undefined;
  const meta = property.meta ?? {};

  return (
    <div>
      <ol>
        <Step role="Business at this location">
          <Named label="Legal name" value={property.legalName} meta={meta.legalName} />
          <Named label="Doing business as" value={property.dbaName} meta={meta.dbaName} />
        </Step>
        <Step role="Land owner of record">
          {holder ? (
            <>
              <div className="text-[15px] font-medium">{holder.grantee}</div>
              <div className="mt-0.5 text-[13px] text-dm-muted">
                Per {fmtDate(holder.recordingDate)} recorded deed · {holder.source}
              </div>
            </>
          ) : (
            <p className="text-[15px] text-dm-dim">—</p>
          )}
          <div className="mt-0.5">
            <LevelLabel level={holder ? (holder.confidence === 'verified' ? 'confirmed' : 'partial') : 'missing'} detail={holder ? undefined : 'no deed on file'} />
          </div>
        </Step>
        <Step role="Landlord (legal name)">
          <EntityLine entity={landlord} meta={meta.landlord} />
        </Step>
        <Step role="Operator (legal name)" last>
          <EntityLine entity={operator} meta={meta.operator} />
        </Step>
      </ol>

      {match === false && holder && landlord && (
        <p className="mt-5 flex items-start gap-2 rounded-md border border-dm-amber/30 bg-dm-amber/10 px-3 py-2 text-[13px] text-dm-amber">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            The latest deed conveys to <b className="font-medium">{holder.grantee}</b>, but the landlord entity is{' '}
            <b className="font-medium">{landlord.name}</b>. A later transfer may be missing or the landlord link may be wrong.
          </span>
        </p>
      )}
    </div>
  );
}
