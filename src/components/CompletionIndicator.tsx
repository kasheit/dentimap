import { useState, useCallback } from 'react';
import { Check } from 'lucide-react';
import type { CompletionState } from '@/types';

interface CompletionIndicatorProps {
  state: CompletionState;
  onChange: (state: CompletionState) => void;
}

export function CompletionIndicator({ state, onChange }: CompletionIndicatorProps) {
  const { fieldsFilled, fieldsTotal, manuallyCompleted } = state;
  const isComplete = manuallyCompleted || fieldsFilled >= fieldsTotal;
  const percent = isComplete ? 100 : Math.round((fieldsFilled / fieldsTotal) * 100);

  const toggleComplete = useCallback(() => {
    onChange({
      ...state,
      manuallyCompleted: !manuallyCompleted,
    });
  }, [state, onChange]);

  if (isComplete) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-mono text-legal-base">
          <Check className="h-3.5 w-3.5" />
          complete
        </span>
        <button
          onClick={toggleComplete}
          className="text-[10px] font-mono text-text-muted hover:text-text-secondary transition-colors"
        >
          reset
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="h-[5px] flex-1 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-legal-base transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="font-mono text-[10px] text-text-muted whitespace-nowrap">
        {fieldsFilled}/{fieldsTotal} fields
      </span>
      <button
        onClick={toggleComplete}
        className="text-[10px] font-mono text-text-secondary hover:text-text-primary border border-border hover:border-text-muted rounded px-1.5 py-0.5 transition-colors whitespace-nowrap"
      >
        mark complete
      </button>
    </div>
  );
}
