import type { SVGProps } from 'react';

/**
 * Lucide doesn't ship a tooth glyph, so this fills the gap for VFD (dental)
 * locations. Drawn filled rather than stroke-only (unlike surrounding lucide
 * icons) because the molar silhouette reads better at 16–24px filled.
 */
export function Tooth({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M12 2c-3.5 0-6.4 2.2-6.8 5.3-.24 1.87.36 3.53.83 4.75.36.93.56 2.44.87 3.55C7.15 16.7 7.7 20 9.3 20c1.09 0 1.5-1.06 1.68-2.32.15-.9.5-1.68 1.02-1.68s.87.78 1.02 1.68C13.2 18.94 13.61 20 14.7 20c1.6 0 2.15-3.3 2.4-4.4.31-1.11.51-2.62.87-3.55.47-1.22 1.07-2.88.83-4.75C18.4 4.2 15.5 2 12 2z" />
    </svg>
  );
}
