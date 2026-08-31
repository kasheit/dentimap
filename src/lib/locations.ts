import { supabase } from '@/lib/supabase';
import { locations as seedLocations } from '@/data';
import type { Location } from '@/types';

interface LocationRow {
  id: string;
  record_id: string;
  name: string;
  city: string;
  state: string;
  asset_type: Location['assetType'];
  specialty: Location['specialty'];
  date_established: string;
  operating_footprint_sq_ft: number;
  landlord_entity: string;
  deed_book_page: string;
  previous_occupant: string;
  original_land_owner: string;
  original_land_value: number;
  current_asset_valuation: number;
  status: Location['status'];
  description: string;
}

function fromRow(row: LocationRow): Location {
  return {
    id: row.id,
    recordId: row.record_id,
    name: row.name,
    city: row.city,
    state: row.state,
    assetType: row.asset_type,
    specialty: row.specialty,
    dateEstablished: row.date_established,
    operatingFootprintSqFt: row.operating_footprint_sq_ft,
    landlordEntity: row.landlord_entity,
    deedBookPage: row.deed_book_page,
    previousOccupant: row.previous_occupant,
    originalLandOwner: row.original_land_owner,
    originalLandValue: row.original_land_value,
    currentAssetValuation: row.current_asset_valuation,
    status: row.status,
    description: row.description,
  };
}

/**
 * Falls back to the baked-in seed (src/data.ts) whenever Supabase isn't
 * configured or the request fails — same pattern as Synvarity's KV loader.
 */
export async function loadLocations(): Promise<Location[]> {
  if (!supabase) return seedLocations;
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('record_id', { ascending: true });
  if (error || !data) return seedLocations;
  return (data as LocationRow[]).map(fromRow);
}
