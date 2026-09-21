import { chainBreaks, sortedDeeds } from './store';
import type { DeedRecord, FieldMeta, LegalEntity, Property, SourcedField } from './types';

/** confirmed = directly confirmed from records, partial = present but not fully confirmed, missing = nothing there. */
export type Level = 'confirmed' | 'partial' | 'missing';

export interface CompletionItem {
  key: string;
  label: string;
  level: Level;
}

export interface Completion {
  items: CompletionItem[];
  percent: number;
  counts: Record<Level, number>;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export function levelFor(has: boolean, meta?: FieldMeta): Level {
  if (!has) return 'missing';
  return meta?.state === 'verified' ? 'confirmed' : 'partial';
}

export function titleChainLevel(deeds: DeedRecord[]): Level {
  if (!deeds.length) return 'missing';
  const clean = deeds.every((d) => d.confidence === 'verified' && d.isFormulaVerified) && chainBreaks(sortedDeeds(deeds)).length === 0;
  return clean ? 'confirmed' : 'partial';
}

export function holderLevel(deeds: DeedRecord[], landlord?: LegalEntity): Level {
  const conv = sortedDeeds(deeds.filter((d) => d.deedType !== 'subdivision_plat'));
  const holder = conv[conv.length - 1];
  if (!holder || !landlord) return 'missing';
  return norm(holder.grantee) === norm(landlord.name) && holder.confidence === 'verified' ? 'confirmed' : 'partial';
}

export function completionFor(p: Property, deedsAll: DeedRecord[], entities: LegalEntity[]): Completion {
  const deeds = deedsAll.filter((d) => d.propertyId === p.id);
  const landlord = entities.find((e) => e.id === p.landlordEntityId);
  const operator = entities.find((e) => e.id === p.operatingEntityId);
  const m = (k: SourcedField) => p.meta?.[k];
  const items: CompletionItem[] = [
    { key: 'legalName', label: 'Legal name', level: levelFor(!!p.legalName, m('legalName')) },
    { key: 'dbaName', label: 'Doing business as', level: levelFor(!!p.dbaName, m('dbaName')) },
    { key: 'address', label: 'Address', level: levelFor(!!(p.address.street && p.address.city && p.address.zip), m('address')) },
    { key: 'county', label: 'County', level: levelFor(!!p.address.county, m('county')) },
    { key: 'parcelPin', label: 'Parcel PIN', level: levelFor(!!p.address.parcelPin, m('parcelPin')) },
    { key: 'assessedValue', label: 'Assessed value', level: levelFor(p.metrics?.currentAssessedValue !== undefined, m('assessedValue')) },
    { key: 'landlord', label: 'Landlord', level: levelFor(!!landlord, m('landlord')) },
    { key: 'operator', label: 'Operator', level: levelFor(!!operator, m('operator')) },
    { key: 'titleChain', label: 'Title chain', level: titleChainLevel(deeds) },
    { key: 'holder', label: 'Deed holder matches landlord', level: holderLevel(deeds, landlord) },
  ];
  const counts: Record<Level, number> = { confirmed: 0, partial: 0, missing: 0 };
  for (const i of items) counts[i.level]++;
  const percent = Math.round(((counts.confirmed + counts.partial * 0.5) / items.length) * 100);
  return { items, percent, counts };
}
