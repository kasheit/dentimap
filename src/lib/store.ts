import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedData } from './seed';
import { supabase } from './supabase';
import type { DeedRecord, DentimapData, LegalEntity, Property } from './types';

export type TabId = 'properties' | 'matrix' | 'entities' | 'deeds';
export type SyncStatus = 'off' | 'connecting' | 'synced' | 'saving' | 'error';

interface State extends DentimapData {
  selectedPropertyId: string;
  lastDeleted: DeedRecord | null;
  tab: TabId;
  sync: SyncStatus;
  syncMessage?: string;
  setTab: (t: TabId) => void;
  select: (id: string) => void;
  openProperty: (id: string) => void;
  updateProperty: (id: string, patch: Partial<Property>) => void;
  addDeed: (d: DeedRecord) => void;
  deleteDeed: (id: string) => void;
  undoDelete: () => void;
  dismissUndo: () => void;
  updateEntity: (id: string, patch: Partial<LegalEntity>) => void;
  linkProperty: (entityId: string, propertyId: string) => void;
  unlinkProperty: (entityId: string, propertyId: string) => void;
  importData: (d: DentimapData) => void;
  reset: () => void;
}

export function isValidData(d: unknown): d is DentimapData {
  const x = d as DentimapData;
  return (
    !!x &&
    Array.isArray(x.properties) &&
    Array.isArray(x.deeds) &&
    Array.isArray(x.entities) &&
    x.properties.every((p) => p && typeof p.id === 'string' && typeof p.name === 'string' && p.address) &&
    x.deeds.every((e) => e && typeof e.id === 'string' && typeof e.propertyId === 'string') &&
    x.entities.every((e) => e && typeof e.id === 'string' && typeof e.name === 'string')
  );
}

const pick = (s: State): DentimapData => ({
  properties: s.properties,
  deeds: s.deeds,
  entities: s.entities,
});

export const useDentimap = create<State>()(
  persist(
    (set) => ({
      ...structuredClone(seedData),
      selectedPropertyId: seedData.properties[0].id,
      tab: 'properties',
      lastDeleted: null,
      sync: 'off',
      setTab: (tab) => set({ tab }),
      select: (selectedPropertyId) => set({ selectedPropertyId }),
      openProperty: (selectedPropertyId) => set({ selectedPropertyId, tab: 'properties' }),
      updateProperty: (id, patch) =>
        set((s) => ({ properties: s.properties.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      addDeed: (d) => set((s) => ({ deeds: [...s.deeds, d] })),
      deleteDeed: (id) =>
        set((s) => ({ lastDeleted: s.deeds.find((d) => d.id === id) ?? null, deeds: s.deeds.filter((d) => d.id !== id) })),
      undoDelete: () => set((s) => (s.lastDeleted ? { deeds: [...s.deeds, s.lastDeleted], lastDeleted: null } : {})),
      dismissUndo: () => set({ lastDeleted: null }),
      updateEntity: (id, patch) =>
        set((s) => ({ entities: s.entities.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      linkProperty: (entityId, propertyId) =>
        set((s) => {
          const ent = s.entities.find((e) => e.id === entityId);
          if (!ent) return {};
          const role =
            ent.entityType === 'landlord_holding' ? 'landlordEntityId' : ent.entityType === 'clinical_operator' ? 'operatingEntityId' : null;
          const prev = role ? s.properties.find((p) => p.id === propertyId)?.[role] : undefined;
          return {
            entities: s.entities.map((e) => {
              if (e.id === entityId)
                return e.associatedPropertyIds.includes(propertyId) ? e : { ...e, associatedPropertyIds: [...e.associatedPropertyIds, propertyId] };
              // a property has one landlord and one operator, so drop it from the entity it is replacing
              if (prev && e.id === prev) return { ...e, associatedPropertyIds: e.associatedPropertyIds.filter((x) => x !== propertyId) };
              return e;
            }),
            properties: role ? s.properties.map((p) => (p.id === propertyId ? { ...p, [role]: entityId } : p)) : s.properties,
          };
        }),
      unlinkProperty: (entityId, propertyId) =>
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === entityId ? { ...e, associatedPropertyIds: e.associatedPropertyIds.filter((x) => x !== propertyId) } : e,
          ),
          properties: s.properties.map((p) =>
            p.id === propertyId
              ? { ...p, landlordEntityId: p.landlordEntityId === entityId ? undefined : p.landlordEntityId, operatingEntityId: p.operatingEntityId === entityId ? undefined : p.operatingEntityId }
              : p,
          ),
        })),
      importData: (d) =>
        set({
          properties: d.properties,
          deeds: d.deeds,
          entities: d.entities,
          selectedPropertyId: d.properties[0]?.id ?? '',
        }),
      reset: () => set({ ...structuredClone(seedData), selectedPropertyId: seedData.properties[0].id }),
    }),
    {
      name: 'dentimap-v2',
      partialize: (s) => ({ ...pick(s), selectedPropertyId: s.selectedPropertyId }),
    },
  ),
);

const TABLE = 'dentimap_state';
const KEY = 'main';
let started = false;

async function pushRemote(data: DentimapData): Promise<string | null> {
  if (!supabase) return null;
  const { error } = await supabase
    .from(TABLE)
    .upsert({ key: KEY, data, updated_at: new Date().toISOString() });
  return error ? error.message : null;
}

/**
 * Supabase is the source of truth once the owner is signed in: pull the stored
 * registry (or seed it from local state on first run), then push every edit,
 * debounced. localStorage stays as the offline cache.
 */
export async function startSync() {
  if (started) return;
  started = true;
  const set = useDentimap.setState;
  if (!supabase) return;

  set({ sync: 'connecting', syncMessage: undefined });
  const { data, error } = await supabase.from(TABLE).select('data').eq('key', KEY).maybeSingle();
  if (error) {
    set({
      sync: 'error',
      syncMessage: /relation|does not exist|schema cache/i.test(error.message)
        ? 'Table missing — run supabase/dentimap-v2.sql in the Supabase SQL editor.'
        : error.message,
    });
    return;
  }
  if (data && isValidData(data.data)) {
    const d = data.data;
    const sel = useDentimap.getState().selectedPropertyId;
    set({
      ...d,
      selectedPropertyId: d.properties.some((p) => p.id === sel) ? sel : (d.properties[0]?.id ?? ''),
    });
  } else {
    const err = await pushRemote(pick(useDentimap.getState()));
    if (err) {
      set({ sync: 'error', syncMessage: err });
      return;
    }
  }
  set({ sync: 'synced', syncMessage: undefined });

  let timer: ReturnType<typeof setTimeout> | undefined;
  useDentimap.subscribe((s, prev) => {
    if (s.properties === prev.properties && s.deeds === prev.deeds && s.entities === prev.entities) return;
    set({ sync: 'saving' });
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const err = await pushRemote(pick(useDentimap.getState()));
      set(err ? { sync: 'error', syncMessage: err } : { sync: 'synced', syncMessage: undefined });
    }, 700);
  });
}

export const sortedDeeds = (deeds: DeedRecord[]) =>
  [...deeds].sort((a, b) => a.recordingDate.localeCompare(b.recordingDate));

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export interface ChainBreak {
  deedId: string;
  expected: string;
  found: string;
}

// A plat has no conveyance parties, so continuity is checked only between conveyances.
export function chainBreaks(chain: DeedRecord[]): ChainBreak[] {
  const conv = chain.filter((d) => d.deedType !== 'subdivision_plat');
  const out: ChainBreak[] = [];
  for (let i = 1; i < conv.length; i++) {
    if (norm(conv[i - 1].grantee) !== norm(conv[i].grantor)) {
      out.push({ deedId: conv[i].id, expected: conv[i - 1].grantee, found: conv[i].grantor });
    }
  }
  return out;
}
