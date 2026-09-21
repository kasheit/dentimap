import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useDentimap } from '@/lib/store';
import { FacilityDossier } from '@/components/FacilityDossier';
import { byType, LocationsTable } from '@/components/LocationsTable';

export function PropertiesView() {
  const { properties, selectedPropertyId, select } = useDentimap();
  const ordered = useMemo(() => [...properties].sort(byType), [properties]);
  const index = ordered.findIndex((p) => p.id === selectedPropertyId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedPropertyId]);

  if (index === -1) return <LocationsTable />;

  const selected = ordered[index];
  const step = (d: number) => select(ordered[(index + d + ordered.length) % ordered.length].id);

  return (
    <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
      <nav className="mb-5 flex items-center justify-between gap-3">
        <button className="btn" onClick={() => select('')}>
          <ArrowLeft className="h-3.5 w-3.5" /> All locations
        </button>
        <div className="flex items-center gap-2 text-label text-dm-dim">
          <span className="tnum">{index + 1} of {ordered.length}</span>
          <button className="btn px-2" onClick={() => step(-1)} aria-label="Previous location">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="btn px-2" onClick={() => step(1)} aria-label="Next location">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </nav>
      <div key={selected.id}>
        <FacilityDossier property={selected} />
      </div>
    </main>
  );
}
