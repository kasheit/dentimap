import { useState, useCallback } from 'react';
import { SectionCard } from '@/components/SectionCard';
import { TierBadge } from '@/components/TierBadge';
import { CompletionIndicator } from '@/components/CompletionIndicator';
import { EditableText } from '@/components/EditableText';
import { timelineEntries as initialEntries } from '@/data';
import { sourceTier } from '@/data';
import type { CompletionState, TimelineEntry } from '@/types';

export function TimelineTab() {
  const [entries, setEntries] = useState<TimelineEntry[]>(() => initialEntries.map((e) => ({ ...e })));

  const updateEntry = useCallback((id: string, patch: Partial<TimelineEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);
  const updateCompletion = useCallback((id: string, state: CompletionState) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, completion: state } : e)));
  }, []);

  return (
    <SectionCard title="Timeline" subtitle="Milestone tracker — founding through acquisition">
      <div className="relative">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

        <div className="space-y-6">
          {entries.map((entry) => {
            const info = sourceTier(entry.badge.tier);
            return (
              <div key={entry.id} className="relative pl-8">
                <div
                  className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full ring-4"
                  style={{ backgroundColor: info.color, ['--tw-ring-color' as string]: info.bgColor }}
                />

                <div className="rounded-lg border border-border bg-nested p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold text-text-primary">
                        <EditableText value={entry.date} onChange={(v) => updateEntry(entry.id, { date: v })} mono className="text-sm font-semibold" inputClassName="text-sm font-mono font-semibold w-full" />
                      </p>
                      <p className="mt-1 text-sm font-medium text-text-primary">
                        <EditableText value={entry.title} onChange={(v) => updateEntry(entry.id, { title: v })} className="text-sm font-medium" inputClassName="text-sm font-medium w-full" />
                      </p>
                    </div>
                    <TierBadge tier={entry.badge.tier} label={entry.badge.label} />
                  </div>

                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                    <EditableText value={entry.description} onChange={(v) => updateEntry(entry.id, { description: v })} multiline className="text-sm" inputClassName="text-sm w-full" />
                  </p>

                  <div className="mt-4 border-t border-border pt-3">
                    <CompletionIndicator state={entry.completion} onChange={(s) => updateCompletion(entry.id, s)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}
