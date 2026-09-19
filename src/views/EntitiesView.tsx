import { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { entityTypeLabel, fmtDate } from '@/lib/format';
import { useDentimap } from '@/lib/store';
import type { LegalEntity } from '@/lib/types';

function EntityCard({ e }: { e: LegalEntity }) {
  const { properties, deeds, openProperty, updateEntity, linkProperty, unlinkProperty } = useDentimap();
  const [editing, setEditing] = useState(false);
  const [managers, setManagers] = useState((e.registeredAgentOrManagers ?? []).join(', '));
  const linked = e.associatedPropertyIds
    .map((id) => properties.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const available = properties.filter((p) => !e.associatedPropertyIds.includes(p.id));
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const acquired = deeds.filter((d) => norm(d.grantee) === norm(e.name)).length;
  const sold = deeds.filter((d) => norm(d.grantor) === norm(e.name)).length;

  const save = () => {
    updateEntity(e.id, { registeredAgentOrManagers: managers.split(',').map((m) => m.trim()).filter(Boolean) });
    setEditing(false);
  };

  return (
    <article className="rounded-xl border border-dm-border bg-dm-surface">
      <header className="flex items-start justify-between gap-3 border-b border-dm-border p-5">
        <div className="flex items-start gap-3">
          <div>
            <h2 className="text-[17px] font-semibold leading-snug">{e.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-dm-muted">{entityTypeLabel[e.entityType]} · {e.jurisdiction}</span>
            </div>
          </div>
        </div>
      </header>

      <dl className="grid grid-cols-3 gap-4 border-b border-dm-border p-5">
        <div>
          <dt className="label">SOS ID</dt>
          <dd className="mt-1 font-mono text-[13px]">{e.sosId ?? '—'}</dd>
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

      <div className="space-y-5 p-5">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="label">Registered agent / managers</span>
            {!editing && (
              <button className="text-dm-dim transition-colors hover:text-dm-blue" onClick={() => setEditing(true)} title="Edit">
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </div>
          {editing ? (
            <div className="flex gap-2">
              <input className="field" value={managers} onChange={(ev) => setManagers(ev.target.value)} placeholder="Comma-separated names" autoFocus onKeyDown={(ev) => ev.key === 'Enter' && save()} />
              <button className="btn btn-primary" onClick={save}>Save</button>
            </div>
          ) : e.registeredAgentOrManagers?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {e.registeredAgentOrManagers.map((m) => (
                <span key={m} className="rounded-full border border-dm-border bg-dm-bg px-2.5 py-1 text-xs text-dm-muted">{m}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-dm-dim">None recorded</p>
          )}
        </div>

        <div>
          <div className="label mb-2">Associated properties ({linked.length})</div>
          {linked.length ? (
            <ul className="space-y-0.5">
              {linked.map((p) => (
                <li key={p.id} className="group flex items-center gap-1 rounded-md hover:bg-dm-hover">
                  <button onClick={() => openProperty(p.id)} className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-2 text-left text-sm">
                    <span className="truncate">{p.name}</span>
                    <span className="shrink-0 text-[13px] text-dm-dim">{p.address.city}, {p.address.state}</span>
                  </button>
                  <button
                    onClick={() => unlinkProperty(e.id, p.id)}
                    className="rounded p-1.5 text-dm-dim opacity-60 transition hover:bg-dm-raised hover:text-dm-red group-hover:opacity-100"
                    title="Remove from this entity (the property itself is kept)"
                    aria-label={`Remove ${p.name} from ${e.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-dm-dim">No linked properties</p>
          )}
          {available.length > 0 && (
            <select
              className="field mt-3"
              value=""
              onChange={(ev) => ev.target.value && linkProperty(e.id, ev.target.value)}
              aria-label="Add a property"
            >
              <option value="">+ Add a property…</option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {p.address.city}, {p.address.state}</option>
              ))}
            </select>
          )}
        </div>
      </div>
    </article>
  );
}

export function EntitiesView() {
  const entities = useDentimap((s) => s.entities);
  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Ownership entities</h1>
        <p className="mt-1 text-sm text-dm-muted">Landlord holding companies and clinical operators behind the facility network.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {entities.map((e) => <EntityCard key={e.id} e={e} />)}
      </div>
    </main>
  );
}
