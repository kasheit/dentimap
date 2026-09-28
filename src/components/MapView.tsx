import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { EmptyState } from '@/components/Page';
import { compactUsd } from '@/lib/format';
import { geocodeMissing, geocodeProperty } from '@/lib/geocode';
import { useDentimap } from '@/lib/store';
import type { Property } from '@/lib/types';

// Leaflet's default marker images resolve relative to the page and 404 under a
// bundler; every marker here uses a custom divIcon, but this keeps L.Marker's
// own defaults (used internally, e.g. by the attribution control) from
// requesting missing images.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;

export type LocState = 'confirmed' | 'unconfirmed' | 'missing';

/** Same three-state system as LocationsTable's stateMeta, styled for a map pin. */
export interface MapRow {
  p: Property;
  owner?: string;
  assessed?: number;
  state: LocState;
}

const pinColor: Record<LocState, string> = {
  confirmed: 'bg-dm-green',
  unconfirmed: 'bg-dm-amber',
  missing: 'bg-dm-dim',
};

const pinLabel: Record<LocState, string> = {
  confirmed: 'Owner and value verified',
  unconfirmed: 'Owner or value unverified',
  missing: 'Owner or value not found',
};

function pinIcon(state: LocState) {
  return L.divIcon({
    html: `<span class="block h-4 w-4 rounded-full border-2 border-white shadow-card ${pinColor[state]}"></span>`,
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
}

const placed = (r: MapRow) => r.p.address.lat !== undefined && r.p.address.lng !== undefined;

/** Pans/fits the map to the given locations whenever the placed set changes. */
function FitBounds({ rows }: { rows: MapRow[] }) {
  const map = useMap();
  const key = rows.map((r) => r.p.id).join(',');
  useEffect(() => {
    const pts = rows.filter(placed);
    if (!pts.length) return;
    if (pts.length === 1) {
      map.setView([pts[0].p.address.lat!, pts[0].p.address.lng!], 13);
    } else {
      const bounds = L.latLngBounds(pts.map((r) => [r.p.address.lat!, r.p.address.lng!] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

const NC_CENTER: [number, number] = [35.5, -79.1];

/**
 * The map mode of the Locations page. `rows` is the already search/filter-
 * filtered set (pins shown + bounds); `allRows` is every location, used only
 * to list what still needs geocoding regardless of the current filter.
 */
export function MapView({ rows, allRows }: { rows: MapRow[]; allRows: MapRow[] }) {
  const openProperty = useDentimap((s) => s.openProperty);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [locating, setLocating] = useState<Set<string>>(new Set());
  const [unplacedOpen, setUnplacedOpen] = useState(false);
  const started = useRef(false);

  // Geocode everything missing coordinates once per mount (i.e. once per time the map is opened), in the background, throttled to 1/sec.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const missing = allRows.map((r) => r.p).filter((p) => p.address.lat === undefined || p.address.lng === undefined);
    if (!missing.length) return;
    void geocodeMissing(missing, (p) => setProgress(p.done < p.total ? p : null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placedRows = rows.filter(placed);
  const unplaced = allRows.filter((r) => !placed(r));

  const locateOne = async (p: Property) => {
    setLocating((s) => new Set(s).add(p.id));
    const result = await geocodeProperty(p);
    if (result) useDentimap.getState().setCoordinates(p.id, result.lat, result.lng);
    setLocating((s) => {
      const n = new Set(s);
      n.delete(p.id);
      return n;
    });
  };

  const nothingPlacedYet = allRows.length > 0 && placedRows.length === 0 && !progress;

  return (
    <div>
      <h2 className="sr-only">Map of locations</h2>

      {progress && (
        <p role="status" className="tnum mb-2 text-label text-dm-muted">
          Locating {progress.done} of {progress.total}…
        </p>
      )}

      {allRows.length === 0 ? (
        <EmptyState title="No locations yet" hint="Add a location to place it on the map." />
      ) : nothingPlacedYet ? (
        <EmptyState title="Nothing placed on the map yet" hint="Locations need an address before they can be geocoded. Add addresses, then reopen Map." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-dm-border bg-dm-surface shadow-card" style={{ height: 560 }}>
          <MapContainer center={NC_CENTER} zoom={7} scrollWheelZoom style={{ height: '100%', width: '100%' }} attributionControl>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <FitBounds rows={placedRows.length ? placedRows : rows} />
            {placedRows.map((r) => (
              <Marker key={r.p.id} position={[r.p.address.lat!, r.p.address.lng!]} icon={pinIcon(r.state)} alt={`${r.p.name}, ${pinLabel[r.state]}`}>
                <Popup>
                  <div className="min-w-[12rem]">
                    <p className="text-title font-semibold">{r.p.name}</p>
                    <p className={`mt-1 text-label ${r.owner ? 'text-dm-text' : 'text-dm-dim'}`}>{r.owner ?? 'No owner on file'}</p>
                    <p className="tnum text-label text-dm-muted">{r.assessed !== undefined ? compactUsd(r.assessed) : '—'}</p>
                    <button className="btn btn-primary mt-2 w-full justify-center" onClick={() => openProperty(r.p.id)}>
                      View location
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {unplaced.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-lg border border-dm-border bg-dm-surface">
          <button
            type="button"
            aria-expanded={unplacedOpen}
            onClick={() => setUnplacedOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-label font-medium text-dm-muted transition-colors hover:bg-dm-hover hover:text-dm-text"
          >
            Not placed on the map yet ({unplaced.length})
            <span aria-hidden>{unplacedOpen ? '−' : '+'}</span>
          </button>
          {unplacedOpen && (
            <ul className="divide-y divide-dm-border/60 border-t border-dm-border">
              {unplaced.map((r) => (
                <li key={r.p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-label">
                  <span className="min-w-0 flex-1 truncate font-medium text-dm-text">{r.p.name}</span>
                  <span className="min-w-0 flex-1 truncate text-dm-dim">
                    {[r.p.address.street, r.p.address.city].filter(Boolean).join(', ') || 'No address on file'}
                  </span>
                  <button className="btn" disabled={locating.has(r.p.id)} onClick={() => locateOne(r.p)}>
                    {locating.has(r.p.id) ? 'Locating…' : 'Locate'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
