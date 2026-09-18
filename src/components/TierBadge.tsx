import type { ConfirmationTier } from '@/types';
import { sourceTier } from '@/data';

interface TierBadgeProps {
  tier: ConfirmationTier;
  label: string;
  size?: 'sm' | 'md';
}

export function TierBadge({ tier, label, size = 'sm' }: TierBadgeProps) {
  const info = sourceTier(tier);
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ${padding}`}
      style={{
        backgroundColor: info.bgColor,
        color: info.textColor,
        ['--tw-ring-color' as string]: `${info.color}40`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: info.color }} />
      <span className="font-mono tracking-tight">{label}</span>
    </span>
  );
}
