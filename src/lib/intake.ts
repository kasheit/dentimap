import { describeFound, propertyPatch } from './countyPage';
import { checkExcise, parseCountyDeedClipboard, splitDeedBlocks } from './deedParser';
import type { ParsedDeedResult } from './deedParser';
import { newId, useDentimap } from './store';
import type { DeedRecord, Property } from './types';

export type Outcome = 'added' | 'filled' | 'duplicate' | 'review' | 'failed';

export interface IntakeItem {
  id: string;
  file: string;
  outcome: Outcome;
  message: string;
  propertyId?: string;
  /** Kept so a document that matched no location can be assigned to one later. */
  text?: string;
}

const alnum = (s?: string) => (s ?? '').replace(/\W/g, '').toLowerCase();
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

function matchProperty(r: ParsedDeedResult, properties: Property[]): Property | undefined {
  const pin = alnum(r.parcelPin);
  if (pin) {
    const hit = properties.find((p) => alnum(p.address.parcelPin) === pin);
    if (hit) return hit;
  }
  const hay = words(r.rawText);
  const hit = properties.find((p) => {
    const street = words(p.address.street);
    return street.length >= 8 && hay.includes(street);
  });
  // The page names a PIN that doesn't belong to the street-matched property — don't trust a
  // coincidental address substring over a PIN that actively disagrees with it.
  if (hit && pin && alnum(hit.address.parcelPin) && alnum(hit.address.parcelPin) !== pin) return undefined;
  return hit;
}

const sameDeed = (a: DeedRecord, b: DeedRecord) =>
  a.propertyId === b.propertyId &&
  ((!!a.instrumentNumber && a.instrumentNumber === b.instrumentNumber) ||
    (!!a.book && !!a.page && a.book === b.book && a.page === b.page) ||
    (a.recordingDate === b.recordingDate && alnum(a.grantor) === alnum(b.grantor) && alnum(a.grantee) === alnum(b.grantee)));

type Bag = Record<string, unknown>;

/** Fills only what the location has no value for. Values that already exist are never overwritten. */
function fillBlanks(r: ParsedDeedResult, p: Property): { patch: Partial<Property>; conflicts: string[] } {
  const blank = { ...p, metrics: undefined, lastSale: undefined, countyDeed: undefined };
  const found = propertyPatch(r, blank) as Bag;
  const have = p as unknown as Bag;
  const patch: Bag = {};
  const conflicts: string[] = [];
  for (const key of Object.keys(found)) {
    const incoming = found[key];
    const current = have[key];
    if (current === undefined) {
      patch[key] = incoming;
    } else if (incoming && typeof incoming === 'object') {
      const merged: Bag = { ...(current as Bag) };
      let changed = false;
      for (const [k, v] of Object.entries(incoming as Bag)) {
        if (v === undefined) continue;
        if (merged[k] === undefined || merged[k] === '') {
          merged[k] = v;
          changed = true;
        } else if (merged[k] !== v) conflicts.push(k);
      }
      if (changed) patch[key] = merged;
    } else if (current !== incoming) conflicts.push(key);
  }
  return { patch: patch as Partial<Property>, conflicts };
}

function apply(r: ParsedDeedResult, file: string, text: string, forced?: string): IntakeItem {
  const st = useDentimap.getState();
  const base = { id: newId('intake'), file, text };
  const property = forced ? st.properties.find((p) => p.id === forced) : matchProperty(r, st.properties);
  if (!property) {
    return { ...base, outcome: 'review', message: r.parcelPin ? `No location with parcel PIN ${r.parcelPin}.` : 'No parcel PIN or address matched a location.' };
  }

  const did: string[] = [];
  let duplicate = false;
  let addedDeed = false;

  if (r.recordingDate && r.grantor && r.grantee) {
    const consideration = r.consideration ?? 0;
    const stamps = r.exciseTaxStamps ?? 0;
    const deed: DeedRecord = {
      id: newId('deed'),
      propertyId: property.id,
      recordingDate: r.recordingDate,
      instrumentNumber: r.instrumentNumber,
      book: r.book,
      page: r.page,
      deedType: r.deedType,
      grantor: r.grantor,
      grantee: r.grantee,
      consideration,
      exciseTaxStamps: stamps,
      isFormulaVerified: checkExcise(consideration, stamps),
      confidence: 'unverified',
      source: `Uploaded: ${file}`,
    };
    if (st.deeds.some((d) => sameDeed(d, deed))) duplicate = true;
    else {
      st.addDeed(deed);
      addedDeed = true;
      did.push(`deed ${r.recordingDate} added`);
      if (!deed.isFormulaVerified) did.push('excise tax does not match');
    }
  }

  const found = describeFound(r);
  if (found.length) {
    const { patch, conflicts } = fillBlanks(r, useDentimap.getState().properties.find((p) => p.id === property.id) ?? property);
    if (Object.keys(patch).length) {
      useDentimap.getState().updateProperty(property.id, patch, `Details filled from upload: ${file}`);
      did.push(`filled ${found.join(', ')}`);
    }
    if (conflicts.length) did.push(`${conflicts.length} differ from what is saved, left unchanged`);
  }

  const filled = did.some((d) => d.startsWith('filled'));
  if (addedDeed || filled) return { ...base, propertyId: property.id, outcome: addedDeed ? 'added' : 'filled', message: `${property.name}: ${did.join('; ')}` };
  if (duplicate) return { ...base, propertyId: property.id, outcome: 'duplicate', message: `${property.name}: already on the title chain` };
  if (did.length) return { ...base, propertyId: property.id, outcome: 'review', message: `${property.name}: ${did.join('; ')}` };
  return { ...base, propertyId: property.id, outcome: 'review', message: `${property.name}: no recording date, grantor and grantee found, so no deed was added` };
}

/** Parses the text of one uploaded file and writes whatever it can to the matching location. */
export function ingestText(text: string, file: string, forcedPropertyId?: string): IntakeItem[] {
  const parsed = splitDeedBlocks(text).map(parseCountyDeedClipboard);
  const useful = parsed.filter((r) => r.grantor || r.grantee || r.consideration !== undefined || r.recordingDate || describeFound(r).length);
  if (!useful.length) return [{ id: newId('intake'), file, outcome: 'failed', message: 'Nothing recognisable in this file.' }];
  return useful.map((r) => apply(r, file, text, forcedPropertyId));
}
