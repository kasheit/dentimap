import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  sublabel: string;
  change?: { value: string; positive: boolean; caption: string };
  icon: LucideIcon;
  index: number;
}

export function KpiCard({ label, value, sublabel, change, icon: Icon, index }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover dark:border-navy-700 dark:bg-navy-800"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="label-eyebrow">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-navy-800 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-[13px] text-navy-400 dark:text-navy-300">{sublabel}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-300 dark:group-hover:bg-teal-500/20">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              change.positive
                ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
            }`}
          >
            {change.positive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {change.value}
          </span>
          <span className="text-xs text-navy-400 dark:text-navy-300">{change.caption}</span>
        </div>
      )}
    </motion.div>
  );
}
