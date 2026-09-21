import { chainBreaks, sortedDeeds } from './store';
import type { DeedRecord, FieldMeta, Property, SourcedField } from './types';

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

export function levelFor(has: boolean, meta?: FieldMeta): Level {
  if (!has) return 'missing';
  return meta?.state === 'verified' ? 'confirmed' : 'partial';
}

export function titleChainLevel(deeds: DeedRecord[]): Level {
  if (!deeds.length) return 'missing';
  const clean = deeds.every((d) => d.confidence === 'verified' && d.isFormulaVerified) && chainBreaks(sortedDeeds(deeds)).length === 0;
  return clean ? 'confirmed' : 'partial';
}

export function ownerLevel(deeds: DeedRecord[]): Level {
  const conv = sortedDeeds(deeds.filter((d) => d.deedType !== 'subdivision_plat'));
  const holder = conv[conv.length - 1];
  if (!holder) return 'missing';
  return holder.confidence === 'verified' ? 'confirmed' : 'partial';
}

export function completionFor(p: Property, deedsAll: DeedRecord[]): Completion {
  const deeds = deedsAll.filter((d) => d.propertyId === p.id);
  const m = (k: SourcedField) => p.meta?.[k];
  const items: CompletionItem[] = [
    { key: 'legalName', label: 'Legal name', level: levelFor(!!p.legalName, m('legalName')) },
    { key: 'dbaName', label: 'Doing business as', level: levelFor(!!p.dbaName, m('dbaName')) },
    { key: 'sosId', label: 'Business SOS ID', level: levelFor(!!p.sosId, m('sosId')) },
    { key: 'address', label: 'Address', level: levelFor(!!(p.address.street && p.address.city && p.address.zip), m('address')) },
    { key: 'county', label: 'County', level: levelFor(!!p.address.county, m('county')) },
    { key: 'parcelPin', label: 'Parcel PIN', level: levelFor(!!p.address.parcelPin, m('parcelPin')) },
    { key: 'assessedValue', label: 'Assessed value', level: levelFor(p.metrics?.currentAssessedValue !== undefined, m('assessedValue')) },
    { key: 'owner', label: 'Property owner', level: ownerLevel(deeds) },
    { key: 'titleChain', label: 'Title chain', level: titleChainLevel(deeds) },
  ];
  const counts: Record<Level, number> = { confirmed: 0, partial: 0, missing: 0 };
  for (const i of items) counts[i.level]++;
  const percent = Math.round(((counts.confirmed + counts.partial * 0.5) / items.length) * 100);
  return { items, percent, counts };
}
