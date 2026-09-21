import { useEffect } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { Header } from '@/components/Header';
import { FOCUS_SEARCH } from '@/components/Sidebar';
import { startSync, useDentimap } from '@/lib/store';
import { DeedsView } from '@/views/DeedsView';
import { EntitiesView } from '@/views/EntitiesView';
import { MatrixView } from '@/views/MatrixView';
import { PeopleView } from '@/views/PeopleView';
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

function ConflictBanner() {
  const sync = useDentimap((s) => s.sync);
  const resolve = useDentimap((s) => s.resolveConflict);
  if (sync !== 'conflict') return null;
  return (
    <div className="border-b border-dm-red/30 bg-dm-red/10 px-4 py-2.5 text-[13px] text-dm-red sm:px-6">
      <div className="mx-auto flex max-w-[1680px] flex-wrap items-center gap-x-4 gap-y-2">
        <span className="flex-1">This registry was changed somewhere else. Your latest edits are not saved yet.</span>
        <button className="btn" onClick={() => resolve('remote')}>Load latest (discard mine)</button>
        <button className="btn" onClick={() => resolve('mine')}>Keep mine (overwrite)</button>
      </div>
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
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !typing)) {
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
      <ConflictBanner />
      {tab === 'properties' && <PropertiesView />}
      {tab === 'matrix' && <MatrixView />}
      {tab === 'entities' && <EntitiesView />}
      {tab === 'people' && <PeopleView />}
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
