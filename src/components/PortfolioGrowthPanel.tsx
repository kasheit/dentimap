import { motion } from 'framer-motion';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { portfolioValueGrowth } from '@/data';

export function PortfolioGrowthPanel() {
  const data = portfolioValueGrowth;
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-navy-700 dark:bg-navy-800"
    >
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-navy-800 dark:text-white">
            Portfolio value growth
          </h2>
          <p className="mt-0.5 text-[13px] text-navy-400 dark:text-navy-300">
            Trailing 12 months · USD millions
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
          +16.3%
        </span>
      </div>

      <div className="mt-4 h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#7686ad' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#7686ad' }}
              domain={['dataMin - 2', 'dataMax + 2']}
              tickFormatter={(v) => `$${v}M`}
            />
            <Tooltip
              cursor={{ fill: 'rgba(27,168,119,0.08)' }}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid rgba(15,23,41,0.12)',
                fontSize: 12,
                boxShadow: '0 8px 24px -8px rgba(15,23,41,0.2)',
              }}
              formatter={(v: unknown) => [`${Number(v)}M`, 'Portfolio value']}
            />
            <Bar
              dataKey="value"
              fill="#1ba877"
              radius={[4, 4, 0, 0]}
              maxBarSize={26}
              isAnimationActive
              animationDuration={900}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}
