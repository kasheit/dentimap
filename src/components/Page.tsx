import type { ReactNode } from 'react';

/** One content column for every view, so the page edge and title never jump between tabs. */
export function PageShell({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-[1280px] p-4 sm:p-6 lg:px-8 lg:py-7">{children}</main>;
}

/** Title with an optional dim count and subtitle, and the view's actions on the right. One primary action per view. */
export function PageHeader({ title, count, subtitle, actions }: { title: string; count?: number; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold leading-8 tracking-tight">
          {title}
          {count !== undefined && <span className="tnum ml-2 font-normal text-dm-dim">{count}</span>}
        </h1>
        {subtitle && <p className="text-label text-dm-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** One empty state everywhere: a short title, one muted line, and at most one action. */
export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="mx-auto max-w-sm py-16 text-center">
      <h2 className="text-body font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-label text-dm-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
