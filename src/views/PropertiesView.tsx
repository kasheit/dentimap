import { useDentimap } from '@/lib/store';
import { FacilityDossier } from '@/components/FacilityDossier';
import { Sidebar } from '@/components/Sidebar';

export function PropertiesView() {
  const { properties, selectedPropertyId } = useDentimap();
  const selected = properties.find((p) => p.id === selectedPropertyId) ?? properties[0];

  return (
    <div className="mx-auto flex min-h-[calc(100vh-97px)] max-w-[1680px] flex-col lg:min-h-[calc(100vh-53px)] lg:flex-row">
      <div className="lg:sticky lg:top-[53px] lg:h-[calc(100vh-53px)] lg:self-start lg:overflow-hidden">
        <Sidebar />
      </div>
      <main key={selected?.id} className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        {selected ? (
          <FacilityDossier property={selected} />
        ) : (
          <p className="py-24 text-center text-sm text-dm-dim">No facilities in the registry. Import a JSON backup or reset to seed data from the Export menu.</p>
        )}
      </main>
    </div>
  );
}
