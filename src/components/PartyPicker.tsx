import { useEffect, useRef, useState } from 'react';
import { newId, useDentimap } from '@/lib/store';

export interface PartyValue {
  name: string;
  entityId?: string;
  personId?: string;
}

/**
 * A grantor/grantee text field that can be matched to a real Entity or Person record.
 * Typing free text still works — it only links when a suggestion (or a new record) is picked.
 */
export function PartyPicker({ label, value, onChange }: { label: string; value: PartyValue; onChange: (v: PartyValue) => void }) {
  const entities = useDentimap((s) => s.entities);
  const people = useDentimap((s) => s.people);
  const addEntity = useDentimap((s) => s.addEntity);
  const addPersonQuiet = useDentimap((s) => s.addPersonQuiet);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const needle = value.name.trim().toLowerCase();
  const matches = needle
    ? [
        ...entities.filter((e) => e.name.toLowerCase().includes(needle)).map((e) => ({ kind: 'entity' as const, id: e.id, name: e.name })),
        ...people.filter((p) => p.name.toLowerCase().includes(needle)).map((p) => ({ kind: 'person' as const, id: p.id, name: p.name })),
      ].slice(0, 6)
    : [];
  const exactMatch = matches.some((m) => m.name.toLowerCase() === needle);
  const linkedTo = value.entityId ? entities.find((e) => e.id === value.entityId) : value.personId ? people.find((p) => p.id === value.personId) : undefined;

  const pick = (m: { kind: 'entity' | 'person'; id: string; name: string }) => {
    onChange({ name: m.name, entityId: m.kind === 'entity' ? m.id : undefined, personId: m.kind === 'person' ? m.id : undefined });
    setOpen(false);
  };

  const createEntity = () => {
    const name = value.name.trim();
    const id = newId('entity');
    addEntity({ id, name, entityType: 'landlord_holding', jurisdiction: 'North Carolina', associatedPropertyIds: [] });
    onChange({ name, entityId: id, personId: undefined });
    setOpen(false);
  };

  const createPerson = () => {
    const name = value.name.trim();
    const id = newId('person');
    addPersonQuiet({ id, name, roles: [], status: 'active', entityIds: [], propertyIds: [], actions: [] });
    onChange({ name, entityId: undefined, personId: id });
    setOpen(false);
  };

  return (
    <div className="relative space-y-1" ref={boxRef}>
      <div className="flex items-center justify-between gap-2">
        <span className="label">{label}</span>
        {linkedTo && (
          <span className="inline-flex items-center gap-1 text-label text-dm-green">
            Linked to {value.entityId ? 'entity' : 'person'}
            <button type="button" className="text-dm-dim transition-colors hover:text-dm-red" onClick={() => onChange({ name: value.name })} aria-label="Unlink">
              ✕
            </button>
          </span>
        )}
      </div>
      <input
        className="field"
        value={value.name}
        onFocus={() => setOpen(true)}
        onChange={(e) => onChange({ name: e.target.value })}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {open && needle && (matches.length > 0 || !exactMatch) && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-dm-border bg-dm-surface shadow-lg shadow-black/40">
          {matches.map((m) => (
            <button
              key={`${m.kind}-${m.id}`}
              type="button"
              className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-dm-hover"
              onClick={() => pick(m)}
            >
              <span className="truncate">{m.name}</span>
              <span className="shrink-0 text-label text-dm-dim">{m.kind === 'entity' ? 'Entity' : 'Person'}</span>
            </button>
          ))}
          {!exactMatch && (
            <>
              <button type="button" className="block w-full px-3 py-1.5 text-left text-label text-dm-blue transition-colors hover:bg-dm-hover" onClick={createEntity}>
                + Create entity "{value.name.trim()}"
              </button>
              <button type="button" className="block w-full px-3 py-1.5 text-left text-label text-dm-blue transition-colors hover:bg-dm-hover" onClick={createPerson}>
                + Create person "{value.name.trim()}"
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
