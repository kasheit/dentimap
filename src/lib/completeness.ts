import type { Location } from '@/types';

/**
 * Placeholder values written into the seed/schema for fields that haven't
 * been confirmed yet (see src/data.ts). A field holding one of these still
 * counts as an open data-pull gap.
 */
const GAP_VALUES = new Set(['Not yet identified', 'Unknown', 'On file — pending retrieval']);

/** The fields real-estate/legal research actually fills in over time. */
const TRACKED_FIELDS = [
  'landlordEntity',
  'dateEstablished',
  'deedBookPage',
  'previousOccupant',
  'originalLandOwner',
] as const satisfies readonly (keyof Location)[];

export interface DataCompleteness {
  fieldsFilled: number;
  fieldsTotal: number;
  /** True once every tracked field is confirmed, or the manual override is set. */
  complete: boolean;
}

export function dataCompleteness(location: Location): DataCompleteness {
  const fieldsTotal = TRACKED_FIELDS.length;
  const fieldsFilled = TRACKED_FIELDS.filter(
    (field) => !GAP_VALUES.has(String(location[field])),
  ).length;
  return {
    fieldsFilled,
    fieldsTotal,
    complete: location.noPullNeeded || fieldsFilled >= fieldsTotal,
  };
}
