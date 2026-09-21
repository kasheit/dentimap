import { useState } from 'react';
import { useDentimap } from '@/lib/store';

const stamp = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export function HistoryLog({ propertyId }: { propertyId: string }) {
  const activity = useDentimap((s) => s.activity);
  const [all, setAll] = useState(false);
  const mine = activity.filter((a) => a.propertyId === propertyId).reverse();
  if (!mine.length) return <p className="text-[13px] text-dm-dim">No changes recorded yet. Edits made from now on are logged here.</p>;
  const shown = all ? mine : mine.slice(0, 10);
  return (
    <div>
      <ul className="divide-y divide-dm-border/70">
        {shown.map((a) => (
          <li key={a.id} className="flex items-baseline justify-between gap-4 py-2 text-[13px]">
            <span className="min-w-0 break-words">{a.text}</span>
            <span className="shrink-0 text-[12px] text-dm-dim">{stamp(a.at)}</span>
          </li>
        ))}
      </ul>
      {mine.length > 10 && (
        <button className="mt-2 text-[13px] text-dm-blue hover:underline" onClick={() => setAll((v) => !v)}>
          {all ? 'Show fewer' : `Show all ${mine.length}`}
        </button>
      )}
    </div>
  );
}
