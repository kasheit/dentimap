import { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { entityTypeLabel, fmtDate, personRoleLabel } from '@/lib/format';
import { newId, useDentimap } from '@/lib/store';
import type { EntityType, LegalEntity } from '@/lib/types';
import { EmptyState, PageHeader, PageShell } from '@/components/Page';

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
  // Prefer the linked id (exact) when a deed's party is linked; unlinked parties fall back to a name guess.
  const isGrantee = (d: (typeof deeds)[number]) => (d.granteeEntityId ? d.granteeEntityId === e.id : norm(d.grantee) === norm(e.name));
  const isGrantor = (d: (typeof deeds)[number]) => (d.grantorEntityId ? d.grantorEntityId === e.id : norm(d.grantor) === norm(e.name));
  const entityDeeds = deeds
    .filter((d) => isGrantee(d) || isGrantor(d))
    .sort((a, b) => b.recordingDate.localeCompare(a.recordingDate));
  const acquired = entityDeeds.filter(isGrantee).length;
  const sold = entityDeeds.filter(isGrantor).length;

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

      {entityDeeds.length > 0 && (
        <div className="border-b border-dm-border px-5 py-4">
          <div className="mb-2 text-sm font-semibold text-dm-text">Deeds</div>
          <ul className="space-y-0.5">
            {entityDeeds.slice(0, 4).map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 rounded-md px-3 py-1.5 text-label hover:bg-dm-hover">
                <span className="text-dm-muted">
                  {isGrantee(d) ? 'Acquired' : 'Sold'} · {properties.find((p) => p.id === d.propertyId)?.name ?? 'Unknown location'}
                </span>
                <button className="tnum shrink-0 text-dm-dim hover:text-dm-blue hover:underline" onClick={() => openProperty(d.propertyId)}>
                  {fmtDate(d.recordingDate)}
                </button>
              </li>
            ))}
          </ul>
          {entityDeeds.length > 4 && <div className="mt-1 px-3 text-label text-dm-dim">+{entityDeeds.length - 4} more</div>}
        </div>
      )}

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
                  className="rounded p-1.5 text-dm-muted opacity-0 transition hover:bg-dm-raised hover:text-dm-red focus-visible:opacity-100 group-hover:opacity-100"
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
            <option value="">Link a person</option>
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
                  className="rounded p-1.5 text-dm-muted opacity-0 transition hover:bg-dm-raised hover:text-dm-red focus-visible:opacity-100 group-hover:opacity-100"
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
            <option value="">Add a location</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.address.city}, {p.address.state}</option>
            ))}
          </select>
        )}
      </div>
    </article>
  );
}

const ROW = 34;
const NODE_W = 200;
const GAP = 96;
const PAD = 12;

/** People on the left, the entity in the middle, locations on the right, joined by hairlines. Nodes are real buttons. */
function EntityDiagram({ e }: { e: LegalEntity }) {
  const { properties, people, openProperty, openPerson } = useDentimap();
  const locs = e.associatedPropertyIds.map((id) => properties.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
  const ppl = people.filter((p) => p.entityIds.includes(e.id));
  const rows = Math.max(ppl.length, locs.length, 1);
  const height = rows * ROW + PAD * 2;
  const width = PAD * 2 + NODE_W * 3 + GAP * 2;
  const cy = height / 2;
  const colY = (i: number, n: number) => cy - (n * ROW) / 2 + i * ROW + ROW / 2;
  const x2 = PAD + NODE_W + GAP;
  const x3 = PAD + (NODE_W + GAP) * 2;
  const link = (x1: number, y1: number, xb: number, y2: number) => `M ${x1} ${y1} C ${(x1 + xb) / 2} ${y1}, ${(x1 + xb) / 2} ${y2}, ${xb} ${y2}`;
  const node = 'absolute flex h-7 items-center rounded-md border border-dm-border bg-dm-surface px-2.5 text-left text-label transition-colors hover:border-dm-dim hover:bg-dm-hover';

  return (
    <div className="scroll-thin overflow-x-auto">
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} className="absolute inset-0" aria-hidden>
          {ppl.map((_, i) => (
            <path key={`p${i}`} d={link(PAD + NODE_W, colY(i, ppl.length), x2, cy)} className="fill-none stroke-dm-dim" strokeOpacity={0.65} strokeWidth={1.25} />
          ))}
          {locs.map((_, i) => (
            <path key={`l${i}`} d={link(x2 + NODE_W, cy, x3, colY(i, locs.length))} className="fill-none stroke-dm-dim" strokeOpacity={0.65} strokeWidth={1.25} />
          ))}
        </svg>
        {ppl.length === 0 && (
          <span className="absolute text-label text-dm-dim" style={{ left: PAD, top: cy - 9 }}>
            No people linked
          </span>
        )}
        {ppl.map((p, i) => (
          <button key={p.id} className={node} style={{ left: PAD, top: colY(i, ppl.length) - 14, width: NODE_W }} onClick={() => openPerson(p.id)} title={p.name}>
            <span className="truncate">{p.name}</span>
          </button>
        ))}
        <span className="absolute flex h-7 items-center rounded-md border border-dm-blue bg-dm-surface px-2.5 text-label font-medium" style={{ left: x2, top: cy - 14, width: NODE_W }} title={e.name}>
          <span className="truncate">{e.name}</span>
        </span>
        {locs.length === 0 && (
          <span className="absolute text-label text-dm-dim" style={{ left: x3, top: cy - 9 }}>
            No locations linked
          </span>
        )}
        {locs.map((p, i) => (
          <button key={p.id} className={node} style={{ left: x3, top: colY(i, locs.length) - 14, width: NODE_W }} onClick={() => openProperty(p.id)} title={p.name}>
            <span className="truncate">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function EntitiesView() {
  const entities = useDentimap((s) => s.entities);
  const addEntity = useDentimap((s) => s.addEntity);
  const [selectedId, setSelectedId] = useState('');
  const selected = entities.find((x) => x.id === selectedId) ?? entities[0];

  const add = () => {
    const id = newId('entity');
    addEntity({ id, name: 'New entity', entityType: 'landlord_holding', jurisdiction: 'North Carolina', associatedPropertyIds: [] });
    setSelectedId(id);
  };

  return (
    <PageShell>
      <PageHeader
        title="Entities"
        count={entities.length}
        subtitle="Who holds what, and who is behind each entity."
        actions={
          <button className="btn btn-primary" onClick={add}>
            Add entity
          </button>
        }
      />
      {!selected ? (
        <EmptyState title="No entities yet" hint="Add the LLCs and companies that hold title." action={<button className="btn" onClick={add}>Add entity</button>} />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <nav aria-label="Entities" className="overflow-hidden rounded-lg border border-dm-border bg-dm-surface shadow-card">
            <ul className="divide-y divide-dm-border/70">
              {entities.map((x) => (
                <li key={x.id}>
                  <button
                    onClick={() => setSelectedId(x.id)}
                    aria-current={x.id === selected.id ? 'true' : undefined}
                    className={`block w-full px-4 py-2.5 text-left transition-colors ${x.id === selected.id ? 'bg-dm-hover' : 'hover:bg-dm-hover/60'}`}
                  >
                    <span className="block truncate text-body font-medium">{x.name}</span>
                    <span className="tnum block truncate text-label text-dm-muted">
                      {entityTypeLabel[x.entityType]} &middot; {x.associatedPropertyIds.length} location{x.associatedPropertyIds.length === 1 ? '' : 's'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div key={selected.id} className="min-w-0 space-y-5">
            <section className="rounded-lg border border-dm-border bg-dm-surface p-5 shadow-card">
              <h2 className="mb-3 text-body font-semibold">Connections</h2>
              <EntityDiagram e={selected} />
            </section>
            <EntityCard e={selected} />
          </div>
        </div>
      )}
    </PageShell>
  );
}
