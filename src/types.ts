export type ConfirmationTier = 'legal' | 'reported' | 'unverified';

export interface ConfirmationBadge {
  tier: ConfirmationTier;
  label: string;
}

export interface CompletionState {
  fieldsFilled: number;
  fieldsTotal: number;
  manuallyCompleted: boolean;
}

export interface Owner {
  id: string;
  name: string;
  role: string;
  badge: ConfirmationBadge;
  note?: string;
  distinct?: boolean;
  completion: CompletionState;
}

export interface OwnedEntity {
  id: string;
  name: string;
  badge: ConfirmationBadge;
  fields: { label: string; value: string }[];
  completion: CompletionState;
}

export interface AcquisitionLineItem {
  id: string;
  label: string;
  value: string;
  note?: string;
  badge: ConfirmationBadge;
}

export interface VillageCareGroup {
  badge: ConfirmationBadge;
  filingFacts: { label: string; value: string }[];
  interpretiveNote: string;
  interpretiveBadge: ConfirmationBadge;
  completion: CompletionState;
}

export interface RealEstateRow {
  id: string;
  practice: string;
  specialty: string;
  county: string;
  simulatedPin: string;
  landValue: string;
  buildingValue: string;
  landlordEntity: string;
  landlordType: 'doctor' | 'corporate' | 'villagecare';
  badge: ConfirmationBadge;
  completion: CompletionState;
}

export interface TimelineEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  badge: ConfirmationBadge;
  completion: CompletionState;
}

export type TabId = 'corporate' | 'realestate' | 'finances' | 'timeline';

export interface SourceTierInfo {
  tier: ConfirmationTier;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  textColor: string;
  description: string;
  examples: string[];
}
