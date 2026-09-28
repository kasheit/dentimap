import { useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { compactUsd, deedTypeLabel, fmtDate } from '@/lib/format';
import { expectedExcise } from '@/lib/deedParser';
import { sortedDeeds } from '@/lib/store';
import type { DeedRecord } from '@/lib/types';

const norm = (s: string) => s.replace(/\W/g, '').toLowerCase();
const SPINE = 'mt-1 block h-px w-full bg-dm-dim/40';

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
  | { kind: 'link'; key: string; deed: DeedRecord; years?: number }
  | { kind: 'gap'; key: string; missing: MissingDeed };

/**
 * Builds the strip left to right: grantor, deed, grantee, deed, grantee... A
 * gap becomes a dashed connector and a dashed node. `years` on a link is how
 * long the previous owner held before this conveyance, used to space the
 * strip by elapsed time.
 *
 * Gaps are always computed over the FULL chain first, then the item list is
 * truncated to the last `max` owner nodes (not deeds) — truncating by deed
 * count first could slice through a gap boundary and silently drop the one
 * indicator this component exists to show.
 */
function buildItems(deeds: DeedRecord[], max: number): { items: Item[]; hidden: number } {
  const chain = sortedDeeds(deeds.filter((d) => d.deedType !== 'subdivision_plat'));
  const items: Item[] = [];
  let prevYear: number | undefined;
  let nodeCount = 0;
  chain.forEach((d, i) => {
    const prev = chain[i - 1];
    const gap = prev && norm(prev.grantee) !== norm(d.grantor);
    if (i === 0) {
      items.push({ kind: 'node', key: `${d.id}-from`, name: d.grantor });
      nodeCount++;
    } else if (gap) {
      items.push({ kind: 'gap', key: `${d.id}-gap`, missing: { from: prev.grantee, to: d.grantor, after: prev.recordingDate, before: d.recordingDate } });
      items.push({ kind: 'node', key: `${d.id}-from`, name: d.grantor, unrecorded: true });
      nodeCount++;
      prevYear = undefined;
    }
    const year = new Date(d.recordingDate).getUTCFullYear();
    items.push({ kind: 'link', key: d.id, deed: d, years: prevYear !== undefined ? year - prevYear : undefined });
    prevYear = year;
    const current = i === chain.length - 1;
    items.push({ kind: 'node', key: `${d.id}-to`, name: d.grantee, year: String(year), current, verified: d.confidence === 'verified' && d.isFormulaVerified });
    nodeCount++;
  });

  if (max <= 0 || max >= nodeCount) return { items, hidden: 0 };

  let nodesSeen = 0;
  let startIdx = items.length;
  for (let i = items.length - 1; i >= 0; i--) {
    if (items[i].kind === 'node') nodesSeen++;
    startIdx = i;
    if (nodesSeen === max) break;
  }
  // pull in the gap immediately before this window, if there is one, so the truncated view never shows a lone "unrecorded" node with no context for why
  if (startIdx > 0 && items[startIdx - 1].kind === 'gap') startIdx -= 1;

  return { items: items.slice(startIdx), hidden: nodeCount - max };
}

/** 6rem to 10rem, scaled by how long the previous owner held (capped at 8 years); an unknown hold gets the midpoint. */
const linkWidth = (years?: number) => `${years === undefined ? 8 : Math.max(6, Math.min(10, 6 + (Math.min(years, 8) / 8) * 4))}rem`;

/**
 * Owner-to-owner lineage, oldest to newest. Each connector is the deed
 * itself, spaced by how long the prior owner held; a missing deed breaks the
 * spine with a wider amber-tinted gap instead of a same-weight segment. The
 * current owner ends the strip as an arrow into whatever names it above
 * (the Ownership card's own headline) when `hideCurrentName` is set, so the
 * name isn't printed twice.
 */
export function ChainStrip({
  deeds,
  max = 0,
  onSelect,
  onAddMissing,
  hideCurrentName,
}: {
  deeds: DeedRecord[];
  max?: number;
  onSelect?: (deedId: string) => void;
  onAddMissing?: (missing: MissingDeed) => void;
  hideCurrentName?: boolean;
}) {
  const { items, hidden } = buildItems(deeds, max);
  const listRef = useRef<HTMLOListElement>(null);
  // The current owner is the right end, so keep it in view even if that crops something on the
  // left — the truncation above already guarantees the nearest gap survives that crop, and the
  // worst case on the right (hideCurrentName's small arrow) is harmless to clip.
  useEffect(() => {
    const el = listRef.current?.parentElement;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [items.length]);
  if (!items.length) return <p className="text-label text-dm-dim">No deeds on file yet.</p>;

  return (
    <div role="group" aria-label="Ownership chain, oldest to newest" tabIndex={0} className="scroll-thin overflow-x-auto rounded pb-2">
      <ol ref={listRef} className="flex items-end gap-0">
        {hidden > 0 && (
          <li className="flex shrink-0 flex-col self-end pr-3">
            <span className="tnum pb-[3px] text-label text-dm-dim">+{hidden} earlier</span>
            <span aria-hidden className={SPINE} />
          </li>
        )}
        {items.map((it) => {
          if (it.kind === 'node') {
            if (it.current && hideCurrentName) {
              return (
                <li key={it.key} className="flex shrink-0 flex-col items-center pl-1.5">
                  <ChevronRight className={`h-4 w-4 pb-[3px] ${it.verified ? 'text-dm-blue' : 'text-dm-dim'}`} aria-hidden />
                  <span className="sr-only">{it.name} (current owner{it.verified ? ', verified' : ''})</span>
                  <span aria-hidden className={`${SPINE} w-6`} />
                </li>
              );
            }
            return (
              <li key={it.key} className={`w-[7.5rem] shrink-0 ${it.unrecorded ? 'rounded-md border border-dashed border-dm-amber bg-dm-amber/10 px-2 py-1' : ''}`}>
                <div
                  className={`line-clamp-2 leading-snug ${it.current ? 'text-[16px] font-semibold text-dm-text' : 'text-body font-medium text-dm-text'} ${it.current && it.verified ? 'border-b-2 border-dm-blue pb-0.5' : ''}`}
                  title={it.name}
                >
                  {it.name}
                  {it.current && <span className="sr-only"> (current owner)</span>}
                </div>
                <div className="tnum mt-0.5 text-[12px] text-dm-dim">{it.unrecorded ? 'not in the chain' : (it.year ?? '')}</div>
                <span aria-hidden className={SPINE} />
              </li>
            );
          }
          if (it.kind === 'gap') {
            const m = it.missing;
            const label = `Missing deed between ${m.from} and ${m.to}`;
            return (
              <li key={it.key} className="flex w-28 shrink-0 flex-col items-center rounded bg-dm-amber/10 px-1 py-0.5">
                {onAddMissing ? (
                  <button
                    type="button"
                    onClick={() => onAddMissing(m)}
                    aria-label={`${label}. Add it.`}
                    title={`${label}. Add it.`}
                    className="rounded px-1 text-center text-[12px] font-medium leading-snug text-dm-amber underline decoration-dashed underline-offset-2 hover:bg-dm-amber/20"
                  >
                    missing deed, add
                  </button>
                ) : (
                  <span className="text-[12px] font-medium text-dm-amber" aria-label={label}>
                    missing deed
                  </span>
                )}
                <span aria-hidden className="mt-1 w-full border-t-[3px] border-dashed border-dm-amber" />
              </li>
            );
          }
          const d = it.deed;
          const stampBad = !d.isFormulaVerified;
          const name = `Deed recorded ${fmtDate(d.recordingDate)}, ${d.grantor} to ${d.grantee}${d.consideration > 0 ? `, ${compactUsd(d.consideration)}` : ''}${d.consideration > 0 ? (stampBad ? `, stamps expect $${expectedExcise(d.consideration).toLocaleString('en-US')}` : ', stamps match') : ''}. Open.`;
          return (
            <li key={it.key} className="flex shrink-0 flex-col px-1" style={{ width: linkWidth(it.years) }}>
              <button
                type="button"
                onClick={() => onSelect?.(d.id)}
                aria-label={name}
                title={[d.instrumentNumber && `Instrument ${d.instrumentNumber}`, d.book && d.page && `Book ${d.book}, page ${d.page}`, d.source].filter(Boolean).join(' · ') || 'Open deed'}
                className="rounded px-1 py-0.5 text-center text-[12px] leading-snug text-dm-dim transition-colors hover:bg-dm-hover hover:text-dm-muted"
              >
                {deedTypeLabel[d.deedType].replace(/ Deed$/, '')}
                {d.consideration > 0 ? (
                  <span className="tnum block text-dm-muted">{compactUsd(d.consideration)}</span>
                ) : null}
                {d.consideration > 0 && (
                  <span className={`block ${stampBad ? 'font-medium text-dm-amber' : ''}`}>{stampBad ? 'stamps expect $' + expectedExcise(d.consideration).toLocaleString('en-US') : 'stamps match'}</span>
                )}
              </button>
              <span aria-hidden className={SPINE} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
