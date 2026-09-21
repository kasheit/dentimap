import { levelFor } from '@/lib/completion';
import { fmtDate } from '@/lib/format';
import { sortedDeeds } from '@/lib/store';
import type { DeedRecord, FieldMeta, Property } from '@/lib/types';
import { LevelLabel } from './Chips';

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

function Named({ label, value, meta, mono }: { label: string; value?: string; meta?: FieldMeta; mono?: boolean }) {
  return (
    <div className="first:mt-0 mt-3">
      <div className="text-[13px] text-dm-dim">{label}</div>
      <div className={`font-medium ${mono ? 'font-mono text-[14px]' : 'text-[15px]'}`}>{value || <span className="font-normal text-dm-dim">—</span>}</div>
      <div className="mt-0.5">
        <LevelLabel level={levelFor(!!value, meta)} detail={value ? detail(meta) : undefined} />
      </div>
    </div>
  );
}

export function OwnershipChain({ property, deeds }: { property: Property; deeds: DeedRecord[] }) {
  const conveyances = sortedDeeds(deeds.filter((d) => d.deedType !== 'subdivision_plat'));
  const holder = conveyances[conveyances.length - 1];
  const meta = property.meta ?? {};

  return (
    <ol>
      <Step role="Business at this location">
        <Named label="Legal name" value={property.legalName} meta={meta.legalName} />
        <Named label="Doing business as" value={property.dbaName} meta={meta.dbaName} />
        <Named label="Business SOS ID" value={property.sosId} meta={meta.sosId} mono />
      </Step>
      <Step role="Property owner of record" last>
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
    </ol>
  );
}
