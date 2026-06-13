/**
 * Role Definitions and Permissions
 * 
 * Enterprise role-based access control definitions.
 */

export type EmployeeRole = 'employee' | 'manager' | 'hr_ops' | 'payroll_admin';

export interface FieldPermission {
  field: string;
  read: boolean;
  write: boolean;
  redact?: boolean; // If true, show redacted version instead of actual value
}

export interface RolePermissions {
  role: EmployeeRole;
  description: string;
  // Self permissions (what you can see about yourself)
  selfPermissions: FieldPermission[];
  // Other permissions (what you can see about others)
  otherPermissions: FieldPermission[];
  // Manager-specific permissions for direct reports
  directReportPermissions?: FieldPermission[];
  // Special capabilities
  capabilities: {
    canApproveVacation: boolean;
    canViewTeamCalendar: boolean;
    canViewSalaryDetails: boolean;
    canApprovePayrollChanges: boolean;
    canApproveCrossBorderWork: boolean;
    canViewBankDetails: boolean;
    canViewCompensationBand: boolean;
  };
}

/**
 * Role permission definitions
 */
export const rolePermissions: Record<EmployeeRole, RolePermissions> = {
  employee: {
    role: 'employee',
    description: 'Standard employee - can access own information only',
    selfPermissions: [
      { field: 'employeeId', read: true, write: false },
      { field: 'name', read: true, write: false },
      { field: 'email', read: true, write: false },
      { field: 'department', read: true, write: false },
      { field: 'country', read: true, write: false },
      { field: 'managerId', read: true, write: false },
      { field: 'employmentType', read: true, write: false },
      { field: 'startDate', read: true, write: false },
      { field: 'payrollRegion', read: true, write: false },
      // Contract fields
      { field: 'contractType', read: true, write: false },
      { field: 'weeklyHours', read: true, write: false },
      { field: 'remoteWorkAllowed', read: true, write: false },
      { field: 'vacationDaysPerYear', read: true, write: false },
      { field: 'compensationBand', read: true, write: false }, // Can see own band
      // Payroll fields - redacted
      { field: 'payrollStatus', read: true, write: false },
      { field: 'grossSalary', read: false, write: false, redact: true },
      { field: 'netSalary', read: false, write: false, redact: true },
      { field: 'bankAccountLast4', read: false, write: false, redact: true },
    ],
    otherPermissions: [], // Cannot see other employees' details
    capabilities: {
      canApproveVacation: false,
      canViewTeamCalendar: false,
      canViewSalaryDetails: false,
      canApprovePayrollChanges: false,
      canApproveCrossBorderWork: false,
      canViewBankDetails: false,
      canViewCompensationBand: false,
    },
  },
  
  manager: {
    role: 'manager',
    description: 'People manager - can see direct reports basic info and work status',
    selfPermissions: [
      { field: '*', read: true, write: false }, // Can see all own data
    ],
    directReportPermissions: [
      { field: 'employeeId', read: true, write: false },
      { field: 'name', read: true, write: false },
      { field: 'email', read: true, write: false, redact: true }, // Partial redaction
      { field: 'department', read: true, write: false },
      { field: 'country', read: true, write: false },
      { field: 'employmentType', read: true, write: false },
      { field: 'startDate', read: true, write: false },
      // Contract - work status only
      { field: 'contractType', read: true, write: false },
      { field: 'weeklyHours', read: true, write: false },
      { field: 'remoteWorkAllowed', read: true, write: false },
      { field: 'vacationDaysPerYear', read: true, write: false },
      // Cannot see compensation details
      { field: 'compensationBand', read: false, write: false, redact: true },
      // Payroll - status only
      { field: 'payrollStatus', read: true, write: false },
      { field: 'grossSalary', read: false, write: false, redact: true },
      { field: 'netSalary', read: false, write: false, redact: true },
      { field: 'bankAccountLast4', read: false, write: false, redact: true },
    ],
    otherPermissions: [
      { field: 'employeeId', read: true, write: false },
      { field: 'name', read: true, write: false },
      { field: 'department', read: true, write: false },
      // Minimal info for other org members
    ],
    capabilities: {
      canApproveVacation: true,
      canViewTeamCalendar: true,
      canViewSalaryDetails: false,
      canApprovePayrollChanges: false,
      canApproveCrossBorderWork: false,
      canViewBankDetails: false,
      canViewCompensationBand: false,
    },
  },
  
  hr_ops: {
    role: 'hr_ops',
    description: 'HR Operations - can see employee and contract info for HR cases',
    selfPermissions: [
      { field: '*', read: true, write: false },
    ],
    otherPermissions: [
      { field: 'employeeId', read: true, write: false },
      { field: 'name', read: true, write: false },
      { field: 'email', read: true, write: false },
      { field: 'role', read: true, write: false },
      { field: 'department', read: true, write: false },
      { field: 'country', read: true, write: false },
      { field: 'managerId', read: true, write: false },
      { field: 'employmentType', read: true, write: false },
      { field: 'startDate', read: true, write: false },
      { field: 'payrollRegion', read: true, write: false },
      // Contract - full visibility
      { field: 'contractType', read: true, write: false },
      { field: 'weeklyHours', read: true, write: false },
      { field: 'remoteWorkAllowed', read: true, write: false },
      { field: 'vacationDaysPerYear', read: true, write: false },
      { field: 'compensationBand', read: true, write: false },
      { field: 'noticePeriodDays', read: true, write: false },
      // Payroll - limited
      { field: 'payrollStatus', read: true, write: false },
      { field: 'grossSalary', read: false, write: false, redact: true },
      { field: 'netSalary', read: false, write: false, redact: true },
      { field: 'bankAccountLast4', read: false, write: false, redact: true },
    ],
    capabilities: {
      canApproveVacation: true,
      canViewTeamCalendar: true,
      canViewSalaryDetails: false,
      canApprovePayrollChanges: false,
      canApproveCrossBorderWork: true, // Can initiate, needs payroll approval
      canViewBankDetails: false,
      canViewCompensationBand: true,
    },
  },
  
  payroll_admin: {
    role: 'payroll_admin',
    description: 'Payroll Administrator - can see payroll records and sensitive data',
    selfPermissions: [
      { field: '*', read: true, write: false },
    ],
    otherPermissions: [
      { field: 'employeeId', read: true, write: false },
      { field: 'name', read: true, write: false },
      { field: 'email', read: true, write: false },
      { field: 'role', read: true, write: false },
      { field: 'department', read: true, write: false },
      { field: 'country', read: true, write: false },
      { field: 'managerId', read: true, write: false },
      { field: 'employmentType', read: true, write: false },
      { field: 'startDate', read: true, write: false },
      { field: 'payrollRegion', read: true, write: false },
      // Contract
      { field: 'contractType', read: true, write: false },
      { field: 'weeklyHours', read: true, write: false },
      { field: 'remoteWorkAllowed', read: true, write: false },
      { field: 'vacationDaysPerYear', read: true, write: false },
      { field: 'compensationBand', read: true, write: false },
      // Payroll - full visibility
      { field: 'payrollStatus', read: true, write: true },
      { field: 'grossSalary', read: true, write: false, redact: true }, // Can see but logged
      { field: 'netSalary', read: true, write: false, redact: true },
      { field: 'bankAccountLast4', read: true, write: false }, // Can see last4
      { field: 'ibanCountry', read: true, write: false },
    ],
    capabilities: {
      canApproveVacation: false, // Not HR
      canViewTeamCalendar: false,
      canViewSalaryDetails: true,
      canApprovePayrollChanges: true, // But still needs human review for high-risk
      canApproveCrossBorderWork: false, // Needs HR ops
      canViewBankDetails: true,
      canViewCompensationBand: true,
    },
  },
};

/**
 * Get permissions for a role
 */
export function getRolePermissions(role: EmployeeRole): RolePermissions {
  return rolePermissions[role];
}

/**
 * Check if a field is readable by role
 */
export function canReadField(
  role: EmployeeRole, 
  field: string, 
  isSelf: boolean,
  isDirectReport: boolean = false
): boolean {
  const perms = rolePermissions[role];
  
  // Self access
  if (isSelf) {
    const selfPerm = perms.selfPermissions.find(p => p.field === field || p.field === '*');
    return selfPerm?.read ?? false;
  }
  
  // Direct report access (for managers)
  if (isDirectReport && perms.directReportPermissions) {
    const drPerm = perms.directReportPermissions.find(p => p.field === field);
    if (drPerm) return drPerm.read;
  }
  
  // Other employee access
  const otherPerm = perms.otherPermissions.find(p => p.field === field || p.field === '*');
  return otherPerm?.read ?? false;
}

/**
 * Check if a field should be redacted
 */
export function shouldRedactField(
  role: EmployeeRole,
  field: string,
  isSelf: boolean,
  isDirectReport: boolean = false
): boolean {
  const perms = rolePermissions[role];
  
  let permission: FieldPermission | undefined;
  
  if (isSelf) {
    permission = perms.selfPermissions.find(p => p.field === field);
  } else if (isDirectReport && perms.directReportPermissions) {
    permission = perms.directReportPermissions.find(p => p.field === field);
  } else {
    permission = perms.otherPermissions.find(p => p.field === field);
  }
  
  return permission?.redact ?? false;
}
