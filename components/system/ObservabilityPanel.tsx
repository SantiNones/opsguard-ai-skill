'use client';

import { useState } from 'react';

interface TokenUsageEstimate {
  inputTokensEstimate: number;
  outputTokensEstimate: number;
  estimatedCostUsd: number;
}

interface ObservabilityPanelProps {
  observability: {
    requestId: string;
    createdAt: string;
    resolverMode: 'ai' | 'fallback' | 'deterministic';
    fallbackReason?: string;
    latencyMs: number;
    modelName?: string;
    retrievalChunkCount: number;
    estimatedContextTokens: number;
    topRuleIds: string[];
    confidenceLabel: 'low' | 'medium' | 'high';
    confidentialityLevel: 'low' | 'medium' | 'high';
    redactionsApplied: number;
    requiresHumanReview: boolean;
    tokenUsageEstimate: TokenUsageEstimate;
  } | null;
}

const MODE_CONFIG = {
  ai: { color: 'text-blue-700', bg: 'bg-blue-50', label: 'AI' },
  fallback: { color: 'text-amber-700', bg: 'bg-amber-50', label: 'Fallback' },
  deterministic: { color: 'text-gray-600', bg: 'bg-gray-50', label: 'Deterministic' },
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-mono text-gray-800">{value}</span>
    </div>
  );
}

export function ObservabilityPanel({ observability }: ObservabilityPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!observability) return null;

  const modeCfg = MODE_CONFIG[observability.resolverMode];
  const totalTokens = observability.tokenUsageEstimate.inputTokensEstimate + observability.tokenUsageEstimate.outputTokensEstimate;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 text-sm">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span className="font-semibold text-gray-700">Observability</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${modeCfg.bg} ${modeCfg.color} font-medium`}>
            {modeCfg.label}
          </span>
          <span className="text-xs text-gray-500">{observability.latencyMs}ms</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-200 pt-3 space-y-3">
          {/* Request metadata */}
          <div className="space-y-0">
            <Row label="Request ID" value={observability.requestId} />
            <Row label="Resolver mode" value={modeCfg.label} />
            <Row label="Latency" value={`${observability.latencyMs}ms`} />
            {observability.modelName && (
              <Row label="Model" value={observability.modelName} />
            )}
            {observability.fallbackReason && (
              <Row label="Fallback reason" value={observability.fallbackReason} />
            )}
          </div>

          {/* Retrieval */}
          <div className="space-y-0">
            <p className="text-xs font-medium text-gray-600 mb-1">Retrieval</p>
            <Row label="Chunks selected" value={observability.retrievalChunkCount} />
            <Row label="Context tokens" value={`${observability.estimatedContextTokens} / 1800`} />
          </div>

          {/* Top rules */}
          {observability.topRuleIds.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1.5">Top rules</p>
              <div className="flex flex-wrap gap-1.5">
                {observability.topRuleIds.map(id => (
                  <span key={id} className="text-xs font-mono bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                    {id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Token estimate */}
          <div className="space-y-0">
            <p className="text-xs font-medium text-gray-600 mb-1">Token estimate</p>
            <Row label="Input tokens" value={`~${observability.tokenUsageEstimate.inputTokensEstimate}`} />
            <Row label="Output tokens" value={`~${observability.tokenUsageEstimate.outputTokensEstimate}`} />
            <Row label="Total" value={`~${totalTokens}`} />
            <Row
              label="Est. cost"
              value={
                observability.resolverMode === 'ai'
                  ? `~$${observability.tokenUsageEstimate.estimatedCostUsd.toFixed(6)}`
                  : '$0.00 (no AI call)'
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
