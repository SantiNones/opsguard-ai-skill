'use client';

import { useState } from 'react';

interface RetrievalDiagnosticsData {
  selectedChunkCount: number;
  estimatedContextTokens: number;
  topRuleIds: string[];
  retrievalConfidence: 'low' | 'medium' | 'high';
  totalCandidateCount: number;
  excludedForBudget: string[];
}

interface RetrievalDiagnosticsProps {
  diagnostics: RetrievalDiagnosticsData | null;
}

const confidenceColors = {
  low: 'text-red-600',
  medium: 'text-yellow-600',
  high: 'text-green-600',
};

export function RetrievalDiagnostics({ diagnostics }: RetrievalDiagnosticsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!diagnostics) return null;

  const { selectedChunkCount, estimatedContextTokens, topRuleIds, retrievalConfidence, totalCandidateCount, excludedForBudget } = diagnostics;
  const tokenBudgetPct = Math.round((estimatedContextTokens / 1800) * 100);

  return (
    <div className="border border-gray-100 rounded-md overflow-hidden">
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-xs font-medium text-gray-600">Retrieval Diagnostics</span>
          <span className={`text-xs font-semibold ${confidenceColors[retrievalConfidence]}`}>
            {retrievalConfidence} confidence
          </span>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-3 py-3 bg-white space-y-3">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-lg font-semibold text-gray-800">{selectedChunkCount}</div>
              <div className="text-xs text-gray-500">chunks selected</div>
              <div className="text-xs text-gray-400">of {totalCandidateCount} candidates</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-lg font-semibold text-gray-800">~{estimatedContextTokens}</div>
              <div className="text-xs text-gray-500">context tokens</div>
              <div className="text-xs text-gray-400">{tokenBudgetPct}% of 1800 budget</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className={`text-lg font-semibold ${confidenceColors[retrievalConfidence]}`}>
                {retrievalConfidence.toUpperCase()}
              </div>
              <div className="text-xs text-gray-500">confidence</div>
              <div className="text-xs text-gray-400">scoring signal</div>
            </div>
          </div>

          {/* Token budget bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Context budget</span>
              <span>~{estimatedContextTokens} / 1800 tokens</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${tokenBudgetPct > 80 ? 'bg-orange-400' : 'bg-blue-400'}`}
                style={{ width: `${Math.min(tokenBudgetPct, 100)}%` }}
              />
            </div>
          </div>

          {/* Retrieved rule IDs */}
          {topRuleIds.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-1.5">Retrieved rules</div>
              <div className="flex flex-wrap gap-1">
                {topRuleIds.map(id => (
                  <span key={id} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-mono font-medium">
                    {id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Budget exclusions */}
          {excludedForBudget.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-1.5">Excluded (budget limit)</div>
              <div className="flex flex-wrap gap-1">
                {excludedForBudget.map(id => (
                  <span key={id} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs font-mono">
                    {id}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
