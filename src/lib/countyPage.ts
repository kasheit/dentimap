import { compactUsd } from './format';
import type { ParsedDeedResult } from './deedParser';
import type { Property } from './types';

export function describeFound(p: ParsedDeedResult): string[] {
  const out: string[] = [];
  if (p.landValue !== undefined) out.push(`land ${compactUsd(p.landValue)}`);
  if (p.buildingValue !== undefined) out.push(`building ${compactUsd(p.buildingValue)}`);
  if (p.assessedValue !== undefined) out.push(`assessed ${compactUsd(p.assessedValue)}`);
  if (p.reid) out.push('REID');
  if (p.landClass) out.push('land class');
  if (p.ownerName) out.push('owner');
  if (p.saleDate || p.salePrice !== undefined) out.push('last sale');
  if (p.deedDate || p.acres !== undefined || p.description) out.push('deed details');
  if (p.heatedArea !== undefined || p.yearBuilt !== undefined || p.useType) out.push('building');
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
  if (r.reid) patch.reid = r.reid;
  if (r.landClass) patch.landClass = r.landClass;
  if (r.ownerName) patch.countyOwner = { name: r.ownerName, mailing: r.ownerMailing };
  if (r.saleDate || r.salePrice !== undefined) patch.lastSale = { ...p.lastSale, ...(r.saleDate && { date: r.saleDate }), ...(r.salePrice !== undefined && { price: r.salePrice }) };
  if (r.deedDate || r.acres !== undefined || r.description || r.book) {
    patch.countyDeed = {
      ...p.countyDeed,
      ...(r.book && { book: r.book }),
      ...(r.page && { page: r.page }),
      ...(r.deedDate && { date: r.deedDate }),
      ...(r.acres !== undefined && { acres: r.acres }),
      ...(r.description && { description: r.description }),
    };
  }
  if (r.heatedArea !== undefined || r.yearBuilt !== undefined || r.useType) {
    patch.building = {
      ...p.building,
      ...(r.heatedArea !== undefined && { heatedAreaSqFt: r.heatedArea }),
      ...(r.yearBuilt !== undefined && { yearBuilt: r.yearBuilt }),
      ...(r.useType && { useType: r.useType }),
    };
  }
  return patch;
}
