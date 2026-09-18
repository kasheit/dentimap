import type {
  Owner,
  OwnedEntity,
  AcquisitionLineItem,
  VillageCareGroup,
  RealEstateRow,
  TimelineEntry,
  SourceTierInfo,
  ConfirmationTier,
} from './types';

export const sourceTiers: SourceTierInfo[] = [
  {
    tier: 'legal',
    name: 'Legal document',
    shortName: 'Legal',
    color: '#2F7A6B',
    bgColor: '#17251F',
    textColor: '#6FCBB0',
    description: 'Sourced from SEC filings, SOS filings, or definitive agreements — the highest confidence tier.',
    examples: ['SEC 8-K / S-1 filing', 'DE Secretary of State filing', 'Transaction Agreement (exhibit)'],
  },
  {
    tier: 'reported',
    name: 'Secondary / reported',
    shortName: 'Reported',
    color: '#C98A2E',
    bgColor: '#2A2013',
    textColor: '#E3AE5E',
    description: 'Sourced from news, job listings, public directories, or relayed by a primary contact — credible but not independently verified.',
    examples: ['Public practice directory', 'Job listing (2022–2024)', 'Company marketing materials'],
  },
  {
    tier: 'unverified',
    name: 'Unverified',
    shortName: 'Unverified',
    color: '#8A3A3A',
    bgColor: '#241717',
    textColor: '#D08080',
    description: 'No source, simulated, or explicitly undisclosed. Structural mapping only — treat as placeholder until confirmed.',
    examples: ['Simulated parcel / PIN', 'Withheld under Reg S-K', 'No public record found'],
  },
];

export function sourceTier(tier: ConfirmationTier): SourceTierInfo {
  return sourceTiers.find((s) => s.tier === tier)!;
}

export const owners: Owner[] = [
  {
    id: 'ryan',
    name: 'Dr. Sean Ryan',
    role: 'Beneficial owner',
    badge: { tier: 'legal', label: 'Beneficial owner — named in Transaction Agreement' },
    completion: { fieldsFilled: 6, fieldsTotal: 8, manuallyCompleted: false },
  },
  {
    id: 'james',
    name: 'Dr. David James',
    role: 'Beneficial owner',
    badge: { tier: 'legal', label: 'Beneficial owner — named in Transaction Agreement' },
    completion: { fieldsFilled: 7, fieldsTotal: 8, manuallyCompleted: false },
  },
  {
    id: 'wiles',
    name: 'Dr. Robert Wiles',
    role: 'Beneficial owner',
    badge: { tier: 'legal', label: 'Beneficial owner — named in Transaction Agreement' },
    completion: { fieldsFilled: 5, fieldsTotal: 8, manuallyCompleted: false },
  },
  {
    id: 'olsen',
    name: 'Patel & Olsen LLP',
    role: 'Beneficial owner',
    badge: { tier: 'legal', label: 'Beneficial owner — named in Transaction Agreement' },
    completion: { fieldsFilled: 6, fieldsTotal: 8, manuallyCompleted: false },
  },
  {
    id: 'patel',
    name: 'Dr. Anish Patel',
    role: 'Non-economic interest',
    badge: { tier: 'reported', label: 'Non-economic interest — structurally distinct' },
    note: 'Licensing-compliance mechanism, not a reduced economic share.',
    distinct: true,
    completion: { fieldsFilled: 4, fieldsTotal: 8, manuallyCompleted: false },
  },
];

export const ownedEntities: OwnedEntity[] = [
  {
    id: 'southeastern',
    name: 'Southeastern Dental Specialists',
    badge: { tier: 'reported', label: 'Independently confirmed via public practice directory' },
    completion: { fieldsFilled: 5, fieldsTotal: 6, manuallyCompleted: false },
    fields: [
      { label: 'Entity type', value: 'Professional LLC' },
      { label: 'Specialty', value: 'Orthodontics' },
      { label: 'Location', value: 'Fayetteville, NC' },
      { label: 'Affiliation', value: 'VFD network' },
      { label: 'Confirmation', value: 'Public directory' },
    ],
  },
  {
    id: 'dha',
    name: 'Dental Health Associates',
    badge: { tier: 'legal', label: 'SOS filing — confirmed entity' },
    completion: { fieldsFilled: 6, fieldsTotal: 6, manuallyCompleted: true },
    fields: [
      { label: 'Entity type', value: 'NC LLC' },
      { label: 'SOSID', value: 'NC-102347' },
      { label: 'Registered agent', value: 'Corporation Service Co.' },
      { label: 'Principal office', value: 'Fayetteville, NC' },
      { label: 'Status', value: 'Active' },
      { label: 'Formation', value: '2014-03-11' },
    ],
  },
  {
    id: 'village-kids',
    name: 'Village Kids Greensboro',
    badge: { tier: 'legal', label: 'SOS filing — confirmed entity' },
    completion: { fieldsFilled: 4, fieldsTotal: 6, manuallyCompleted: false },
    fields: [
      { label: 'Entity type', value: 'NC LLC' },
      { label: 'Specialty', value: 'Pediatric dentistry' },
      { label: 'Location', value: 'Greensboro, NC' },
      { label: 'Status', value: 'Active' },
    ],
  },
  {
    id: 'cape-fear',
    name: 'Cape Fear Oral & Maxillofacial Surgery',
    badge: { tier: 'reported', label: 'Reported — not yet independently verified' },
    completion: { fieldsFilled: 3, fieldsTotal: 6, manuallyCompleted: false },
    fields: [
      { label: 'Specialty', value: 'Oral & maxillofacial surgery' },
      { label: 'Location', value: 'Fayetteville, NC' },
      { label: 'Affiliation', value: 'VFD network' },
    ],
  },
];

export const acquisitionLineItems: AcquisitionLineItem[] = [
  {
    id: 'base',
    label: 'Base consideration',
    value: '$39.1M',
    badge: { tier: 'legal', label: 'SEC filing' },
  },
  {
    id: 'rollover',
    label: 'Rollover equity',
    value: '$9.2M / 474,535 PARK shares',
    badge: { tier: 'legal', label: 'SEC filing' },
  },
  {
    id: 'earnout',
    label: 'EBITDA earnout',
    value: 'up to $4.6M over 2yr',
    note: 'Contingent on performance',
    badge: { tier: 'legal', label: 'SEC filing' },
  },
  {
    id: 'retention',
    label: 'Retention (Dr. James)',
    value: '$2.3M over 5yr',
    badge: { tier: 'legal', label: 'SEC filing' },
  },
];

export const acquisitionWithheldNote: { badge: ConfirmationTier; label: string; text: string } = {
  badge: 'unverified',
  label: 'Withheld — Reg S-K Item 601(a)(5)',
  text: 'Per-owner split (Ryan / James / Wiles / Patel / Olsen) — not public. Withheld under Reg S-K Item 601(a)(5).',
};

export const villageCareGroup: VillageCareGroup = {
  badge: { tier: 'legal', label: 'SOS filing — confirmed entity' },
  filingFacts: [
    { label: 'Entity type', value: 'DE foreign LLC' },
    { label: 'SOSID', value: '3193425' },
    { label: 'Filed date', value: 'Dec 18, 2025 (15 days post-PARK IPO)' },
    { label: 'President', value: 'Dr. David James' },
  ],
  interpretiveNote:
    'Likely pre-transaction reorg vehicle for retained assets (real estate / Valleygate) not swept into the DSO sale.',
  interpretiveBadge: { tier: 'reported', label: 'Secondary — interpretive note' },
  completion: { fieldsFilled: 4, fieldsTotal: 5, manuallyCompleted: false },
};

export const realEstateRows: RealEstateRow[] = [
  {
    id: 'fayetteville',
    practice: 'Village Family Dental — Fayetteville',
    specialty: 'General / Multi-specialty',
    county: 'Cumberland',
    simulatedPin: 'SIM-04-123-001',
    landValue: '$420,000',
    buildingValue: '$1,850,000',
    landlordEntity: 'VFD Real Estate Partners, LLC',
    landlordType: 'corporate',
    badge: { tier: 'unverified', label: 'Landlord not publicly confirmed' },
    completion: { fieldsFilled: 6, fieldsTotal: 8, manuallyCompleted: false },
  },
  {
    id: 'hope-mills',
    practice: 'Village Family Dental — Hope Mills',
    specialty: 'General',
    county: 'Cumberland',
    simulatedPin: 'SIM-04-087-214',
    landValue: '$310,000',
    buildingValue: '$1,420,000',
    landlordEntity: 'Village Care Group',
    landlordType: 'villagecare',
    badge: { tier: 'unverified', label: 'Landlord not publicly confirmed' },
    completion: { fieldsFilled: 5, fieldsTotal: 8, manuallyCompleted: false },
  },
  {
    id: 'eastover',
    practice: 'Village Kids — Eastover',
    specialty: 'Pediatric',
    county: 'Cumberland',
    simulatedPin: 'SIM-04-032-088',
    landValue: '$220,000',
    buildingValue: '$980,000',
    landlordEntity: 'Village Care Group',
    landlordType: 'villagecare',
    badge: { tier: 'unverified', label: 'Landlord not publicly confirmed' },
    completion: { fieldsFilled: 5, fieldsTotal: 8, manuallyCompleted: false },
  },
  {
    id: 'st-pauls',
    practice: 'Village Family Dental — St. Pauls (founding site)',
    specialty: 'General',
    county: 'Robeson',
    simulatedPin: 'SIM-07-011-003',
    landValue: '$185,000',
    buildingValue: '$760,000',
    landlordEntity: 'Knowles Realty, LLC',
    landlordType: 'doctor',
    badge: { tier: 'unverified', label: 'Landlord not publicly confirmed' },
    completion: { fieldsFilled: 4, fieldsTotal: 8, manuallyCompleted: false },
  },
  {
    id: 'raeford',
    practice: 'Village Family Dental — Raeford',
    specialty: 'Orthodontics',
    county: 'Hoke',
    simulatedPin: 'SIM-06-044-119',
    landValue: '$240,000',
    buildingValue: '$1,120,000',
    landlordEntity: 'McGibbon Realty, LLC',
    landlordType: 'doctor',
    badge: { tier: 'unverified', label: 'Landlord not publicly confirmed' },
    completion: { fieldsFilled: 4, fieldsTotal: 8, manuallyCompleted: false },
  },
  {
    id: 'laurinburg',
    practice: 'Village Family Dental — Laurinburg',
    specialty: 'General',
    county: 'Scotland',
    simulatedPin: 'SIM-08-019-072',
    landValue: '$195,000',
    buildingValue: '$890,000',
    landlordEntity: 'Village Care Group',
    landlordType: 'villagecare',
    badge: { tier: 'unverified', label: 'Landlord not publicly confirmed' },
    completion: { fieldsFilled: 3, fieldsTotal: 8, manuallyCompleted: false },
  },
];

export const timelineEntries: TimelineEntry[] = [
  {
    id: '1985',
    date: '1985',
    title: 'Founded in St. Pauls',
    description: 'Dr. Michael Knowles opens the founding Village Family Dental location in St. Pauls, NC.',
    badge: { tier: 'reported', label: 'Company materials / job listings' },
    completion: { fieldsFilled: 3, fieldsTotal: 4, manuallyCompleted: false },
  },
  {
    id: '2002',
    date: '2002',
    title: 'Partnership expansion',
    description: 'Dr. Faith McGibbon joins as partner, beginning the multi-doctor group structure.',
    badge: { tier: 'reported', label: 'Company materials / job listings' },
    completion: { fieldsFilled: 3, fieldsTotal: 4, manuallyCompleted: false },
  },
  {
    id: 'vcg-2025',
    date: 'Dec 18, 2025',
    title: 'Village Care Group formed',
    description: 'DE foreign LLC filed — SOSID 3193425. Dr. James listed as President. Filed 15 days post-PARK IPO.',
    badge: { tier: 'legal', label: 'SOS filing — confirmed' },
    completion: { fieldsFilled: 4, fieldsTotal: 4, manuallyCompleted: true },
  },
  {
    id: 'park-2026',
    date: 'Aug 2026',
    title: 'Park Dental Partners acquisition',
    description: 'VFD acquired by Park Dental Partners (NASDAQ: PARK) for $39.1M base + $9.2M rollover + up to $4.6M earnout.',
    badge: { tier: 'legal', label: 'SEC filing — confirmed' },
    completion: { fieldsFilled: 4, fieldsTotal: 4, manuallyCompleted: true },
  },
];

export const counties: string[] = ['All', 'Cumberland', 'Robeson', 'Hoke', 'Scotland'];
