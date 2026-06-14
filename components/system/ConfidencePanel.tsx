'use client';

import { useState } from 'react';

interface ConfidencePanelProps {
  confidence: {
    confidenceScore: number;
    confidenceLabel: 'low' | 'medium' | 'high';
    confidenceReasons: string[];
  } | null;
}

const LABEL_CONFIG = {
  high: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  medium: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  low: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
};

export function ConfidencePanel({ confidence }: ConfidencePanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!confidence) return null;

  const cfg = LABEL_CONFIG[confidence.confidenceLabel];
  const pct = Math.round(confidence.confidenceScore * 100);
  const isLow = confidence.confidenceLabel === 'low';

  return (
    <div className={`rounded-lg border ${cfg.border} ${cfg.bg} text-sm`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          <span className={`font-semibold ${cfg.color}`}>
            Confidence: {confidence.confidenceLabel.charAt(0).toUpperCase() + confidence.confidenceLabel.slice(1)}
          </span>
          <span className={`${cfg.color} opacity-70`}>{pct}%</span>
        </div>
        <svg
          className={`w-4 h-4 ${cfg.color} transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className={`px-4 pb-4 border-t ${cfg.border} space-y-3 pt-3`}>
          {/* Score bar */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-500">Score</span>
              <span className={`text-xs font-mono ${cfg.color}`}>{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  confidence.confidenceLabel === 'high' ? 'bg-emerald-500' :
                  confidence.confidenceLabel === 'medium' ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Low confidence warning */}
          {isLow && (
            <div className="rounded-md bg-red-100 border border-red-200 px-3 py-2 text-xs text-red-800">
              Low confidence — human review recommended before acting on this response.
            </div>
          )}

          {/* Reasons */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1.5">Factors</p>
            <ul className="space-y-1">
              {confidence.confidenceReasons.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                  <span className="mt-0.5 text-gray-400">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
