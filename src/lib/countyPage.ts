import { compactUsd } from './format';
import type { ParsedDeedResult } from './deedParser';
import type { Property } from './types';

export function describeFound(p: ParsedDeedResult): string[] {
  const out: string[] = [];
  if (p.landValue !== undefined) out.push(`land ${compactUsd(p.landValue)}`);
  if (p.buildingValue !== undefined) out.push(`building ${compactUsd(p.buildingValue)}`);
  if (p.assessedValue !== undefined) out.push(`assessed ${compactUsd(p.assessedValue)}`);
  if (p.saleDate || p.salePrice !== undefined) out.push('last sale');
  if (p.deedDate || p.book) out.push('deed details');
  return out;
}

/** Only the details found on the page are changed; everything else on the location is left alone. */
export function propertyPatch(r: ParsedDeedResult, p: Property): Partial<Property> {
  const patch: Partial<Property> = {};
  if (r.landValue !== undefined || r.buildingValue !== undefined || r.assessedValue !== undefined) {
    patch.metrics = {
      ...p.metrics,
      ...(r.landValue !== undefined && { landValue: r.landValue }),
      ...(r.buildingValue !== undefined && { buildingValue: r.buildingValue }),
      ...(r.assessedValue !== undefined && { currentAssessedValue: r.assessedValue }),
    };
  }
  if (r.saleDate || r.salePrice !== undefined) patch.lastSale = { ...p.lastSale, ...(r.saleDate && { date: r.saleDate }), ...(r.salePrice !== undefined && { price: r.salePrice }) };
  if (r.deedDate || r.book) {
    patch.countyDeed = {
      ...p.countyDeed,
      ...(r.book && { book: r.book }),
      ...(r.page && { page: r.page }),
      ...(r.deedDate && { date: r.deedDate }),
    };
  }
  return patch;
}
