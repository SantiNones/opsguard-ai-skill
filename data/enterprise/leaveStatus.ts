/**
 * Fictitious Employee Leave Status Data
 *
 * Leave balances and clock-in status for enterprise context simulation.
 * No real personal data. All values are illustrative.
 */

export type ClockInStatus = 'on-time' | 'late' | 'missed' | 'remote';
export type OnboardingStatus = 'complete' | 'in-progress' | 'pending';

export interface LeaveStatus {
  employeeId: string;
  vacationBalance: number;          // Total entitled days this year (from contract)
  usedVacationDays: number;         // Days taken so far
  remainingVacationDays: number;    // Computed: balance - used
  pendingLeaveRequests: number;     // Requests awaiting approval
  lastClockInStatus: ClockInStatus;
  onboardingStatus?: OnboardingStatus;
}

/**
 * Mock leave status dataset — June 2026
 * Figures are consistent with contract vacationDaysPerYear values.
 */
export const leaveStatuses: LeaveStatus[] = [
  {
    employeeId: 'EMP-001',        // Ana García
    vacationBalance: 23,
    usedVacationDays: 6,
    remainingVacationDays: 17,
    pendingLeaveRequests: 0,
    lastClockInStatus: 'on-time',
    onboardingStatus: 'complete',
  },
  {
    employeeId: 'EMP-002',        // Carlos Ruiz
    vacationBalance: 25,
    usedVacationDays: 8,
    remainingVacationDays: 17,
    pendingLeaveRequests: 1,
    lastClockInStatus: 'on-time',
    onboardingStatus: 'complete',
  },
  {
    employeeId: 'EMP-003',        // Laura Martín (manager)
    vacationBalance: 25,
    usedVacationDays: 10,
    remainingVacationDays: 15,
    pendingLeaveRequests: 0,
    lastClockInStatus: 'remote',
    onboardingStatus: 'complete',
  },
  {
    employeeId: 'EMP-004',        // Elena Fernández (part-time)
    vacationBalance: 22,
    usedVacationDays: 4,
    remainingVacationDays: 18,
    pendingLeaveRequests: 2,
    lastClockInStatus: 'on-time',
    onboardingStatus: 'complete',
  },
  {
    employeeId: 'EMP-005',        // Miguel Torres (manager)
    vacationBalance: 25,
    usedVacationDays: 12,
    remainingVacationDays: 13,
    pendingLeaveRequests: 0,
    lastClockInStatus: 'remote',
    onboardingStatus: 'complete',
  },
  {
    employeeId: 'EMP-006',        // Marta Ruiz (HR Ops)
    vacationBalance: 23,
    usedVacationDays: 5,
    remainingVacationDays: 18,
    pendingLeaveRequests: 0,
    lastClockInStatus: 'on-time',
    onboardingStatus: 'complete',
  },
  {
    employeeId: 'EMP-007',        // Diego Costa (payroll admin)
    vacationBalance: 23,
    usedVacationDays: 7,
    remainingVacationDays: 16,
    pendingLeaveRequests: 0,
    lastClockInStatus: 'on-time',
    onboardingStatus: 'complete',
  },
  {
    employeeId: 'EMP-008',        // Sofia Andersen (remote)
    vacationBalance: 25,
    usedVacationDays: 3,
    remainingVacationDays: 22,
    pendingLeaveRequests: 1,
    lastClockInStatus: 'remote',
    onboardingStatus: 'complete',
  },
];

/**
 * Get leave status for an employee
 */
export function getLeaveStatus(employeeId: string): LeaveStatus | undefined {
  return leaveStatuses.find(l => l.employeeId === employeeId);
}
