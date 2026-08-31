import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { AssetType } from '@/types';
import { assetTypeLabel } from '@/lib/format';

interface PortfolioMixPanelProps {
  counts: Record<AssetType, number>;
}

const COLORS: Record<AssetType, string> = {
  dental: '#1ba877',
  asc: '#2c3d63',
  dual: '#3fc28f',
};

const ORDER: AssetType[] = ['dental', 'asc', 'dual'];

export function PortfolioMixPanel({ counts }: PortfolioMixPanelProps) {
  const data = ORDER.map((t) => ({
    name: assetTypeLabel(t),
    key: t,
    value: counts[t],
  }));
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-navy-700 dark:bg-navy-800"
    >
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-navy-800 dark:text-white">
            Portfolio mix
          </h2>
          <p className="mt-0.5 text-[13px] text-navy-400 dark:text-navy-300">
            Asset composition across {total} clinical real estate records
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="relative h-[180px] w-[180px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={56}
                outerRadius={84}
                paddingAngle={3}
                stroke="none"
                isAnimationActive
                animationDuration={900}
              >
                {data.map((d) => (
                  <Cell key={d.key} fill={COLORS[d.key]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-bold text-navy-800 dark:text-white">
              {total}
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-navy-400 dark:text-navy-300">
              Records
            </span>
          </div>
        </div>

        <ul className="flex-1 space-y-3">
          {data.map((d) => (
            <li key={d.key} className="flex items-center gap-3">
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: COLORS[d.key] }}
              />
              <div className="flex-1">
                <p className="text-[13px] font-medium text-navy-700 dark:text-navy-100">
                  {d.name}
                </p>
              </div>
              <span className="text-sm font-semibold text-navy-800 dark:text-white">
                {d.value}
              </span>
              <span className="w-10 text-right text-xs text-navy-400 dark:text-navy-300">
                {Math.round((d.value / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.section>
  );
}
