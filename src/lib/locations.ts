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
  payer_mix: string[];
  staffing_notes: string;
  no_pull_needed: boolean;
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
    payerMix: row.payer_mix,
    staffingNotes: row.staffing_notes,
    noPullNeeded: row.no_pull_needed,
  };
}

function toRow(location: Location): Omit<LocationRow, 'id'> {
  return {
    record_id: location.recordId,
    name: location.name,
    city: location.city,
    state: location.state,
    asset_type: location.assetType,
    specialty: location.specialty,
    date_established: location.dateEstablished,
    operating_footprint_sq_ft: location.operatingFootprintSqFt,
    landlord_entity: location.landlordEntity,
    deed_book_page: location.deedBookPage,
    previous_occupant: location.previousOccupant,
    original_land_owner: location.originalLandOwner,
    original_land_value: location.originalLandValue,
    current_asset_valuation: location.currentAssetValuation,
    status: location.status,
    description: location.description,
    payer_mix: location.payerMix,
    staffing_notes: location.staffingNotes,
    no_pull_needed: location.noPullNeeded,
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

/**
 * Persists an edited location to Supabase. Returns null (and leaves the
 * database untouched) when Supabase isn't configured — callers should still
 * update local state so single-session edits work against the seed data.
 */
export async function updateLocation(location: Location): Promise<Location | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('locations')
    .update(toRow(location))
    .eq('id', location.id)
    .select()
    .single();
  if (error || !data) return null;
  return fromRow(data as LocationRow);
}
