import { useMemo, useState } from 'react';
import { entityTypeLabel, personRoleLabel } from '@/lib/format';
import { useDentimap } from '@/lib/store';

const ROW_H = 34;
const NODE_W = 208;
const COL_GAP = 130;
const PAD_X = 24;
const PAD_TOP = 96;
const BOX_H = 26;

type Kind = 'person' | 'entity' | 'property';
type NodeId = `${Kind}:${string}`;

const truncate = (s: string, n = 26) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

interface Edge {
  a: NodeId;
  b: NodeId;
  direct: boolean;
}

export function NetworkView() {
  const { people, entities, properties, openPerson, openProperty, setTab } = useDentimap();
  const [includeClosed, setIncludeClosed] = useState(false);
  const [focus, setFocus] = useState<NodeId | null>(null);

  const visProperties = useMemo(
    () => properties.filter((p) => includeClosed || p.status === 'active').sort((a, b) => a.name.localeCompare(b.name)),
    [properties, includeClosed],
  );
  const visEntities = useMemo(() => [...entities].sort((a, b) => a.name.localeCompare(b.name)), [entities]);
  const visPeople = useMemo(
    () => people.filter((p) => p.entityIds.length > 0 || p.propertyIds.length > 0).sort((a, b) => a.name.localeCompare(b.name)),
    [people],
  );

  const col1x = PAD_X;
  const col2x = col1x + NODE_W + COL_GAP;
  const col3x = col2x + NODE_W + COL_GAP;
  const width = col3x + NODE_W + PAD_X;
  const rows = Math.max(visPeople.length, visEntities.length, visProperties.length, 1);
  const height = rows * ROW_H + PAD_TOP + 32;

  const yOf = useMemo(() => {
    const m = new Map<NodeId, number>();
    visPeople.forEach((p, i) => m.set(`person:${p.id}`, PAD_TOP + i * ROW_H + BOX_H / 2));
    visEntities.forEach((e, i) => m.set(`entity:${e.id}`, PAD_TOP + i * ROW_H + BOX_H / 2));
    visProperties.forEach((p, i) => m.set(`property:${p.id}`, PAD_TOP + i * ROW_H + BOX_H / 2));
    return m;
  }, [visPeople, visEntities, visProperties]);

  const edges = useMemo(() => {
    const propSet = new Set(visProperties.map((p) => p.id));
    const entSet = new Set(visEntities.map((e) => e.id));
    const out: Edge[] = [];
    for (const p of visPeople) {
      for (const eid of p.entityIds) if (entSet.has(eid)) out.push({ a: `person:${p.id}`, b: `entity:${eid}`, direct: false });
      for (const pid of p.propertyIds) if (propSet.has(pid)) out.push({ a: `person:${p.id}`, b: `property:${pid}`, direct: true });
    }
    for (const e of visEntities) {
      for (const pid of e.associatedPropertyIds) if (propSet.has(pid)) out.push({ a: `entity:${e.id}`, b: `property:${pid}`, direct: false });
    }
    return out;
  }, [visPeople, visEntities, visProperties]);

  const connected = useMemo(() => {
    if (!focus) return null;
    const s = new Set<NodeId>([focus]);
    for (const e of edges) {
      if (e.a === focus) s.add(e.b);
      if (e.b === focus) s.add(e.a);
    }
    return s;
  }, [focus, edges]);

  const focusedName = () => {
    if (!focus) return null;
    const [kind, id] = focus.split(':') as [Kind, string];
    if (kind === 'person') return people.find((p) => p.id === id)?.name;
    if (kind === 'entity') return entities.find((e) => e.id === id)?.name;
    return properties.find((p) => p.id === id)?.name;
  };

  const openNode = (id: NodeId) => {
    const [kind, raw] = id.split(':') as [Kind, string];
    if (kind === 'person') openPerson(raw);
    else if (kind === 'property') openProperty(raw);
    else setTab('entities');
  };

  const Column = ({ kind, x, items, sub }: { kind: Kind; x: number; items: { id: string; name: string }[]; sub: (id: string) => string }) => (
    <>
      {items.map((it, i) => {
        const nid: NodeId = `${kind}:${it.id}`;
        const y = PAD_TOP + i * ROW_H;
        const dimmed = connected ? !connected.has(nid) : false;
        const active = focus === nid;
        return (
          <g
            key={nid}
            className={`cursor-pointer transition-opacity duration-150 ${dimmed ? 'opacity-25' : 'opacity-100'}`}
            onClick={() => setFocus(active ? null : nid)}
            onDoubleClick={() => openNode(nid)}
          >
            <title>{`${it.name}${sub(it.id) ? ` — ${sub(it.id)}` : ''} (double-click to open)`}</title>
            <rect
              x={x}
              y={y}
              width={NODE_W}
              height={BOX_H}
              rx={6}
              className={active ? 'fill-dm-hover stroke-dm-blue' : 'fill-dm-surface stroke-dm-border'}
              strokeWidth={active ? 1.5 : 1}
            />
            <text x={x + 10} y={y + BOX_H / 2 + 4} className={active ? 'fill-dm-text' : 'fill-dm-text'} fontSize={12} fontWeight={500}>
              {truncate(it.name)}
            </text>
          </g>
        );
      })}
    </>
  );

  const path = (from: NodeId, to: NodeId, direct: boolean) => {
    const y1 = yOf.get(from);
    const y2 = yOf.get(to);
    if (y1 === undefined || y2 === undefined) return null;
    if (direct) {
      const x1 = col1x + NODE_W;
      const x2 = col3x;
      const apex = 58;
      return `M ${x1} ${y1} C ${x1 + 80} ${apex}, ${x2 - 80} ${apex}, ${x2} ${y2}`;
    }
    const [kindA] = from.split(':');
    const x1 = kindA === 'person' ? col1x + NODE_W : col2x + NODE_W;
    const x2 = kindA === 'person' ? col2x : col3x;
    const midX = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
  };

  return (
    <main className="mx-auto max-w-[1680px] p-4 sm:p-6 lg:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Network</h1>
          <p className="mt-1 text-label text-dm-dim">Who's connected to what — click a node to trace it, double-click to open it.</p>
        </div>
        <label className="flex items-center gap-2 text-label text-dm-muted">
          <input type="checkbox" className="accent-dm-blue" checked={includeClosed} onChange={(e) => setIncludeClosed(e.target.checked)} />
          Include closed locations
        </label>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-label text-dm-dim">
        <span className="flex items-center gap-1.5"><i className="inline-block h-px w-4 bg-dm-border" /> Through an entity</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-px w-4 border-t border-dashed border-dm-border" /> Direct link, no entity</span>
        {focus && (
          <span className="flex items-center gap-2">
            <span className="text-dm-muted">Tracing: <b className="font-medium text-dm-text">{focusedName()}</b></span>
            <button className="text-dm-blue hover:underline" onClick={() => openNode(focus)}>Open</button>
            <button className="text-dm-dim hover:text-dm-text" onClick={() => setFocus(null)}>Clear</button>
          </span>
        )}
      </div>

      <div className="scroll-thin overflow-auto rounded-lg border border-dm-border bg-dm-bg" style={{ maxHeight: 'calc(100vh - 260px)' }}>
        <svg width={width} height={height} className="block">
          <text x={col1x} y={40} className="fill-dm-dim" fontSize={11} fontWeight={600} letterSpacing="0.06em">
            PEOPLE ({visPeople.length})
          </text>
          <text x={col2x} y={40} className="fill-dm-dim" fontSize={11} fontWeight={600} letterSpacing="0.06em">
            ENTITIES ({visEntities.length})
          </text>
          <text x={col3x} y={40} className="fill-dm-dim" fontSize={11} fontWeight={600} letterSpacing="0.06em">
            LOCATIONS ({visProperties.length})
          </text>

          {edges.map((e, i) => {
            const d = path(e.a, e.b, e.direct);
            if (!d) return null;
            const on = !!connected && connected.has(e.a) && connected.has(e.b);
            const anyFocus = !!focus;
            return (
              <path
                key={i}
                d={d}
                fill="none"
                className={on ? 'stroke-dm-blue' : 'stroke-dm-border'}
                strokeWidth={on ? 2 : 1}
                strokeDasharray={e.direct ? '4 3' : undefined}
                style={{ opacity: anyFocus ? (on ? 0.9 : 0.08) : 0.45 }}
              />
            );
          })}

          <Column kind="person" x={col1x} items={visPeople} sub={(id) => people.find((p) => p.id === id)?.roles.map((r) => personRoleLabel[r]).join(' · ') ?? ''} />
          <Column kind="entity" x={col2x} items={visEntities} sub={(id) => entityTypeLabel[entities.find((e) => e.id === id)?.entityType ?? 'landlord_holding']} />
          <Column kind="property" x={col3x} items={visProperties} sub={(id) => properties.find((p) => p.id === id)?.address.city ?? ''} />
        </svg>
      </div>
    </main>
  );
}
