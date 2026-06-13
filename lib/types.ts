export type RiskLevel = 'low' | 'medium' | 'high';

export type Route = 
  | 'answer_directly' 
  | 'ask_for_info' 
  | 'draft_action' 
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
