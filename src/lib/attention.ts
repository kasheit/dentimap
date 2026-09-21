import { chainBreaks, sortedDeeds } from './store';
import type { DeedRecord, Property } from './types';

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
