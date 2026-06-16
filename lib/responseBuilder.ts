/**
 * Dual Audience Response Builder
 * 
 * Transforms resolver output into employee-facing and HR-facing responses.
 * Ensures employees get safe answers while HR gets detailed review packets.
 */

import { 
  ResolveOpsRequestOutput, 
  EmployeeResponse, 
  HRReviewPacket, 
  EnterpriseContextMetadata,
  Citation,
  DraftAction 
} from './types';
import { ConfidenceResult, isNoPolicyFound } from './confidence';

export interface DualAudienceResponse {
  employeeResponse: EmployeeResponse;
  hrReviewPacket: HRReviewPacket;
}

/**
 * Build dual audience responses from resolver output
 */
export function buildDualAudienceResponse(
  resolverOutput: ResolveOpsRequestOutput,
  enterpriseContext?: EnterpriseContextMetadata,
  confidence?: ConfidenceResult
): DualAudienceResponse {
  const employeeResponse = buildEmployeeResponse(resolverOutput, enterpriseContext, confidence);
  const hrReviewPacket = buildHRReviewPacket(resolverOutput, enterpriseContext, confidence);

  return {
    employeeResponse,
    hrReviewPacket,
  };
}

/**
 * Build employee-facing response
 */
function buildEmployeeResponse(
  output: ResolveOpsRequestOutput,
  context?: EnterpriseContextMetadata,
  confidence?: ConfidenceResult
): EmployeeResponse {
  const { route, risk, explanation, citations, reviewPacket } = output;
  
  // Filter citations for employee visibility
  const visibleCitations = filterCitationsForEmployee(citations, context);

  // Low-confidence / no-policy note for employee
  const noPolicyFound = isNoPolicyFound(
    confidence?.confidenceLabel ?? output.confidence,
    citations.length,
    undefined
  );
  const confidenceNote = noPolicyFound
    ? 'We could not find a specific policy for this request. Please contact HR directly or provide more details.'
    : confidence?.confidenceLabel === 'low' && citations.length === 0
    ? 'Our confidence in this answer is low. Please verify with your HR team.'
    : undefined;

  // Build response based on route
  switch (route) {
    case 'answer_directly': {
      const isEnterpriseAnswer = output.answerSource === 'enterprise_context';
      return {
        title: 'Answered',
        message: isEnterpriseAnswer
          ? (output.enterpriseAnswer ?? explanation)
          : explanation,
        status: 'answered',
        visibleCitations: isEnterpriseAnswer ? [] : visibleCitations,
        missingFields: [],
        nextStep: 'No action needed',
        privacyNote: isEnterpriseAnswer
          ? 'Answer retrieved from your permissioned enterprise record.'
          : (context?.redactionsApplied || 0) > 0
          ? 'Some information has been masked for privacy.'
          : undefined,
        confidenceNote,
        answerSource: output.answerSource,
        dataPoints: isEnterpriseAnswer
          ? (output.reviewPacket?.summary.replace('Enterprise context answer: ', '').split(', ') ?? [])
          : undefined,
        payrollReports: output.payrollReports,
      };
    }
      
    case 'ask_for_info': {
      const isAccessDenied = output.reviewPacket?.summary?.startsWith('Access restricted:');
      if (isAccessDenied) {
        return {
          title: 'Access Restricted',
          message: explanation,
          status: 'not_allowed',
          visibleCitations: [],
          missingFields: [],
          nextStep: 'Contact HR directly if you have a legitimate business need',
          privacyNote: 'Access to other employees’ payroll and employee data is restricted.',
        };
      }
      return {
        title: noPolicyFound ? 'Policy Not Found' : 'More Information Needed',
        message: noPolicyFound
          ? 'We could not find a matching HR policy for your request. Please contact your HR team directly or provide more details about your situation.'
          : explanation,
        status: 'needs_more_info',
        visibleCitations,
        missingFields: extractMissingFields(output),
        nextStep: noPolicyFound
          ? 'Contact HR or provide more details'
          : 'Please provide the requested information',
        confidenceNote,
      };
    }
      
    case 'draft_action':
      if (risk === 'high' || context?.accessLevel === 'none') {
        return {
          title: 'Sent to HR Review',
          message: 'This request requires HR review. Your case has been submitted and will be handled by the appropriate team.',
          status: 'sent_to_hr_review',
          visibleCitations: [],
          missingFields: [],
          nextStep: 'Wait for HR to contact you',
          privacyNote: 'For security, specific details are not shown here.',
        };
      } else {
        return {
          title: 'Action Required',
          message: explanation,
          status: 'needs_more_info',
          visibleCitations,
          missingFields: extractMissingFields(output),
          nextStep: 'Please complete the required steps',
          confidenceNote,
        };
      }
      
    case 'escalate':
      return {
        title: 'Sent to HR Review',
        message: 'This request requires HR review. Your case has been submitted and will be handled by the appropriate team.',
        status: 'sent_to_hr_review',
        visibleCitations: [],
        missingFields: [],
        nextStep: 'Wait for HR to contact you',
        privacyNote: 'For security, specific details are not shown here.',
      };
      
    default:
      return {
        title: 'Not Allowed',
        message: 'This request cannot be processed.',
        status: 'not_allowed',
        visibleCitations: [],
        missingFields: [],
        nextStep: 'Contact HR if you believe this is an error',
      };
  }
}

/**
 * Build HR-facing review packet
 */
function buildHRReviewPacket(
  output: ResolveOpsRequestOutput,
  context?: EnterpriseContextMetadata,
  confidence?: ConfidenceResult
): HRReviewPacket {
  const { risk, route, reasoning, citations, draftAction, reviewPacket } = output;
  
  // Determine recommended owner based on request type and risk
  const recommendedOwner = determineRecommendedOwner(route, risk, context);
  
  // Build access control notes
  const accessControlNotes = buildAccessControlNotes(context);
  
  const isEnterpriseAnswer = output.answerSource === 'enterprise_context';
  return {
    riskLevel: risk,
    route,
    requiresHumanReview: route !== 'answer_directly' || risk === 'high',
    reasoning: isEnterpriseAnswer
      ? ['Answered from permissioned enterprise context (leave balance data)', ...reasoning]
      : reasoning,
    missingFields: extractMissingFields(output),
    citations,
    draftAction,
    recommendedOwner,
    accessControlNotes: isEnterpriseAnswer
      ? `${accessControlNotes}. Answer sourced from enterprise leave records (no policy citation needed).`
      : accessControlNotes,
    redactionsApplied: context?.redactionsApplied || 0,
    enterpriseContextSummary: {
      actorRole: context?.actor?.role || 'unknown',
      accessLevel: context?.accessLevel || 'none',
      targetEmployee: context?.targetEmployee?.name,
      hasRestrictedData: (context?.redactionsApplied || 0) > 0,
    },
    confidenceLabel: confidence?.confidenceLabel,
    confidenceScore: confidence?.confidenceScore,
    confidenceReasons: confidence?.confidenceReasons,
  };
}

/**
 * Filter citations for employee visibility
 */
function filterCitationsForEmployee(
  citations: Citation[],
  context?: EnterpriseContextMetadata
): Citation[] {
  // If no access control or full access, show all citations
  if (!context || context.accessLevel === 'full') {
    return citations;
  }
  
  // For limited access, only show non-sensitive citations
  return citations.filter(citation => {
    // Filter out payroll, compensation, and bank-related citations for non-HR roles
    const sensitiveKeywords = ['payroll', 'compensation', 'salary', 'bank', 'payment'];
    const isSensitive = sensitiveKeywords.some(keyword => 
      citation.title.toLowerCase().includes(keyword) ||
      citation.excerpt.toLowerCase().includes(keyword)
    );
    
    // Only show sensitive citations to HR and payroll roles
    if (isSensitive && !['hr_ops', 'payroll_admin'].includes(context?.actor?.role || '')) {
      return false;
    }
    
    return true;
  });
}

/**
 * Extract missing fields from output
 */
function extractMissingFields(output: ResolveOpsRequestOutput): string[] {
  const fields: string[] = [];
  
  // From draft action
  if (output.draftAction?.missingFields) {
    fields.push(...output.draftAction.missingFields);
  }
  
  // From review packet
  if (output.reviewPacket?.missingFields) {
    fields.push(...output.reviewPacket.missingFields);
  }
  
  // From reasoning (look for patterns)
  const missingPatterns = [
    /missing (.+)/gi,
    /need (.+)/gi,
    /provide (.+)/gi,
    /requires (.+)/gi,
  ];
  
  for (const pattern of missingPatterns) {
    for (const reason of output.reasoning) {
      const matches = reason.match(pattern);
      if (matches) {
        fields.push(...matches.map(m => m.toLowerCase()));
      }
    }
  }
  
  // Deduplicate and clean
  return [...new Set(fields.map(f => f.replace(/^(missing|need|provide|requires)\s+/i, '')))];
}

/**
 * Determine recommended owner for HR review
 */
function determineRecommendedOwner(
  route: string,
  risk: string,
  context?: EnterpriseContextMetadata
): string {
  const actorRole = context?.actor?.role;
  
  // High risk always goes to HR Ops
  if (risk === 'high') {
    return 'HR Operations';
  }
  
  // Payroll-specific requests
  if (isPayrollRequest(context)) {
    return 'Payroll Administrator';
  }
  
  // Cross-border requests
  if (isCrossBorderRequest(context)) {
    return 'HR Operations';
  }
  
  // Manager escalations
  if (actorRole === 'manager' && route === 'escalate') {
    return 'HR Operations';
  }
  
  // Default
  return 'HR Operations';
}

/**
 * Check if this is a payroll request
 */
function isPayrollRequest(context?: EnterpriseContextMetadata): boolean {
  // This would ideally be determined from the request content
  // For now, use context heuristics
  return (context?.redactionsApplied || 0) > 0 || context?.accessLevel === 'none';
}

/**
 * Check if this is a cross-border request
 */
function isCrossBorderRequest(context?: EnterpriseContextMetadata): boolean {
  // Check if actor and target are in different countries
  if (context?.actor?.country && context?.targetEmployee?.country) {
    return context.actor.country !== context.targetEmployee.country;
  }
  return false;
}

/**
 * Build access control notes for HR packet
 */
function buildAccessControlNotes(context?: EnterpriseContextMetadata): string {
  if (!context) {
    return 'No access control context available';
  }
  
  const notes: string[] = [];
  
  notes.push(`Actor: ${context.actor?.name} (${context.actor?.role})`);
  
  if (context.targetEmployee) {
    notes.push(`Target: ${context.targetEmployee.name}`);
    notes.push(`Access Level: ${context.accessLevel}`);
  }
  
  if (context.redactionsApplied > 0) {
    notes.push(`${context.redactionsApplied} fields redacted for privacy`);
  }
  
  if (context.accessLevel === 'none') {
    notes.push('ACCESS DENIED: Actor lacks permissions for requested data');
  }
  
  return notes.join('. ');
}
