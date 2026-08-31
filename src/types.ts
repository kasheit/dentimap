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
}

export interface Landlord {
  entity: string;
  locations: Location[];
}
