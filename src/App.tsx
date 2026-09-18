import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NavBar } from '@/components/NavBar';
import { SourceLegend } from '@/components/SourceLegend';
import { CorporateLineageTab } from '@/tabs/CorporateLineageTab';
import { RealEstateTab } from '@/tabs/RealEstateTab';
import { FinancesTab } from '@/tabs/FinancesTab';
import { TimelineTab } from '@/tabs/TimelineTab';
import { tabContentVariants } from '@/lib/motion';
import type { TabId } from '@/types';

const tabComponents: Record<TabId, React.ComponentType> = {
  corporate: CorporateLineageTab,
  realestate: RealEstateTab,
  finances: FinancesTab,
  timeline: TimelineTab,
};

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('corporate');
  const ActiveTabComponent = tabComponents[activeTab];

  return (
    <div className="min-h-screen bg-page">
      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        <SourceLegend />
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <ActiveTabComponent />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
