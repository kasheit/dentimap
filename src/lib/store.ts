import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase';
import type { ActivityEntry, DeedRecord, DentimapData, LegalEntity, Person, Property } from './types';

export type TabId = 'properties' | 'entities' | 'people' | 'deeds';
export type SyncStatus = 'off' | 'connecting' | 'synced' | 'saving' | 'error' | 'conflict';

interface State {
  properties: Property[];
  deeds: DeedRecord[];
  entities: LegalEntity[];
  activity: ActivityEntry[];
  people: Person[];
  selectedPersonId: string;
  selectedPropertyId: string;
  lastDeleted: DeedRecord | null;
  tab: TabId;
  sync: SyncStatus;
  syncMessage?: string;
  setTab: (t: TabId) => void;
  select: (id: string) => void;
  openPerson: (id: string) => void;
  selectPerson: (id: string) => void;
  addPerson: (p: Person) => void;
  addPeople: (p: Person[]) => void;
  updatePerson: (id: string, patch: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  openProperty: (id: string) => void;
  addProperty: (p: Property) => void;
  updateProperty: (id: string, patch: Partial<Property>, logText?: string) => void;
  deleteProperty: (id: string) => void;
  addDeed: (d: DeedRecord) => void;
  updateDeed: (id: string, d: DeedRecord) => void;
  deleteDeed: (id: string) => void;
  undoDelete: () => void;
  dismissUndo: () => void;
  addEntity: (e: LegalEntity) => void;
  updateEntity: (id: string, patch: Partial<LegalEntity>) => void;
  deleteEntity: (id: string) => void;
  linkProperty: (entityId: string, propertyId: string) => void;
  unlinkProperty: (entityId: string, propertyId: string) => void;
  importData: (d: DentimapData) => { added: number; updated: number };
  resolveConflict: (choice: 'remote' | 'mine') => Promise<void>;
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
    x.entities.every((e) => e && typeof e.id === 'string' && typeof e.name === 'string') &&
    (x.people === undefined || (Array.isArray(x.people) && x.people.every((e) => e && typeof e.id === 'string' && typeof e.name === 'string')))
  );
}

const currentStatus = (p: Property): Property => (p.status === 'closed' ? p : { ...p, status: 'active' });

const pick = (s: State): DentimapData => ({
  properties: s.properties,
  deeds: s.deeds,
  entities: s.entities,
  activity: s.activity,
  people: s.people,
});

const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

const logged = (activity: ActivityEntry[], text: string, propertyId?: string): ActivityEntry[] =>
  [...activity, { id: uid('act'), at: new Date().toISOString(), text, propertyId }].slice(-300);

const nameOf = (s: State, id: string) => s.properties.find((p) => p.id === id)?.name ?? id;

export const useDentimap = create<State>()(
  persist(
    (set, get) => ({
      properties: [],
      deeds: [],
      entities: [],
      activity: [],
      people: [],
      selectedPersonId: '',
      selectedPropertyId: '',
      tab: 'properties',
      lastDeleted: null,
      sync: 'off',
      setTab: (tab) => set({ tab }),
      select: (selectedPropertyId) => set({ selectedPropertyId }),
      openPerson: (selectedPersonId) => set({ selectedPersonId, tab: 'people' }),
      selectPerson: (selectedPersonId) => set({ selectedPersonId }),
      addPerson: (p) => set((s) => ({ people: [...s.people, p], selectedPersonId: p.id, tab: 'people', activity: logged(s.activity, `Person added: ${p.name}`) })),
      addPeople: (list) =>
        set((s) => ({
          people: [...s.people, ...list],
          selectedPersonId: s.selectedPersonId || list[0]?.id || '',
          activity: logged(s.activity, `Added ${list.length} ${list.length === 1 ? 'person' : 'people'}`),
        })),
      updatePerson: (id, patch) => set((s) => ({ people: s.people.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deletePerson: (id) =>
        set((s) => {
          const rest = s.people.filter((x) => x.id !== id);
          return {
            people: rest,
            selectedPersonId: s.selectedPersonId === id ? (rest[0]?.id ?? '') : s.selectedPersonId,
            activity: logged(s.activity, `Person deleted: ${s.people.find((x) => x.id === id)?.name ?? id}`),
          };
        }),
      openProperty: (selectedPropertyId) => set({ selectedPropertyId, tab: 'properties' }),

      addProperty: (p) =>
        set((s) => ({ properties: [...s.properties, p], selectedPropertyId: p.id, tab: 'properties', activity: logged(s.activity, 'Location created', p.id) })),
      updateProperty: (id, patch, logText) =>
        set((s) => ({
          properties: s.properties.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          activity: logText ? logged(s.activity, logText, id) : s.activity,
        })),
      deleteProperty: (id) =>
        set((s) => {
          const rest = s.properties.filter((p) => p.id !== id);
          return {
            properties: rest,
            deeds: s.deeds.filter((d) => d.propertyId !== id),
            entities: s.entities.map((e) => ({ ...e, associatedPropertyIds: e.associatedPropertyIds.filter((x) => x !== id) })),
            people: s.people.map((x) => ({ ...x, propertyIds: x.propertyIds.filter((y) => y !== id), actions: x.actions.map((a) => (a.propertyId === id ? { ...a, propertyId: undefined } : a)) })),
            selectedPropertyId: s.selectedPropertyId === id ? '' : s.selectedPropertyId,
            activity: logged(s.activity, `Location deleted: ${nameOf(s, id)}`),
          };
        }),

      addDeed: (d) =>
        set((s) => ({ deeds: [...s.deeds, d], activity: logged(s.activity, `Deed added (${d.recordingDate}, ${d.grantor} → ${d.grantee})`, d.propertyId) })),
      updateDeed: (id, d) =>
        set((s) => ({ deeds: s.deeds.map((x) => (x.id === id ? d : x)), activity: logged(s.activity, `Deed edited (${d.recordingDate})`, d.propertyId) })),
      deleteDeed: (id) =>
        set((s) => {
          const d = s.deeds.find((x) => x.id === id);
          return {
            lastDeleted: d ?? null,
            deeds: s.deeds.filter((x) => x.id !== id),
            activity: d ? logged(s.activity, `Deed removed (${d.recordingDate})`, d.propertyId) : s.activity,
          };
        }),
      undoDelete: () =>
        set((s) =>
          s.lastDeleted
            ? { deeds: [...s.deeds, s.lastDeleted], lastDeleted: null, activity: logged(s.activity, `Deed restored (${s.lastDeleted.recordingDate})`, s.lastDeleted.propertyId) }
            : {},
        ),
      dismissUndo: () => set({ lastDeleted: null }),

      addEntity: (e) => set((s) => ({ entities: [...s.entities, e], activity: logged(s.activity, `Entity created: ${e.name}`) })),
      updateEntity: (id, patch) => set((s) => ({ entities: s.entities.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      deleteEntity: (id) =>
        set((s) => ({
          entities: s.entities.filter((e) => e.id !== id),
          people: s.people.map((x) => ({ ...x, entityIds: x.entityIds.filter((y) => y !== id) })),
          activity: logged(s.activity, `Entity deleted: ${s.entities.find((e) => e.id === id)?.name ?? id}`),
        })),
      linkProperty: (entityId, propertyId) =>
        set((s) => {
          const ent = s.entities.find((e) => e.id === entityId);
          if (!ent) return {};
          return {
            entities: s.entities.map((e) => (e.id === entityId && !e.associatedPropertyIds.includes(propertyId) ? { ...e, associatedPropertyIds: [...e.associatedPropertyIds, propertyId] } : e)),
            activity: logged(s.activity, `Linked to ${ent.name}`, propertyId),
          };
        }),
      unlinkProperty: (entityId, propertyId) =>
        set((s) => ({
          entities: s.entities.map((e) => (e.id === entityId ? { ...e, associatedPropertyIds: e.associatedPropertyIds.filter((x) => x !== propertyId) } : e)),
          activity: logged(s.activity, `Unlinked from ${s.entities.find((e) => e.id === entityId)?.name ?? entityId}`, propertyId),
        })),

      // Merge by id: records in the file win over matching records here; nothing else is removed.
      importData: (d) => {
        let added = 0;
        let updated = 0;
        const merge = <T extends { id: string }>(cur: T[], inc: T[]) => {
          const map = new Map(cur.map((x) => [x.id, x]));
          for (const x of inc) {
            if (map.has(x.id)) updated++;
            else added++;
            map.set(x.id, x);
          }
          return [...map.values()];
        };
        set((s) => {
          const properties = merge(s.properties, d.properties.map(currentStatus));
          return {
            properties,
            deeds: merge(s.deeds, d.deeds),
            entities: merge(s.entities, d.entities),
            people: merge(s.people, d.people ?? []),
            selectedPropertyId: properties.some((p) => p.id === s.selectedPropertyId) ? s.selectedPropertyId : '',
            activity: logged(s.activity, `Imported file: ${added} new, ${updated} updated`),
          };
        });
        return { added, updated };
      },

      resolveConflict: async (choice) => {
        if (choice === 'remote') {
          const err = await pull();
          useDentimap.setState(err ? { sync: 'error', syncMessage: err } : { sync: 'synced', syncMessage: undefined });
        } else {
          const res = await pushRemote(pick(get()), true);
          useDentimap.setState(res === 'ok' ? { sync: 'synced', syncMessage: undefined } : { sync: 'error', syncMessage: res });
        }
      },
    }),
    {
      name: 'dentimap-v2',
      partialize: (s) => pick(s),
      merge: (saved, cur) => {
        const data = saved as Partial<DentimapData> | undefined;
        return { ...cur, ...data, properties: (data?.properties ?? cur.properties).map(currentStatus) };
      },
    },
  ),
);

const TABLE = 'dentimap_state';
const KEY = 'main';
let started = false;
let applyingRemote = false;
// updated_at of the remote row as last seen; null means no row exists yet.
let remoteVersion: string | null = null;

const friendly = (m: string) => {
  console.warn('[dentimap sync]', m);
  return /relation|does not exist|schema cache/i.test(m) ? 'Cloud sync is not set up. Changes are saved in this browser.' : m;
};

async function pushRemote(data: DentimapData, force = false): Promise<'ok' | 'conflict' | string> {
  if (!supabase) return 'ok';
  const now = new Date().toISOString();
  if (remoteVersion === null) {
    const { data: row, error } = await supabase.from(TABLE).insert({ key: KEY, data, updated_at: now }).select('updated_at').single();
    if (error) return error.code === '23505' ? 'conflict' : friendly(error.message);
    remoteVersion = row.updated_at;
    return 'ok';
  }
  let q = supabase.from(TABLE).update({ data, updated_at: now }).eq('key', KEY);
  if (!force) q = q.eq('updated_at', remoteVersion);
  const { data: rows, error } = await q.select('updated_at');
  if (error) return friendly(error.message);
  if (!rows?.length) return 'conflict';
  remoteVersion = rows[0].updated_at;
  return 'ok';
}

async function pull(): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from(TABLE).select('data, updated_at').eq('key', KEY).maybeSingle();
  if (error) return friendly(error.message);
  if (data && isValidData(data.data)) {
    const d = data.data;
    remoteVersion = data.updated_at;
    const sel = useDentimap.getState().selectedPropertyId;
    applyingRemote = true;
    useDentimap.setState({
      properties: d.properties.map(currentStatus),
      deeds: d.deeds,
      entities: d.entities,
      activity: d.activity ?? [],
      people: d.people ?? [],
      selectedPropertyId: d.properties.some((p) => p.id === sel) ? sel : '',
    });
    applyingRemote = false;
  } else {
    remoteVersion = null;
  }
  return null;
}

/**
 * Supabase is the source of truth once the owner is signed in. Edits are pushed
 * debounced, and only if the remote row is still the version we last saw, so a
 * change made on another device is never silently overwritten.
 */
export async function startSync() {
  if (started) return;
  started = true;
  const set = useDentimap.setState;
  if (!supabase) return;

  set({ sync: 'connecting', syncMessage: undefined });
  const err = await pull();
  if (err) {
    set({ sync: 'error', syncMessage: err });
    return;
  }
  // First run from a browser that already holds data (e.g. a JSON import): create the remote row.
  if (remoteVersion === null && useDentimap.getState().properties.length > 0) {
    const res = await pushRemote(pick(useDentimap.getState()));
    if (res !== 'ok') {
      set(res === 'conflict' ? { sync: 'conflict', syncMessage: 'The registry changed elsewhere.' } : { sync: 'error', syncMessage: res });
      return;
    }
  }
  set({ sync: 'synced', syncMessage: undefined });

  let timer: ReturnType<typeof setTimeout> | undefined;
  useDentimap.subscribe((s, prev) => {
    if (applyingRemote || s.sync === 'conflict') return;
    if (s.properties === prev.properties && s.deeds === prev.deeds && s.entities === prev.entities && s.activity === prev.activity && s.people === prev.people) return;
    set({ sync: 'saving' });
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (useDentimap.getState().sync === 'conflict') return;
      const res = await pushRemote(pick(useDentimap.getState()));
      if (res === 'ok') set({ sync: 'synced', syncMessage: undefined });
      else if (res === 'conflict') set({ sync: 'conflict', syncMessage: 'This registry was changed somewhere else.' });
      else set({ sync: 'error', syncMessage: res });
    }, 700);
  });
}

export const sortedDeeds = (deeds: DeedRecord[]) => [...deeds].sort((a, b) => a.recordingDate.localeCompare(b.recordingDate));

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

export const newId = uid;
