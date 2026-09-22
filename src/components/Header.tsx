import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AlertTriangle, Users, Building2, CloudOff, FileText, Landmark, BookOpen } from 'lucide-react';
import { exportCsv, exportJson } from '@/lib/exporters';
import { OPEN_SEARCH_EVENT } from './SearchPalette';
import { isValidData, useDentimap } from '@/lib/store';
import type { TabId } from '@/lib/store';
import { supabase } from '@/lib/supabase';

const tabs: { id: TabId; label: string; icon: typeof Building2 }[] = [
  { id: 'properties', label: 'Locations', icon: Building2 },
  { id: 'entities', label: 'Entities', icon: Landmark },
  { id: 'people', label: 'People', icon: Users },
  { id: 'deeds', label: 'Deeds', icon: FileText },
  { id: 'glossary', label: 'Glossary', icon: BookOpen },
];

function SyncBadge() {
  const sync = useDentimap((s) => s.sync);
  const message = useDentimap((s) => s.syncMessage);
  if (sync === 'off' || sync === 'synced' || sync === 'connecting' || sync === 'saving') return null;
  if (sync === 'conflict') {
    return (
      <span className="hidden items-center gap-1.5 tnum text-label text-dm-red md:flex" title={message}>
        <AlertTriangle className="h-3.5 w-3.5" /> Conflict
      </span>
    );
  }
  if (sync === 'error') {
    return (
      <span className="hidden items-center gap-1.5 tnum text-label text-dm-amber md:flex" title={message}>
        <CloudOff className="h-3.5 w-3.5" /> Not syncing
      </span>
    );
  }
  return null;
}

export function Header() {
  const { tab, setTab, importData } = useDentimap();
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement>>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number; ready: boolean }>({ left: 0, width: 0, ready: false });
  const [hovered, setHovered] = useState<TabId | null>(null);
  const [hoverBox, setHoverBox] = useState<{ left: number; width: number; top: number; height: number }>({ left: 0, width: 0, top: 0, height: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      const el = tabRefs.current[tab];
      if (!el) {
        setIndicator((i) => ({ ...i, ready: false }));
        return;
      }
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [tab]);

  useLayoutEffect(() => {
    if (!hovered) return;
    const el = tabRefs.current[hovered];
    if (el) setHoverBox({ left: el.offsetLeft, width: el.offsetWidth, top: el.offsetTop, height: el.offsetHeight });
  }, [hovered]);

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
    const { properties, deeds, entities, people, activity, glossary } = useDentimap.getState();
    return { properties, deeds, entities, people, activity, glossary };
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

  const menuItem = 'flex w-full items-center gap-2 px-3 py-2 text-left text-label text-dm-muted transition-colors hover:bg-dm-hover hover:text-dm-text';

  return (
    <header className="z-40 lg:sticky lg:top-0 border-b border-dm-border bg-dm-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1680px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6">
        <button onClick={() => setTab('home')} aria-label="Go to home" className="transition-transform duration-200 ease-luxury hover:scale-[1.03] active:scale-[0.97]">
          <img src="/dentimap-logo.png" alt="Dentimap" className="h-8 w-auto select-none brightness-0 invert" draggable={false} />
        </button>

        <nav
          ref={navRef}
          onMouseLeave={() => setHovered(null)}
          className="relative order-3 -mb-2.5 flex w-full gap-1 overflow-x-auto scroll-thin lg:order-none lg:mb-0 lg:w-auto"
        >
          <span
            className="pointer-events-none absolute rounded-md bg-dm-hover transition-all duration-200 ease-luxury"
            style={{
              left: hoverBox.left,
              width: hoverBox.width,
              top: hoverBox.top,
              height: hoverBox.height,
              opacity: hovered ? 1 : 0,
            }}
          />
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              ref={(el) => {
                if (el) tabRefs.current[id] = el;
              }}
              onClick={() => setTab(id)}
              onMouseEnter={() => setHovered(id)}
              className={`relative flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-label font-medium transition-colors duration-200 ease-luxury lg:py-2 ${
                tab === id ? 'text-dm-text' : 'text-dm-dim hover:text-dm-muted'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
          <span
            className="pointer-events-none absolute bottom-0 h-px bg-dm-text transition-all duration-300 ease-luxury"
            style={{ left: indicator.left + 8, width: Math.max(indicator.width - 16, 0), opacity: indicator.ready ? 1 : 0 }}
          />
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <SyncBadge />
          {notice && <span className="hidden tnum text-label text-dm-dim md:inline">{notice}</span>}
          <button className="btn" onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}>
            Search
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <div className="relative" ref={menuRef}>
            <button className="btn" onClick={() => setMenu((m) => !m)}>
              Export
            </button>
            {menu && (
              <div className="animate-scale-in absolute right-0 mt-1.5 w-52 origin-top-right overflow-hidden rounded-lg border border-dm-border bg-dm-surface shadow-lg shadow-black/60">
                <button className={menuItem} onClick={() => { exportJson(snapshot()); setMenu(false); }}>
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
    </header>
  );
}
