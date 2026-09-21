import type { DentimapData } from './types';

function download(name: string, mime: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const cell = (v: unknown) => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const toCsv = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  return [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n');
};

const stamp = () => new Date().toISOString().slice(0, 10);

const BACKUP_KEY = 'dentimap-last-backup';

export function lastBackupAt(): string | null {
  try {
    return localStorage.getItem(BACKUP_KEY);
  } catch {
    return null;
  }
}

export function backupDue(days = 7): boolean {
  const last = lastBackupAt();
  if (!last) return true;
  return Date.now() - Date.parse(last) > days * 24 * 60 * 60 * 1000;
}

export const exportJson = (d: DentimapData) => {
  download(`dentimap-${stamp()}.json`, 'application/json', JSON.stringify(d, null, 2));
  try {
    localStorage.setItem(BACKUP_KEY, new Date().toISOString());
  } catch {
    /* storage unavailable */
  }
};

export function exportCsv(d: DentimapData, which: 'properties' | 'deeds' | 'entities') {
  let rows: Record<string, unknown>[];
  if (which === 'properties') {
    rows = d.properties.map((p) => ({
      id: p.id,
      name: p.name,
      facilityType: p.facilityType,
      status: p.status,
      street: p.address.street,
      city: p.address.city,
      state: p.address.state,
      zip: p.address.zip,
      county: p.address.county,
      parcelPin: p.address.parcelPin,
      projectInvestment: p.metrics?.projectInvestment,
      assessedValue: p.metrics?.currentAssessedValue,
      landValue: p.metrics?.landValue,
      buildingValue: p.metrics?.buildingValue,
      footprintSqFt: p.metrics?.footprintSqFt,
      targetOpening: p.metrics?.targetOpening,
      operatingRooms: p.clinicalSpecs?.operatingRooms,
      pacuBays: p.clinicalSpecs?.pacuBays,
      specialties: p.clinicalSpecs?.specialties?.join('; '),
      landlordEntityId: p.landlordEntityId,
      operatingEntityId: p.operatingEntityId,
      notes: p.notes,
    }));
  } else if (which === 'deeds') {
    rows = d.deeds.map((x) => ({ ...x }));
  } else {
    rows = d.entities.map((e) => ({
      ...e,
      registeredAgentOrManagers: e.registeredAgentOrManagers?.join('; '),
      associatedPropertyIds: e.associatedPropertyIds.join('; '),
    }));
  }
  download(`dentimap-${which}-${stamp()}.csv`, 'text/csv', toCsv(rows));
}
