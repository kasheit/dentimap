/**
 * Per-browser display preference, deliberately kept out of the zustand-persisted
 * (Supabase-synced) store — a light/dark choice on one machine has no business
 * traveling through sync to another. Plain localStorage, read once synchronously
 * in index.html before paint to avoid a flash of the wrong theme.
 */
export type ThemePref = 'light' | 'dark' | 'system';

const KEY = 'dentimap-theme';

export function getStoredTheme(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', pref);
  try {
    if (pref === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    // private browsing / storage blocked — theme still applies for this page load, just won't persist
  }
}

export const nextTheme: Record<ThemePref, ThemePref> = { system: 'light', light: 'dark', dark: 'system' };
