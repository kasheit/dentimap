import { AlertCircle, Check, MinusCircle } from 'lucide-react';
import type { Location } from '@/types';
import { dataCompleteness } from '@/lib/completeness';

/**
 * At-a-glance data-pull status symbol for a location: confirmed complete
 * (teal check), a manual "no pull needed" override (slate dash), or an
 * amber count of remaining gap fields.
 */
export function DataStatusBadge({ location }: { location: Location }) {
  const { fieldsFilled, fieldsTotal, complete } = dataCompleteness(location);

  if (location.noPullNeeded) {
    return (
      <span
        title="Marked: no further data pull needed"
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-navy-500 dark:bg-navy-700 dark:text-navy-300"
      >
        <MinusCircle className="h-3 w-3" />
        No pull needed
      </span>
    );
  }

  if (complete) {
    return (
      <span
        title="All tracked fields confirmed"
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"
      >
        <Check className="h-3 w-3" />
        Complete
      </span>
    );
  }

  return (
    <span
      title={`${fieldsTotal - fieldsFilled} field(s) still pending confirmation`}
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
    >
      <AlertCircle className="h-3 w-3" />
      {fieldsTotal - fieldsFilled} gap{fieldsTotal - fieldsFilled === 1 ? '' : 's'}
    </span>
  );
}
