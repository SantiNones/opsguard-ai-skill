/**
 * Enterprise Data Resolver
 *
 * Detects when a query can be answered directly from permissioned enterprise
 * context data (e.g. vacation balance, leave status) without needing policy
 * citations. This is distinct from policy-grounded answers:
 *
 *   Policy answer    → requires citation from policy KB
 *   Enterprise answer → requires permissioned access to actor/target data
 *
 * Only safe, non-sensitive fields are surfaced (balance, status, counts).
 * Salary, bank, and compensation data are never returned here.
 */

import { getLeaveStatus } from '@/data/enterprise/leaveStatus';
import { getEmployeeById } from '@/data/enterprise/employees';
import { EnterpriseContextResult } from './enterpriseContext';
import { determineAccess } from './accessControl';

export interface EnterpriseDataAnswer {
  answered: true;
  answer: string;
  answerSource: 'enterprise_context';
  dataPoints: string[];       // human-readable fields surfaced
  targetName: string;
  isSelf: boolean;
}

export interface EnterpriseDataDenied {
  answered: false;
  accessDenied: true;
  targetFirstName: string;   // used to build the denial message
}

export type EnterpriseDataResult = EnterpriseDataAnswer | EnterpriseDataDenied | { answered: false; accessDenied?: never };

/**
 * Check if actor is permitted to view leave balance data for target.
 *
 * Leave balance is HR employee-admin data, NOT payroll data:
 *   - Self access: always allowed
 *   - Manager → direct report: allowed (canApproveVacation)
 *   - HR Ops → anyone: allowed (leave admin role)
 *   - Payroll Admin → non-self: DENIED (payroll ≠ leave admin)
 *   - Employee peer → non-self: DENIED
 */
function canAccessLeaveBalance(
  actorId: string,
  targetId: string,
  actorRole: string
): boolean {
  if (actorId === targetId) return true;
  if (actorRole === 'hr_ops') return true;
  if (actorRole === 'manager') {
    const access = determineAccess(actorId, targetId);
    return access.isDirectReport;
  }
  return false;
}

/**
 * Detect whether the query asks for vacation balance or leave status,
 * and whether the actor has permission to see it.
 *
 * Returns a formatted, data-grounded answer if conditions are met.
 */
export function tryEnterpriseContextAnswer(
  query: string,
  enterpriseContext: EnterpriseContextResult | null
): EnterpriseDataResult {
  if (!enterpriseContext) return { answered: false };

  const q = query.toLowerCase();
  const isSelf = enterpriseContext.actor.employeeId === enterpriseContext.targetEmployee?.employeeId;

  // Detect vacation / leave balance intent
  const isVacationBalanceQuery =
    (q.includes('vacation') || q.includes('leave') || q.includes('pto')) &&
    (q.includes('balance') || q.includes('left') || q.includes('remaining') ||
      q.includes('how many') || q.includes('days') || q.includes('available'));

  // Detect leave request status query
  const isLeaveStatusQuery =
    q.includes('pending') && (q.includes('leave') || q.includes('vacation') || q.includes('request'));

  // Detect clock-in / attendance status query (pure lookups only)
  // Exclude action/correction workflows: "I forgot to clock in", "how do I fix/report", etc.
  const isActionRequest =
    q.includes('forgot') || q.includes('fix') || q.includes('report') ||
    q.includes('correct') || q.includes('adjust') || q.includes('how do i') ||
    q.includes('how can i') || q.includes('what do i') || q.includes('what should i') ||
    q.includes('overtime');
  const isClockStatusQuery =
    !isActionRequest &&
    q.includes('clock') && (q.includes('status') || q.includes('last clock') || q.includes('last clock-in'));

  if (!isVacationBalanceQuery && !isLeaveStatusQuery && !isClockStatusQuery) {
    return { answered: false };
  }

  // Permission check: use leave-specific access rules (stricter than general accessLevel)
  const actorId = enterpriseContext.actor.employeeId;
  const targetId = enterpriseContext.targetEmployee?.employeeId ?? actorId;
  if (!canAccessLeaveBalance(actorId, targetId, enterpriseContext.actor.role)) {
    // If the query was for a SPECIFIC other employee, signal access denied explicitly
    // so the resolver can return a clear restriction message instead of a policy fallthrough.
    if (actorId !== targetId) {
      const deniedTarget = getEmployeeById(targetId);
      return {
        answered: false,
        accessDenied: true,
        targetFirstName: deniedTarget?.name.split(' ')[0] ?? 'that employee',
      };
    }
    return { answered: false };
  }

  // Determine which employee's data to surface
  const leave = getLeaveStatus(targetId);
  if (!leave) return { answered: false };

  const targetEmp = getEmployeeById(targetId);
  if (!targetEmp) return { answered: false };

  const targetName = isSelf ? 'you' : targetEmp.name.split(' ')[0]; // first name only
  const dataPoints: string[] = [];
  const parts: string[] = [];

  if (isVacationBalanceQuery) {
    const pending = leave.pendingLeaveRequests > 0
      ? ` (${leave.pendingLeaveRequests} request${leave.pendingLeaveRequests > 1 ? 's' : ''} pending approval)`
      : '';
    const subjectVerb = isSelf ? 'You have' : `${targetName} has`;
    parts.push(
      `${subjectVerb} **${leave.remainingVacationDays} vacation days remaining** out of ${leave.vacationBalance} entitled this year (${leave.usedVacationDays} already taken${pending}).`
    );
    dataPoints.push(`Remaining days: ${leave.remainingVacationDays}`);
    dataPoints.push(`Used: ${leave.usedVacationDays} of ${leave.vacationBalance}`);
    if (leave.pendingLeaveRequests > 0) {
      dataPoints.push(`Pending requests: ${leave.pendingLeaveRequests}`);
    }
  }

  if (isLeaveStatusQuery) {
    const subjectHave = isSelf ? 'You have' : `${targetName} has`;
    parts.push(`${subjectHave} ${leave.pendingLeaveRequests} pending leave request${leave.pendingLeaveRequests !== 1 ? 's' : ''}.`);
    dataPoints.push(`Pending leave requests: ${leave.pendingLeaveRequests}`);
  }

  if (isClockStatusQuery) {
    const statusLabel: Record<string, string> = {
      'on-time': 'clocked in on time',
      late: 'clocked in late',
      missed: 'missed clock-in',
      remote: 'working remotely (no clock-in required)',
    };
    const subjectIs = isSelf ? 'Your last' : `${targetName}'s last`;
    parts.push(`${subjectIs} clock-in status: ${statusLabel[leave.lastClockInStatus] ?? leave.lastClockInStatus}.`);
    dataPoints.push(`Last clock-in: ${leave.lastClockInStatus}`);
  }

  if (parts.length === 0) return { answered: false };

  return {
    answered: true,
    answer: parts.join(' '),
    answerSource: 'enterprise_context',
    dataPoints,
    targetName: isSelf ? 'self' : targetEmp.name,
    isSelf,
  };
}
