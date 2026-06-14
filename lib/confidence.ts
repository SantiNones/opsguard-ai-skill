import { ResolveOpsRequestOutput, EnterpriseContextMetadata } from './types';
import { RetrievalDiagnostics } from './policyRetrieval';

export interface ConfidenceResult {
  confidenceScore: number;
  confidenceLabel: 'low' | 'medium' | 'high';
  confidenceReasons: string[];
}

/**
 * Calculate a composite confidence score for a resolved request.
 *
 * Confidence is NOT the same as risk:
 * - High risk + high confidence = system is confident it should escalate
 * - Low confidence = system is uncertain about its own answer quality
 *
 * Factors:
 * 1. Retrieval confidence (strongest signal)
 * 2. Citation count (policy grounding)
 * 3. Route clarity (answer_directly vs ask_for_info)
 * 4. Resolver mode (AI vs fallback)
 * 5. Access restrictions (limited context reduces confidence)
 */
export function calculateConfidence(
  output: ResolveOpsRequestOutput,
  retrievalDiagnostics: RetrievalDiagnostics | undefined,
  enterpriseContext: EnterpriseContextMetadata | undefined,
  mode: 'ai' | 'fallback',
  fallbackReason?: string
): ConfidenceResult {
  let score = 0.50;
  const reasons: string[] = [];

  // Factor 1: Retrieval confidence (biggest signal — did we find relevant policy?)
  const retrievalConf = retrievalDiagnostics?.retrievalConfidence ?? 'low';
  if (retrievalConf === 'high') {
    score += 0.25;
    reasons.push('Strong policy match found');
  } else if (retrievalConf === 'medium') {
    score += 0.10;
    reasons.push('Partial policy match found');
  } else {
    score -= 0.20;
    reasons.push('No strong policy match found');
  }

  // Factor 2: Citation count (weighted by retrieval quality)
  // Citations from low-quality retrieval are weak grounding signals.
  const citationCount = output.citations.length;
  if (citationCount >= 2 && retrievalConf === 'high') {
    score += 0.10;
    reasons.push(`${citationCount} policy rules cited`);
  } else if (citationCount >= 2 && retrievalConf === 'medium') {
    score += 0.05;
    reasons.push(`${citationCount} policy rules cited (partial match)`);
  } else if (citationCount >= 2 && retrievalConf === 'low') {
    // Weak citations from low-quality retrieval — no boost
    reasons.push(`${citationCount} policy rules retrieved (low confidence)`);
  } else if (citationCount === 1) {
    score += 0.05;
    reasons.push('1 policy rule cited');
  } else {
    score -= 0.15;
    reasons.push('No policy citations available');
  }

  // Factor 3: Route clarity
  if (output.route === 'answer_directly' && output.risk === 'low') {
    score += 0.10;
    reasons.push('Clear low-risk routing');
  } else if (output.route === 'escalate' && citationCount > 0) {
    // Confident escalation is a valid high-confidence outcome
    reasons.push('Escalation route confirmed by policy');
  } else if (output.route === 'ask_for_info') {
    score -= 0.10;
    reasons.push('Missing information required');
  }

  // Factor 4: Fallback mode (AI failure reduces confidence signal)
  if (mode === 'fallback' && fallbackReason && fallbackReason !== 'AI not enabled') {
    score -= 0.10;
    reasons.push(`Fallback resolver used`);
  }

  // Factor 5: Enterprise context restrictions
  if (enterpriseContext?.accessLevel === 'none') {
    score -= 0.10;
    reasons.push('Actor access denied or restricted');
  } else if ((enterpriseContext?.redactionsApplied ?? 0) > 0) {
    score -= 0.05;
    reasons.push(`${enterpriseContext!.redactionsApplied} fields redacted`);
  }

  // Clamp to [0, 1]
  score = Math.max(0, Math.min(1, score));

  const confidenceLabel: 'low' | 'medium' | 'high' =
    score >= 0.70 ? 'high' : score >= 0.45 ? 'medium' : 'low';

  return {
    confidenceScore: Math.round(score * 100) / 100,
    confidenceLabel,
    confidenceReasons: reasons,
  };
}

/**
 * Determine if a result warrants a low-confidence warning to the employee.
 * Separate from the confidence label — only triggers when both:
 * - label is 'low'
 * - no citation-backed policy answer exists
 */
export function isNoPolicyFound(
  confidenceLabel: 'low' | 'medium' | 'high',
  citationCount: number,
  retrievalConfidence: 'low' | 'medium' | 'high' | undefined
): boolean {
  // Policy is considered "not found" when:
  // - overall confidence is low, AND
  // - either no citations exist OR retrieval was too weak to trust them
  return (
    confidenceLabel === 'low' &&
    (citationCount === 0 || retrievalConfidence === 'low' || retrievalConfidence === undefined)
  );
}
