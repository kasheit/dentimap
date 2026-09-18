import { useState } from 'react';
import { NavBar } from '@/components/NavBar';
import { SourceLegend } from '@/components/SourceLegend';
import { CorporateLineageTab } from '@/tabs/CorporateLineageTab';
import { RealEstateTab } from '@/tabs/RealEstateTab';
import { FinancesTab } from '@/tabs/FinancesTab';
import { TimelineTab } from '@/tabs/TimelineTab';
import type { TabId } from '@/types';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('corporate');

  return (
    <div className="min-h-screen bg-page">
      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        <SourceLegend />
        {activeTab === 'corporate' && <CorporateLineageTab />}
        {activeTab === 'realestate' && <RealEstateTab />}
        {activeTab === 'finances' && <FinancesTab />}
        {activeTab === 'timeline' && <TimelineTab />}
      </main>
    </div>
  );
}

export default App;
