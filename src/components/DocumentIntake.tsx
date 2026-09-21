import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { isSupportedDocument, readDocumentText } from '@/lib/documents';
import { ingestText } from '@/lib/intake';
import type { IntakeItem, Outcome } from '@/lib/intake';
import { useDentimap } from '@/lib/store';

const dot: Record<Outcome, string> = {
  added: 'bg-dm-green',
  filled: 'bg-dm-green',
  duplicate: 'bg-dm-dim',
  review: 'bg-dm-amber',
  failed: 'bg-dm-red',
};

const label: Record<Outcome, string> = {
  added: 'Added',
  filled: 'Updated',
  duplicate: 'Duplicate',
  review: 'Needs a location',
  failed: 'Not read',
};

export function DocumentIntake() {
  const properties = useDentimap((s) => s.properties);
  const openProperty = useDentimap((s) => s.openProperty);
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<IntakeItem[]>([]);
  const [reading, setReading] = useState<{ name: string; fraction: number } | null>(null);
  const [over, setOver] = useState(false);

  const handle = async (files: File[]) => {
    for (const file of files) {
      if (!isSupportedDocument(file)) {
        setItems((prev) => [{ id: `${file.name}-${Date.now()}`, file: file.name, outcome: 'failed', message: 'Use a PDF, an image or a text file.' }, ...prev]);
        continue;
      }
      setReading({ name: file.name, fraction: 0 });
      try {
        const text = await readDocumentText(file, (fraction) => setReading({ name: file.name, fraction }));
        const added = ingestText(text, file.name);
        setItems((prev) => [...added, ...prev]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not read that file.';
        setItems((prev) => [{ id: `${file.name}-${Date.now()}`, file: file.name, outcome: 'failed', message }, ...prev]);
      }
    }
    setReading(null);
  };

  const assign = (item: IntakeItem, propertyId: string) => {
    if (!item.text || !propertyId) return;
    const next = ingestText(item.text, item.file, propertyId);
    setItems((prev) => prev.flatMap((x) => (x.id === item.id ? next : [x])));
  };

  return (
    <section className="mb-4" aria-label="Upload documents">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void handle([...e.dataTransfer.files]);
        }}
        className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3 transition-colors ${over ? 'border-dm-text bg-dm-hover' : 'border-dm-border'}`}
      >
        <span className="text-label text-dm-muted">
          {reading ? `Reading ${reading.name}… ${Math.round(reading.fraction * 100)}%` : 'Drop deeds, county records or scans here. Matching locations update automatically.'}
        </span>
        <input ref={inputRef} type="file" multiple accept="application/pdf,image/*,text/plain,.txt,.pdf" hidden onChange={(e) => {
          void handle([...(e.target.files ?? [])]);
          if (inputRef.current) inputRef.current.value = '';
        }} />
        <button className="btn" disabled={!!reading} onClick={() => inputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" /> Upload documents
        </button>
      </div>

      {items.length > 0 && (
        <div className="mt-2 overflow-hidden rounded-lg border border-dm-border bg-dm-surface">
          <div className="flex items-center justify-between border-b border-dm-border px-4 py-2 text-label text-dm-dim">
            <span>Uploads this session</span>
            <button className="hover:text-dm-text" onClick={() => setItems([])}>
              Clear
            </button>
          </div>
          <ul className="divide-y divide-dm-border/60">
            {items.map((it) => (
              <li key={it.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-label">
                <span className="inline-flex w-36 shrink-0 items-center gap-1.5 text-dm-muted">
                  <i className={`h-1.5 w-1.5 rounded-full ${dot[it.outcome]}`} />
                  {label[it.outcome]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{it.file}</span>
                  <span className="ml-2 text-dm-dim">{it.message}</span>
                </span>
                {it.outcome === 'review' && !it.propertyId && it.text && (
                  <select className="rounded-md border border-dm-border bg-dm-bg px-2 py-1 text-dm-muted outline-none" value="" onChange={(e) => assign(it, e.target.value)} aria-label="Choose a location for this document">
                    <option value="">Choose location…</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
                {it.propertyId && (
                  <button className="text-dm-blue hover:underline" onClick={() => openProperty(it.propertyId as string)}>
                    Open
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
