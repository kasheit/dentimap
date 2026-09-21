import { fmtDate } from '@/lib/format';
import { sortedDeeds } from '@/lib/store';
import type { DeedRecord, Property, SourcedField } from '@/lib/types';
import { ConfirmLabel } from './ConfirmLabel';
import { LevelLabel } from './Chips';

function SubHeading({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return (
    <div className={`text-[12px] font-semibold uppercase tracking-[0.08em] text-dm-blue/80 ${first ? '' : 'mt-6'} mb-1 border-b border-dm-border/70 pb-1.5`}>
      {children}
    </div>
  );
}

function Row({ label, value, mono, status }: { label: string; value?: React.ReactNode; mono?: boolean; status: React.ReactNode }) {
  return (
    <div className="grid gap-x-4 gap-y-1 border-b border-dm-border/50 py-2.5 last:border-0 sm:grid-cols-[9rem_1fr_auto] sm:items-baseline">
      <div className="text-[13px] text-dm-dim">{label}</div>
      <div className={`min-w-0 break-words ${mono ? 'font-mono text-[14px]' : 'text-[15px]'} font-medium`}>
        {value || <span className="font-normal text-dm-dim">—</span>}
      </div>
      <div className="sm:text-right">{status}</div>
    </div>
  );
}

export function OwnershipChain({ property, deeds }: { property: Property; deeds: DeedRecord[] }) {
  const conveyances = sortedDeeds(deeds.filter((d) => d.deedType !== 'subdivision_plat'));
  const holder = conveyances[conveyances.length - 1];

  const status = (field: SourcedField, label: string, has: boolean) => <ConfirmLabel property={property} field={field} label={label} has={has} />;

  return (
    <div>
      <SubHeading first>Business</SubHeading>
      <Row label="Legal name" value={property.legalName} status={status('legalName', 'Legal name', !!property.legalName)} />
      <Row label="Doing business as" value={property.dbaName} status={status('dbaName', 'Doing business as', !!property.dbaName)} />
      <Row label="Business SOS ID" mono value={property.sosId} status={status('sosId', 'Business SOS ID', !!property.sosId)} />
      <Row
        label="First filing"
        value={property.firstFilingDate ? fmtDate(property.firstFilingDate) : undefined}
        status={status('firstFilingDate', 'First filing date', !!property.firstFilingDate)}
      />

      <SubHeading>Property</SubHeading>
      <Row
        label="Owner of record"
        value={
          holder && (
            <>
              {holder.grantee}
              <span className="ml-2 text-[13px] font-normal text-dm-dim">per {fmtDate(holder.recordingDate)} deed</span>
            </>
          )
        }
        status={<LevelLabel level={holder ? (holder.confidence === 'verified' ? 'confirmed' : 'partial') : 'missing'} detail={holder ? holder.source || undefined : 'no deed on file'} />}
      />
    </div>
  );
}
