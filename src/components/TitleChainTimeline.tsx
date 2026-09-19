import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Trash2 } from 'lucide-react';
import { expectedExcise } from '@/lib/deedParser';
import { deedTypeLabel, fmtDate, usd } from '@/lib/format';
import { chainBreaks, sortedDeeds, useDentimap } from '@/lib/store';
import type { DeedRecord } from '@/lib/types';
import { Empty, FormulaChip, VerifyChip } from './Chips';

export function TitleChainTimeline({ deeds }: { deeds: DeedRecord[] }) {
  const deleteDeed = useDentimap((s) => s.deleteDeed);
  const [arming, setArming] = useState<string | null>(null);
  const chain = useMemo(() => sortedDeeds(deeds), [deeds]);
  const breaks = useMemo(() => new Map(chainBreaks(chain).map((b) => [b.deedId, b])), [chain]);

  if (!chain.length) return <Empty>No recorded instruments yet. Paste a county record above to start the chain of title.</Empty>;

  return (
    <ol className="relative space-y-4 pl-6 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-dm-border">
      {chain.map((d, i) => {
        const brk = breaks.get(d.id);
        const isPlat = d.deedType === 'subdivision_plat';
        const current = i === chain.length - 1;
        return (
          <li key={d.id} className="relative">
            <span
              className={`absolute -left-6 top-4 h-[15px] w-[15px] rounded-full border-2 bg-dm-bg ${
                current ? 'border-dm-blue shadow-[0_0_0_4px_rgba(56,189,248,0.12)]' : 'border-dm-dim'
              }`}
            />
            <article className="rounded-lg border border-dm-border bg-dm-bg p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-medium">{fmtDate(d.recordingDate)}</span>
                    <span className="rounded border border-dm-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-dm-muted">
                      {deedTypeLabel[d.deedType]}
                    </span>
                    {current && (
                      <span className="rounded border border-dm-blue/30 bg-dm-blue/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-dm-blue">
                        Present holding
                      </span>
                    )}
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-dm-dim">
                    {d.instrumentNumber && <>Inst {d.instrumentNumber}</>}
                    {d.book && d.page && <>{d.instrumentNumber ? ' · ' : ''}Bk {d.book} / Pg {d.page}</>}
                    {d.platReference && <> · {d.platReference}</>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <VerifyChip state={d.confidence} />
                  {arming === d.id ? (
                    <button className="btn border-dm-red/40 text-dm-red" onClick={() => { deleteDeed(d.id); setArming(null); }} onBlur={() => setArming(null)} autoFocus>
                      Confirm delete
                    </button>
                  ) : (
                    <button className="rounded p-1.5 text-dm-dim transition-colors hover:bg-dm-hover hover:text-dm-red" title="Remove instrument" onClick={() => setArming(d.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="text-dm-muted">{d.grantor}</span>
                <ArrowRight className="h-3.5 w-3.5 text-dm-dim" />
                <span className="font-medium">{d.grantee}</span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {!isPlat || d.consideration > 0 ? (
                  <>
                    <span className="font-mono text-base font-semibold text-dm-text">{usd(d.consideration)}</span>
                    <FormulaChip consideration={d.consideration} stamps={d.exciseTaxStamps} ok={d.isFormulaVerified} expected={expectedExcise(d.consideration)} />
                  </>
                ) : (
                  <span className="font-mono text-[11px] text-dm-dim">No consideration — plat / subdivision record</span>
                )}
              </div>

              <div className="mt-2 text-[11px] text-dm-dim">Source: {d.source}</div>

              {brk && (
                <p className="mt-3 flex items-start gap-2 rounded-md border border-dm-amber/30 bg-dm-amber/10 px-3 py-2 text-xs text-dm-amber">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Chain gap: the prior instrument conveyed to <b className="font-medium">{brk.expected}</b>, but this grantor is <b className="font-medium">{brk.found}</b>. An intermediate deed may be missing.
                  </span>
                </p>
              )}
            </article>
          </li>
        );
      })}
    </ol>
  );
}
