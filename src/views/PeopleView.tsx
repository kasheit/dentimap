import { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { LevelLabel } from '@/components/Chips';
import { buildAgentDirectory, agentKey } from '@/lib/agents';
import { fmtDate, personRoleLabel } from '@/lib/format';
import { newId, useDentimap } from '@/lib/store';
import type { Person, PersonAction, PersonRole, VerificationState } from '@/lib/types';

const ROLES = Object.keys(personRoleLabel) as PersonRole[];
const today = () => new Date().toISOString().slice(0, 10);

const roleText = (p: Person) => p.roles.map((r) => personRoleLabel[r]).join(' · ') || 'No role set';

function ActionForm({ person }: { person: Person }) {
  const { properties, updatePerson } = useDentimap();
  const [open, setOpen] = useState(false);
  const [d, setD] = useState({ date: today(), text: '', propertyId: '', source: '', state: 'unverified' as VerificationState });

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        Add entry
      </button>
    );
  }

  const save = () => {
    const text = d.text.trim();
    if (!text || !d.date) return;
    const entry: PersonAction = {
      id: newId('act'),
      date: d.date,
      text,
      propertyId: d.propertyId || undefined,
      source: d.source.trim() || undefined,
      state: d.state,
    };
    updatePerson(person.id, {
      actions: [...person.actions, entry],
      propertyIds: entry.propertyId && !person.propertyIds.includes(entry.propertyId) ? [...person.propertyIds, entry.propertyId] : person.propertyIds,
    });
    setD({ date: today(), text: '', propertyId: '', source: '', state: 'unverified' });
    setOpen(false);
  };

  return (
    <div className="space-y-3 rounded-lg border border-dm-border p-4">
      <div className="grid gap-3 sm:grid-cols-[9rem_1fr]">
        <label className="space-y-1">
          <span className="label">Date</span>
          <input type="date" className="field" value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} />
        </label>
        <label className="space-y-1">
          <span className="label">What they did</span>
          <input className="field" value={d.text} onChange={(e) => setD({ ...d, text: e.target.value })} autoFocus />
        </label>
        <label className="space-y-1">
          <span className="label">Location (optional)</span>
          <select className="field" value={d.propertyId} onChange={(e) => setD({ ...d, propertyId: e.target.value })}>
            <option value="">None</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
          <label className="space-y-1">
            <span className="label">Source</span>
            <input className="field" placeholder="e.g. Wake Co. deed book 14209" value={d.source} onChange={(e) => setD({ ...d, source: e.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="label">Confirmed?</span>
            <select className="field" value={d.state} onChange={(e) => setD({ ...d, state: e.target.value as VerificationState })}>
              <option value="unverified">Unconfirmed</option>
              <option value="verified">Confirmed</option>
            </select>
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn btn-primary" disabled={!d.text.trim() || !d.date} onClick={save}>Save entry</button>
      </div>
    </div>
  );
}

function LinkList({
  title,
  items,
  options,
  onAdd,
  onRemove,
  onOpen,
}: {
  title: string;
  items: { id: string; label: string }[];
  options: { id: string; label: string }[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onOpen?: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-[13px] font-semibold">{title}</div>
      {items.length ? (
        <ul className="space-y-0.5">
          {items.map((i) => (
            <li key={i.id} className="group flex items-center gap-1 rounded-md hover:bg-dm-hover">
              <button onClick={() => onOpen?.(i.id)} className="min-w-0 flex-1 truncate px-3 py-1.5 text-left text-sm">
                {i.label}
              </button>
              <button
                onClick={() => onRemove(i.id)}
                className="rounded p-1.5 text-dm-muted transition hover:text-dm-red group-hover:opacity-100"
                aria-label={`Remove ${i.label}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-dm-dim">None</p>
      )}
      {options.length > 0 && (
        <select className="field mt-2" value="" onChange={(e) => e.target.value && onAdd(e.target.value)} aria-label={`Add to ${title}`}>
          <option value="">+ Add…</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      )}
    </div>
  );
}

function Profile({ person }: { person: Person }) {
  const { entities, properties, updatePerson, deletePerson, openProperty, setTab } = useDentimap();
  const [editing, setEditing] = useState(person.name === 'New person');
  const [d, setD] = useState({ name: person.name, title: person.title ?? '', relevance: person.relevance ?? '', status: person.status, roles: person.roles });
  const [notes, setNotes] = useState(person.notes ?? '');

  const actions = useMemo(() => [...person.actions].sort((a, b) => b.date.localeCompare(a.date)), [person.actions]);
  const propName = (id?: string) => properties.find((p) => p.id === id)?.name;

  const toggleRole = (r: PersonRole) => setD((x) => ({ ...x, roles: x.roles.includes(r) ? x.roles.filter((y) => y !== r) : [...x.roles, r] }));

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      {editing ? (
        <div className="space-y-4">
          <label className="block space-y-1">
            <span className="label">Name</span>
            <input className="field" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} autoFocus />
          </label>
          <div>
            <span className="label mb-1.5 block">Roles</span>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {ROLES.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-dm-blue" checked={d.roles.includes(r)} onChange={() => toggleRole(r)} />
                  {personRoleLabel[r]}
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="label">Title</span>
              <input className="field" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
            </label>
            <label className="block space-y-1">
              <span className="label">Status</span>
              <select className="field" value={d.status} onChange={(e) => setD({ ...d, status: e.target.value as Person['status'] })}>
                <option value="active">Active</option>
                <option value="former">Former</option>
              </select>
            </label>
          </div>
          <label className="block space-y-1">
            <span className="label">Why they matter</span>
            <textarea className="field resize-y leading-relaxed" rows={3} value={d.relevance} onChange={(e) => setD({ ...d, relevance: e.target.value })} />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              className="btn text-dm-red hover:text-dm-red"
              onClick={() => {
                if (confirm(`Delete ${person.name}? Their entries are deleted with them.`)) deletePerson(person.id);
              }}
            >
              Delete person
            </button>
            <div className="flex gap-2">
              <button className="btn" onClick={() => setEditing(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={!d.name.trim()}
                onClick={() => {
                  updatePerson(person.id, { name: d.name.trim(), title: d.title.trim() || undefined, relevance: d.relevance.trim() || undefined, status: d.status, roles: d.roles });
                  setEditing(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : (
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[13px] text-dm-muted">
              {roleText(person)}
              {person.status === 'former' && <span className="text-dm-dim"> · Former</span>}
            </div>
            <h1 className="mt-1 text-[26px] font-semibold leading-tight">{person.name}</h1>
            {person.title && <p className="mt-1 text-[15px] text-dm-muted">{person.title}</p>}
            {person.relevance && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed">{person.relevance}</p>}
          </div>
          <button className="btn shrink-0" onClick={() => setEditing(true)}>Edit</button>
        </header>
      )}

      <section className="border-t border-dm-border pt-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[18px] font-semibold">What they did</h2>
          <span className="text-[13px] text-dm-dim">{actions.length}</span>
        </div>
        {actions.length === 0 ? (
          <p className="mb-4 text-[13px] text-dm-dim">No entries.</p>
        ) : (
          <ul className="mb-4 divide-y divide-dm-border/70">
            {actions.map((a) => (
              <li key={a.id} className="grid gap-x-4 gap-y-1 py-3 sm:grid-cols-[7rem_1fr_auto]">
                <span className="tnum text-[13px] text-dm-dim">{fmtDate(a.date)}</span>
                <div className="min-w-0">
                  <p className="text-[14px] leading-relaxed">{a.text}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[13px] text-dm-dim">
                    {propName(a.propertyId) && (
                      <button className="hover:text-dm-blue hover:underline" onClick={() => a.propertyId && openProperty(a.propertyId)}>
                        {propName(a.propertyId)}
                      </button>
                    )}
                    <LevelLabel level={a.state === 'verified' ? 'confirmed' : 'partial'} detail={a.source} />
                  </div>
                </div>
                <button
                  className="self-start rounded p-1.5 text-dm-muted transition-colors hover:text-dm-red"
                  aria-label="Delete entry"
                  onClick={() => updatePerson(person.id, { actions: person.actions.filter((x) => x.id !== a.id) })}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <ActionForm person={person} />
      </section>

      <section className="grid gap-8 border-t border-dm-border pt-5 sm:grid-cols-2">
        <LinkList
          title="Entities"
          items={entities.filter((e) => person.entityIds.includes(e.id)).map((e) => ({ id: e.id, label: e.name }))}
          options={entities.filter((e) => !person.entityIds.includes(e.id)).map((e) => ({ id: e.id, label: e.name }))}
          onAdd={(id) => updatePerson(person.id, { entityIds: [...person.entityIds, id] })}
          onRemove={(id) => updatePerson(person.id, { entityIds: person.entityIds.filter((x) => x !== id) })}
          onOpen={() => setTab('entities')}
        />
        <LinkList
          title="Locations"
          items={properties.filter((p) => person.propertyIds.includes(p.id)).map((p) => ({ id: p.id, label: p.name }))}
          options={properties.filter((p) => !person.propertyIds.includes(p.id)).map((p) => ({ id: p.id, label: p.name }))}
          onAdd={(id) => updatePerson(person.id, { propertyIds: [...person.propertyIds, id] })}
          onRemove={(id) => updatePerson(person.id, { propertyIds: person.propertyIds.filter((x) => x !== id) })}
          onOpen={openProperty}
        />
      </section>

      <section className="border-t border-dm-border pt-5">
        <h2 className="mb-3 text-[18px] font-semibold">Notes</h2>
        <textarea
          className="field scroll-thin resize-y leading-relaxed"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== (person.notes ?? '') && updatePerson(person.id, { notes: notes.trim() || undefined })}
        />
      </section>
    </div>
  );
}

export function PeopleView() {
  const { people, entities, selectedPersonId, selectPerson, addPerson, addPeople } = useDentimap();
  const [q, setQ] = useState('');
  const [role, setRole] = useState<'all' | PersonRole>('all');

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return people
      .filter((p) => (role === 'all' || p.roles.includes(role)) && (!needle || `${p.name} ${p.title ?? ''} ${p.relevance ?? ''}`.toLowerCase().includes(needle)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [people, q, role]);

  const selected = people.find((p) => p.id === selectedPersonId) ?? visible[0];

  // Registered agents already recorded on entities that are not people yet.
  const missingAgents = useMemo(() => {
    const known = new Set(people.map((p) => agentKey(p.name)));
    return buildAgentDirectory(entities).filter((a) => !known.has(agentKey(a.name)));
  }, [people, entities]);

  const importAgents = () =>
    addPeople(
      missingAgents.map((a) => ({
        id: newId('person'),
        name: a.name,
        roles: ['registered_agent'] as PersonRole[],
        status: 'active' as const,
        entityIds: a.entities.map((e) => e.id),
        propertyIds: [],
        actions: [],
      })),
    );

  const create = () =>
    addPerson({ id: newId('person'), name: 'New person', roles: [], status: 'active', entityIds: [], propertyIds: [], actions: [] });

  return (
    <div className="mx-auto flex min-h-[calc(100vh-97px)] max-w-[1680px] flex-col lg:min-h-[calc(100vh-53px)] lg:flex-row">
      <aside className="border-b border-dm-border lg:sticky lg:top-[53px] lg:h-[calc(100vh-53px)] lg:w-80 lg:shrink-0 lg:self-start lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="space-y-3 border-b border-dm-border p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dm-dim" />
              <input className="field pl-9" placeholder="Search people" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <button className="btn shrink-0 px-2.5" onClick={create} title="Add a person" aria-label="Add a person">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <select className="field text-[13px]" value={role} onChange={(e) => setRole(e.target.value as 'all' | PersonRole)} aria-label="Filter by role">
            <option value="all">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{personRoleLabel[r]}</option>
            ))}
          </select>
        </div>
        <ul className="p-3">
          {visible.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => selectPerson(p.id)}
                className={`block w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  selected?.id === p.id ? 'border-dm-blue/40 bg-dm-blue/[0.06]' : 'border-transparent hover:border-dm-border hover:bg-dm-hover'
                }`}
              >
                <div className="text-[13px] font-medium">{p.name}</div>
                <div className="mt-0.5 text-[13px] text-dm-dim">
                  {roleText(p)}
                  {p.status === 'former' && ' · Former'}
                </div>
              </button>
            </li>
          ))}
          {!visible.length && <li className="px-3 py-6 text-center text-sm text-dm-dim">{people.length ? 'No matches.' : 'No people yet.'}</li>}
        </ul>
        {missingAgents.length > 0 && (
          <div className="border-t border-dm-border p-4">
            <button className="btn w-full justify-center" onClick={importAgents}>
              Add {missingAgents.length} registered {missingAgents.length === 1 ? 'agent' : 'agents'} from entities
            </button>
          </div>
        )}
      </aside>
      <main key={selected?.id} className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        {selected ? (
          <Profile person={selected} />
        ) : (
          <div className="mx-auto max-w-md py-24 text-center">
            <h1 className="text-lg font-semibold">No people yet</h1>
            <p className="mt-2 text-sm text-dm-muted">Add a person with the + button.</p>
          </div>
        )}
      </main>
    </div>
  );
}
