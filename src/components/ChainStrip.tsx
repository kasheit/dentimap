import { useEffect, useRef } from 'react';
import { compactUsd, deedTypeLabel, fmtDate } from '@/lib/format';
import { expectedExcise } from '@/lib/deedParser';
import { sortedDeeds } from '@/lib/store';
import type { DeedRecord } from '@/lib/types';

const norm = (s: string) => s.replace(/\W/g, '').toLowerCase();

export interface MissingDeed {
  /** Who the deed before the gap conveyed to. */
  from: string;
  /** Who the next deed says it came from. */
  to: string;
  after: string;
  before: string;
}

type Item =
  | { kind: 'node'; key: string; name: string; year?: string; current?: boolean; verified?: boolean; unrecorded?: boolean }
  | { kind: 'link'; key: string; deed: DeedRecord }
  | { kind: 'gap'; key: string; missing: MissingDeed };

/** Builds the strip left to right: grantor, deed, grantee, deed, grantee... A gap becomes a dashed connector and a dashed node. */
function buildItems(deeds: DeedRecord[], max: number): { items: Item[]; hidden: number } {
  const chain = sortedDeeds(deeds.filter((d) => d.deedType !== 'subdivision_plat'));
  const shown = max > 0 ? chain.slice(-max) : chain;
  const hidden = chain.length - shown.length;
  const items: Item[] = [];
  shown.forEach((d, i) => {
    const prev = shown[i - 1];
    const gap = prev && norm(prev.grantee) !== norm(d.grantor);
    if (i === 0) {
      items.push({ kind: 'node', key: `${d.id}-from`, name: d.grantor });
    } else if (gap) {
      items.push({ kind: 'gap', key: `${d.id}-gap`, missing: { from: prev.grantee, to: d.grantor, after: prev.recordingDate, before: d.recordingDate } });
      items.push({ kind: 'node', key: `${d.id}-from`, name: d.grantor, unrecorded: true });
    }
    items.push({ kind: 'link', key: d.id, deed: d });
    const current = i === shown.length - 1;
    items.push({ kind: 'node', key: `${d.id}-to`, name: d.grantee, year: String(new Date(d.recordingDate).getUTCFullYear()), current, verified: d.confidence === 'verified' && d.isFormulaVerified });
  });
  return { items, hidden };
}

/** Owner-to-owner lineage. Each connector is the deed itself; a missing deed is a dashed amber button to a dashed node. */
export function ChainStrip({
  deeds,
  max = 0,
  onSelect,
  onAddMissing,
}: {
  deeds: DeedRecord[];
  max?: number;
  onSelect?: (deedId: string) => void;
  onAddMissing?: (missing: MissingDeed) => void;
}) {
  const { items, hidden } = buildItems(deeds, max);
  const listRef = useRef<HTMLOListElement>(null);
  // the current owner is the right end, so keep it in view
  useEffect(() => {
    const el = listRef.current?.parentElement;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [items.length]);
  if (!items.length) return <p className="text-label text-dm-dim">No deeds on file yet.</p>;

  return (
    <div role="group" aria-label="Ownership chain, oldest to newest" tabIndex={0} className="scroll-thin overflow-x-auto rounded pb-2">
      <ol ref={listRef} className="flex items-end gap-0">
        {hidden > 0 && <li className="tnum shrink-0 self-center pr-3 text-label text-dm-dim">+{hidden} earlier</li>}
        {items.map((it) => {
          if (it.kind === 'node') {
            return (
              <li key={it.key} className={`w-[7.5rem] shrink-0 ${it.unrecorded ? 'rounded-md border border-dashed border-dm-amber px-2 py-1' : ''}`}>
                <div
                  className={`line-clamp-2 leading-snug ${it.current ? 'text-[16px] font-semibold text-dm-text' : 'text-label text-dm-muted'} ${it.current && it.verified ? 'border-b-2 border-dm-blue pb-0.5' : ''}`}
                  title={it.name}
                >
                  {it.name}
                  {it.current && <span className="sr-only"> (current owner)</span>}
                </div>
                <div className="tnum mt-0.5 text-[12px] text-dm-dim">{it.unrecorded ? 'not in the chain' : (it.year ?? '')}</div>
              </li>
            );
          }
          if (it.kind === 'gap') {
            const m = it.missing;
            const label = `Missing deed between ${m.from} and ${m.to}`;
            return (
              <li key={it.key} className="flex w-24 shrink-0 flex-col items-center px-1">
                {onAddMissing ? (
                  <button
                    type="button"
                    onClick={() => onAddMissing(m)}
                    aria-label={`${label}. Add it.`}
                    title={`${label}. Add it.`}
                    className="rounded px-1 text-center text-[12px] leading-snug text-dm-amber underline decoration-dashed underline-offset-2 hover:bg-dm-hover"
                  >
                    missing deed, add
                  </button>
                ) : (
                  <span className="text-[12px] text-dm-amber" aria-label={label}>
                    missing deed
                  </span>
                )}
                <span aria-hidden className="mt-1 w-full border-t-2 border-dashed border-dm-amber" />
              </li>
            );
          }
          const d = it.deed;
          const stampBad = !d.isFormulaVerified;
          const name = `Deed recorded ${fmtDate(d.recordingDate)}, ${d.grantor} to ${d.grantee}${d.consideration > 0 ? `, ${compactUsd(d.consideration)}` : ''}${d.consideration > 0 ? (stampBad ? `, stamps expect $${expectedExcise(d.consideration).toLocaleString('en-US')}` : ', stamps match') : ''}. Open.`;
          return (
            <li key={it.key} className="flex w-36 shrink-0 flex-col px-1">
              <button
                type="button"
                onClick={() => onSelect?.(d.id)}
                aria-label={name}
                title={[d.instrumentNumber && `Instrument ${d.instrumentNumber}`, d.book && d.page && `Book ${d.book}, page ${d.page}`, d.source].filter(Boolean).join(' · ') || 'Open deed'}
                className="rounded px-1 py-0.5 text-center text-[12px] leading-snug text-dm-muted transition-colors hover:bg-dm-hover hover:text-dm-text"
              >
                {deedTypeLabel[d.deedType].replace(/ Deed$/, '')}
                {d.consideration > 0 ? ` · ${compactUsd(d.consideration)}` : ''}
                <span className={`block ${stampBad ? 'text-dm-amber' : 'text-dm-dim'}`}>
                  {d.consideration > 0 ? (stampBad ? `stamps expect $${expectedExcise(d.consideration).toLocaleString('en-US')}` : 'stamps match') : ''}
                </span>
              </button>
              <span aria-hidden className="mt-1 h-px w-full bg-dm-dim" />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
