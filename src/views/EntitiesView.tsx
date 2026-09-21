import { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { entityTypeLabel, fmtDate, personRoleLabel } from '@/lib/format';
import { newId, useDentimap } from '@/lib/store';
import type { EntityType, LegalEntity } from '@/lib/types';

function EntityHeader({ e }: { e: LegalEntity }) {
  const { updateEntity, deleteEntity } = useDentimap();
  const [editing, setEditing] = useState(e.name === 'New entity');
  const [d, setD] = useState({
    name: e.name,
    dbaName: e.dbaName ?? '',
    entityType: e.entityType,
    jurisdiction: e.jurisdiction,
    sosId: e.sosId ?? '',
    formationDate: e.formationDate ?? '',
  });
  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => setD((x) => ({ ...x, [k]: v }));

  if (!editing) {
    return (
      <header className="flex items-start justify-between gap-3 border-b border-dm-border p-5">
        <div>
          <h2 className="text-title font-semibold leading-snug">{e.name}</h2>
          {e.dbaName && <div className="mt-0.5 text-label text-dm-muted">d/b/a {e.dbaName}</div>}
          <div className="mt-1 text-label text-dm-dim">{entityTypeLabel[e.entityType]} · {e.jurisdiction || 'Jurisdiction not set'}</div>
        </div>
        <button className="rounded p-1.5 text-dm-muted transition-colors hover:bg-dm-hover hover:text-dm-blue" onClick={() => setEditing(true)} aria-label={`Edit ${e.name}`} title="Edit entity">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </header>
    );
  }

  return (
    <header className="space-y-3 border-b border-dm-border p-5">
      <label className="block space-y-1">
        <span className="label">Legal name</span>
        <input className="field" value={d.name} onChange={(ev) => set('name', ev.target.value)} autoFocus />
      </label>
      <label className="block space-y-1">
        <span className="label">Doing business as</span>
        <input className="field" value={d.dbaName} onChange={(ev) => set('dbaName', ev.target.value)} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="label">Type</span>
          <select className="field" value={d.entityType} onChange={(ev) => set('entityType', ev.target.value as EntityType)}>
            {(Object.keys(entityTypeLabel) as EntityType[]).map((k) => <option key={k} value={k}>{entityTypeLabel[k]}</option>)}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="label">Jurisdiction</span>
          <input className="field" value={d.jurisdiction} onChange={(ev) => set('jurisdiction', ev.target.value)} />
        </label>
        <label className="block space-y-1">
          <span className="label">SOS ID</span>
          <input className="field font-mono text-label" value={d.sosId} onChange={(ev) => set('sosId', ev.target.value)} />
        </label>
        <label className="block space-y-1">
          <span className="label">Formation date</span>
          <input type="date" className="field" value={d.formationDate} onChange={(ev) => set('formationDate', ev.target.value)} />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          className="btn text-dm-red hover:text-dm-red"
          onClick={() => {
            if (confirm(`Delete "${e.name}"? Locations and people linked to it are kept.`)) deleteEntity(e.id);
          }}
        >
          Delete entity
        </button>
        <div className="flex gap-2">
          <button className="btn" onClick={() => setEditing(false)}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!d.name.trim()}
            onClick={() => {
              updateEntity(e.id, {
                name: d.name.trim(),
                dbaName: d.dbaName.trim() || undefined,
                entityType: d.entityType,
                jurisdiction: d.jurisdiction.trim(),
                sosId: d.sosId.trim() || undefined,
                formationDate: d.formationDate || undefined,
              });
              setEditing(false);
            }}
          >
            Save
          </button>
        </div>
      </div>
    </header>
  );
}

function EntityCard({ e }: { e: LegalEntity }) {
  const { properties, deeds, people, openProperty, openPerson, linkProperty, unlinkProperty, updatePerson } = useDentimap();
  const linked = e.associatedPropertyIds
    .map((id) => properties.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const available = properties.filter((p) => !e.associatedPropertyIds.includes(p.id));
  const linkedPeople = people.filter((p) => p.entityIds.includes(e.id));
  const otherPeople = people.filter((p) => !p.entityIds.includes(e.id));
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const acquired = deeds.filter((d) => norm(d.grantee) === norm(e.name)).length;
  const sold = deeds.filter((d) => norm(d.grantor) === norm(e.name)).length;

  return (
    <article className="rounded-lg border border-dm-border bg-dm-surface">
      <EntityHeader e={e} />

      <dl className="grid grid-cols-3 gap-4 border-b border-dm-border p-5">
        <div>
          <dt className="label">SOS ID</dt>
          <dd className="mt-1 font-mono text-label">{e.sosId ?? '—'}</dd>
        </div>
        <div>
          <dt className="label">Formed</dt>
          <dd className="mt-1 tnum text-sm">{e.formationDate ? fmtDate(e.formationDate) : '—'}</dd>
        </div>
        <div>
          <dt className="label">Deeds in / out</dt>
          <dd className="mt-1 tnum text-sm">{acquired} / {sold}</dd>
        </div>
      </dl>

      <div className="border-b border-dm-border px-5 py-4">
        <div className="mb-2 text-sm font-semibold text-dm-text">People</div>
        {linkedPeople.length ? (
          <ul className="space-y-0.5">
            {linkedPeople.map((p) => (
              <li key={p.id} className="group flex items-center gap-1 rounded-md hover:bg-dm-hover">
                <button onClick={() => openPerson(p.id)} className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-1.5 text-left text-sm">
                  <span className="truncate">{p.name}</span>
                  <span className="shrink-0 text-label text-dm-dim">{p.roles.map((r) => personRoleLabel[r]).join(' · ')}</span>
                </button>
                <button
                  onClick={() => updatePerson(p.id, { entityIds: p.entityIds.filter((x) => x !== e.id) })}
                  className="rounded p-1.5 text-dm-muted transition hover:bg-dm-raised hover:text-dm-red group-hover:opacity-100"
                  aria-label={`Unlink ${p.name} from ${e.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-dm-dim">None</p>
        )}
        {otherPeople.length > 0 && (
          <select
            className="field mt-2"
            value=""
            onChange={(ev) => {
              const person = people.find((x) => x.id === ev.target.value);
              if (person) updatePerson(person.id, { entityIds: [...person.entityIds, e.id] });
            }}
            aria-label="Link a person"
          >
            <option value="">+ Link a person…</option>
            {otherPeople.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="p-5">
        <div className="label mb-2">Associated locations ({linked.length})</div>
        {linked.length ? (
          <ul className="space-y-0.5">
            {linked.map((p) => (
              <li key={p.id} className="group flex items-center gap-1 rounded-md hover:bg-dm-hover">
                <button onClick={() => openProperty(p.id)} className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-2 text-left text-sm">
                  <span className="truncate">{p.name}</span>
                  <span className="shrink-0 text-label text-dm-dim">{p.address.city}, {p.address.state}</span>
                </button>
                <button
                  onClick={() => unlinkProperty(e.id, p.id)}
                  className="rounded p-1.5 text-dm-muted transition hover:bg-dm-raised hover:text-dm-red group-hover:opacity-100"
                  title="Remove from this entity (the location itself is kept)"
                  aria-label={`Remove ${p.name} from ${e.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-dm-dim">No linked locations</p>
        )}
        {available.length > 0 && (
          <select
            className="field mt-3"
            value=""
            onChange={(ev) => ev.target.value && linkProperty(e.id, ev.target.value)}
            aria-label="Add a location"
          >
            <option value="">+ Add a location…</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.address.city}, {p.address.state}</option>
            ))}
          </select>
        )}
      </div>
    </article>
  );
}

export function EntitiesView() {
  const entities = useDentimap((s) => s.entities);
  const addEntity = useDentimap((s) => s.addEntity);
  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Entities</h1>
        <button
          className="btn"
          onClick={() => addEntity({ id: newId('entity'), name: 'New entity', entityType: 'landlord_holding', jurisdiction: 'North Carolina', associatedPropertyIds: [] })}
        >
          Add entity
        </button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {entities.map((e) => <EntityCard key={e.id} e={e} />)}
      </div>
    </main>
  );
}
