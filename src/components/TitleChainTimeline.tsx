import { useMemo, useState } from 'react';
import { ArrowRight, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { expectedExcise } from '@/lib/deedParser';
import { compactUsd, deedTypeLabel, fmtDate, usd } from '@/lib/format';
import { sortedDeeds, useDentimap } from '@/lib/store';
import type { DeedRecord } from '@/lib/types';
import { Empty, FormulaChip, VerifyChip } from './Chips';

/** One compact row per instrument, newest first. The chain itself is drawn once, in the strip above the tabs. */
export function TitleChainTimeline({ deeds, onEdit }: { deeds: DeedRecord[]; onEdit: (deedId: string) => void }) {
  const deleteDeed = useDentimap((s) => s.deleteDeed);
  const [arming, setArming] = useState<string | null>(null);
  const chain = useMemo(() => sortedDeeds(deeds), [deeds]);

  if (!chain.length) return <Empty>No instruments recorded.</Empty>;

  return (
    <ul className="divide-y divide-dm-border/70 rounded-lg border border-dm-border">
      {[...chain].reverse().map((d) => {
        const isPlat = d.deedType === 'subdivision_plat';
        const current = d.id === chain[chain.length - 1].id;
        return (
          <li key={d.id} className="px-4 py-3">
            <div className="grid items-start gap-x-4 gap-y-1 sm:grid-cols-[6.5rem_9rem_minmax(0,1fr)_7.5rem_auto]">
              <div>
                <div className="tnum text-label font-medium">{fmtDate(d.recordingDate)}</div>
                {current && <div className="text-[12px] font-medium text-dm-text">Current owner</div>}
              </div>
              <div className="text-label text-dm-muted">{deedTypeLabel[d.deedType]}</div>
              <div className="min-w-0 text-label">
                <div className="text-dm-muted">{d.grantor}</div>
                <div className="flex items-start gap-1.5 font-medium">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dm-dim" aria-hidden />
                  <span>{d.grantee}</span>
                </div>
              </div>
              <div className="sm:text-right">
                {!isPlat || d.consideration > 0 ? (
                  <span className="tnum text-label font-medium" title={usd(d.consideration)}>
                    {compactUsd(d.consideration)}
                  </span>
                ) : (
                  <span className="text-label text-dm-dim">plat</span>
                )}
              </div>
              <div className="flex items-center gap-1 sm:justify-end">
                <VerifyChip state={d.confidence} />
                <button className="rounded p-1.5 text-dm-muted transition-colors hover:bg-dm-hover hover:text-dm-text" title="Edit deed" aria-label={`Edit deed recorded ${fmtDate(d.recordingDate)}`} onClick={() => onEdit(d.id)}>
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                {arming === d.id ? (
                  <button
                    className="btn border-dm-red/40 text-dm-red"
                    onClick={() => {
                      deleteDeed(d.id);
                      setArming(null);
                    }}
                    onBlur={() => setArming(null)}
                    autoFocus
                  >
                    Remove?
                  </button>
                ) : (
                  <button className="rounded p-1.5 text-dm-muted transition-colors hover:bg-dm-hover hover:text-dm-red" title="Remove deed" aria-label={`Remove deed recorded ${fmtDate(d.recordingDate)}`} onClick={() => setArming(d.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {(!isPlat || d.consideration > 0) && !d.isFormulaVerified && (
              <div className="mt-1.5 sm:pl-[7.5rem]">
                <FormulaChip consideration={d.consideration} stamps={d.exciseTaxStamps} ok={false} expected={expectedExcise(d.consideration)} />
              </div>
            )}

            {(d.instrumentNumber || (d.book && d.page) || d.platReference || d.source || d.documentUrl) && (
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[12px] text-dm-dim sm:pl-[7.5rem]">
                {d.instrumentNumber && (
                  <span>
                    Instrument <span className="font-mono">{d.instrumentNumber}</span>
                  </span>
                )}
                {d.book && d.page && (
                  <span>
                    Book <span className="font-mono">{d.book}</span>, page <span className="font-mono">{d.page}</span>
                  </span>
                )}
                {d.platReference && <span>{d.platReference}</span>}
                {d.source && <span>Source: {d.source}</span>}
                {d.documentUrl && (
                  <a href={d.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-dm-blue hover:underline">
                    Document <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
