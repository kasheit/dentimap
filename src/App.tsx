import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { Header } from '@/components/Header';
import { OPEN_SEARCH_EVENT, SearchPalette } from '@/components/SearchPalette';
import { FOCUS_SEARCH } from '@/components/LocationsTable';
import { startSync, useDentimap } from '@/lib/store';
import type { TabId } from '@/lib/store';
import { DeedsView } from '@/views/DeedsView';
import { EntitiesView } from '@/views/EntitiesView';
import { GlossaryView } from '@/views/GlossaryView';
import { HomeView } from '@/views/HomeView';
import { PeopleView } from '@/views/PeopleView';
import { PropertiesView } from '@/views/PropertiesView';

const OUT_MS = 90;

/** Fades the outgoing tab down-and-out, then eases the new one up-and-in, instead of a hard cut. */
function TabViewport({ tab }: { tab: TabId }) {
  const [renderedTab, setRenderedTab] = useState(tab);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (tab === renderedTab) return;
    setLeaving(true);
    const t = setTimeout(() => {
      setRenderedTab(tab);
      setLeaving(false);
    }, OUT_MS);
    return () => clearTimeout(t);
  }, [tab, renderedTab]);

  return (
    <div key={renderedTab} className={leaving ? 'animate-view-out' : 'animate-view-in'}>
      {renderedTab === 'home' && <HomeView />}
      {renderedTab === 'properties' && <PropertiesView />}
      {renderedTab === 'entities' && <EntitiesView />}
      {renderedTab === 'people' && <PeopleView />}
      {renderedTab === 'deeds' && <DeedsView />}
      {renderedTab === 'glossary' && <GlossaryView />}
    </div>
  );
}

function UndoToast() {
  const { lastDeleted, undoDelete, dismissUndo } = useDentimap();
  useEffect(() => {
    if (!lastDeleted) return;
    const t = setTimeout(dismissUndo, 8000);
    return () => clearTimeout(t);
  }, [lastDeleted, dismissUndo]);
  if (!lastDeleted) return null;
  return (
    <div role="status" className="animate-sheet-in fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-lg border border-dm-border bg-dm-raised px-4 py-2.5 text-label shadow-pop">
      <span className="text-dm-muted">Deed removed: {lastDeleted.grantor} to {lastDeleted.grantee}</span>
      <button className="font-medium text-dm-blue transition-colors hover:underline" onClick={undoDelete}>Undo</button>
    </div>
  );
}

function ConflictBanner() {
  const sync = useDentimap((s) => s.sync);
  const resolve = useDentimap((s) => s.resolveConflict);
  if (sync !== 'conflict') return null;
  return (
    <div className="animate-fade-in border-b border-dm-red/30 bg-dm-red/10 px-4 py-2.5 text-label text-dm-red sm:px-6">
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
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const open = () => setSearchOpen(true);
    window.addEventListener(OPEN_SEARCH_EVENT, open);
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, open);
  }, []);

  useEffect(() => {
    startSync();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        setTab('properties');
        useDentimap.getState().select('');
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
      <TabViewport tab={tab} />
      <UndoToast />
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
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
