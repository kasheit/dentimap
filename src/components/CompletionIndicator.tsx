import { Check } from 'lucide-react';
import type { DataCompleteness } from '@/lib/completeness';

interface CompletionIndicatorProps {
  state: DataCompleteness;
  noPullNeeded: boolean;
  onToggleNoPullNeeded: () => void;
}

/**
 * Progress bar over the tracked "gap" fields, with a manual override for
 * locations where Eshan has decided no further data pull is needed (a
 * confirmed dead end, or a field that will just never be public).
 */
export function CompletionIndicator({
  state,
  noPullNeeded,
  onToggleNoPullNeeded,
}: CompletionIndicatorProps) {
  const { fieldsFilled, fieldsTotal, complete } = state;
  const percent = complete ? 100 : Math.round((fieldsFilled / fieldsTotal) * 100);

  if (complete) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400">
          <Check className="h-3.5 w-3.5" />
          {noPullNeeded ? 'No further pull needed' : 'All tracked fields confirmed'}
        </span>
        {noPullNeeded && (
          <button
            onClick={onToggleNoPullNeeded}
            className="text-[11px] font-medium text-navy-400 transition-colors hover:text-navy-700 dark:text-navy-300 dark:hover:text-white"
          >
            Reset
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-navy-700">
        <div
          className="h-full rounded-full bg-teal-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="whitespace-nowrap font-mono text-[11px] text-navy-400 dark:text-navy-300">
        {fieldsFilled}/{fieldsTotal} fields
      </span>
      <button
        onClick={onToggleNoPullNeeded}
        className="whitespace-nowrap rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-navy-500 transition-colors hover:border-navy-300 hover:text-navy-800 dark:border-navy-600 dark:text-navy-300 dark:hover:border-navy-400 dark:hover:text-white"
      >
        No pull needed
      </button>
    </div>
  );
}
