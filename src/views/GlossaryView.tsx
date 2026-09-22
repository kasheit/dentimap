import { useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { fmtDate } from '@/lib/format';
import { newId, useDentimap } from '@/lib/store';
import type { GlossaryTerm } from '@/lib/types';

function TermForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: { term: string; expansion: string; definition: string };
  onSave: (v: { term: string; expansion: string; definition: string }) => void;
  onCancel?: () => void;
}) {
  const [d, setD] = useState(initial);
  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => setD((x) => ({ ...x, [k]: v }));
  const valid = d.term.trim() && d.definition.trim();

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="label">Term</span>
          <input className="field" value={d.term} onChange={(e) => set('term', e.target.value)} placeholder="MSO" autoFocus />
        </label>
        <label className="block space-y-1">
          <span className="label">Stands for (optional)</span>
          <input className="field" value={d.expansion} onChange={(e) => set('expansion', e.target.value)} placeholder="Management Services Organization" />
        </label>
      </div>
      <label className="block space-y-1">
        <span className="label">Definition, in your own words</span>
        <textarea
          className="field min-h-[90px] resize-y"
          value={d.definition}
          onChange={(e) => set('definition', e.target.value)}
          placeholder="What this means in the context of how we use it here…"
        />
      </label>
      <div className="flex justify-end gap-2">
        {onCancel && <button className="btn" onClick={onCancel}>Cancel</button>}
        <button
          className="btn btn-primary"
          disabled={!valid}
          onClick={() => {
            onSave({ term: d.term.trim(), expansion: d.expansion.trim(), definition: d.definition.trim() });
            if (!onCancel) setD({ term: '', expansion: '', definition: '' });
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function TermCard({ t }: { t: GlossaryTerm }) {
  const updateTerm = useDentimap((s) => s.updateTerm);
  const deleteTerm = useDentimap((s) => s.deleteTerm);
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <article className="rounded-lg border border-dm-border bg-dm-surface p-5">
        <TermForm
          initial={{ term: t.term, expansion: t.expansion ?? '', definition: t.definition }}
          onCancel={() => setEditing(false)}
          onSave={(v) => {
            updateTerm(t.id, { term: v.term, expansion: v.expansion || undefined, definition: v.definition });
            setEditing(false);
          }}
        />
      </article>
    );
  }

  return (
    <article className="lift group rounded-lg border border-dm-border bg-dm-surface p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-body font-semibold">{t.term}</h3>
          {t.expansion && <div className="mt-0.5 text-label text-dm-dim">{t.expansion}</div>}
        </div>
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button className="rounded p-1.5 text-dm-muted transition-colors hover:bg-dm-hover hover:text-dm-blue" onClick={() => setEditing(true)} aria-label={`Edit ${t.term}`}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            className="rounded p-1.5 text-dm-muted transition-colors hover:bg-dm-hover hover:text-dm-red"
            onClick={() => confirm(`Delete "${t.term}"?`) && deleteTerm(t.id)}
            aria-label={`Delete ${t.term}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>
      <p className="mt-2 whitespace-pre-wrap text-sm text-dm-muted">{t.definition}</p>
      <div className="mt-3 text-label text-dm-dim">Updated {fmtDate(t.updatedAt.slice(0, 10))}</div>
    </article>
  );
}

export function GlossaryView() {
  const glossary = useDentimap((s) => s.glossary);
  const addTerm = useDentimap((s) => s.addTerm);
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const sorted = [...glossary].sort((a, b) => a.term.localeCompare(b.term));
    if (!needle) return sorted;
    return sorted.filter((t) => [t.term, t.expansion, t.definition].filter(Boolean).join(' ').toLowerCase().includes(needle));
  }, [glossary, q]);

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Glossary</h1>
          <p className="mt-1 text-label text-dm-dim">Terms and acronyms, defined in your own words.</p>
        </div>
        <div className="flex items-center gap-2">
          <input className="field w-56" placeholder="Search terms…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn btn-primary" onClick={() => setAdding((a) => !a)}>
            {adding ? 'Close' : 'Add term'}
          </button>
        </div>
      </div>

      {adding && (
        <div className="mb-6 rounded-lg border border-dm-border bg-dm-surface p-5">
          <TermForm
            initial={{ term: '', expansion: '', definition: '' }}
            onSave={(v) => {
              const now = new Date().toISOString();
              addTerm({ id: newId('term'), term: v.term, expansion: v.expansion || undefined, definition: v.definition, createdAt: now, updatedAt: now });
            }}
          />
        </div>
      )}

      {filtered.length ? (
        <div className="stagger grid gap-4 sm:grid-cols-2">
          {filtered.map((t) => <TermCard key={t.id} t={t} />)}
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-dm-dim">{glossary.length ? 'No terms match your search.' : 'No terms yet. Add the first one above.'}</p>
      )}
    </main>
  );
}
