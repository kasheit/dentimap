import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { addressLine } from '@/lib/format';
import { presetsFor, safeUrl, sourcesOf } from '@/lib/sources';
import type { Property } from '@/lib/types';

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard blocked: nothing to do */
        }
      }}
    >
      {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {done ? 'Copied' : label}
    </button>
  );
}

/** For a location with no deed yet: the county and state sites to search, with the PIN and address ready to paste. */
export function WhereToLook({ p, onAddDeed }: { p: Property; onAddDeed: () => void }) {
  const known = sourcesOf(p);
  const presets = presetsFor(p.address.county);
  const links = [...known, ...presets.filter((pr) => pr.url && !known.some((k) => k.url === pr.url))];
  const missing = presets.filter((pr) => !pr.url);
  const hasAddress = !!(p.address.street && p.address.city);

  return (
    <section id="where-to-look" className="min-w-0 rounded-lg border border-dm-border bg-dm-surface p-5 shadow-card">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-body font-semibold text-dm-text">Where to look for the owner</h2>
        <button type="button" className="btn btn-primary" onClick={onAddDeed}>
          Add the deed
        </button>
      </header>
      <ol className="list-decimal space-y-1 pl-5 text-label text-dm-muted">
        <li>Search the parcel on the county site{p.address.parcelPin ? ' by its PIN' : hasAddress ? ' by its address' : ''}.</li>
        <li>Open the latest recorded deed and note who it conveyed to.</li>
        <li>Paste it under Add deed. The owner and chain fill in from there.</li>
      </ol>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {p.address.parcelPin && <CopyButton text={p.address.parcelPin} label={`Copy PIN ${p.address.parcelPin}`} />}
        {hasAddress && <CopyButton text={addressLine(p.address)} label="Copy address" />}
        {links.map((l) => (
          <a key={l.url} href={safeUrl(l.url)} target="_blank" rel="noreferrer" className="btn text-dm-blue">
            {l.label} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        ))}
      </div>
      {missing.length > 0 && <p className="mt-3 text-label text-dm-dim">{missing.map((m) => m.label).join(', ')}: add its link under Edit so it shows up here.</p>}
    </section>
  );
}
