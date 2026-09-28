import type { DeedRecord, LegalEntity } from './types';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** The entity a party name refers to: the linked id when a deed has one, otherwise a name match. */
export function entityFor(entities: LegalEntity[], name: string, id?: string): LegalEntity | undefined {
  if (id) {
    const linked = entities.find((e) => e.id === id);
    if (linked) return linked;
  }
  const n = norm(name);
  return n ? entities.find((e) => norm(e.name) === n) : undefined;
}

/** Grantees that appear on deeds but have no entity record yet, most frequent first. */
export function unlinkedGrantees(entities: LegalEntity[], deeds: DeedRecord[]): { name: string; deeds: number }[] {
  const counts = new Map<string, { name: string; deeds: number }>();
  for (const d of deeds) {
    if (d.deedType === 'subdivision_plat' || !d.grantee.trim() || entityFor(entities, d.grantee, d.granteeEntityId)) continue;
    // people are not entities
    if (d.granteePersonId) continue;
    const key = norm(d.grantee);
    const cur = counts.get(key) ?? { name: d.grantee.trim(), deeds: 0 };
    cur.deeds += 1;
    counts.set(key, cur);
  }
  return [...counts.values()].sort((a, b) => b.deeds - a.deeds || a.name.localeCompare(b.name));
}
