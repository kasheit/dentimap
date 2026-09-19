import { ArrowDown, Landmark } from 'lucide-react';
import { entityTypeLabel } from '@/lib/format';
import { useDentimap } from '@/lib/store';
import type { LegalEntity } from '@/lib/types';
import { Empty } from './Chips';

export function EntityNode({ role, entity }: { role: string; entity?: LegalEntity }) {
  const setTab = useDentimap((s) => s.setTab);
  return (
    <div className="rounded-lg border border-dm-border bg-dm-bg p-4">
      <div className="label">{role}</div>
      {entity ? (
        <>
          <button onClick={() => setTab('entities')} className="mt-1 flex items-center gap-2 text-left text-sm font-medium transition-colors hover:text-dm-blue">
            <Landmark className="h-4 w-4 text-dm-blue" /> {entity.name}
          </button>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-dm-dim">
            <span>{entityTypeLabel[entity.entityType]}</span>
            {entity.sosId && <span>SOS {entity.sosId}</span>}
            <span>{entity.jurisdiction}</span>
          </div>
        </>
      ) : (
        <p className="mt-1 text-sm text-dm-dim">Not yet identified</p>
      )}
    </div>
  );
}

export function CorporateEntities({ landlord, operator }: { landlord?: LegalEntity; operator?: LegalEntity }) {
  if (!landlord && !operator) return <Empty>No landlord or operating entity linked to this facility.</Empty>;
  return (
    <div className="space-y-2">
      <EntityNode role="Landlord holding entity" entity={landlord} />
      <div className="flex justify-center text-dm-dim">
        <ArrowDown className="h-4 w-4" />
      </div>
      <EntityNode role="Clinical operating entity" entity={operator} />
    </div>
  );
}
