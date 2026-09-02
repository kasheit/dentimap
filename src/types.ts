export type AssetType = 'dental' | 'asc' | 'dual';

export type Specialty = 'Ortho' | 'OMFS' | 'General' | 'Pediatric';

export type LocationStatus = 'Operating' | 'Under renovation' | 'Lease review' | 'Acquisition pending';

export interface Location {
  id: string;
  recordId: string;
  name: string;
  city: string;
  state: string;
  assetType: AssetType;
  specialty: Specialty[];
  dateEstablished: string;
  operatingFootprintSqFt: number;
  landlordEntity: string;
  deedBookPage: string;
  previousOccupant: string;
  originalLandOwner: string;
  originalLandValue: number;
  currentAssetValuation: number;
  status: LocationStatus;
  description: string;
  /** Free-form payer mix shares, e.g. "30% military", "35-40% Medicaid". */
  payerMix: string[];
  /** Staffing/rotation notes, e.g. how specialists rotate across offices. */
  staffingNotes: string;
}

export interface Landlord {
  entity: string;
  locations: Location[];
}

export type CourseStatus = 'completed' | 'in-progress' | 'needed';

export interface Course {
  id: string;
  name: string;
  status: CourseStatus;
  notes: string;
}
