import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Users, Building2, Table2, CloudOff, FileText, Landmark } from 'lucide-react';
import { backupDue, exportCsv, exportJson } from '@/lib/exporters';
import { OPEN_SEARCH_EVENT } from './SearchPalette';
import { isValidData, useDentimap } from '@/lib/store';
import type { TabId } from '@/lib/store';
import { supabase } from '@/lib/supabase';

const tabs: { id: TabId; label: string; icon: typeof Building2 }[] = [
  { id: 'properties', label: 'Locations', icon: Building2 },
  { id: 'matrix', label: 'Matrix', icon: Table2 },
  { id: 'entities', label: 'Entities', icon: Landmark },
  { id: 'people', label: 'People', icon: Users },
  { id: 'deeds', label: 'Deeds', icon: FileText },
];

function SyncBadge() {
  const sync = useDentimap((s) => s.sync);
  const message = useDentimap((s) => s.syncMessage);
  if (sync === 'off' || sync === 'synced' || sync === 'connecting' || sync === 'saving') return null;
  if (sync === 'conflict') {
    return (
      <span className="hidden items-center gap-1.5 tnum text-[13px] text-dm-red md:flex" title={message}>
        <AlertTriangle className="h-3.5 w-3.5" /> Conflict
      </span>
    );
  }
  if (sync === 'error') {
    return (
      <span className="hidden items-center gap-1.5 tnum text-[13px] text-dm-amber md:flex" title={message}>
        <CloudOff className="h-3.5 w-3.5" /> Not syncing
      </span>
    );
  }
  return null;
}

export function Header() {
  const { tab, setTab, importData, properties } = useDentimap();
  const [due, setDue] = useState(() => backupDue());
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const snapshot = () => {
    const { properties, deeds, entities, people, activity } = useDentimap.getState();
    return { properties, deeds, entities, people, activity };
  };

  const onImport = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!isValidData(parsed)) throw new Error('shape');
      if (!confirm(`Merge ${parsed.properties.length} locations, ${parsed.deeds.length} deeds and ${parsed.entities.length} entities from "${file.name}"? Records with a matching ID are overwritten by the file; nothing else is removed.`)) return;
      const { added, updated } = importData(parsed);
      setNotice(`Imported: ${added} new, ${updated} updated.`);
    } catch {
      setNotice('Import failed — not a valid Dentimap JSON export.');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const menuItem = 'flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-dm-muted transition-colors hover:bg-dm-hover hover:text-dm-text';

  return (
    <header className="z-40 lg:sticky lg:top-0 border-b border-dm-border bg-dm-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1680px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6">
        <img src="/dentimap-logo.png" alt="Dentimap" className="h-8 w-auto select-none brightness-150" draggable={false} />

        <nav className="order-3 -mb-2.5 flex w-full gap-1 overflow-x-auto scroll-thin lg:order-none lg:mb-0 lg:w-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-[13px] font-medium transition-colors lg:py-2 ${
                tab === id ? 'text-dm-text' : 'text-dm-dim hover:text-dm-muted'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {tab === id && <span className="absolute inset-x-2 bottom-0 h-px bg-dm-blue" />}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <SyncBadge />
          {due && properties.length > 0 && (
            <button
              className="hidden text-[13px] text-dm-amber transition-colors hover:text-dm-text md:inline"
              title="You have not downloaded a backup in over a week"
              onClick={() => {
                exportJson(snapshot());
                setDue(false);
                setNotice('Backup downloaded.');
              }}
            >
              Back up
            </button>
          )}
          <button className="btn" onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))} title="Search everything (Ctrl K)">
            Search
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
          <button className="btn" onClick={() => fileRef.current?.click()} title="Import a Dentimap JSON export">
            Import
          </button>
          <div className="relative" ref={menuRef}>
            <button className="btn" onClick={() => setMenu((m) => !m)}>
              Export
            </button>
            {menu && (
              <div className="absolute right-0 mt-1.5 w-52 overflow-hidden rounded-lg border border-dm-border bg-dm-surface shadow-2xl shadow-black/50">
                <button className={menuItem} onClick={() => { exportJson(snapshot()); setDue(false); setMenu(false); }}>
                  Full backup (JSON)
                </button>
                {(['properties', 'deeds', 'entities'] as const).map((w) => (
                  <button key={w} className={menuItem} onClick={() => { exportCsv(snapshot(), w); setMenu(false); }}>
                    {(w === 'properties' ? 'Locations' : w[0].toUpperCase() + w.slice(1))} (CSV)
                  </button>
                ))}
                <div className="border-t border-dm-border" />
                {supabase && (
                  <button className={menuItem} onClick={() => supabase?.auth.signOut()}>
                    Sign out
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {notice && (
        <div className="border-t border-dm-border bg-dm-surface px-6 py-1.5 text-center tnum text-[13px] text-dm-muted">{notice}</div>
      )}
    </header>
  );
}
