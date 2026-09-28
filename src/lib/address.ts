import type { Property } from './types';

/** The query string a location's address geocodes to. Shared by geocode.ts and the store's stale-coordinate check, so both agree on what "this address" means. */
export function addressQuery(p: Property): string {
  const a = p.address;
  return [a.street, a.city, a.county && `${a.county.replace(/ County$/, '')} County`, a.state, a.zip].filter(Boolean).join(', ');
}
