import { useEffect, useState } from 'react';
import { ArrowRight, Circle, CircleAlert, TriangleAlert } from 'lucide-react';
import { EmptyState, PageHeader, PageShell } from '@/components/Page';
import { attentionQueue } from '@/lib/attention';
import type { Severity } from '@/lib/attention';
import { compactUsd } from '@/lib/format';
import { useDentimap } from '@/lib/store';

const severity: Record<Severity, { Icon: typeof Circle; cls: string; label: string }> = {
  red: { Icon: CircleAlert, cls: 'text-dm-red', label: 'Needs attention' },
  amber: { Icon: TriangleAlert, cls: 'text-dm-amber', label: 'Worth a look' },
  gray: { Icon: Circle, cls: 'text-dm-dim', label: 'When you have a minute' },
};

/** A work queue: the next things worth doing, worst first. */
export function HomeView() {
  const { properties, deeds, entities, openProperty, setTab } = useDentimap();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const queue = attentionQueue(properties, deeds, entities);
  const dateLine = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const withValue = properties.filter((p) => p.metrics?.currentAssessedValue !== undefined);
  const total = withValue.reduce((t, p) => t + (p.metrics?.currentAssessedValue ?? 0), 0);
  const subtitle = withValue.length ? `${dateLine} · ${compactUsd(total)} assessed across ${withValue.length} of ${properties.length} locations` : dateLine;

  const go = (item: (typeof queue)[number]) => {
    if (item.goToEntities) setTab('entities');
    else if (item.goToLocations) setTab('properties');
    else if (item.propertyId) openProperty(item.propertyId, item.tab);
  };

  return (
    <PageShell>
      <PageHeader title="Next up" count={queue.length} subtitle={subtitle} />
      {queue.length ? (
        <ul className="divide-y divide-dm-border/70 overflow-hidden rounded-lg border border-dm-border bg-dm-surface shadow-card">
          {queue.map((item) => {
            const { Icon, cls, label } = severity[item.severity];
            return (
              <li key={item.id}>
                <button onClick={() => go(item)} className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-dm-hover/70 focus-visible:bg-dm-hover">
                  <Icon className={`h-4 w-4 shrink-0 ${cls}`} aria-hidden />
                  <span className="sr-only">{label}: </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body font-medium">{item.title}</span>
                    <span className="block truncate text-label text-dm-muted">{item.sub}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-dm-dim transition-transform duration-150 ease-luxury group-hover:translate-x-0.5 group-hover:text-dm-muted" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          title="Nothing needs you right now"
          hint="Every location with a deed has a verified owner and value."
          action={
            <button className="btn" onClick={() => setTab('properties')}>
              View locations
            </button>
          }
        />
      )}
    </PageShell>
  );
}
