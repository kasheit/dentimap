import { useEffect } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { Header } from '@/components/Header';
import { FOCUS_SEARCH } from '@/components/Sidebar';
import { startSync, useDentimap } from '@/lib/store';
import { DeedsView } from '@/views/DeedsView';
import { EntitiesView } from '@/views/EntitiesView';
import { MatrixView } from '@/views/MatrixView';
import { PropertiesView } from '@/views/PropertiesView';

function UndoToast() {
  const { lastDeleted, undoDelete, dismissUndo } = useDentimap();
  useEffect(() => {
    if (!lastDeleted) return;
    const t = setTimeout(dismissUndo, 8000);
    return () => clearTimeout(t);
  }, [lastDeleted, dismissUndo]);
  if (!lastDeleted) return null;
  return (
    <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-lg border border-dm-border bg-dm-raised px-4 py-2.5 text-[13px] shadow-xl shadow-black/40">
      <span className="text-dm-muted">Instrument removed</span>
      <button className="font-medium text-dm-blue hover:underline" onClick={undoDelete}>Undo</button>
    </div>
  );
}

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
      {tab === 'matrix' && <MatrixView />}
      {tab === 'entities' && <EntitiesView />}
      {tab === 'deeds' && <DeedsView />}
      <UndoToast />
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
