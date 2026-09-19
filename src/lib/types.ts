export type VerificationState = 'verified' | 'unverified' | 'unknown';
export type FacilityType = 'valleygate_asc' | 'vfd_practice' | 'affiliate';
export type FacilityStatus = 'active' | 'pipeline_fitout' | 'pipeline_pending' | 'closed';
export type DeedType =
  | 'warranty_deed'
  | 'special_warranty_deed'
  | 'quitclaim_deed'
  | 'trustees_deed'
  | 'subdivision_plat'
  | 'other';
export type EntityType = 'landlord_holding' | 'clinical_operator' | 'mso' | 'land_trust';

export interface Property {
  id: string;
  name: string;
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
  metrics?: {
    projectInvestment?: number;
    footprintSqFt?: number;
    currentAssessedValue?: number;
    targetOpening?: string;
  };
  clinicalSpecs?: {
    operatingRooms?: number;
    pacuBays?: number;
    outpatientSharePercent?: number;
    specialties?: string[];
    licensure?: string;
  };
  landlordEntityId?: string;
  operatingEntityId?: string;
  notes?: string;
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
  confidence: VerificationState;
  source: string;
}

export interface LegalEntity {
  id: string;
  name: string;
  sosId?: string;
  entityType: EntityType;
  jurisdiction: string;
  formationDate?: string;
  registeredAgentOrManagers?: string[];
  associatedPropertyIds: string[];
}

export interface DentimapData {
  properties: Property[];
  deeds: DeedRecord[];
  entities: LegalEntity[];
}
