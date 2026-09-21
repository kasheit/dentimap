import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Building2, Cloud, Table2, CloudOff, Download, FileText, Landmark, Loader2, LogOut, MapPin, Upload } from 'lucide-react';
import { exportCsv, exportJson } from '@/lib/exporters';
import { isValidData, useDentimap } from '@/lib/store';
import type { TabId } from '@/lib/store';
import { supabase } from '@/lib/supabase';

const tabs: { id: TabId; label: string; icon: typeof Building2 }[] = [
  { id: 'properties', label: 'Properties & Facilities', icon: Building2 },
  { id: 'matrix', label: 'Real Estate Matrix', icon: Table2 },
  { id: 'entities', label: 'Ownership Entities', icon: Landmark },
  { id: 'deeds', label: 'Deeds & Title Registry', icon: FileText },
];

function SyncBadge() {
  const sync = useDentimap((s) => s.sync);
  const message = useDentimap((s) => s.syncMessage);
  if (sync === 'off') {
    return (
      <span className="hidden items-center gap-1.5 tnum text-[11px] text-dm-dim md:flex" title="Saved in this browser only">
        <CloudOff className="h-3.5 w-3.5" /> Local
      </span>
    );
  }
  if (sync === 'conflict') {
    return (
      <span className="hidden items-center gap-1.5 tnum text-[11px] text-dm-red md:flex" title={message}>
        <AlertTriangle className="h-3.5 w-3.5" /> Conflict
      </span>
    );
  }
  if (sync === 'error') {
    return (
      <span className="hidden items-center gap-1.5 tnum text-[11px] text-dm-amber md:flex" title={message}>
        <CloudOff className="h-3.5 w-3.5" /> Local · sync off
      </span>
    );
  }
  const busy = sync === 'connecting' || sync === 'saving';
  return (
    <span className="hidden items-center gap-1.5 tnum text-[11px] text-dm-green md:flex">
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Cloud className="h-3.5 w-3.5" />}
      {busy ? 'Syncing' : 'Synced'}
    </span>
  );
}

export function Header() {
  const { tab, setTab, importData } = useDentimap();
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
    const { properties, deeds, entities } = useDentimap.getState();
    return { properties, deeds, entities };
  };

  const onImport = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!isValidData(parsed)) throw new Error('shape');
      if (!confirm(`Merge ${parsed.properties.length} properties, ${parsed.deeds.length} deeds and ${parsed.entities.length} entities from "${file.name}"? Records with a matching ID are overwritten by the file; nothing else is removed.`)) return;
      const { added, updated } = importData(parsed);
      setNotice(`Imported: ${added} new, ${updated} updated.`);
    } catch {
      setNotice('Import failed — not a valid Dentimap JSON export.');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const menuItem = 'flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-dm-muted transition-colors hover:bg-dm-hover hover:text-dm-text';

  return (
    <header className="sticky top-0 z-40 border-b border-dm-border bg-dm-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1680px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6">
        <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <MapPin className="h-4 w-4 text-dm-blue" />
          Dentimap
        </span>

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
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
          <button className="btn" onClick={() => fileRef.current?.click()} title="Import a Dentimap JSON export">
            <Upload className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Import</span>
          </button>
          <div className="relative" ref={menuRef}>
            <button className="btn btn-primary" onClick={() => setMenu((m) => !m)}>
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            {menu && (
              <div className="absolute right-0 mt-1.5 w-52 overflow-hidden rounded-lg border border-dm-border bg-dm-surface shadow-2xl shadow-black/50">
                <button className={menuItem} onClick={() => { exportJson(snapshot()); setMenu(false); }}>
                  <Download className="h-3.5 w-3.5" /> Full backup (JSON)
                </button>
                {(['properties', 'deeds', 'entities'] as const).map((w) => (
                  <button key={w} className={menuItem} onClick={() => { exportCsv(snapshot(), w); setMenu(false); }}>
                    <Download className="h-3.5 w-3.5" /> {w[0].toUpperCase() + w.slice(1)} (CSV)
                  </button>
                ))}
                <div className="border-t border-dm-border" />
                {supabase && (
                  <button className={menuItem} onClick={() => supabase?.auth.signOut()}>
                    <LogOut className="h-3.5 w-3.5" /> Sign out
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {notice && (
        <div className="border-t border-dm-border bg-dm-surface px-6 py-1.5 text-center tnum text-[11px] text-dm-muted">{notice}</div>
      )}
    </header>
  );
}
