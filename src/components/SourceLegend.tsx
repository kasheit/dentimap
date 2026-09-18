import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Info, ChevronDown, FileText, Newspaper, HelpCircle } from 'lucide-react';
import { sourceTiers } from '@/data';
import type { ConfirmationTier } from '@/types';

const tierIcons: Record<ConfirmationTier, typeof FileText> = {
  legal: FileText,
  reported: Newspaper,
  unverified: HelpCircle,
};

export function SourceLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-nested"
      >
        <div className="flex items-center gap-2.5">
          <Info className="h-4 w-4 text-text-secondary" />
          <span className="text-sm font-semibold tracking-wide text-text-primary uppercase">
            Source legend
          </span>
          <span className="text-xs text-text-muted hidden sm:inline">
            Every data point carries one of three confirmation tiers
          </span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
          <ChevronDown className="h-4 w-4 text-text-muted" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="legend-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-5 py-4">
            <div className="grid gap-4 md:grid-cols-3">
              {sourceTiers.map((tier) => {
                const Icon = tierIcons[tier.tier];
                return (
                  <div
                    key={tier.tier}
                    className="rounded-lg border border-border p-4"
                    style={{ backgroundColor: tier.bgColor }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-md"
                        style={{ backgroundColor: `${tier.color}30` }}
                      >
                        <Icon className="h-4 w-4" style={{ color: tier.textColor }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: tier.textColor }}>
                          {tier.name}
                        </p>
                        <p className="font-mono text-[10px] text-text-muted">
                          {tier.color}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed mb-3">
                      {tier.description}
                    </p>
                    <div className="space-y-1">
                      {tier.examples.map((ex) => (
                        <div key={ex} className="flex items-center gap-1.5">
                          <span
                            className="h-1 w-1 rounded-full flex-shrink-0"
                            style={{ backgroundColor: tier.color }}
                          />
                          <span className="font-mono text-[10px] text-text-muted">{ex}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-text-muted leading-relaxed">
              A number with no badge is a bug. When a field is genuinely not applicable (e.g. a
              doctor-affiliated LLC with no PARK-share rollover), use the &ldquo;mark complete&rdquo;
              override rather than leaving it unfilled.
            </p>
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
