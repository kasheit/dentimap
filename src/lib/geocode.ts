import { addressQuery } from './address';
import { useDentimap } from './store';
import type { Property } from './types';

/** Nominatim's usage policy caps this at 1 request/second. Every geocode call — batch or a single manual "Locate" — goes through the same queue below, so a burst of clicks can never exceed it. */
const THROTTLE_MS = 1100;

export interface GeocodeResult {
  lat: number;
  lng: number;
}

export type GeocodeFailure = 'no-match' | 'error';

/** In-memory cache: a location is never re-geocoded for the same address query, even across calls this session. */
const cache = new Map<string, GeocodeResult | GeocodeFailure>();

export { addressQuery };

// A single serialized queue every fetch passes through, spaced at least
// THROTTLE_MS apart, regardless of how many callers ask at once.
let queue: Promise<unknown> = Promise.resolve();
let nextSlotAt = 0;
function throttledFetch(url: string): Promise<Response> {
  const run = queue.then(async () => {
    const wait = Math.max(0, nextSlotAt - Date.now());
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    nextSlotAt = Date.now() + THROTTLE_MS;
    return fetch(url, { headers: { Accept: 'application/json' } });
  });
  // keep the chain alive even if this request fails, so later callers still get their turn
  queue = run.catch(() => undefined);
  return run;
}

/**
 * Looks up one location's address via Nominatim. Returns coordinates from the
 * first result, `'no-match'` when the address didn't resolve to anything, or
 * `'error'` on a network/HTTP failure. Results are cached by query string so
 * the same address is never looked up twice, and the fetch itself is always
 * routed through the shared throttle above.
 */
export async function geocodeProperty(p: Property): Promise<GeocodeResult | GeocodeFailure | undefined> {
  const query = addressQuery(p);
  if (!query.trim()) return undefined;
  if (cache.has(query)) return cache.get(query);

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await throttledFetch(url);
    if (!res.ok) {
      cache.set(query, 'error');
      return 'error';
    }
    const rows = (await res.json()) as { lat: string; lon: string }[];
    const first = rows[0];
    if (!first) {
      cache.set(query, 'no-match');
      return 'no-match';
    }
    const result: GeocodeResult = { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
    if (Number.isNaN(result.lat) || Number.isNaN(result.lng)) {
      cache.set(query, 'no-match');
      return 'no-match';
    }
    cache.set(query, result);
    return result;
  } catch {
    cache.set(query, 'error');
    return 'error';
  }
}

export const isCoords = (r: GeocodeResult | GeocodeFailure | undefined): r is GeocodeResult => !!r && typeof r === 'object';

export interface GeocodeProgress {
  done: number;
  total: number;
}

/**
 * Geocodes every property in `properties` missing lat/lng. Each resolved
 * location is written into the store immediately via setCoordinates rather
 * than waiting for the whole batch, so pins can appear on the map as they
 * come in. `onProgress` fires after every attempt, success or not. Pacing is
 * handled entirely by geocodeProperty's shared throttle, so this just awaits
 * each call in turn.
 */
export async function geocodeMissing(properties: Property[], onProgress?: (p: GeocodeProgress) => void): Promise<void> {
  const targets = properties.filter((p) => p.address.lat === undefined || p.address.lng === undefined);
  const total = targets.length;
  let done = 0;
  onProgress?.({ done, total });

  for (const p of targets) {
    const result = await geocodeProperty(p);
    if (isCoords(result)) useDentimap.getState().setCoordinates(p.id, result.lat, result.lng);
    done += 1;
    onProgress?.({ done, total });
  }
}
