import { ResolveOpsRequestOutput, Citation, EnterpriseContextMetadata } from './types';
import { retrieveWithDiagnostics, PolicyChunk, findRuleById, RetrievalDiagnostics } from './policyRetrieval';
import { applySafetyRules, quickSafetyCheck } from './safetyRules';
import { aiResolve, isAIEnabled } from './aiResolve';
import { buildEnterpriseContext, formatEnterpriseContextForResolver, getContextSummary } from './enterpriseContext';
import { calculateConfidence, ConfidenceResult } from './confidence';
import { tryEnterpriseContextAnswer } from './enterpriseDataResolver';
import { assessConfidentiality, ConfidentialityMetadata } from './privacy/confidentiality';
import { buildObservabilityMetadata, ObservabilityMetadata } from './observability';

export interface ResolveResult {
  output: ResolveOpsRequestOutput;
  retrievedChunks: PolicyChunk[];
  processingTimeMs: number;
  safetyOverridesApplied: boolean;
  mode: 'ai' | 'fallback';
  fallbackReason?: string;
  enterpriseContext?: EnterpriseContextMetadata;
  retrievalDiagnostics?: RetrievalDiagnostics;
  confidence?: ConfidenceResult;
  confidentiality?: ConfidentialityMetadata;
  observability?: ObservabilityMetadata;
}

/**
 * Main resolver function that orchestrates:
 * 1. Enterprise context building (if actorId provided)
 * 2. Policy retrieval
 * 3. AI classification (if enabled) with deterministic fallback
 * 4. Safety rule application
 * 
 * AI mode is used when USE_AI=true and OPENAI_API_KEY is set.
 * Falls back to deterministic resolver on any AI failure.
 */
export async function resolveOpsRequest(
  userRequest: string,
  actorId?: string
): Promise<ResolveResult> {
  const startTime = Date.now();

  // Build enterprise context if actorId provided
  let enterpriseContextMetadata: EnterpriseContextMetadata | undefined;
  let enterpriseContextText = '';
  
  if (actorId) {
    const enterpriseContext = buildEnterpriseContext(userRequest, actorId);
    if (enterpriseContext) {
      enterpriseContextText = formatEnterpriseContextForResolver(enterpriseContext);
      const summary = getContextSummary(enterpriseContext);
      enterpriseContextMetadata = {
        actor: enterpriseContext.actor,
        targetEmployee: enterpriseContext.targetEmployee,
        accessLevel: summary.accessLevel,
        redactionsApplied: summary.redactionCount,
        hasContext: summary.hasContext,
      };
    }
  }

  // Quick safety check
  const safetyCheck = quickSafetyCheck(userRequest);
  if (!safetyCheck.allowed) {
    const result = createBlockedResponse(userRequest, safetyCheck.reason!, startTime);
    return { 
      ...result, 
      mode: 'fallback', 
      fallbackReason: 'Safety check failed',
      enterpriseContext: enterpriseContextMetadata,
    };
  }

  // Step 1: Retrieve relevant policy chunks with diagnostics
  const { chunks: retrievedChunks, diagnostics: retrievalDiagnostics } = retrieveWithDiagnostics(
    userRequest,
    { limit: 5, maxContextTokens: 1800, includeDiagnostics: true }
  );

  // Step 1b: Try enterprise context data answer (before AI/deterministic)
  // Handles permissioned structured-data queries (vacation balance, leave status)
  // that don't require policy citations — only actor permission.
  if (actorId) {
    const enterpriseContext = buildEnterpriseContext(userRequest, actorId);
    const dataAnswer = tryEnterpriseContextAnswer(userRequest, enterpriseContext);

    // Access-denied: query targeted a specific employee but actor lacks permission.
    // Return a clear restriction response; do not fall through to the policy path.
    if (!dataAnswer.answered && dataAnswer.accessDenied) {
      const deniedOutput: ResolveOpsRequestOutput = {
        request: userRequest,
        risk: 'low',
        route: 'ask_for_info',
        confidence: 'high',
        needsReview: false,
        explanation: `I'm not able to show you ${dataAnswer.targetFirstName}'s restricted employee data. Payroll and employee records are only shown when you have the required permission. Please contact HR directly if you have a legitimate need.`,
        reasoning: [
          `Access denied: actor role (${enterpriseContext?.actor.role}) is not permitted to view restricted data for ${dataAnswer.targetFirstName}`,
          'Restricted employee data requires an approved access relationship',
          'No restricted employee data was returned',
        ],
        citations: [],
        reviewPacket: {
          summary: `Access restricted: actor attempted to view restricted employee data for ${dataAnswer.targetFirstName} without permission.`,
          recommendedAction: 'No action required. Actor should contact HR if they have a legitimate business need.',
          approver: 'None',
          missingFields: [],
        },
      };
      const deniedProcessingTimeMs = Date.now() - startTime;
      const deniedConfidence = calculateConfidence(deniedOutput, retrievalDiagnostics, enterpriseContextMetadata, 'fallback');
      const deniedConfidentiality = assessConfidentiality(userRequest, enterpriseContextMetadata);
      const deniedObservability = buildObservabilityMetadata({
        latencyMs: deniedProcessingTimeMs,
        mode: 'fallback',
        fallbackReason: 'enterprise_access_denied',
        retrievalDiagnostics,
        confidence: deniedConfidence,
        confidentiality: deniedConfidentiality,
        requiresHumanReview: false,
      });
      return {
        output: deniedOutput,
        retrievedChunks,
        processingTimeMs: deniedProcessingTimeMs,
        safetyOverridesApplied: false,
        mode: 'fallback',
        fallbackReason: 'enterprise_access_denied',
        enterpriseContext: enterpriseContextMetadata,
        retrievalDiagnostics,
        confidence: deniedConfidence,
        confidentiality: deniedConfidentiality,
        observability: deniedObservability,
      };
    }

    if (dataAnswer.answered) {
      const ecOutput: ResolveOpsRequestOutput = {
        request: userRequest,
        risk: 'low',
        route: 'answer_directly',
        confidence: 'high',
        needsReview: false,
        explanation: dataAnswer.answer,
        reasoning: [
          'Query answered from permissioned enterprise context data',
          `Source: enterprise record for ${dataAnswer.targetName}`,
          'No policy citation required — data is directly accessible',
        ],
        citations: [],
        answerSource: 'enterprise_context',
        enterpriseAnswer: dataAnswer.answer,
        payrollReports: dataAnswer.payrollReports,
        reviewPacket: {
          summary: `Enterprise context answer: ${dataAnswer.dataPoints.join(', ')}`,
          recommendedAction: 'No action required — informational answer from permissioned data.',
          approver: 'None',
          missingFields: [],
        },
      };
      const ecProcessingTimeMs = Date.now() - startTime;
      const ecConfidence = calculateConfidence(
        ecOutput, retrievalDiagnostics, enterpriseContextMetadata, 'fallback'
      );
      const ecConfidentiality = assessConfidentiality(userRequest, enterpriseContextMetadata);
      const ecObservability = buildObservabilityMetadata({
        latencyMs: ecProcessingTimeMs,
        mode: 'fallback',
        fallbackReason: 'enterprise_context_answer',
        retrievalDiagnostics,
        confidence: ecConfidence,
        confidentiality: ecConfidentiality,
        requiresHumanReview: false,
      });
      return {
        output: ecOutput,
        retrievedChunks,
        processingTimeMs: ecProcessingTimeMs,
        safetyOverridesApplied: false,
        mode: 'fallback',
        fallbackReason: 'enterprise_context_answer',
        enterpriseContext: enterpriseContextMetadata,
        retrievalDiagnostics,
        confidence: ecConfidence,
        confidentiality: ecConfidentiality,
        observability: ecObservability,
      };
    }
  }

  // Step 2: Try AI resolver if enabled
  let baseOutput: ResolveOpsRequestOutput;
  let mode: 'ai' | 'fallback' = 'fallback';
  let fallbackReason: string | undefined;

  if (isAIEnabled()) {
    const aiResult = await aiResolve(userRequest, retrievedChunks);
    
    if (aiResult.success) {
      // Validate AI output safety
      const aiOutput = aiResult.output;
      
      // Check citations are valid
      const allowedRuleIds = retrievedChunks.map(c => c.ruleId);
      const hasInvalidCitations = aiOutput.citations.some(
        c => !allowedRuleIds.includes(c.code)
      );
      
      // Check for safety violations (AI trying to auto-approve sensitive actions)
      const isUnsafeRoute = 
        aiOutput.route === 'answer_directly' && 
        (userRequest.toLowerCase().includes('payroll') ||
         userRequest.toLowerCase().includes('compensation') ||
         userRequest.toLowerCase().includes('salary') ||
         userRequest.toLowerCase().includes('cross-border'));
      
      if (!hasInvalidCitations && !isUnsafeRoute) {
        baseOutput = aiOutput;
        mode = 'ai';
      } else {
        fallbackReason = hasInvalidCitations 
          ? 'AI cited invalid rules' 
          : 'AI attempted unsafe routing';
        baseOutput = generateDeterministicOutput(userRequest, retrievedChunks);
      }
    } else {
      // AI failed, use fallback
      fallbackReason = aiResult.error;
      baseOutput = generateDeterministicOutput(userRequest, retrievedChunks);
    }
  } else {
    // AI not enabled, use deterministic
    baseOutput = generateDeterministicOutput(userRequest, retrievedChunks);
  }

  // Step 3: Apply safety rules (always run)
  const safeOutput = applySafetyRules(baseOutput, retrievedChunks);
  const safetyOverridesApplied = JSON.stringify(baseOutput) !== JSON.stringify(safeOutput);

  const processingTimeMs = Date.now() - startTime;

  // Step 4: Compute confidence, confidentiality, and observability
  const confidence = calculateConfidence(
    safeOutput,
    retrievalDiagnostics,
    enterpriseContextMetadata,
    mode,
    fallbackReason
  );

  const confidentiality = assessConfidentiality(
    userRequest,
    enterpriseContextMetadata
  );

  const observability = buildObservabilityMetadata({
    latencyMs: processingTimeMs,
    mode,
    fallbackReason,
    retrievalDiagnostics,
    confidence,
    confidentiality,
    requiresHumanReview: safeOutput.needsReview,
  });

  return {
    output: safeOutput,
    retrievedChunks,
    processingTimeMs,
    safetyOverridesApplied,
    mode,
    fallbackReason,
    enterpriseContext: enterpriseContextMetadata,
    retrievalDiagnostics,
    confidence,
    confidentiality,
    observability,
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
    mode: 'fallback',
    fallbackReason: reason,
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

  const isVacationEntitlementQuestion =
    (normalized.includes('vacation') || normalized.includes('leave') || normalized.includes('pto')) &&
    (
      normalized.includes('per year') ||
      normalized.includes('each year') ||
      normalized.includes('annually') ||
      normalized.includes('annual') ||
      normalized.includes('entitled') ||
      normalized.includes('entitlement') ||
      normalized.includes('allowance')
    ) &&
    !normalized.includes('balance') &&
    !normalized.includes('left') &&
    !normalized.includes('remaining') &&
    !normalized.includes('available');

  if (isVacationEntitlementQuestion) {
    return createVacationEntitlementOutput(request, citations);
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

function createVacationEntitlementOutput(
  request: string,
  citations: Citation[]
): ResolveOpsRequestOutput {
  const vl05 = citations.find(c => c.code === 'VL-05');
  const finalCitations = vl05 ? [vl05] : citations.filter(c => c.code.startsWith('VL-')).slice(0, 2);

  return {
    request,
    risk: 'low',
    route: 'answer_directly',
    confidence: 'medium',
    needsReview: false,
    explanation: 'Full-time employees are entitled to 23 paid vacation days per calendar year. Individual entitlements may vary by contract, seniority, or local employment agreement.',
    reasoning: [
      'Query asks about annual vacation allowance rather than remaining balance',
      'No employee-specific balance lookup required',
      'Vacation policy contains a dedicated annual entitlement rule',
    ],
    citations: finalCitations,
    reviewPacket: {
      summary: 'Employee inquiry about annual vacation entitlement.',
      recommendedAction: 'Explain annual vacation allowance policy and clarify that remaining balances are separate live data lookups.',
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
      recommendedAction: 'Verify the original scheduled hours, confirm manager approval, and route the time correction to the direct manager for review.',
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
