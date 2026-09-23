import type { Property, SourceLink } from './types';

/** Where records for a county are usually looked up. URLs are a starting point; edit them per location. */
const COUNTY_PRESETS: Record<string, SourceLink[]> = {
  wake: [
    { label: 'Wake County Real Estate', url: 'https://services.wakegov.com/realestate/' },
    { label: 'Wake iMaps', url: 'https://maps.wakegov.com/imaps/' },
  ],
  cumberland: [{ label: 'Cumberland County Property Search', url: '' }],
  durham: [{ label: 'Durham County Property Search', url: '' }],
  mecklenburg: [{ label: 'Mecklenburg County Property Search', url: '' }],
};

const COMMON_PRESETS: SourceLink[] = [
  { label: 'NC Secretary of State', url: 'https://www.sosnc.gov/online_services/search/by_title/_Business_Registration' },
];

export function presetsFor(county: string): SourceLink[] {
  const key = county.trim().toLowerCase().replace(/\s+county$/, '');
  return [...(COUNTY_PRESETS[key] ?? [{ label: `${county.trim() ? county.trim() + ' County ' : ''}Property Search`.trim(), url: '' }]), ...COMMON_PRESETS];
}

/** Saved links, plus the older single county-record link on locations that predate the list. */
export function sourcesOf(p: Property): SourceLink[] {
  if (p.sources?.length) return p.sources;
  return p.parcelUrl ? [{ label: 'County record', url: p.parcelUrl }] : [];
}

export const safeUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);
