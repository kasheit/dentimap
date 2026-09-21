import { AlertTriangle } from 'lucide-react';
import { entityTypeLabel, fmtDate } from '@/lib/format';
import { sortedDeeds, useDentimap } from '@/lib/store';
import type { DeedRecord, LegalEntity } from '@/lib/types';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

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

function EntityLine({ entity }: { entity?: LegalEntity }) {
  const setTab = useDentimap((s) => s.setTab);
  if (!entity) return <p className="text-[15px] text-dm-dim">Not identified</p>;
  return (
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
  );
}

export function OwnershipChain({
  deeds,
  landlord,
  operator,
  business,
}: {
  business?: { legalName?: string; dbaName?: string };
  deeds: DeedRecord[];
  landlord?: LegalEntity;
  operator?: LegalEntity;
}) {
  const conveyances = sortedDeeds(deeds.filter((d) => d.deedType !== 'subdivision_plat'));
  const holder = conveyances[conveyances.length - 1];
  const match = holder && landlord ? norm(holder.grantee) === norm(landlord.name) : undefined;

  return (
    <div>
      <ol>
        <Step role="Business at this location">
          {business?.legalName || business?.dbaName ? (
            <>
              <div className="text-[13px] text-dm-dim">Legal name</div>
              <div className="text-[15px] font-medium">{business.legalName || <span className="font-normal text-dm-dim">Not set</span>}</div>
              <div className="mt-2 text-[13px] text-dm-dim">Doing business as</div>
              <div className="text-[15px] font-medium">{business.dbaName || <span className="font-normal text-dm-dim">Not set</span>}</div>
            </>
          ) : (
            <p className="text-[15px] text-dm-dim">Not set.</p>
          )}
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
            <p className="text-[15px] text-dm-dim">No deed on file</p>
          )}
        </Step>
        <Step role="Landlord (legal name)">
          <EntityLine entity={landlord} />
        </Step>
        <Step role="Operator (legal name)" last>
          <EntityLine entity={operator} />
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
