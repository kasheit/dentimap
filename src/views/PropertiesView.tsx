import { ArrowLeft } from 'lucide-react';
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

  return (
    <main className="mx-auto max-w-[1280px] p-4 sm:p-6 lg:px-8 lg:py-7">
      <nav className="mb-5">
        <button className="btn" onClick={() => select('')}>
          <ArrowLeft className="h-3.5 w-3.5" /> All locations
        </button>
      </nav>
      <div key={selected.id}>
        <FacilityDossier property={selected} />
      </div>
    </main>
  );
}
