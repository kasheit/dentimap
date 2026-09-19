import { useEffect } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { Header } from '@/components/Header';
import { FOCUS_SEARCH } from '@/components/Sidebar';
import { startSync, useDentimap } from '@/lib/store';
import { DeedsView } from '@/views/DeedsView';
import { EntitiesView } from '@/views/EntitiesView';
import { PropertiesView } from '@/views/PropertiesView';

function Shell() {
  const tab = useDentimap((s) => s.tab);
  const setTab = useDentimap((s) => s.setTab);

  useEffect(() => {
    startSync();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (useDentimap.getState().tab !== 'properties') setTab('properties');
        setTimeout(() => window.dispatchEvent(new Event(FOCUS_SEARCH)), 0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setTab]);

  return (
    <div className="min-h-screen bg-dm-bg">
      <Header />
      {tab === 'properties' && <PropertiesView />}
      {tab === 'entities' && <EntitiesView />}
      {tab === 'deeds' && <DeedsView />}
    </div>
  );
}

export default function App() {
  return (
    <AuthGate>
      <Shell />
    </AuthGate>
  );
}
