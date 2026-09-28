import { useDentimap } from './store';
import type { Property } from './types';

/** Nominatim's usage policy caps this at 1 request/second. */
const THROTTLE_MS = 1100;

export interface GeocodeResult {
  lat: number;
  lng: number;
}

/** In-memory cache: a location is never re-geocoded once it has resolved, even across calls this session. */
const cache = new Map<string, GeocodeResult | null>();

export function addressQuery(p: Property): string {
  const a = p.address;
  return [a.street, a.city, a.county && `${a.county.replace(/ County$/, '')} County`, a.state, a.zip]
    .filter(Boolean)
    .join(', ');
}

/**
 * Looks up one location's address via Nominatim. Returns coordinates from the
 * first result, or undefined on failure or no match. Results are cached by
 * query string so the same address is never looked up twice.
 */
export async function geocodeProperty(p: Property): Promise<GeocodeResult | undefined> {
  const query = addressQuery(p);
  if (!query.trim()) return undefined;
  if (cache.has(query)) return cache.get(query) ?? undefined;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      cache.set(query, null);
      return undefined;
    }
    const rows = (await res.json()) as { lat: string; lon: string }[];
    const first = rows[0];
    if (!first) {
      cache.set(query, null);
      return undefined;
    }
    const result: GeocodeResult = { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
    if (Number.isNaN(result.lat) || Number.isNaN(result.lng)) {
      cache.set(query, null);
      return undefined;
    }
    cache.set(query, result);
    return result;
  } catch {
    cache.set(query, null);
    return undefined;
  }
}

export interface GeocodeProgress {
  done: number;
  total: number;
}

/**
 * Geocodes every property in `properties` missing lat/lng, one request per
 * second (Nominatim's rate limit). Each resolved location is written into the
 * store immediately via setCoordinates rather than waiting for the whole
 * batch, so pins can appear on the map as they come in. `onProgress` fires
 * after every attempt, success or not.
 */
export async function geocodeMissing(properties: Property[], onProgress?: (p: GeocodeProgress) => void): Promise<void> {
  const targets = properties.filter((p) => p.address.lat === undefined || p.address.lng === undefined);
  const total = targets.length;
  let done = 0;
  onProgress?.({ done, total });

  for (const p of targets) {
    const result = await geocodeProperty(p);
    if (result) useDentimap.getState().setCoordinates(p.id, result.lat, result.lng);
    done += 1;
    onProgress?.({ done, total });
    if (done < total) await new Promise((r) => setTimeout(r, THROTTLE_MS));
  }
}
