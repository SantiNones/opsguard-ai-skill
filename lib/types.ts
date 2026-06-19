export type RiskLevel = 'low' | 'medium' | 'high';

export type Route = 
  | 'answer_directly' 
  | 'ask_for_info' 
  | 'draft_action' 
  | 'restrict_access'
  | 'escalate';

export interface Citation {
  code: string;
  title: string;
  excerpt: string;
}

export interface DraftAction {
  type: string;
  description: string;
  approver: string;
  missingFields: string[];
}

export interface PayrollReportLineItem {
  label: string;
  amount: number;
}

export interface PayrollReport {
  recordId: string;
  employeeId: string;
  employeeName: string;
  payrollMonth: string;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  grossPay: number;
  netSalary: number;
  currency: string;
  bankAccountLast4: string;
  ibanCountry: string;
  payrollStatus: string;
  earnings: PayrollReportLineItem[];
  deductions: PayrollReportLineItem[];
  employerContributions: PayrollReportLineItem[];
  notes?: string;
}

export interface ResolveOpsRequestOutput {
  request: string;
  risk: RiskLevel;
  route: Route;
  confidence: 'low' | 'medium' | 'high';
  needsReview: boolean;
  explanation: string;
  reasoning: string[];
  citations: Citation[];
  draftAction?: DraftAction;
  reviewPacket?: {
    summary: string;
    recommendedAction: string;
    approver: string;
    missingFields: string[];
  };
  answerSource?: 'policy' | 'enterprise_context'; // What grounded the answer
  enterpriseAnswer?: string;                       // Data-grounded answer text
  payrollReports?: PayrollReport[];
}

export interface ExampleRequest {
  label: string;
  text: string;
}

// Enterprise context metadata for resolver output
export interface EnterpriseContextMetadata {
  actor?: {
    employeeId: string;
    name: string;
    role: string;
    department?: string;
    country?: string;
  };
  targetEmployee?: {
    employeeId: string;
    name: string;
    department?: string;
    country?: string;
    managerId?: string | null;
  } | null;
  accessLevel: 'full' | 'partial' | 'minimal' | 'none';
  redactionsApplied: number;
  hasContext: boolean;
}

// Employee-facing response
export interface EmployeeResponse {
  title: string;
  message: string;
  status: 'answered' | 'needs_more_info' | 'sent_to_hr_review' | 'not_allowed';
  visibleCitations: Citation[];
  missingFields: string[];
  nextStep: string;
  privacyNote?: string;
  confidenceNote?: string;
  answerSource?: 'policy' | 'enterprise_context';
  dataPoints?: string[]; // surfaced data fields (for enterprise context answers)
  payrollReports?: PayrollReport[];
}

// HR/Ops-facing review packet
export interface HRReviewPacket {
  riskLevel: RiskLevel;
  route: Route;
  requiresHumanReview: boolean;
  reasoning: string[];
  missingFields: string[];
  citations: Citation[];
  draftAction?: DraftAction;
  recommendedOwner: string;
  accessControlNotes: string;
  redactionsApplied: number;
  enterpriseContextSummary: {
    actorRole: string;
    accessLevel: string;
    targetEmployee?: string;
    hasRestrictedData: boolean;
  };
  confidenceLabel?: 'low' | 'medium' | 'high';
  confidenceScore?: number;
  confidenceReasons?: string[];
}
