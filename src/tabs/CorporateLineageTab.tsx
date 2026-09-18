import { useState, useCallback } from 'react';
import { Building2 } from 'lucide-react';
import { SectionCard } from '@/components/SectionCard';
import { TierBadge } from '@/components/TierBadge';
import { CompletionIndicator } from '@/components/CompletionIndicator';
import { FlagBanner } from '@/components/FlagBanner';
import { EditableText } from '@/components/EditableText';
import {
  owners as initialOwners,
  ownedEntities as initialEntities,
  acquisitionLineItems as initialAcquisition,
  acquisitionWithheldNote as initialWithheld,
  villageCareGroup as initialVcg,
} from '@/data';
import type { CompletionState, Owner, OwnedEntity, AcquisitionLineItem, VillageCareGroup, ConfirmationTier } from '@/types';

export function CorporateLineageTab() {
  const [ownerList, setOwnerList] = useState<Owner[]>(() => initialOwners.map((o) => ({ ...o })));
  const [entityList, setEntityList] = useState<OwnedEntity[]>(() => initialEntities.map((e) => ({ ...e, fields: e.fields.map((f) => ({ ...f })) })));
  const [acquisition, setAcquisition] = useState<AcquisitionLineItem[]>(() => initialAcquisition.map((a) => ({ ...a })));
  const [withheld, setWithheld] = useState({ ...initialWithheld });
  const [vcg, setVcg] = useState<VillageCareGroup>(() => ({
    ...initialVcg,
    filingFacts: initialVcg.filingFacts.map((f) => ({ ...f })),
  }));

  const updateOwner = useCallback((id: string, patch: Partial<Owner>) => {
    setOwnerList((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }, []);
  const updateOwnerCompletion = useCallback((id: string, state: CompletionState) => {
    setOwnerList((prev) => prev.map((o) => (o.id === id ? { ...o, completion: state } : o)));
  }, []);
  const updateEntity = useCallback((id: string, patch: Partial<OwnedEntity>) => {
    setEntityList((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);
  const updateEntityCompletion = useCallback((id: string, state: CompletionState) => {
    setEntityList((prev) => prev.map((e) => (e.id === id ? { ...e, completion: state } : e)));
  }, []);
  const updateEntityField = useCallback((entityId: string, fieldIndex: number, value: string) => {
    setEntityList((prev) => prev.map((e) => (e.id === entityId ? {
      ...e,
      fields: e.fields.map((f, i) => (i === fieldIndex ? { ...f, value } : f)),
    } : e)));
  }, []);
  const updateAcquisition = useCallback((id: string, patch: Partial<AcquisitionLineItem>) => {
    setAcquisition((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  return (
    <div className="space-y-6">
      <SectionCard title="Beneficial owners" subtitle="Named in the Transaction Agreement — per-owner split withheld">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ownerList.map((owner) => (
            <OwnerCard
              key={owner.id}
              owner={owner}
              onName={(v) => updateOwner(owner.id, { name: v })}
              onRole={(v) => updateOwner(owner.id, { role: v })}
              onNote={(v) => updateOwner(owner.id, { note: v })}
              onCompletion={(s) => updateOwnerCompletion(owner.id, s)}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Owned entities" subtitle="Subsidiary and affiliated practice entities">
        <div className="grid gap-4 md:grid-cols-2">
          {entityList.map((entity) => (
            <OwnedEntityCard
              key={entity.id}
              entity={entity}
              onName={(v) => updateEntity(entity.id, { name: v })}
              onField={(i, v) => updateEntityField(entity.id, i, v)}
              onCompletion={(s) => updateEntityCompletion(entity.id, s)}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Acquisition — Park Dental Partners (NASDAQ: PARK)" subtitle="August 2026 · definitive agreement">
        <div className="grid gap-3 md:grid-cols-2">
          {acquisition.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-nested p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-text-muted">{item.label}</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-text-primary">
                    <EditableText value={item.value} onChange={(v) => updateAcquisition(item.id, { value: v })} mono className="text-lg font-semibold" inputClassName="text-lg font-semibold w-full" />
                  </p>
                  {item.note && (
                    <p className="mt-1 text-xs text-text-secondary italic">
                      <EditableText value={item.note} onChange={(v) => updateAcquisition(item.id, { note: v })} multiline className="text-xs italic" inputClassName="text-xs w-full" />
                    </p>
                  )}
                </div>
                <TierBadge tier={item.badge.tier} label={item.badge.label} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <FlagBanner tier={withheld.badge} text={withheld.text} />
        </div>
      </SectionCard>

      <SectionCard title="Village Care Group module" subtitle="DE foreign LLC — pre-transaction reorg vehicle">
        <div className="rounded-lg border border-border bg-nested p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-text-secondary" />
            <span className="text-sm font-semibold text-text-primary">Village Care Group</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {vcg.filingFacts.map((fact, i) => (
              <div key={fact.label}>
                <p className="text-[10px] text-text-muted uppercase tracking-wide">{fact.label}</p>
                <p className="font-mono text-sm text-text-primary">
                  <EditableText
                    value={fact.value}
                    onChange={(v) => setVcg((prev) => ({ ...prev, filingFacts: prev.filingFacts.map((f, j) => (j === i ? { ...f, value: v } : f)) }))}
                    mono
                    className="text-sm"
                    inputClassName="text-sm w-full"
                  />
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <TierBadge tier={vcg.badge.tier} label={vcg.badge.label} />
          </div>
          <div className="mt-3 border-l-2 border-reported-base/40 pl-3">
            <p className="text-sm text-text-secondary leading-relaxed">
              <EditableText
                value={vcg.interpretiveNote}
                onChange={(v) => setVcg((prev) => ({ ...prev, interpretiveNote: v }))}
                multiline
                className="text-sm"
                inputClassName="text-sm w-full"
              />
            </p>
            <div className="mt-2">
              <TierBadge tier={vcg.interpretiveBadge.tier} label={vcg.interpretiveBadge.label} />
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-3">
            <CompletionIndicator state={vcg.completion} onChange={(s) => setVcg((prev) => ({ ...prev, completion: s }))} />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function OwnerCard({ owner, onName, onRole, onNote, onCompletion }: {
  owner: Owner;
  onName: (v: string) => void;
  onRole: (v: string) => void;
  onNote: (v: string) => void;
  onCompletion: (s: CompletionState) => void;
}) {
  return (
    <div className={`rounded-lg border p-4 ${owner.distinct ? 'border-reported-base/30 bg-reported-bg/30' : 'border-border bg-nested'}`}>
      <p className="text-sm font-semibold text-text-primary">
        <EditableText value={owner.name} onChange={onName} className="text-sm font-semibold" inputClassName="text-sm font-semibold w-full" />
      </p>
      <p className="text-xs text-text-muted mt-0.5">
        <EditableText value={owner.role} onChange={onRole} className="text-xs" inputClassName="text-xs w-full" />
      </p>
      {owner.note && (
        <p className="mt-2 text-xs text-reported-text leading-relaxed italic">
          <EditableText value={owner.note} onChange={onNote} multiline className="text-xs italic" inputClassName="text-xs w-full" />
        </p>
      )}
      <div className="mt-3">
        <TierBadge tier={owner.badge.tier} label={owner.badge.label} />
      </div>
      <div className="mt-4 border-t border-border pt-3">
        <CompletionIndicator state={owner.completion} onChange={onCompletion} />
      </div>
    </div>
  );
}

function OwnedEntityCard({ entity, onName, onField, onCompletion }: {
  entity: OwnedEntity;
  onName: (v: string) => void;
  onField: (index: number, value: string) => void;
  onCompletion: (s: CompletionState) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-nested p-4">
      <p className="text-sm font-semibold text-text-primary">
        <EditableText value={entity.name} onChange={onName} className="text-sm font-semibold" inputClassName="text-sm font-semibold w-full" />
      </p>
      <div className="mt-3 grid gap-2">
        {entity.fields.map((field, i) => (
          <div key={field.label} className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-text-muted">{field.label}</span>
            <span className="font-mono text-xs text-text-primary text-right">
              <EditableText value={field.value} onChange={(v) => onField(i, v)} mono className="text-xs" inputClassName="text-xs w-40" />
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <TierBadge tier={entity.badge.tier} label={entity.badge.label} />
      </div>
      <div className="mt-4 border-t border-border pt-3">
        <CompletionIndicator state={entity.completion} onChange={onCompletion} />
      </div>
    </div>
  );
}
