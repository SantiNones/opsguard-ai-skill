import { RetrievalDiagnostics } from './policyRetrieval';
import { ConfidenceResult } from './confidence';
import { ConfidentialityMetadata } from './privacy/confidentiality';

export interface TokenUsageEstimate {
  inputTokensEstimate: number;
  outputTokensEstimate: number;
  estimatedCostUsd: number;
}

export interface ObservabilityMetadata {
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
}

// GPT-4o-mini pricing per 1M tokens (as of 2024)
const MODEL_COSTS: Record<string, { inputPerM: number; outputPerM: number }> = {
  'gpt-4o-mini': { inputPerM: 0.15, outputPerM: 0.60 },
  'gpt-4o': { inputPerM: 5.00, outputPerM: 15.00 },
};

function estimateCostUsd(
  inputTokens: number,
  outputTokens: number,
  modelName: string | undefined
): number {
  const costs = MODEL_COSTS[modelName ?? 'gpt-4o-mini'] ?? MODEL_COSTS['gpt-4o-mini'];
  const raw = (inputTokens * costs.inputPerM + outputTokens * costs.outputPerM) / 1_000_000;
  return Math.round(raw * 1_000_000) / 1_000_000;
}

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function buildObservabilityMetadata(params: {
  latencyMs: number;
  mode: 'ai' | 'fallback';
  fallbackReason?: string;
  retrievalDiagnostics?: RetrievalDiagnostics;
  confidence: ConfidenceResult;
  confidentiality: ConfidentialityMetadata;
  requiresHumanReview: boolean;
  modelName?: string;
}): ObservabilityMetadata {
  const {
    latencyMs,
    mode,
    fallbackReason,
    retrievalDiagnostics,
    confidence,
    confidentiality,
    requiresHumanReview,
    modelName,
  } = params;

  const retrievalChunkCount = retrievalDiagnostics?.selectedChunkCount ?? 0;
  const estimatedContextTokens = retrievalDiagnostics?.estimatedContextTokens ?? 0;
  const topRuleIds = retrievalDiagnostics?.topRuleIds ?? [];

  // Estimate tokens: system prompt overhead (~200) + context + output (~200)
  const inputTokensEstimate = estimatedContextTokens + 200;
  const outputTokensEstimate = 200;

  const resolverMode: ObservabilityMetadata['resolverMode'] =
    mode === 'ai' ? 'ai' :
    fallbackReason && fallbackReason !== 'AI not enabled' ? 'fallback' :
    'deterministic';

  return {
    requestId: generateRequestId(),
    createdAt: new Date().toISOString(),
    resolverMode,
    fallbackReason,
    latencyMs,
    modelName: mode === 'ai' ? (modelName ?? 'gpt-4o-mini') : undefined,
    retrievalChunkCount,
    estimatedContextTokens,
    topRuleIds,
    confidenceLabel: confidence.confidenceLabel,
    confidentialityLevel: confidentiality.confidentialityLevel,
    redactionsApplied: confidentiality.redactionsApplied,
    requiresHumanReview,
    tokenUsageEstimate: {
      inputTokensEstimate,
      outputTokensEstimate,
      estimatedCostUsd: mode === 'ai'
        ? estimateCostUsd(inputTokensEstimate, outputTokensEstimate, modelName)
        : 0,
    },
  };
}
