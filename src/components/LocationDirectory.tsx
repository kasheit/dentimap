import { motion } from 'framer-motion';
import { Hospital, MapPin } from 'lucide-react';
import { Tooth } from '@/components/icons/Tooth';
import { DataStatusBadge } from '@/components/DataStatusBadge';
import type { Location, AssetType } from '@/types';
import { assetTypeShort } from '@/lib/format';

interface LocationDirectoryProps {
  locations: Location[];
  filter: AssetType | 'all';
  onFilterChange: (f: AssetType | 'all') => void;
  onSelect: (loc: Location) => void;
  selectedId?: string;
}

const FILTERS: { key: AssetType | 'all'; label: string }[] = [
  { key: 'all', label: 'All assets' },
  { key: 'dental', label: 'Dental practices' },
  { key: 'asc', label: 'ASCs' },
  { key: 'dual', label: 'Dual-purpose' },
];

function typeBadgeClass(t: AssetType): string {
  switch (t) {
    case 'dental':
      return 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300';
    case 'asc':
      return 'bg-slate-200 text-navy-700 dark:bg-navy-700 dark:text-navy-200';
    case 'dual':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200';
  }
}

export function LocationDirectory({
  locations,
  filter,
  onFilterChange,
  onSelect,
  selectedId,
}: LocationDirectoryProps) {
  const filtered =
    filter === 'all' ? locations : locations.filter((l) => l.assetType === filter);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-slate-200 bg-white shadow-card dark:border-navy-700 dark:bg-navy-800"
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-navy-700 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-navy-800 dark:text-white">
            Location directory
          </h2>
          <p className="mt-0.5 text-[13px] text-navy-400 dark:text-navy-300">
            {filtered.length} of {locations.length} records shown
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-navy-700/60">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => onFilterChange(f.key)}
              className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.key
                  ? 'text-navy-800 dark:text-white'
                  : 'text-navy-400 hover:text-navy-700 dark:text-navy-300 dark:hover:text-white'
              }`}
            >
              {filter === f.key && (
                <motion.span
                  layoutId="dir-filter"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-navy-600"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      <ul className="divide-y divide-slate-100 dark:divide-navy-700/60">
        {filtered.map((loc, i) => {
          const isSelected = loc.id === selectedId;
          return (
            <motion.li
              key={loc.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
            >
              <motion.button
                onClick={() => onSelect(loc)}
                whileTap={{ scale: 0.985 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors ${
                  isSelected
                    ? 'bg-teal-50/70 dark:bg-teal-500/10'
                    : 'hover:bg-slate-50 dark:hover:bg-navy-700/40'
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    loc.assetType === 'asc'
                      ? 'bg-navy-100 text-navy-600 dark:bg-navy-700 dark:text-navy-200'
                      : 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300'
                  }`}
                >
                  {loc.assetType === 'asc' ? (
                    <Hospital className="h-5 w-5" strokeWidth={2} />
                  ) : (
                    <Tooth className="h-5 w-5" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-navy-800 dark:text-white">
                      {loc.name}
                    </p>
                    <span className="shrink-0 font-mono text-[10px] font-medium text-navy-400 dark:text-navy-300">
                      {loc.recordId}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-navy-400 dark:text-navy-300">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">
                      {loc.city}, {loc.state}
                    </span>
                  </div>
                </div>

                <DataStatusBadge location={loc} />

                <span
                  className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-block ${typeBadgeClass(
                    loc.assetType,
                  )}`}
                >
                  {assetTypeShort(loc.assetType)}
                </span>
              </motion.button>
            </motion.li>
          );
        })}
      </ul>
    </motion.section>
  );
}
