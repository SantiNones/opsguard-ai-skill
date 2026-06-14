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

export interface EnterpriseDataAnswer {
  answered: true;
  answer: string;
  answerSource: 'enterprise_context';
  dataPoints: string[];       // human-readable fields surfaced
  targetName: string;
  isSelf: boolean;
}

export type EnterpriseDataResult = EnterpriseDataAnswer | { answered: false };

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

  // Detect clock-in / attendance status query
  const isClockStatusQuery =
    q.includes('clock') && (q.includes('status') || q.includes('in') || q.includes('last'));

  if (!isVacationBalanceQuery && !isLeaveStatusQuery && !isClockStatusQuery) {
    return { answered: false };
  }

  // Access check: actor must have at least minimal access to target
  if (enterpriseContext.accessLevel === 'none') {
    return { answered: false };
  }

  // Determine which employee's data to surface
  const targetId = enterpriseContext.targetEmployee?.employeeId ?? enterpriseContext.actor.employeeId;
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
