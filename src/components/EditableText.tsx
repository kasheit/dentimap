import { useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  mono?: boolean;
}

/**
 * Click-to-edit inline text: no separate edit mode to enter, commits on
 * blur/Enter, Escape reverts. Used for fields worth fixing in passing
 * (a landlord name, a deed reference) without opening the full record editor.
 */
export function EditableText({
  value,
  onChange,
  placeholder,
  className = '',
  mono = false,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft !== value) onChange(draft.trim());
    else setDraft(value);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') cancel();
          if (e.key === 'Enter') commit();
        }}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-teal-500 bg-white px-2 py-1 text-sm font-medium text-navy-800 outline-none ring-2 ring-teal-500/15 dark:bg-navy-800 dark:text-white ${
          mono ? 'font-mono' : ''
        } ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      title="Click to edit"
      className={`group -mx-1 inline-flex max-w-full items-center gap-1.5 rounded px-1 py-0.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-navy-700/60 ${
        mono ? 'font-mono' : ''
      } ${className}`}
    >
      <span className="truncate">{value}</span>
      <Pencil className="h-3 w-3 shrink-0 text-navy-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-navy-400" />
    </button>
  );
}
