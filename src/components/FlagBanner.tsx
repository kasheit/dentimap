import { AlertTriangle } from 'lucide-react';
import type { ConfirmationTier } from '@/types';
import { sourceTier } from '@/data';

interface FlagBannerProps {
  tier: ConfirmationTier;
  text: string;
}

export function FlagBanner({ tier, text }: FlagBannerProps) {
  const info = sourceTier(tier);
  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-border px-4 py-3"
      style={{ backgroundColor: info.bgColor }}
    >
      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: info.textColor }} />
      <p className="text-sm leading-relaxed" style={{ color: info.textColor }}>
        {text}
      </p>
    </div>
  );
}
