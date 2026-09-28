import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Maximize2, Minimize2 } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { EmptyState } from '@/components/Page';
import { compactUsd, facilityTypeLabel } from '@/lib/format';
import { geocodeMissing, geocodeProperty, isCoords } from '@/lib/geocode';
import type { GeocodeFailure } from '@/lib/geocode';
import { useDentimap } from '@/lib/store';
import type { FacilityType, Property } from '@/lib/types';

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
  ownerSource?: string;
  assessed?: number;
  assessedSure?: boolean;
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

/**
 * Pin color is verification state (unchanged); shape alone can't carry a third facility
 * type at 16-20px, so each type gets its own icon instead. Sourced from real icon
 * libraries already used in the app rather than hand-drawn: the tooth is Tabler's
 * "dental" icon (MIT, same 24x24/2px-stroke language as lucide) with its small top
 * decorative stroke dropped — it reads as noise at pin scale; syringe and stethoscope
 * are lucide's own, unmodified.
 */
const facilityIconPaths: Record<FacilityType, { d: string[]; circle?: [string, string, string] }> = {
  vfd_practice: {
    d: [
      'M12 5.5c-1.074 -.586 -2.583 -1.5 -4 -1.5c-2.1 0 -4 1.247 -4 5c0 4.899 1.056 8.41 2.671 10.537c.573 .756 1.97 .521 2.567 -.236c.398 -.505 .819 -1.439 1.262 -2.801c.292 -.771 .892 -1.504 1.5 -1.5c.602 0 1.21 .737 1.5 1.5c.443 1.362 .864 2.295 1.262 2.8c.597 .759 2 .993 2.567 .237c1.615 -2.127 2.671 -5.637 2.671 -10.537c0 -3.74 -1.908 -5 -4 -5c-1.423 0 -2.92 .911 -4 1.5',
    ],
  },
  valleygate_asc: {
    d: ['m18 2 4 4', 'm17 7 3-3', 'M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5', 'm9 11 4 4', 'm5 19-3 3', 'm14 4 6 6'],
  },
  affiliate: {
    d: ['M11 2v2', 'M5 2v2', 'M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1', 'M8 15a6 6 0 0 0 12 0v-3'],
    circle: ['20', '10', '2'],
  },
};

function facilityIconSvg(type: FacilityType, stroke: string, strokeWidth: number) {
  const icon = facilityIconPaths[type];
  const paths = icon.d.map((d) => `<path d="${d}"/>`).join('');
  const circle = icon.circle ? `<circle cx="${icon.circle[0]}" cy="${icon.circle[1]}" r="${icon.circle[2]}"/>` : '';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${paths}${circle}</svg>`;
}

function pinIcon(state: LocState, facilityType: FacilityType) {
  const glyph = facilityIconSvg(facilityType, 'white', 2.75);
  return L.divIcon({
    html: `<span class="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-card ${pinColor[state]}"><span class="h-[11px] w-[11px]">${glyph}</span></span>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  });
}

/** Monochrome, unfilled — same glyph as the map pins, but drawn only in ink-dim so it can't be misread as a fourth state color. */
function TypeGlyph({ type }: { type: FacilityType }) {
  return <span aria-hidden className="inline-block h-3 w-3 text-dm-dim" dangerouslySetInnerHTML={{ __html: facilityIconSvg(type, 'currentColor', 2) }} />;
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

/** Leaflet sizes itself from its container on mount and on window resize, but the browser Fullscreen API changes that container's size without firing a resize event, so this calls it explicitly on the transition. */
function InvalidateOnFullscreen({ fullscreen }: { fullscreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 60);
    return () => clearTimeout(t);
  }, [fullscreen, map]);
  return null;
}

// A public Mapbox token (pk.*) is meant to be embedded in client code — Mapbox's own
// docs put it directly in frontend JS, restricted by the account's own token settings
// rather than by keeping it secret. Falls back to plain OSM tiles if it's ever unset.
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

const legend: { state: LocState; label: string }[] = [
  { state: 'confirmed', label: 'Verified' },
  { state: 'unconfirmed', label: 'Unverified' },
  { state: 'missing', label: 'Not found' },
];

const typeLegend: { type: FacilityType; label: string }[] = [
  { type: 'vfd_practice', label: facilityTypeLabel.vfd_practice },
  { type: 'valleygate_asc', label: facilityTypeLabel.valleygate_asc },
  { type: 'affiliate', label: facilityTypeLabel.affiliate },
];

/**
 * The map mode of the Locations page. `rows` is the already search/filter-
 * filtered set (pins shown + bounds); `allRows` is every location, used only
 * to list what still needs geocoding regardless of the current filter.
 * `searchActive` tells the map a search narrowed the set, so a single match
 * should open its own popup rather than just being panned to.
 */
export function MapView({ rows, allRows, searchActive }: { rows: MapRow[]; allRows: MapRow[]; searchActive?: boolean }) {
  const openProperty = useDentimap((s) => s.openProperty);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [locating, setLocating] = useState<Set<string>>(new Set());
  const [failed, setFailed] = useState<Map<string, GeocodeFailure>>(new Map());
  const [unplacedOpen, setUnplacedOpen] = useState(false);
  const started = useRef(false);
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    // some embedding contexts (an iframe without fullscreen delegated, certain browser policies) reject this;
    // there's nothing useful to show the operator for a "nice to have" toggle failing, so just stay as-is
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else wrapperRef.current?.requestFullscreen().catch(() => {});
  };

  // Geocode everything missing coordinates once per mount (i.e. once per time the map is opened), in the background, throttled to 1/sec.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const missing = allRows.map((r) => r.p).filter((p) => p.address.lat === undefined || p.address.lng === undefined);
    if (!missing.length) return;
    // announcing every attempt would interrupt a screen reader ~once a second for the whole batch; report only every few and the final state
    let lastAnnounced = 0;
    void geocodeMissing(missing, (p) => {
      const finished = p.done >= p.total;
      if (finished || p.done - lastAnnounced >= 3) {
        lastAnnounced = p.done;
        setProgress(finished ? null : p);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placedRows = rows.filter(placed);
  const unplaced = allRows.filter((r) => !placed(r));

  // a search that narrows to exactly one placed location opens its popup, so typing an address "pulls it up"
  useEffect(() => {
    if (!searchActive || placedRows.length !== 1) return;
    const marker = markerRefs.current.get(placedRows[0].p.id);
    marker?.openPopup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchActive, placedRows.length === 1 ? placedRows[0]?.p.id : undefined]);

  const locateOne = async (p: Property) => {
    setLocating((s) => new Set(s).add(p.id));
    const result = await geocodeProperty(p);
    if (isCoords(result)) useDentimap.getState().setCoordinates(p.id, result.lat, result.lng);
    else if (result) setFailed((m) => new Map(m).set(p.id, result));
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
        <>
          <div
            ref={wrapperRef}
            className={`relative overflow-hidden border-dm-border bg-dm-surface shadow-card ${isFullscreen ? 'border-0 rounded-none' : 'rounded-lg border'}`}
            style={{ height: isFullscreen ? '100vh' : 560 }}
          >
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fill the screen with the map'}
              title={isFullscreen ? 'Exit fullscreen' : 'Fill the screen with the map'}
              className="absolute right-2 top-2 z-[1000] rounded-md border border-dm-border bg-dm-surface p-1.5 text-dm-muted shadow-card transition-colors hover:bg-dm-hover hover:text-dm-text"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}
            </button>
            <MapContainer center={NC_CENTER} zoom={7} scrollWheelZoom style={{ height: '100%', width: '100%' }} attributionControl>
              <InvalidateOnFullscreen fullscreen={isFullscreen} />
              {MAPBOX_TOKEN ? (
                <TileLayer
                  url={`https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
                  tileSize={512}
                  zoomOffset={-1}
                  attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
              ) : (
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
              )}
              <FitBounds rows={placedRows.length ? placedRows : rows} />
              {placedRows.map((r) => (
                <Marker
                  key={r.p.id}
                  position={[r.p.address.lat!, r.p.address.lng!]}
                  icon={pinIcon(r.state, r.p.facilityType)}
                  ref={(m) => {
                    if (m) markerRefs.current.set(r.p.id, m);
                    else markerRefs.current.delete(r.p.id);
                  }}
                  eventHandlers={{
                    add: (e) => {
                      const el = e.target.getElement();
                      if (!el) return;
                      el.setAttribute('role', 'button');
                      el.setAttribute('aria-label', `${r.p.name}, ${facilityTypeLabel[r.p.facilityType]}, ${pinLabel[r.state]}`);
                      el.removeAttribute('alt');
                    },
                  }}
                >
                  <Popup>
                    <div className="min-w-[12rem]">
                      <p className="text-title font-semibold">{r.p.name}</p>
                      <p className={`mt-1 text-label ${r.owner ? 'text-dm-text' : 'text-dm-dim'}`}>{r.owner ?? 'No owner on file'}</p>
                      <p className="text-label text-dm-muted">{r.owner ? r.ownerSource || 'No source' : ''}</p>
                      <p className="tnum text-label text-dm-muted">
                        {r.assessed !== undefined ? compactUsd(r.assessed) : '—'}
                        {r.assessed !== undefined && !r.assessedSure && <span className="text-dm-amber"> · unverified</span>}
                      </p>
                      <button className="btn btn-primary mt-2 w-full justify-center" onClick={() => openProperty(r.p.id)}>
                        View location
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-label text-dm-muted" aria-label="Pin colors, by verification state">
            {legend.map((l) => (
              <li key={l.state} className="flex items-center gap-1.5">
                <span aria-hidden className={`inline-block h-2.5 w-2.5 rounded-full border border-white shadow-card ${pinColor[l.state]}`} />
                {l.label}
              </li>
            ))}
          </ul>
          <ul className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-label text-dm-muted" aria-label="Pin icons, by facility type">
            {typeLegend.map((t) => (
              <li key={t.type} className="flex items-center gap-1.5">
                <TypeGlyph type={t.type} />
                {t.label}
              </li>
            ))}
          </ul>
        </>
      )}

      {unplaced.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-lg border border-dm-border bg-dm-surface">
          <button
            type="button"
            aria-expanded={unplacedOpen}
            onClick={() => setUnplacedOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-label font-medium text-dm-muted transition-colors hover:bg-dm-hover hover:text-dm-text"
          >
            No address to place ({unplaced.length})
            <span aria-hidden>{unplacedOpen ? '−' : '+'}</span>
          </button>
          {unplacedOpen && (
            <ul className="divide-y divide-dm-border/60 border-t border-dm-border">
              {unplaced.map((r) => {
                const fail = failed.get(r.p.id);
                return (
                  <li key={r.p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-label">
                    <span className="min-w-0 flex-1 truncate font-medium text-dm-text">{r.p.name}</span>
                    <span className="min-w-0 flex-1 truncate text-dm-dim">
                      {[r.p.address.street, r.p.address.city, r.p.address.county.replace(/ County$/, '')].filter(Boolean).join(', ') || 'No address on file'}
                    </span>
                    {fail && <span className="shrink-0 text-dm-amber">{fail === 'no-match' ? 'No match for this address' : "Couldn't reach the map service"}</span>}
                    <button className="btn" disabled={locating.has(r.p.id)} onClick={() => locateOne(r.p)}>
                      {locating.has(r.p.id) ? 'Locating…' : fail ? 'Try again' : 'Locate'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
