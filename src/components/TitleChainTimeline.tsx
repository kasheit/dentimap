import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { expectedExcise } from '@/lib/deedParser';
import { deedTypeLabel, fmtDate, usd } from '@/lib/format';
import { chainBreaks, sortedDeeds, useDentimap } from '@/lib/store';
import type { DeedRecord } from '@/lib/types';
import { Empty, FormulaChip, VerifyChip } from './Chips';
import { canSaveDraft, DeedForm, draftFromDeed, draftToDeed } from './DeedForm';
import type { Draft } from './DeedForm';

export function TitleChainTimeline({ deeds }: { deeds: DeedRecord[] }) {
  const deleteDeed = useDentimap((s) => s.deleteDeed);
  const updateDeed = useDentimap((s) => s.updateDeed);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [arming, setArming] = useState<string | null>(null);
  const chain = useMemo(() => sortedDeeds(deeds), [deeds]);
  const breaks = useMemo(() => new Map(chainBreaks(chain).map((b) => [b.deedId, b])), [chain]);

  if (!chain.length) return <Empty>No instruments recorded.</Empty>;

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
                current ? 'border-dm-text' : 'border-dm-dim'
              }`}
            />
            <article className="rounded-lg border border-dm-border bg-dm-bg p-4">
              {editing === d.id && draft ? (
                <div className="space-y-4">
                  <DeedForm draft={draft} onChange={setDraft} withConfidence />
                  <div className="flex justify-end gap-2">
                    <button className="btn" onClick={() => setEditing(null)}>Cancel</button>
                    <button
                      className="btn btn-primary"
                      disabled={!canSaveDraft(draft)}
                      onClick={() => {
                        updateDeed(d.id, draftToDeed(draft, d));
                        setEditing(null);
                      }}
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              ) : (
              <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="tnum text-sm font-medium">{fmtDate(d.recordingDate)}</span>
                    <span className="text-xs text-dm-muted">{deedTypeLabel[d.deedType]}</span>
                    {current && (
                      <span className="text-[11px] font-medium text-dm-text">Current holder</span>
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
                  <button
                    className="rounded p-1.5 text-dm-dim transition-colors hover:bg-dm-hover hover:text-dm-text"
                    title="Edit instrument"
                    aria-label="Edit instrument"
                    onClick={() => {
                      setDraft(draftFromDeed(d));
                      setEditing(d.id);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {arming === d.id ? (
                    <button className="btn border-dm-red/40 text-dm-red" onClick={() => { deleteDeed(d.id); setArming(null); }} onBlur={() => setArming(null)} autoFocus>
                      Remove?
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
                    <span className="tnum text-base font-semibold text-dm-text">{usd(d.consideration)}</span>
                    {!d.isFormulaVerified && <FormulaChip consideration={d.consideration} stamps={d.exciseTaxStamps} ok={false} expected={expectedExcise(d.consideration)} />}
                  </>
                ) : (
                  <span className="tnum text-[11px] text-dm-dim">No consideration — plat / subdivision record</span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-dm-dim">
                <span>Source: {d.source}</span>
                {d.documentUrl && (
                  <a href={d.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-dm-blue hover:underline">
                    Document <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {brk && (
                <p className="mt-3 flex items-start gap-2 rounded-md border border-dm-amber/30 bg-dm-amber/10 px-3 py-2 text-xs text-dm-amber">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Chain gap: the prior instrument conveyed to <b className="font-medium">{brk.expected}</b>, but this grantor is <b className="font-medium">{brk.found}</b>. An intermediate deed may be missing.
                  </span>
                </p>
              )}
              </>
              )}
            </article>
          </li>
        );
      })}
    </ol>
  );
}
