import { useState } from 'react';
import { ChevronDown, Pencil, X } from 'lucide-react';
import { agentKey, buildAgentDirectory } from '@/lib/agents';
import { entityTypeLabel, fmtDate } from '@/lib/format';
import { useDentimap } from '@/lib/store';
import type { LegalEntity } from '@/lib/types';

function EntityCard({ e }: { e: LegalEntity }) {
  const { properties, deeds, entities, openProperty, updateEntity, linkProperty, unlinkProperty } = useDentimap();
  const [editing, setEditing] = useState(false);
  const [newAgent, setNewAgent] = useState('');
  const agents = e.registeredAgentOrManagers ?? [];
  const linked = e.associatedPropertyIds
    .map((id) => properties.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const available = properties.filter((p) => !e.associatedPropertyIds.includes(p.id));
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const acquired = deeds.filter((d) => norm(d.grantee) === norm(e.name)).length;
  const sold = deeds.filter((d) => norm(d.grantor) === norm(e.name)).length;

  const directory = buildAgentDirectory(entities);
  const setAgents = (next: string[]) => updateEntity(e.id, { registeredAgentOrManagers: next });
  const addAgent = (name: string) => {
    const clean = name.trim();
    if (clean && !agents.some((x) => agentKey(x) === agentKey(clean))) setAgents([...agents, directory.find((d) => agentKey(d.name) === agentKey(clean))?.name ?? clean]);
    setNewAgent('');
  };
  const removeAgent = (name: string) => setAgents(agents.filter((x) => x !== name));
  const existing = directory.filter((d) => !agents.some((x) => agentKey(x) === agentKey(d.name)));
  const sharedCount = (name: string) => directory.find((d) => agentKey(d.name) === agentKey(name))?.entities.length ?? 1;

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

      <details className="group/agents border-b border-dm-border">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3.5 transition-colors hover:bg-dm-hover [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex-1 text-sm font-semibold text-dm-text">
            Registered Agents <span className="ml-1 font-normal text-dm-dim">{agents.length || 'None'}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-dm-dim transition-transform group-[[open]]/agents:rotate-180" />
        </summary>
        <div className="space-y-3 px-5 pb-4 pt-1">
          <div className="flex items-start justify-between gap-3">
            {agents.length ? (
              <ul className="flex flex-wrap gap-1.5">
                {agents.map((m) => (
                  <li key={m} className="inline-flex items-center gap-1.5 rounded-full border border-dm-border bg-dm-bg py-1 pl-2.5 pr-2 text-xs text-dm-text">
                    {m}
                    {sharedCount(m) > 1 && (
                      <span className="tnum text-[11px] text-dm-dim" title={`Also registered on ${sharedCount(m) - 1} other ${sharedCount(m) === 2 ? 'entity' : 'entities'}`}>
                        ×{sharedCount(m)}
                      </span>
                    )}
                    {editing && (
                      <button onClick={() => removeAgent(m)} className="text-dm-dim transition-colors hover:text-dm-red" aria-label={`Remove ${m}`}>
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-dm-dim">None recorded</p>
            )}
            <button
              className={`shrink-0 text-xs transition-colors ${editing ? 'font-medium text-dm-blue' : 'text-dm-dim hover:text-dm-blue'}`}
              onClick={() => setEditing((v) => !v)}
              aria-label={editing ? 'Done editing registered agents' : 'Edit registered agents'}
            >
              {editing ? 'Done' : <Pencil className="h-3.5 w-3.5" />}
            </button>
          </div>
          {editing && (
            <div className="space-y-2">
              {existing.length > 0 && (
                <select className="field" value="" onChange={(ev) => ev.target.value && addAgent(ev.target.value)} aria-label="Add an existing registered agent">
                  <option value="">+ Add an existing agent…</option>
                  {existing.map((d) => (
                    <option key={d.name} value={d.name}>{d.name} — on {d.entities.length} {d.entities.length === 1 ? 'entity' : 'entities'}</option>
                  ))}
                </select>
              )}
              <div className="flex gap-2">
                <input className="field" value={newAgent} onChange={(ev) => setNewAgent(ev.target.value)} placeholder="New agent name" onKeyDown={(ev) => ev.key === 'Enter' && addAgent(newAgent)} />
                <button className="btn" onClick={() => addAgent(newAgent)} disabled={!newAgent.trim()}>Add</button>
              </div>
            </div>
          )}
        </div>
      </details>

      <div className="space-y-5 p-5">
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

function AgentDirectory() {
  const entities = useDentimap((s) => s.entities);
  const directory = buildAgentDirectory(entities);
  return (
    <details className="mb-6 rounded-xl border border-dm-border bg-dm-surface">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3.5 [&::-webkit-details-marker]:hidden">
        <span className="flex-1 text-sm font-semibold">Registered Agents <span className="ml-1 font-normal text-dm-muted">· {directory.length} across {entities.length} entities</span></span>
        <ChevronDown className="h-4 w-4 text-dm-dim" />
      </summary>
      <ul className="grid gap-x-6 gap-y-2 border-t border-dm-border px-5 py-4 text-sm sm:grid-cols-2">
        {directory.length === 0 && <li className="text-dm-dim">No registered agents recorded yet.</li>}
        {directory.map((d) => (
          <li key={d.name} className="flex items-baseline justify-between gap-3">
            <span>{d.name}</span>
            <span className="truncate text-xs text-dm-dim">{d.entities.map((x) => x.name).join(' · ')}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function EntitiesView() {
  const entities = useDentimap((s) => s.entities);
  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Ownership entities</h1>
      </div>
      <AgentDirectory />
      <div className="grid gap-6 md:grid-cols-2">
        {entities.map((e) => <EntityCard key={e.id} e={e} />)}
      </div>
    </main>
  );
}
