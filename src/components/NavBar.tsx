import { motion } from 'framer-motion';
import { Building2, MapPin, DollarSign, Clock } from 'lucide-react';
import type { TabId } from '@/types';

interface NavBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: typeof Building2 }[] = [
  { id: 'corporate', label: 'Corporate lineage', icon: Building2 },
  { id: 'realestate', label: 'Real estate', icon: MapPin },
  { id: 'finances', label: 'Finances', icon: DollarSign },
  { id: 'timeline', label: 'Timeline', icon: Clock },
];

export function NavBar({ activeTab, onTabChange }: NavBarProps) {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-page/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-legal-bg ring-1 ring-legal-base/30">
              <Building2 className="h-5 w-5 text-legal-text" />
            </div>
            <div>
              <h1 className="font-mono text-base font-semibold tracking-widest text-text-primary">
                DENTIMAP
              </h1>
              <p className="text-[10px] text-text-muted tracking-wide">
                VFD / Valleygate structural intelligence
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-1 -mb-px overflow-x-auto scrollbar-thin">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`relative flex items-center gap-2 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                  active ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {active && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-legal-base"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
