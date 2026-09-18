import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, subtitle, children, className = '' }: SectionCardProps) {
  return (
    <section className={`rounded-lg border border-border bg-card ${className}`}>
      <div className="border-b border-border px-5 py-3.5">
        <h2 className="text-sm font-semibold tracking-wide text-text-primary uppercase">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
