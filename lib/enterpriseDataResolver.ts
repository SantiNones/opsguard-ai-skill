/**
 * Enterprise Data Resolver
 *
 * Detects when a query can be answered directly from permissioned enterprise
 * context data (e.g. vacation balance, leave status, own payroll reports) without needing policy
 * citations. This is distinct from policy-grounded answers:
 *
 *   Policy answer    → requires citation from policy KB
 *   Enterprise answer → requires permissioned access to actor/target data
 *
 * Only safe, non-sensitive fields are surfaced (balance, status, counts).
 * Payroll reports are returned only for self-access.
 */

import { getLeaveStatus } from '@/data/enterprise/leaveStatus';
import { getRecentPayrollRecords } from '@/data/enterprise/payrollRecords';
import { getEmployeeById } from '@/data/enterprise/employees';
import { EnterpriseContextResult } from './enterpriseContext';
import { determineAccess } from './accessControl';
import { PayrollReport } from './types';

export interface EnterpriseDataAnswer {
  answered: true;
  answer: string;
  answerSource: 'enterprise_context';
  dataPoints: string[];       // human-readable fields surfaced
  targetName: string;
  isSelf: boolean;
  payrollReports?: PayrollReport[];
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
  const isCarryoverPolicyQuery =
    (q.includes('vacation') || q.includes('leave') || q.includes('pto')) &&
    (q.includes('carry over') || q.includes('carryover') || q.includes('carry forward') || q.includes('unused'));

  const isAnnualEntitlementQuery =
    (q.includes('vacation') || q.includes('leave') || q.includes('pto')) &&
    (
      q.includes('per year') ||
      q.includes('each year') ||
      q.includes('annually') ||
      q.includes('annual') ||
      q.includes('entitled') ||
      q.includes('entitlement') ||
      q.includes('allowance')
    ) &&
    !q.includes('balance') &&
    !q.includes('left') &&
    !q.includes('remaining') &&
    !q.includes('available');

  const isVacationBalanceQuery =
    !isCarryoverPolicyQuery &&
    !isAnnualEntitlementQuery &&
    (q.includes('vacation') || q.includes('leave') || q.includes('pto')) &&
    (q.includes('balance') || q.includes('left') || q.includes('remaining') || q.includes('available'));

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

  const isPayrollReportQuery =
    (
      q.includes('payroll report') ||
      q.includes('payroll reports') ||
      q.includes('payslip') ||
      q.includes('pay slip') ||
      q.includes('paystub') ||
      q.includes('pay stub') ||
      q.includes('nomina') ||
      q.includes('nómina') ||
      q.includes('nominas') ||
      q.includes('nóminas')
    ) &&
    (
      q.includes('my') ||
      q.includes('mis') ||
      q.includes('mi ') ||
      q.includes('own') ||
      q.includes('show') ||
      q.includes('see') ||
      q.includes('open') ||
      q.includes('view')
    );

  if (!isVacationBalanceQuery && !isLeaveStatusQuery && !isClockStatusQuery && !isPayrollReportQuery) {
    return { answered: false };
  }

  // Permission check: use leave-specific access rules (stricter than general accessLevel)
  const actorId = enterpriseContext.actor.employeeId;
  const targetId = enterpriseContext.targetEmployee?.employeeId ?? actorId;
  if (isPayrollReportQuery && actorId !== targetId) {
    const deniedTarget = getEmployeeById(targetId);
    return {
      answered: false,
      accessDenied: true,
      targetFirstName: deniedTarget?.name.split(' ')[0] ?? 'that employee',
    };
  }

  if (!isPayrollReportQuery && !canAccessLeaveBalance(actorId, targetId, enterpriseContext.actor.role)) {
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
  const targetEmp = getEmployeeById(targetId);
  if (!targetEmp) return { answered: false };

  const targetName = isSelf ? 'you' : targetEmp.name.split(' ')[0]; // first name only
  const dataPoints: string[] = [];
  const parts: string[] = [];

  if (isPayrollReportQuery) {
    const reports = getRecentPayrollRecords(actorId, 3).map(report => ({
      recordId: report.recordId,
      employeeId: report.employeeId,
      employeeName: targetEmp.name,
      payrollMonth: report.payrollMonth,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      paymentDate: report.paymentDate,
      grossPay: report.grossPay,
      netSalary: report.netSalary,
      currency: report.currency,
      bankAccountLast4: report.bankAccountLast4,
      ibanCountry: report.ibanCountry,
      payrollStatus: report.payrollStatus,
      earnings: report.earnings,
      deductions: report.deductions,
      employerContributions: report.employerContributions,
      notes: report.notes,
    }));

    if (reports.length === 0) return { answered: false };

    parts.push(`I found your latest ${reports.length} payroll report${reports.length !== 1 ? 's' : ''}. These contain sensitive payroll information and are only visible to you.`);
    dataPoints.push(`Payroll reports: ${reports.length}`);
    dataPoints.push(`Latest month: ${reports[0].payrollMonth}`);
    dataPoints.push(`Access scope: self only`);

    return {
      answered: true,
      answer: parts.join(' '),
      answerSource: 'enterprise_context',
      dataPoints,
      targetName: 'self',
      isSelf: true,
      payrollReports: reports,
    };
  }

  const leave = getLeaveStatus(targetId);
  if (!leave) return { answered: false };

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
