import { useDentimap } from '@/lib/store';
import { entityTypeLabel } from '@/lib/format';
import type { LegalEntity } from '@/lib/types';
import { Empty } from './Chips';

function Row({ role, entity }: { role: string; entity?: LegalEntity }) {
  const setTab = useDentimap((s) => s.setTab);
  return (
    <div className="border-b border-dm-border/70 py-3 first:pt-0 last:border-0 last:pb-0">
      <div className="text-[13px] text-dm-dim">{role}</div>
      {entity ? (
        <>
          <button onClick={() => setTab('entities')} className="mt-0.5 text-left text-[15px] font-medium transition-colors hover:text-dm-blue">
            {entity.name}
          </button>
          <div className="mt-0.5 text-[13px] text-dm-muted">
            {entityTypeLabel[entity.entityType]} · {entity.jurisdiction}
            {entity.sosId && <> · SOS <span className="font-mono text-xs">{entity.sosId}</span></>}
          </div>
        </>
      ) : (
        <p className="mt-0.5 text-[15px] text-dm-dim">Not identified</p>
      )}
    </div>
  );
}

export function CorporateEntities({ landlord, operator }: { landlord?: LegalEntity; operator?: LegalEntity }) {
  if (!landlord && !operator) return <Empty>No landlord or operating entity linked to this facility.</Empty>;
  return (
    <div>
      <Row role="Landlord" entity={landlord} />
      <Row role="Operator" entity={operator} />
    </div>
  );
}
