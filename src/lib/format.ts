import type { DeedType, EntityType, FacilityStatus, FacilityType, PersonRole } from './types';

export const usd = (n?: number, digits = 0) =>
  n === undefined
    ? '—'
    : n.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });

export const compactUsd = (n?: number) =>
  n === undefined ? '—' : n >= 1e6 ? `$${(n / 1e6).toFixed(2).replace(/\.?0+$/, '')}M` : usd(n);

export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
};

export const deedTypeLabel: Record<DeedType, string> = {
  warranty_deed: 'Warranty Deed',
  special_warranty_deed: 'Special Warranty Deed',
  quitclaim_deed: 'Quitclaim Deed',
  trustees_deed: "Trustee's Deed",
  subdivision_plat: 'Subdivision Plat',
  other: 'Other',
};

export const statusLabel: Record<FacilityStatus, string> = {
  active: 'Active',
  pipeline_fitout: 'Pipeline · Fit-out',
  pipeline_pending: 'Pipeline · Pending',
  closed: 'Closed',
};

export const facilityTypeLabel: Record<FacilityType, string> = {
  valleygate_asc: 'Valleygate ASC',
  vfd_practice: 'VFD practice',
  affiliate: 'Affiliate',
};

export const entityTypeLabel: Record<EntityType, string> = {
  landlord_holding: 'Holding company',
  clinical_operator: 'Operating company',
  mso: 'MSO',
  land_trust: 'Land Trust',
};

export const addressLine = (a: { street: string; city: string; state: string; zip: string }) =>
  `${a.street}, ${a.city}, ${a.state} ${a.zip}`;

export const personRoleLabel: Record<PersonRole, string> = {
  owner: 'Owner',
  doctor: 'Doctor',
  attorney: 'Attorney',
  registered_agent: 'Registered agent',
};

export const fmtMonth = (iso: string) => {
  const [y, m] = iso.split('-').map(Number);
  if (!y || !m) return iso;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
};
