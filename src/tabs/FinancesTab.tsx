import { useState } from 'react';
import { motion } from 'framer-motion';
import { SectionCard } from '@/components/SectionCard';
import { TierBadge } from '@/components/TierBadge';
import { FlagBanner } from '@/components/FlagBanner';
import { EditableText } from '@/components/EditableText';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { Users, Building2 } from 'lucide-react';

interface FinanceStat {
  id: string;
  label: string;
  value: string;
  sublabel: string;
}

export function FinancesTab() {
  const [payerStats, setPayerStats] = useState<FinanceStat[]>([
    { id: 'military', label: 'Military / retired military', value: '~30%', sublabel: 'Approximate share of network-wide patient base' },
    { id: 'medicaid', label: 'Medicaid beneficiaries', value: '35–40%', sublabel: 'Range — not a single figure, varies by location' },
  ]);
  const [scaleStats, setScaleStats] = useState<FinanceStat[]>([
    { id: 'reported-offices', label: 'Reported offices', value: '11', sublabel: 'Pediatric dentists rotate across the office network' },
    { id: 'job-listings', label: 'Job-listing count (2022–2024)', value: '8–10', sublabel: 'Public job listings during 2022–2024' },
  ]);
  const [payerNote, setPayerNote] = useState('Ranges shown rather than precise figures — publicly reported data does not support false precision. Both categories together represent roughly 65–70% of the network\'s payer base.');
  const [discrepancyText, setDiscrepancyText] = useState('Public job listings (2022–2024) put VFD at 8–10 locations — cross-check before treating 11 as current.');

  const updatePayer = (id: string, patch: Partial<FinanceStat>) => {
    setPayerStats((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };
  const updateScale = (id: string, patch: Partial<FinanceStat>) => {
    setScaleStats((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const StatCard = ({ stat, onUpdate, icon }: { stat: FinanceStat; onUpdate: (patch: Partial<FinanceStat>) => void; icon: React.ReactNode }) => (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="rounded-lg border border-border bg-nested p-6 transition-colors duration-200 hover:border-text-muted"
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm font-medium text-text-secondary">
          <EditableText value={stat.label} onChange={(v) => onUpdate({ label: v })} className="text-sm" inputClassName="text-sm w-full" />
        </span>
      </div>
      <p className="font-mono text-4xl font-semibold text-text-primary">
        <EditableText value={stat.value} onChange={(v) => onUpdate({ value: v })} mono className="text-4xl font-semibold" inputClassName="text-3xl font-mono font-semibold w-full" />
      </p>
      <p className="mt-2 text-xs text-text-muted">
        <EditableText value={stat.sublabel} onChange={(v) => onUpdate({ sublabel: v })} multiline className="text-xs" inputClassName="text-xs w-full" />
      </p>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <SectionCard title="Payer mix" subtitle="Network-wide patient insurance breakdown">
        <div className="mb-3">
          <TierBadge tier="reported" label="Secondary / reported" size="md" />
        </div>
        <motion.div className="grid gap-4 md:grid-cols-2" variants={staggerContainer} initial="hidden" animate="visible">
          {payerStats.map((stat) => (
            <StatCard key={stat.id} stat={stat} onUpdate={(patch) => updatePayer(stat.id, patch)} icon={<Users className="h-5 w-5 text-reported-text" />} />
          ))}
        </motion.div>
        <p className="mt-4 text-xs text-text-muted leading-relaxed">
          <EditableText value={payerNote} onChange={setPayerNote} multiline className="text-xs" inputClassName="text-xs w-full" />
        </p>
      </SectionCard>

      <SectionCard title="Network scale" subtitle="Operating footprint — discrepancy flagged">
        <div className="mb-3">
          <TierBadge tier="reported" label="Secondary / reported" size="md" />
        </div>
        <motion.div className="grid gap-4 md:grid-cols-2 mb-4" variants={staggerContainer} initial="hidden" animate="visible">
          {scaleStats.map((stat, i) => (
            <StatCard
              key={stat.id}
              stat={stat}
              onUpdate={(patch) => updateScale(stat.id, patch)}
              icon={<Building2 className={`h-5 w-5 ${i === 1 ? 'text-reported-text' : 'text-text-primary'}`} />}
            />
          ))}
        </motion.div>
        <FlagBanner tier="reported" text={discrepancyText} />
      </SectionCard>
    </div>
  );
}
