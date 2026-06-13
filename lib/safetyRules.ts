import { RiskLevel, Route, ResolveOpsRequestOutput, Citation } from './types';
import { PolicyChunk } from './policyRetrieval';

export interface SafetyCheck {
  passed: boolean;
  violation?: string;
  override: {
    risk?: RiskLevel;
    route?: Route;
    needsReview?: boolean;
    explanation?: string;
  };
}

// High-risk keywords that should trigger safety overrides
const HIGH_RISK_KEYWORDS = [
  'payroll',
  'compensation', 
  'salary',
  'wage',
  'payment',
  'cutoff',
  'termination',
  'firing',
  'fire',
  'layoff',
  'legal',
  'lawsuit',
  'litigation',
  'cross-border',
  'abroad',
  'international',
  'tax',
  'jurisdiction',
  'visa',
  'work permit',
];

// Medium-risk keywords
const MEDIUM_RISK_KEYWORDS = [
  'overtime',
  'clock-in',
  'clock-out',
  'missed',
  'forgot',
  'correction',
  'adjustment',
  'change',
  'modify',
  'update',
  'bank account',
];

/**
 * Check if a request contains high-risk keywords
 */
function containsHighRiskTerms(request: string): boolean {
  const normalized = request.toLowerCase();
  return HIGH_RISK_KEYWORDS.some(term => normalized.includes(term.toLowerCase()));
}

/**
 * Check if a request contains medium-risk keywords
 */
function containsMediumRiskTerms(request: string): boolean {
  const normalized = request.toLowerCase();
  return MEDIUM_RISK_KEYWORDS.some(term => normalized.includes(term.toLowerCase()));
}

/**
 * Check if this is clearly just a policy explanation request (not an action)
 */
function isPolicyExplanationOnly(request: string): boolean {
  const normalized = request.toLowerCase();
  
  // If it's asking "how does X work" or "what is the policy" - likely safe
  const explanationPatterns = [
    'how do',
    'how does',
    'what is',
    "what's the",
    'can you explain',
    'tell me about',
    'policy on',
    'rule for',
  ];
  
  const isExplanation = explanationPatterns.some(p => normalized.includes(p));
  
  // But if it contains action words, it might be a request for change
  const actionPatterns = [
    'i need to',
    'i want to',
    'please',
    'help me',
    'adjust',
    'change my',
    'update my',
    'fix',
    'correct',
  ];
  
  const isActionRequest = actionPatterns.some(p => normalized.includes(p));
  
  return isExplanation && !isActionRequest;
}

/**
 * Determine if citations are valid for the request
 */
function validateCitations(
  citations: Citation[],
  retrievedChunks: PolicyChunk[]
): { valid: boolean; reason?: string } {
  if (citations.length === 0) {
    return { valid: false, reason: 'No citations provided for policy-based decision' };
  }
  
  // Check that cited rules exist in our policy set
  const availableRuleIds = new Set(retrievedChunks.map(c => c.ruleId));
  const invalidCitations = citations.filter(c => !availableRuleIds.has(c.code));
  
  if (invalidCitations.length > 0) {
    return { 
      valid: false, 
      reason: `Invalid citations: ${invalidCitations.map(c => c.code).join(', ')}` 
    };
  }
  
  return { valid: true };
}

/**
 * Apply safety rules to an output.
 * This is the main safety guardrail function.
 */
export function applySafetyRules(
  output: ResolveOpsRequestOutput,
  retrievedChunks: PolicyChunk[]
): ResolveOpsRequestOutput {
  const request = output.request.toLowerCase();
  const modified = { ...output };
  const safetyOverrides: string[] = [];

  // Rule 1: High-risk terms cannot be low risk
  if (containsHighRiskTerms(request) && output.risk === 'low') {
    // If it's clearly just asking for policy info, medium risk is fine
    if (isPolicyExplanationOnly(request)) {
      modified.risk = 'medium';
      safetyOverrides.push('Contains sensitive terms - elevated to medium risk');
    } else {
      modified.risk = 'high';
      safetyOverrides.push('Contains high-risk terms (payroll/compensation/legal/cross-border) - elevated to high risk');
    }
  }

  // Rule 2: High-risk requests must require review
  if (modified.risk === 'high' && !output.needsReview) {
    modified.needsReview = true;
    safetyOverrides.push('High-risk request must require human review');
  }

  // Rule 3: Payroll/compensation/legal/cross-border should escalate unless clearly just info
  const isSensitiveTopic = HIGH_RISK_KEYWORDS.some(term => request.includes(term.toLowerCase()));
  
  if (isSensitiveTopic && output.route === 'answer_directly') {
    if (!isPolicyExplanationOnly(request)) {
      modified.route = 'escalate';
      modified.risk = 'high';
      modified.needsReview = true;
      modified.explanation = 'Sensitive request requires specialist review.';
      safetyOverrides.push('Sensitive topic with action intent - routed to escalate');
    }
  }

  // Rule 4: Missing citations for policy-based answers
  if (output.route === 'answer_directly') {
    const citationValidation = validateCitations(output.citations, retrievedChunks);
    if (!citationValidation.valid) {
      modified.route = 'ask_for_info';
      modified.confidence = 'low';
      modified.explanation = `Cannot answer directly: ${citationValidation.reason}. Request clarification or escalate.`;
      safetyOverrides.push('Insufficient citations - routed to ask for info');
    }
  }

  // Rule 5: Time corrections with overtime are at least medium risk
  if (request.includes('clock') && (request.includes('overtime') || request.includes('hour'))) {
    if (modified.risk === 'low') {
      modified.risk = 'medium';
      safetyOverrides.push('Time correction with hours involved - elevated to medium');
    }
    if (!modified.needsReview) {
      modified.needsReview = true;
      safetyOverrides.push('Time correction requires human review');
    }
    if (modified.route === 'answer_directly') {
      modified.route = 'draft_action';
      safetyOverrides.push('Time correction cannot be answered directly - requires action');
    }
  }

  // Rule 6: Payroll cutoff scenarios are high risk
  if (request.includes('payroll') && (request.includes('cutoff') || request.includes('tomorrow') || request.includes('urgent'))) {
    modified.risk = 'high';
    modified.route = 'escalate';
    modified.needsReview = true;
    modified.explanation = 'Payroll deadline scenario requires immediate specialist attention.';
    safetyOverrides.push('Payroll cutoff scenario - escalated');
  }

  // Rule 7: Cross-border work is always high risk
  if ((request.includes('remote') || request.includes('work')) && 
      (request.includes('abroad') || request.includes('country') || request.includes('overseas'))) {
    modified.risk = 'high';
    modified.route = 'escalate';
    modified.needsReview = true;
    modified.explanation = 'Cross-border work triggers tax and compliance review.';
    safetyOverrides.push('Cross-border work detected - escalated');
  }

  // Append safety reasoning if any overrides applied
  if (safetyOverrides.length > 0) {
    modified.reasoning = [
      ...modified.reasoning,
      'Safety override applied:',
      ...safetyOverrides,
    ];
  }

  return modified;
}

/**
 * Quick safety check for API layer - determines if request should be blocked
 */
export function quickSafetyCheck(request: string): { allowed: boolean; reason?: string } {
  // Block obviously malicious or out-of-scope requests
  const blockedPatterns = [
    'hack',
    'bypass',
    'override',
    'ignore policy',
    'skip approval',
    'do it anyway',
    'without asking',
  ];
  
  const normalized = request.toLowerCase();
  for (const pattern of blockedPatterns) {
    if (normalized.includes(pattern)) {
      return { 
        allowed: false, 
        reason: 'Request appears to attempt to bypass safety controls' 
      };
    }
  }
  
  return { allowed: true };
}
