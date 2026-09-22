import { useEffect, useState } from 'react';
import { attentionQueue } from '@/lib/attention';
import { useDentimap } from '@/lib/store';

/** Single-owner app: this is who "Home" greets, not an account field. */
const OWNER_NAME = 'Eshan';

function greeting(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function HomeView() {
  const { properties, deeds, entities, openProperty, setTab } = useDentimap();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const queue = attentionQueue(properties, deeds, entities);
  const dateLine = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const activeCount = properties.filter((p) => p.status === 'active').length;

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-4 pt-16 sm:pt-24">
      <div className="text-center">
        <div className="text-label text-dm-dim">{dateLine}</div>
        <h1 className="mt-2.5 text-display font-semibold tracking-tight">
          {greeting(now.getHours())}, {OWNER_NAME}.
        </h1>
        <p className="mt-1.5 text-body text-dm-muted">
          {queue.length
            ? `${queue.length} thing${queue.length === 1 ? '' : 's'} need${queue.length === 1 ? 's' : ''} you across ${activeCount} location${activeCount === 1 ? '' : 's'}.`
            : `Nothing needs you right now, across ${activeCount} location${activeCount === 1 ? '' : 's'}.`}
        </p>
      </div>

      {queue.length > 0 && (
        <div className="flex w-full flex-col gap-2.5">
          {queue.map((item, i) => (
            <button
              key={item.id}
              onClick={() => (item.goToEntities ? setTab('entities') : item.propertyId && openProperty(item.propertyId))}
              className="group flex items-center gap-4 rounded-lg border border-dm-border bg-dm-surface px-5 py-4 text-left transition-colors hover:border-dm-blue/40"
            >
              <span className={`w-6 shrink-0 text-label font-semibold tnum ${item.severity === 'red' ? 'text-dm-red' : item.severity === 'amber' ? 'text-dm-amber' : 'text-dm-dim'}`}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.title}</span>
                <span className="mt-0.5 block truncate text-label text-dm-dim">{item.sub}</span>
              </span>
              <span className="shrink-0 text-dm-dim transition-colors group-hover:text-dm-muted">→</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-center gap-8 pt-2">
        {[
          ['Locations', properties.length],
          ['Deeds', deeds.length],
          ['Entities', entities.length],
        ].map(([label, n]) => (
          <div key={label} className="text-center">
            <div className="tnum text-lg font-semibold">{n}</div>
            <div className="text-label text-dm-dim">{label}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
