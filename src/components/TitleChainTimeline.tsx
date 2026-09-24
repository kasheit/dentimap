import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { expectedExcise } from '@/lib/deedParser';
import { compactUsd, deedTypeLabel, fmtDate, usd } from '@/lib/format';
import { chainBreaks, sortedDeeds, useDentimap } from '@/lib/store';
import type { DeedRecord } from '@/lib/types';
import { ChainStrip } from './ChainStrip';
import { DeedSheet } from './DeedSheet';
import { Empty, FormulaChip, VerifyChip } from './Chips';

/** The chain as a strip on top and one compact row per instrument below. Editing opens a side sheet. */
export function TitleChainTimeline({ deeds }: { deeds: DeedRecord[] }) {
  const deleteDeed = useDentimap((s) => s.deleteDeed);
  const updateDeed = useDentimap((s) => s.updateDeed);
  const [editing, setEditing] = useState<string | null>(null);
  const [arming, setArming] = useState<string | null>(null);
  const chain = useMemo(() => sortedDeeds(deeds), [deeds]);
  const breaks = useMemo(() => new Map(chainBreaks(chain).map((b) => [b.deedId, b])), [chain]);
  const editingDeed = chain.find((d) => d.id === editing);

  if (!chain.length) return <Empty>No instruments recorded.</Empty>;

  return (
    <div className="space-y-5">
      <ChainStrip deeds={chain} onSelect={setEditing} />

      <ul className="divide-y divide-dm-border/70 rounded-lg border border-dm-border">
        {[...chain].reverse().map((d) => {
          const brk = breaks.get(d.id);
          const isPlat = d.deedType === 'subdivision_plat';
          const current = d.id === chain[chain.length - 1].id;
          return (
            <li key={d.id} className="px-4 py-2.5">
              <div className="grid items-center gap-x-4 gap-y-1 sm:grid-cols-[6.5rem_9rem_minmax(0,1fr)_auto_auto]">
                <span className="tnum text-label font-medium">{fmtDate(d.recordingDate)}</span>
                <span className="text-label text-dm-muted">
                  {deedTypeLabel[d.deedType]}
                  {current && <span className="ml-1.5 font-medium text-dm-text">current</span>}
                </span>
                <span className="flex min-w-0 items-center gap-2 text-label">
                  <span className="truncate text-dm-muted">{d.grantor}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-dm-dim" aria-hidden />
                  <span className="truncate font-medium">{d.grantee}</span>
                </span>
                <span className="flex items-center gap-2 sm:justify-end">
                  {!isPlat || d.consideration > 0 ? (
                    <>
                      <span className="tnum text-label font-medium" title={usd(d.consideration)}>{compactUsd(d.consideration)}</span>
                      {!d.isFormulaVerified && <FormulaChip consideration={d.consideration} stamps={d.exciseTaxStamps} ok={false} expected={expectedExcise(d.consideration)} />}
                    </>
                  ) : (
                    <span className="text-label text-dm-dim">plat</span>
                  )}
                </span>
                <span className="flex items-center gap-1 sm:justify-end">
                  <VerifyChip state={d.confidence} />
                  <button className="rounded p-1.5 text-dm-muted transition-colors hover:bg-dm-hover hover:text-dm-text" title="Edit deed" aria-label={`Edit deed recorded ${fmtDate(d.recordingDate)}`} onClick={() => setEditing(d.id)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {arming === d.id ? (
                    <button className="btn border-dm-red/40 text-dm-red" onClick={() => { deleteDeed(d.id); setArming(null); }} onBlur={() => setArming(null)} autoFocus>
                      Remove?
                    </button>
                  ) : (
                    <button className="rounded p-1.5 text-dm-muted transition-colors hover:bg-dm-hover hover:text-dm-red" title="Remove deed" aria-label={`Remove deed recorded ${fmtDate(d.recordingDate)}`} onClick={() => setArming(d.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </span>
              </div>

              {(d.instrumentNumber || (d.book && d.page) || d.platReference || d.source || d.documentUrl) && (
                <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[12px] text-dm-dim sm:pl-[7.25rem]">
                  {d.instrumentNumber && <span>Instrument <span className="font-mono">{d.instrumentNumber}</span></span>}
                  {d.book && d.page && <span>Book <span className="font-mono">{d.book}</span>, page <span className="font-mono">{d.page}</span></span>}
                  {d.platReference && <span>{d.platReference}</span>}
                  {d.source && <span>Source: {d.source}</span>}
                  {d.documentUrl && (
                    <a href={d.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-dm-blue hover:underline">
                      Document <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}

              {brk && (
                <p className="mt-1.5 flex items-start gap-2 text-label text-dm-amber sm:pl-[7.25rem]">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span>
                    Chain gap: the prior deed conveyed to <b className="font-medium">{brk.expected}</b>, but this grantor is <b className="font-medium">{brk.found}</b>. A deed in between may be missing.
                  </span>
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {editingDeed && (
        <DeedSheet
          deed={editingDeed}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            updateDeed(editingDeed.id, next);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
