import { useState, useRef, useEffect } from 'react';
import { Pencil } from 'lucide-react';

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
  mono?: boolean;
  multiline?: boolean;
}

export function EditableText({
  value,
  onChange,
  className = '',
  inputClassName = '',
  mono = false,
  multiline = false,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onChange(draft);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  if (editing) {
    const sharedClass = `${inputClassName} bg-page border border-legal-base/50 rounded px-2 py-1 outline-none focus:border-legal-base ${mono ? 'font-mono' : ''}`;
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') cancel();
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit();
          }}
          className={sharedClass}
          rows={3}
        />
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') cancel();
          if (e.key === 'Enter') commit();
        }}
        className={sharedClass}
      />
    );
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true); }}
      className={`group cursor-text inline-flex items-center gap-1 rounded px-1 -mx-1 hover:bg-nested transition-colors ${className}`}
      title="Click to edit"
    >
      <span>{value}</span>
      <Pencil className="h-3 w-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </span>
  );
}
