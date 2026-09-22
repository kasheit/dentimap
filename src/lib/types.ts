export type VerificationState = 'verified' | 'unverified' | 'unknown';
export type FacilityType = 'valleygate_asc' | 'vfd_practice' | 'affiliate';
export type FacilityStatus = 'active' | 'closed';
export type DeedType =
  | 'warranty_deed'
  | 'special_warranty_deed'
  | 'quitclaim_deed'
  | 'trustees_deed'
  | 'subdivision_plat'
  | 'other';
export type EntityType = 'landlord_holding' | 'clinical_operator' | 'mso' | 'land_trust';
export type NoteTag = 'note' | 'question' | 'follow_up';
export type PersonRole = 'owner' | 'doctor' | 'attorney' | 'registered_agent';

/** One dated thing a person did, with where we learned it. */
export interface PersonAction {
  id: string;
  date: string;
  text: string;
  propertyId?: string;
  source?: string;
  state: VerificationState;
}

export interface Person {
  id: string;
  name: string;
  roles: PersonRole[];
  title?: string;
  /** Why this person matters to the network. */
  relevance?: string;
  status: 'active' | 'former';
  entityIds: string[];
  propertyIds: string[];
  actions: PersonAction[];
  notes?: string;
}

export interface NoteEntry {
  id: string;
  text: string;
  tag: NoteTag;
  createdAt: string;
  resolved?: boolean;
}

/** Provenance for a single value. `unknown` with no source means "unsourced". */
export interface FieldMeta {
  state: VerificationState;
  source?: string;
  asOf?: string;
}

export type SourcedField =
  | 'legalName'
  | 'dbaName'
  | 'sosId'
  | 'firstFilingDate'
  | 'address'
  | 'county'
  | 'parcelPin'
  | 'assessedValue'
  | 'projectInvestment'
  | 'landlord'
  | 'operator';

export interface Property {
  id: string;
  name: string;
  /** Name on business documents (the registered entity). */
  legalName?: string;
  /** Trade name / doing business as. */
  dbaName?: string;
  /** Secretary of State ID of the business at this location. */
  sosId?: string;
  /** Date of the business's first filing (ISO). */
  firstFilingDate?: string;
  facilityType: FacilityType;
  status: FacilityStatus;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    county: string;
    parcelPin: string;
  };
  parcelUrl?: string;
  /** County parcel identifiers and classification. */
  reid?: string;
  landClass?: string;
  /** Owner as listed by the county tax record (may differ from the deed holder). */
  countyOwner?: { name?: string; mailing?: string };
  lastSale?: { date?: string; price?: number };
  countyDeed?: { book?: string; page?: string; date?: string; acres?: number; description?: string };
  building?: { heatedAreaSqFt?: number; yearBuilt?: number; useType?: string };
  metrics?: {
    projectInvestment?: number;
    footprintSqFt?: number;
    currentAssessedValue?: number;
    landValue?: number;
    buildingValue?: number;
    targetOpening?: string;
  };
  meta?: Partial<Record<SourcedField, FieldMeta>>;
  clinicalSpecs?: {
    operatingRooms?: number;
    pacuBays?: number;
    outpatientSharePercent?: number;
    specialties?: string[];
    licensure?: string;
  };
  landlordEntityId?: string;
  operatingEntityId?: string;
  notes?: string; // legacy single-field notes, superseded by noteLog
  noteLog?: NoteEntry[];
  photoUrl?: string;
}

export interface DeedRecord {
  id: string;
  propertyId: string;
  recordingDate: string;
  instrumentNumber?: string;
  book?: string;
  page?: string;
  deedType: DeedType;
  grantor: string;
  grantee: string;
  consideration: number;
  exciseTaxStamps: number;
  isFormulaVerified: boolean;
  platReference?: string;
  documentUrl?: string;
  confidence: VerificationState;
  source: string;
}

export interface LegalEntity {
  id: string;
  /** Registered legal name. */
  name: string;
  /** Trade name / doing business as. */
  dbaName?: string;
  sosId?: string;
  entityType: EntityType;
  jurisdiction: string;
  formationDate?: string;
  registeredAgentOrManagers?: string[];
  associatedPropertyIds: string[];
}

export interface ActivityEntry {
  id: string;
  at: string;
  text: string;
  propertyId?: string;
}

/** A term the user has defined in their own words, e.g. an acronym like MSO or LLC. */
export interface GlossaryTerm {
  id: string;
  /** The term or acronym itself, e.g. "MSO". */
  term: string;
  /** What the acronym stands for, if it is one, e.g. "Management Services Organization". */
  expansion?: string;
  /** The user's own-words definition. */
  definition: string;
  createdAt: string;
  updatedAt: string;
}

export interface DentimapData {
  properties: Property[];
  deeds: DeedRecord[];
  entities: LegalEntity[];
  activity?: ActivityEntry[];
  people?: Person[];
  glossary?: GlossaryTerm[];
}
