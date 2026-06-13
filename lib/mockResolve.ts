import { ResolveOpsRequestOutput, ExampleRequest } from './types';

export const exampleRequests: ExampleRequest[] = [
  {
    label: 'Vacation',
    text: 'I have 5 unused vacation days from last year. Can I carry them over to next year?',
  },
  {
    label: 'Clock-in',
    text: 'I forgot to clock in yesterday and worked 2 hours overtime. How do I report this?',
  },
  {
    label: 'Payroll',
    text: "I need to adjust my bank account for this month's payroll. The cutoff is tomorrow.",
  },
  {
    label: 'Remote abroad',
    text: 'I want to work remotely from Portugal for 3 weeks next month. Is this allowed?',
  },
];

export function mockResolve(request: string): ResolveOpsRequestOutput {
  const normalized = request.toLowerCase();
  
  // Vacation carryover - low risk, answer directly
  if (normalized.includes('vacation') && normalized.includes('carry')) {
    return {
      request,
      risk: 'low',
      route: 'answer_directly',
      confidence: 'high',
      needsReview: false,
      explanation: 'Standard vacation policy query with clear precedent.',
      reasoning: [
        'Query matches documented vacation policy VL-01',
        'No personal data modification required',
        'No compliance triggers detected',
      ],
      citations: [
        {
          code: 'VL-01',
          title: 'Vacation Leave Policy',
          excerpt: 'Up to 5 unused days may be carried over per calendar year.',
        },
      ],
      reviewPacket: {
        summary: 'Employee inquiry about vacation carryover policy.',
        recommendedAction: 'Provide policy reference VL-01.',
        approver: 'HR Operations',
        missingFields: [],
      },
    };
  }
  
  // Missed clock-in + overtime - medium risk, draft action
  if (normalized.includes('clock') || (normalized.includes('overtime') && normalized.includes('forget'))) {
    return {
      request,
      risk: 'medium',
      route: 'draft_action',
      confidence: 'high',
      needsReview: true,
      explanation: 'Time correction requires documented approval chain.',
      reasoning: [
        'Time entry modification requires manager approval per TT-01',
        'Overtime component triggers payroll review per TT-02',
        'Audit trail required per TT-03',
      ],
      citations: [
        { code: 'TT-01', title: 'Time Tracking Corrections', excerpt: 'All retroactive time entries require manager sign-off.' },
        { code: 'TT-02', title: 'Overtime Reporting', excerpt: 'Overtime must be pre-approved or flagged for review.' },
        { code: 'TT-03', title: 'Audit Requirements', excerpt: 'All time corrections logged with timestamp and approver.' },
      ],
      draftAction: {
        type: 'time_correction',
        description: 'Submit missed clock-in and overtime for approval.',
        approver: 'Direct Manager + Payroll',
        missingFields: ['Original scheduled hours', 'Manager approval'],
      },
      reviewPacket: {
        summary: 'Time correction request with overtime component.',
        recommendedAction: 'Draft correction ticket, route to manager.',
        approver: 'Direct Manager',
        missingFields: ['Original scheduled hours', 'Manager approval'],
      },
    };
  }
  
  // Payroll cutoff - high risk, escalate
  if (normalized.includes('payroll') && normalized.includes('cutoff')) {
    return {
      request,
      risk: 'high',
      route: 'escalate',
      confidence: 'medium',
      needsReview: true,
      explanation: 'Payroll deadline breach requires immediate specialist intervention.',
      reasoning: [
        'Cutoff proximity creates payment risk per PA-01',
        'Bank account changes require verification per PA-03',
        'Time-sensitive: manual override may be needed',
      ],
      citations: [
        { code: 'PA-01', title: 'Payroll Cutoff Policy', excerpt: 'Changes within 48h of cutoff require specialist review.' },
        { code: 'TT-03', title: 'Audit Requirements', excerpt: 'Payroll modifications logged with urgency flag.' },
      ],
      reviewPacket: {
        summary: 'Urgent payroll account change near cutoff.',
        recommendedAction: 'Escalate to Payroll Operations immediately.',
        approver: 'Payroll Operations Lead',
        missingFields: ['Verification docs', 'Emergency contact'],
      },
    };
  }
  
  // Cross-border remote - high risk, escalate
  if (normalized.includes('remote') && normalized.includes('abroad')) {
    return {
      request,
      risk: 'high',
      route: 'escalate',
      confidence: 'medium',
      needsReview: true,
      explanation: 'Cross-border work triggers tax and compliance review.',
      reasoning: [
        'Multi-jurisdiction tax implications per RW-02',
        'Payroll entity restrictions per PA-03',
        'Requires Legal + HRBP sign-off',
      ],
      citations: [
        { code: 'RW-02', title: 'Remote Work Policy', excerpt: 'International remote work requires pre-approval.' },
        { code: 'PA-03', title: 'Payroll Entity Rules', excerpt: 'Cross-border work may violate entity restrictions.' },
      ],
      reviewPacket: {
        summary: 'Request for international remote work.',
        recommendedAction: 'Route to Legal and HRBP for review.',
        approver: 'HRBP + Legal',
        missingFields: ['Tax residency docs', 'Business justification'],
      },
    };
  }
  
  // Default response
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
