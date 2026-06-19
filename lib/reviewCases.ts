import { EmployeeRole } from '@/data/enterprise/employees';
import { Citation, RiskLevel, Route } from '@/lib/types';

export type ReviewCaseStatus = 'review_required' | 'escalated' | 'answered' | 'access_restricted' | 'resolved';

export interface CreatedReviewCase {
  id: string;
  request: string;
  requester: string;
  actorId: string;
  actorRole: EmployeeRole;
  targetName?: string;
  targetEmployeeId?: string;
  risk: RiskLevel | 'restricted';
  route: Route;
  status: ReviewCaseStatus;
  owner: string;
  ownerRole?: string;
  ownerDepartment?: string;
  type: string;
  summary: string;
  timestamp: string;
  time: string;
  policyReferences?: Citation[];
  missingFields?: string[];
  source: 'created_from_request_console';
}

export const REVIEW_CASES_STORAGE_KEY = 'opsguard.createdReviewCases.v1';
