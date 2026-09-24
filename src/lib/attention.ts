import { chainBreaks, sortedDeeds } from './store';
import type { DossierTab } from './store';
import type { DeedRecord, LegalEntity, Property } from './types';

export interface Attention {
  issues: string[];
}

export function attentionFor(p: Property, deeds: DeedRecord[]): Attention {
  const mine = deeds.filter((d) => d.propertyId === p.id);
  const issues: string[] = [];
  if (mine.some((d) => !d.isFormulaVerified)) issues.push('Excise mismatch');
  if (chainBreaks(sortedDeeds(mine)).length) issues.push('Title chain gap');
  const open = (p.noteLog ?? []).filter((n) => n.tag !== 'note' && !n.resolved).length;
  if (open) issues.push(`${open} open note${open === 1 ? '' : 's'}`);
  return { issues };
}

export type Severity = 'red' | 'amber' | 'gray';

export interface QueueItem {
  id: string;
  severity: Severity;
  title: string;
  sub: string;
  propertyId?: string;
  goToEntities?: boolean;
  goToLocations?: boolean;
  tab?: DossierTab;
}

const severityRank: Record<Severity, number> = { red: 0, amber: 1, gray: 2 };

/** Ranked list of things across the registry that want a look, worst first. */
export function attentionQueue(properties: Property[], deeds: DeedRecord[], entities: LegalEntity[]): QueueItem[] {
  const items: QueueItem[] = [];

  for (const p of properties) {
    if (p.status === 'closed') continue;
    const mine = deeds.filter((d) => d.propertyId === p.id);
    const gaps = chainBreaks(sortedDeeds(mine)).length;
    if (gaps) items.push({ id: `chain-${p.id}`, severity: 'red', title: `${p.name} — title chain gap`, sub: `${gaps} break${gaps === 1 ? '' : 's'} between recorded deeds`, propertyId: p.id });

    const mismatched = mine.filter((d) => !d.isFormulaVerified).length;
    if (mismatched) items.push({ id: `excise-${p.id}`, severity: 'amber', title: `${p.name} — excise mismatch`, sub: `${mismatched} deed${mismatched === 1 ? "'s" : 's'} stamps don't formula-check`, propertyId: p.id });

    const open = (p.noteLog ?? []).filter((n) => n.tag !== 'note' && !n.resolved);
    if (open.length) items.push({ id: `notes-${p.id}`, severity: 'amber', title: `${p.name} — ${open.length} open note${open.length === 1 ? '' : 's'}`, sub: open[0].text, propertyId: p.id });
  }

  // Locations with no owner on file: one line each when there are a few, one grouped line when there are many.
  const noOwner = properties.filter((p) => p.status === 'active' && !deeds.some((d) => d.propertyId === p.id && d.deedType !== 'subdivision_plat'));
  if (noOwner.length > 3) {
    items.push({
      id: 'no-owner',
      severity: 'amber',
      title: `${noOwner.length} locations have no owner on file`,
      sub: `${noOwner.slice(0, 3).map((p) => p.name).join(', ')} and ${noOwner.length - 3} more`,
      goToLocations: true,
    });
  } else {
    for (const p of noOwner) items.push({ id: `no-owner-${p.id}`, severity: 'amber', title: `${p.name} — no owner on file`, sub: 'Add the deed that put title in the current owner’s name', propertyId: p.id, tab: 'title' });
  }

  for (const p of properties) {
    if (p.status === 'closed') continue;
    const hasDeed = deeds.some((d) => d.propertyId === p.id && d.deedType !== 'subdivision_plat');
    const assessed = p.metrics?.currentAssessedValue;
    if (hasDeed && assessed === undefined) items.push({ id: `assessed-${p.id}`, severity: 'gray', title: `${p.name} — no assessed value`, sub: 'Paste the county page to fill it in', propertyId: p.id });
    else if (hasDeed && assessed !== undefined && p.meta?.assessedValue?.state !== 'verified') items.push({ id: `assessed-src-${p.id}`, severity: 'gray', title: `${p.name} — assessed value has no source`, sub: 'Confirm where the figure came from', propertyId: p.id });
  }

  for (const e of entities) {
    if (!e.sosId) items.push({ id: `sos-${e.id}`, severity: 'gray', title: `${e.name} — no SOS ID on file`, sub: 'Unsourced', goToEntities: true });
  }

  return items.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
