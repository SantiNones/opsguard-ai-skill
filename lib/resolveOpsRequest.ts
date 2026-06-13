import { ResolveOpsRequestOutput, Citation } from './types';
import { retrievePolicyChunks, PolicyChunk, findRuleById } from './policyRetrieval';
import { applySafetyRules, quickSafetyCheck } from './safetyRules';

export interface ResolveResult {
  output: ResolveOpsRequestOutput;
  retrievedChunks: PolicyChunk[];
  processingTimeMs: number;
  safetyOverridesApplied: boolean;
}

/**
 * Main resolver function that orchestrates:
 * 1. Policy retrieval
 * 2. Deterministic classification
 * 3. Safety rule application
 * 
 * This is currently deterministic but structured to easily add
 * an OpenAI resolver layer in the next milestone.
 */
export async function resolveOpsRequest(
  userRequest: string
): Promise<ResolveResult> {
  const startTime = Date.now();

  // Quick safety check
  const safetyCheck = quickSafetyCheck(userRequest);
  if (!safetyCheck.allowed) {
    return createBlockedResponse(userRequest, safetyCheck.reason!, startTime);
  }

  // Step 1: Retrieve relevant policy chunks
  const retrievedChunks = retrievePolicyChunks(userRequest, 3);

  // Step 2: Generate deterministic output
  const baseOutput = generateDeterministicOutput(userRequest, retrievedChunks);

  // Step 3: Apply safety rules
  const safeOutput = applySafetyRules(baseOutput, retrievedChunks);
  const safetyOverridesApplied = JSON.stringify(baseOutput) !== JSON.stringify(safeOutput);

  const processingTimeMs = Date.now() - startTime;

  return {
    output: safeOutput,
    retrievedChunks,
    processingTimeMs,
    safetyOverridesApplied,
  };
}

/**
 * Create a blocked response when quick safety check fails
 */
function createBlockedResponse(
  request: string,
  reason: string,
  startTime: number
): ResolveResult {
  const processingTimeMs = Date.now() - startTime;

  return {
    output: {
      request,
      risk: 'high',
      route: 'escalate',
      confidence: 'high',
      needsReview: true,
      explanation: `Request blocked by safety controls: ${reason}`,
      reasoning: [
        'Safety filter detected potentially problematic request pattern',
        'Automatic escalation to human review for safety',
      ],
      citations: [],
      reviewPacket: {
        summary: 'Request blocked by automated safety check.',
        recommendedAction: 'Review request for compliance with safety policies.',
        approver: 'Security Team',
        missingFields: [],
      },
    },
    retrievedChunks: [],
    processingTimeMs,
    safetyOverridesApplied: true,
  };
}

/**
 * Generate deterministic output based on retrieved policy chunks.
 * This is the current classification logic - will be enhanced with
 * OpenAI in the next milestone while keeping this as fallback.
 */
function generateDeterministicOutput(
  request: string,
  retrievedChunks: PolicyChunk[]
): ResolveOpsRequestOutput {
  const normalized = request.toLowerCase();

  // Score the request type based on retrieved chunks
  const chunkScores = {
    vacation: scoreChunks(retrievedChunks, ['VL']),
    timeTracking: scoreChunks(retrievedChunks, ['TT']),
    payroll: scoreChunks(retrievedChunks, ['PA']),
    remoteWork: scoreChunks(retrievedChunks, ['RW']),
    onboarding: scoreChunks(retrievedChunks, ['ON']),
  };

  // Find best matching policy type
  const bestMatch = Object.entries(chunkScores)
    .sort(([,a], [,b]) => b - a)[0];

  const hasRelevantPolicy = bestMatch && bestMatch[1] > 0;

  // Generate citations from retrieved chunks
  const citations: Citation[] = retrievedChunks
    .slice(0, 3)
    .map(chunk => ({
      code: chunk.ruleId,
      title: chunk.title,
      excerpt: chunk.excerpt,
    }));

  // Classification logic
  if (normalized.includes('vacation') && normalized.includes('carry')) {
    return createVacationCarryoverOutput(request, citations);
  }

  if (normalized.includes('clock') || (normalized.includes('overtime') && normalized.includes('forget'))) {
    return createTimeCorrectionOutput(request, citations, retrievedChunks);
  }

  if (normalized.includes('payroll') && normalized.includes('cutoff')) {
    return createPayrollCutoffOutput(request, citations, retrievedChunks);
  }

  // Cross-border / international remote work detection
  const hasCountryNames = /\b(portugal|spain|france|germany|mexico|canada|uk|brazil|india|china|japan|australia)\b/.test(normalized);
  const isRemoteRequest = normalized.includes('remote') || normalized.includes('work from') || normalized.includes('working from');
  if ((isRemoteRequest && hasCountryNames) || normalized.includes('abroad') || normalized.includes('cross-border')) {
    return createRemoteAbroadOutput(request, citations, retrievedChunks);
  }

  // Compensation / salary changes
  if (normalized.includes('salary') || normalized.includes('compensation') || normalized.includes('raise') || normalized.includes('higher pay')) {
    return createCompensationEscalationOutput(request, citations);
  }

  // Detect vague/benefits questions that need clarification
  const isVagueQuestion = normalized.includes('question about') || 
                          normalized.includes('help with') ||
                          (normalized.includes('benefits') && !normalized.includes('enroll') && !normalized.includes('sign up'));
  if (isVagueQuestion) {
    return createAmbiguousOutput(request);
  }

  // Fallback for requests with retrieved policies
  if (hasRelevantPolicy && citations.length > 0) {
    return createPolicyGuidanceOutput(request, citations, bestMatch[0]);
  }

  // No relevant policy found
  return createAmbiguousOutput(request);
}

/**
 * Score chunks by policy prefix
 */
function scoreChunks(chunks: PolicyChunk[], prefixes: string[]): number {
  return chunks.filter(c => prefixes.some(p => c.ruleId.startsWith(p))).length;
}

// Output generators for specific scenarios

function createVacationCarryoverOutput(
  request: string,
  citations: Citation[]
): ResolveOpsRequestOutput {
  // Ensure we cite VL-01 if available
  const vl01 = citations.find(c => c.code === 'VL-01') || citations[0];
  const finalCitations = vl01 ? [vl01] : citations;

  return {
    request,
    risk: 'low',
    route: 'answer_directly',
    confidence: 'high',
    needsReview: false,
    explanation: 'Standard vacation policy query with clear precedent.',
    reasoning: [
      'Query matches documented vacation policy',
      'No personal data modification required',
      'No compliance triggers detected',
    ],
    citations: finalCitations,
    reviewPacket: {
      summary: 'Employee inquiry about vacation carryover policy.',
      recommendedAction: 'Provide policy reference for vacation carryover.',
      approver: 'HR Operations',
      missingFields: [],
    },
  };
}

function createTimeCorrectionOutput(
  request: string,
  citations: Citation[],
  retrievedChunks: PolicyChunk[]
): ResolveOpsRequestOutput {
  // Find relevant time tracking rules
  const relevantCitations = citations.filter(c => 
    c.code.startsWith('TT-')
  );

  const hasOvertime = request.toLowerCase().includes('overtime');

  return {
    request,
    risk: 'medium',
    route: 'draft_action',
    confidence: 'high',
    needsReview: true,
    explanation: 'Time correction requires documented approval chain.',
    reasoning: [
      'Time entry modification requires manager approval',
      hasOvertime ? 'Overtime component triggers additional review' : 'Standard time correction workflow',
      'Audit trail required for compliance',
    ],
    citations: relevantCitations.length > 0 ? relevantCitations.slice(0, 3) : citations.slice(0, 2),
    draftAction: {
      type: 'time_correction',
      description: 'Submit missed clock-in time correction for approval.',
      approver: 'Direct Manager',
      missingFields: ['Original scheduled hours', 'Manager approval'],
    },
    reviewPacket: {
      summary: hasOvertime 
        ? 'Time correction request with overtime component.'
        : 'Time correction request for missed clock-in.',
      recommendedAction: 'Draft correction ticket, route to manager for approval.',
      approver: 'Direct Manager',
      missingFields: ['Original scheduled hours', 'Manager approval'],
    },
  };
}

function createPayrollCutoffOutput(
  request: string,
  citations: Citation[],
  retrievedChunks: PolicyChunk[]
): ResolveOpsRequestOutput {
  // Find PA-01 and related payroll rules
  const relevantCitations = citations.filter(c => c.code.startsWith('PA-'));

  return {
    request,
    risk: 'high',
    route: 'escalate',
    confidence: 'medium',
    needsReview: true,
    explanation: 'Payroll deadline breach requires immediate specialist intervention.',
    reasoning: [
      'Cutoff proximity creates payment risk',
      'Bank account changes require verification',
      'Time-sensitive: manual override may be needed',
    ],
    citations: relevantCitations.length > 0 ? relevantCitations.slice(0, 2) : citations.slice(0, 1),
    reviewPacket: {
      summary: 'Urgent payroll account change near cutoff deadline.',
      recommendedAction: 'Escalate to Payroll Operations immediately.',
      approver: 'Payroll Operations Lead',
      missingFields: ['Verification documents', 'Emergency contact'],
    },
  };
}

function createRemoteAbroadOutput(
  request: string,
  citations: Citation[],
  retrievedChunks: PolicyChunk[]
): ResolveOpsRequestOutput {
  // Find RW-02 and related rules
  const relevantCitations = citations.filter(c => 
    c.code.startsWith('RW-') || c.code.startsWith('PA-')
  );

  return {
    request,
    risk: 'high',
    route: 'escalate',
    confidence: 'medium',
    needsReview: true,
    explanation: 'Cross-border work triggers tax and compliance review.',
    reasoning: [
      'Multi-jurisdiction tax implications',
      'Payroll entity restrictions may apply',
      'Requires Legal + HRBP sign-off',
    ],
    citations: relevantCitations.length > 0 ? relevantCitations.slice(0, 2) : citations.slice(0, 1),
    reviewPacket: {
      summary: 'Request for international remote work arrangement.',
      recommendedAction: 'Route to Legal and HRBP for compliance review.',
      approver: 'HRBP + Legal',
      missingFields: ['Tax residency documentation', 'Business justification'],
    },
  };
}

function createCompensationEscalationOutput(
  request: string,
  citations: Citation[]
): ResolveOpsRequestOutput {
  return {
    request,
    risk: 'high',
    route: 'escalate',
    confidence: 'high',
    needsReview: true,
    explanation: 'Compensation changes require HR Director approval.',
    reasoning: [
      'Salary/compensation adjustments are high-stakes decisions',
      'Require HR Director approval per policy',
      'Never handled via automated routing',
    ],
    citations: citations.slice(0, 1), // Use whatever was retrieved
    reviewPacket: {
      summary: 'Employee request for compensation adjustment.',
      recommendedAction: 'Escalate to HR Director for review.',
      approver: 'HR Director',
      missingFields: ['Performance review documentation', 'Market analysis justification'],
    },
  };
}

function createPolicyGuidanceOutput(
  request: string,
  citations: Citation[],
  policyType: string
): ResolveOpsRequestOutput {
  const policyTypeNames: Record<string, string> = {
    vacation: 'vacation leave',
    timeTracking: 'time tracking',
    payroll: 'payroll',
    remoteWork: 'remote work',
    onboarding: 'onboarding',
  };

  return {
    request,
    risk: 'low',
    route: 'answer_directly',
    confidence: 'medium',
    needsReview: false,
    explanation: `Policy guidance request with matching ${policyTypeNames[policyType] || 'HR'} documentation.`,
    reasoning: [
      'Request matches documented policy',
      'Informational query without data modification',
      'Citations available for reference',
    ],
    citations: citations.slice(0, 2),
    reviewPacket: {
      summary: `Employee inquiry about ${policyTypeNames[policyType] || 'HR'} policy.`,
      recommendedAction: 'Provide policy reference and guidance.',
      approver: 'HR Operations',
      missingFields: [],
    },
  };
}

function createAmbiguousOutput(request: string): ResolveOpsRequestOutput {
  return {
    request,
    risk: 'medium',
    route: 'ask_for_info',
    confidence: 'low',
    needsReview: true,
    explanation: 'Request needs clarification before routing.',
    reasoning: [
      'Insufficient detail to classify risk',
      'Missing context for automated handling',
      'Recommend human triage',
    ],
    citations: [],
    reviewPacket: {
      summary: 'Unclear request requiring clarification.',
      recommendedAction: 'Request additional information from employee.',
      approver: 'HR Operations',
      missingFields: ['Request category', 'Urgency level', 'Employee ID'],
    },
  };
}

/**
 * Find a specific rule by ID and return as citation
 */
export function getCitationForRule(ruleId: string): Citation | null {
  const rule = findRuleById(ruleId);
  if (!rule) return null;

  return {
    code: rule.ruleId,
    title: rule.title,
    excerpt: rule.excerpt,
  };
}
