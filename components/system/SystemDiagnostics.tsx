'use client';

import React, { useState } from 'react';
import { ChevronDownIcon } from '@/components/ui/Icons';

interface SystemDiagnosticsProps {
  children: React.ReactNode;
  /** number of available diagnostic panels, shown as a subtle count */
  count?: number;
}

/**
 * Collapsible container that groups all technical/internal panels
 * (Enterprise Context, Retrieval, Confidence, Confidentiality,
 * Observability, Evidence) under one secondary, collapsed-by-default
 * section so they don't dominate the product UI.
 */
export function SystemDiagnostics({ children, count }: SystemDiagnosticsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="og-card-flat overflow-hidden bg-white/70 shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#fff7f5] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center ring-1 ring-brand-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-black text-stone-950">Technical details available</p>
            <p className="text-xs font-medium text-stone-500">
              Enterprise context, retrieval, confidence, confidentiality, and observability are collapsed by default.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-stone-400">
          {typeof count === 'number' && count > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100">{count}</span>
          )}
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-[#f0e8e4] space-y-3 og-fade-up">
          {children}
        </div>
      )}
    </div>
  );
}
