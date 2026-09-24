import { useEffect, useRef } from 'react';
import { compactUsd, deedTypeLabel } from '@/lib/format';
import { expectedExcise } from '@/lib/deedParser';
import { sortedDeeds } from '@/lib/store';
import type { DeedRecord } from '@/lib/types';

const norm = (s: string) => s.replace(/\W/g, '').toLowerCase();

type Item =
  | { kind: 'node'; key: string; name: string; year?: string; current?: boolean; verified?: boolean; unrecorded?: boolean }
  | { kind: 'link'; key: string; deed: DeedRecord }
  | { kind: 'gap'; key: string };

/** Builds the strip left to right: grantor, deed, grantee, deed, grantee... A gap becomes a dashed link and a dashed node. */
function buildItems(deeds: DeedRecord[], max: number): { items: Item[]; hidden: number } {
  const chain = sortedDeeds(deeds.filter((d) => d.deedType !== 'subdivision_plat'));
  const shown = max > 0 ? chain.slice(-max) : chain;
  const hidden = chain.length - shown.length;
  const items: Item[] = [];
  shown.forEach((d, i) => {
    const prev = shown[i - 1];
    const gap = prev && norm(prev.grantee) !== norm(d.grantor);
    if (i === 0) {
      items.push({ kind: 'node', key: `${d.id}-from`, name: d.grantor, year: undefined });
    } else if (gap) {
      items.push({ kind: 'gap', key: `${d.id}-gap` });
      items.push({ kind: 'node', key: `${d.id}-from`, name: d.grantor, unrecorded: true });
    }
    items.push({ kind: 'link', key: d.id, deed: d });
    const current = i === shown.length - 1;
    items.push({ kind: 'node', key: `${d.id}-to`, name: d.grantee, year: String(new Date(d.recordingDate).getUTCFullYear()), current, verified: d.confidence === 'verified' && d.isFormulaVerified });
  });
  return { items, hidden };
}

/** Owner-to-owner lineage. Each connector is the deed itself; a missing deed is a dashed amber connector to a dashed node. */
export function ChainStrip({ deeds, max = 0, onSelect }: { deeds: DeedRecord[]; max?: number; onSelect?: (deedId: string) => void }) {
  const { items, hidden } = buildItems(deeds, max);
  const listRef = useRef<HTMLOListElement>(null);
  // the current owner is the right end, so keep it in view
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [items.length]);
  if (!items.length) return <p className="text-label text-dm-dim">No deeds on file yet.</p>;

  return (
    <ol ref={listRef} className="scroll-thin flex items-end gap-0 overflow-x-auto pb-2" aria-label="Ownership chain, oldest to newest">
      {hidden > 0 && (
        <li className="tnum shrink-0 self-center pr-3 text-label text-dm-dim">+{hidden} earlier</li>
      )}
      {items.map((it) => {
        if (it.kind === 'node') {
          return (
            <li key={it.key} className={`w-[7.5rem] shrink-0 ${it.unrecorded ? 'rounded-md border border-dashed border-dm-amber px-2 py-1' : ''}`}>
              <div
                className={`line-clamp-2 leading-snug ${it.current ? 'text-[16px] font-semibold text-dm-text' : 'text-label text-dm-muted'} ${
                  it.current && it.verified ? 'border-b-2 border-dm-blue pb-0.5' : ''
                }`}
                title={it.name}
              >
                {it.name}
              </div>
              <div className="tnum mt-0.5 text-[12px] text-dm-dim">{it.unrecorded ? 'not in the chain' : (it.year ?? '')}</div>
            </li>
          );
        }
        if (it.kind === 'gap') {
          return (
            <li key={it.key} className="flex w-24 shrink-0 flex-col items-center px-1" aria-label="Missing deed">
              <span className="text-[12px] text-dm-amber">missing deed</span>
              <span className="mt-1 w-full border-t-2 border-dashed border-dm-amber" />
            </li>
          );
        }
        const d = it.deed;
        const stampBad = !d.isFormulaVerified;
        return (
          <li key={it.key} className="flex w-36 shrink-0 flex-col px-1">
            <button
              type="button"
              onClick={() => onSelect?.(d.id)}
              title={[d.instrumentNumber && `Instrument ${d.instrumentNumber}`, d.book && d.page && `Book ${d.book}, page ${d.page}`, d.source].filter(Boolean).join(' · ') || 'Open deed'}
              className="rounded px-1 py-0.5 text-center text-[12px] leading-snug text-dm-muted transition-colors hover:bg-dm-hover hover:text-dm-text"
            >
              {deedTypeLabel[d.deedType].replace(/ Deed$/, '')}
              {d.consideration > 0 ? ` · ${compactUsd(d.consideration)}` : ''}
              <span className={`block ${stampBad ? 'text-dm-amber' : 'text-dm-dim'}`}>
                {d.consideration > 0 ? (stampBad ? `stamps expect $${expectedExcise(d.consideration).toLocaleString('en-US')}` : 'stamps match') : ''}
              </span>
            </button>
            <span className="mt-1 h-px w-full bg-dm-dim" />
          </li>
        );
      })}
    </ol>
  );
}
