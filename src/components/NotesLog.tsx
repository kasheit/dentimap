import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useDentimap } from '@/lib/store';
import type { NoteEntry, NoteTag, Property } from '@/lib/types';

const tagLabel: Record<NoteTag, string> = { note: 'Note', question: 'Open question', follow_up: 'Follow-up' };
const tagColor: Record<NoteTag, string> = { note: 'text-dm-muted', question: 'text-dm-amber', follow_up: 'text-dm-blue' };

const stamp = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export function NotesLog({ property }: { property: Property }) {
  const updateProperty = useDentimap((s) => s.updateProperty);
  const [text, setText] = useState('');
  const [tag, setTag] = useState<NoteTag>('note');

  const log = useMemo(() => {
    const entries = [...(property.noteLog ?? [])];
    if (property.notes) {
      entries.push({ id: 'legacy', text: property.notes, tag: 'note', createdAt: '1970-01-01T00:00:00.000Z' });
    }
    return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [property.noteLog, property.notes]);

  const open = log.filter((n) => n.tag !== 'note' && !n.resolved).length;

  const save = (next: NoteEntry[], logText: string, clearLegacy = false) =>
    updateProperty(property.id, { noteLog: next, ...(clearLegacy ? { notes: undefined } : {}) }, logText);

  const add = () => {
    const t = text.trim();
    if (!t) return;
    const entries = [...(property.noteLog ?? [])];
    entries.push({ id: `note-${Date.now().toString(36)}`, text: t, tag, createdAt: new Date().toISOString() });
    save(entries, `Note added (${tagLabel[tag]})`);
    setText('');
  };

  const editReal = (fn: (n: NoteEntry) => NoteEntry | null, logText: string) =>
    save((property.noteLog ?? []).map(fn).filter((n): n is NoteEntry => n !== null), logText);

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && add()}
          rows={2}
          placeholder="Add a note…"
          className="field scroll-thin flex-1 resize-y leading-relaxed"
        />
        <div className="flex gap-2 sm:flex-col">
          <select className="field" value={tag} onChange={(e) => setTag(e.target.value as NoteTag)} aria-label="Note type">
            {(Object.keys(tagLabel) as NoteTag[]).map((t) => (
              <option key={t} value={t}>{tagLabel[t]}</option>
            ))}
          </select>
          <button className="btn justify-center" disabled={!text.trim()} onClick={add}>
            Add
          </button>
        </div>
      </div>

      {log.length === 0 ? (
        <p className="mt-4 text-[13px] text-dm-dim">No notes.</p>
      ) : (
        <>
          <p className="mt-5 text-[13px] text-dm-dim">
            {log.length} {log.length === 1 ? 'entry' : 'entries'}
            {open > 0 && <> · <span className="text-dm-amber">{open} open</span></>}
          </p>
          <ul className="mt-2 divide-y divide-dm-border/70">
            {log.map((n) => {
              const legacy = n.id === 'legacy';
              const actionable = n.tag !== 'note';
              return (
                <li key={n.id} className="flex items-start gap-3 py-3">
                  {actionable ? (
                    <input
                      type="checkbox"
                      checked={!!n.resolved}
                      onChange={() => editReal((x) => (x.id === n.id ? { ...x, resolved: !x.resolved } : x), n.resolved ? 'Note reopened' : 'Note resolved')}
                      className="mt-1 h-3.5 w-3.5 accent-[#7eb0ff]"
                      aria-label="Mark resolved"
                    />
                  ) : (
                    <span className="w-3.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] text-dm-dim">
                      <span className={tagColor[n.tag]}>{tagLabel[n.tag]}</span>
                      {!legacy && <> · {stamp(n.createdAt)}</>}
                      {legacy && <> · earlier note</>}
                      {n.resolved && <> · resolved</>}
                    </div>
                    <p className={`mt-0.5 whitespace-pre-wrap text-[14px] leading-relaxed ${n.resolved ? 'text-dm-dim line-through' : ''}`}>{n.text}</p>
                  </div>
                  <button
                    onClick={() => (legacy ? save(property.noteLog ?? [], 'Note deleted', true) : editReal((x) => (x.id === n.id ? null : x), 'Note deleted'))}
                    className="rounded p-1.5 text-dm-dim transition-colors hover:bg-dm-hover hover:text-dm-red"
                    title="Delete"
                    aria-label="Delete note"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
