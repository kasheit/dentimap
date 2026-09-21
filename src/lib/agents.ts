import type { LegalEntity } from './types';

export const agentKey = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');

export interface AgentRecord {
  name: string;
  entities: LegalEntity[];
}

/** Registered agents are stored per entity as plain names; this folds them into one shared directory. */
export function buildAgentDirectory(entities: LegalEntity[]): AgentRecord[] {
  const byKey = new Map<string, AgentRecord>();
  for (const e of entities) {
    for (const raw of e.registeredAgentOrManagers ?? []) {
      const key = agentKey(raw);
      if (!key) continue;
      const rec = byKey.get(key) ?? { name: raw.trim(), entities: [] };
      rec.entities.push(e);
      byKey.set(key, rec);
    }
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}
