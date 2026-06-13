/**
 * Access Control Module
 * 
 * Role-based access control for enterprise HR/Payroll data.
 * Determines what data an actor can access about a target employee.
 */

import { 
  Employee, 
  EmployeeRole, 
  getEmployeeById 
} from '@/data/enterprise/employees';
import { 
  Contract, 
  getContractByEmployeeId 
} from '@/data/enterprise/contracts';
import { 
  PayrollRecord, 
  getLatestPayrollRecord 
} from '@/data/enterprise/payrollRecords';
import { 
  isInManagementChain,
  arePeers 
} from '@/data/enterprise/orgChart';
import { 
  RolePermissions,
  getRolePermissions,
  canReadField,
  shouldRedactField
} from '@/data/enterprise/roles';

export interface AccessDecision {
  allowed: boolean;
  reason: string;
  accessLevel: 'full' | 'partial' | 'minimal' | 'none';
  isSelf: boolean;
  isDirectReport: boolean;
  isPeer: boolean;
  isInManagementChain: boolean;
}

export interface AccessibleContext {
  employee?: Partial<Employee>;
  contract?: Partial<Contract>;
  payroll?: Partial<PayrollRecord>;
}

export interface RestrictedFields {
  employee: string[];
  contract: string[];
  payroll: string[];
}

export interface AccessibleEmployeeContext {
  actor: {
    employeeId: string;
    name: string;
    role: EmployeeRole;
  };
  targetEmployee: {
    employeeId: string;
    name: string;
  };
  accessDecision: AccessDecision;
  accessibleContext: AccessibleContext;
  restrictedFields: RestrictedFields;
  redactionsApplied: string[];
}

/**
 * Determine access decision between actor and target
 */
export function determineAccess(
  actorId: string, 
  targetEmployeeId: string
): AccessDecision {
  const actor = getEmployeeById(actorId);
  const target = getEmployeeById(targetEmployeeId);
  
  if (!actor || !target) {
    return {
      allowed: false,
      reason: 'Actor or target employee not found',
      accessLevel: 'none',
      isSelf: false,
      isDirectReport: false,
      isPeer: false,
      isInManagementChain: false,
    };
  }
  
  // Self access
  if (actorId === targetEmployeeId) {
    return {
      allowed: true,
      reason: 'Self access granted',
      accessLevel: 'full',
      isSelf: true,
      isDirectReport: false,
      isPeer: false,
      isInManagementChain: false,
    };
  }
  
  // Check relationships
  const isManager = isInManagementChain(actorId, targetEmployeeId);
  const isDirectReport = actor.employeeId === target.managerId;
  const isPeer = arePeers(actorId, targetEmployeeId);
  
  // HR Ops and Payroll Admin have broader access
  if (actor.role === 'hr_ops' || actor.role === 'payroll_admin') {
    return {
      allowed: true,
      reason: `${actor.role} access granted`,
      accessLevel: actor.role === 'payroll_admin' ? 'full' : 'partial',
      isSelf: false,
      isDirectReport: false,
      isPeer,
      isInManagementChain: false,
    };
  }
  
  // Manager access to direct reports
  if (actor.role === 'manager' && isDirectReport) {
    return {
      allowed: true,
      reason: 'Direct report access granted',
      accessLevel: 'partial',
      isSelf: false,
      isDirectReport: true,
      isPeer: false,
      isInManagementChain: false,
    };
  }
  
  // Peer access (minimal)
  if (isPeer) {
    return {
      allowed: true,
      reason: 'Peer access granted (minimal)',
      accessLevel: 'minimal',
      isSelf: false,
      isDirectReport: false,
      isPeer: true,
      isInManagementChain: false,
    };
  }
  
  // Default: deny
  return {
    allowed: false,
    reason: 'No access relationship established',
    accessLevel: 'none',
    isSelf: false,
    isDirectReport: false,
    isPeer: false,
    isInManagementChain: false,
  };
}

/**
 * Check if a specific field can be accessed
 */
export function canAccessField(
  actor: Employee,
  targetEmployeeId: string,
  fieldName: string,
  entityType: 'employee' | 'contract' | 'payroll'
): boolean {
  const access = determineAccess(actor.employeeId, targetEmployeeId);
  
  return canReadField(
    actor.role,
    fieldName,
    access.isSelf,
    access.isDirectReport
  );
}

/**
 * Build accessible context for an actor viewing a target employee
 */
export function getAccessibleEmployeeContext(
  actorId: string,
  targetEmployeeId: string
): AccessibleEmployeeContext | null {
  const actor = getEmployeeById(actorId);
  const target = getEmployeeById(targetEmployeeId);
  
  if (!actor || !target) {
    return null;
  }
  
  const accessDecision = determineAccess(actorId, targetEmployeeId);
  const permissions = getRolePermissions(actor.role);
  
  // Filter employee fields
  const accessibleEmployee: Partial<Employee> = {};
  const restrictedEmployeeFields: string[] = [];
  const redactionsApplied: string[] = [];
  
  const employeeFields: (keyof Employee)[] = [
    'employeeId', 'name', 'email', 'role', 'department', 'country', 
    'managerId', 'employmentType', 'startDate', 'payrollRegion', 'isActive'
  ];
  
  for (const field of employeeFields) {
    const canRead = canReadField(
      actor.role, 
      field, 
      accessDecision.isSelf, 
      accessDecision.isDirectReport
    );
    const redact = shouldRedactField(
      actor.role,
      field,
      accessDecision.isSelf,
      accessDecision.isDirectReport
    );
    
    if (canRead) {
      if (redact) {
        // @ts-expect-error - dynamic field access
        accessibleEmployee[field] = `[${field.toUpperCase()}_REDACTED]`;
        redactionsApplied.push(`employee.${field}`);
      } else {
        // @ts-expect-error - dynamic field access
        accessibleEmployee[field] = target[field];
      }
    } else {
      restrictedEmployeeFields.push(field);
    }
  }
  
  // Filter contract fields
  const contract = getContractByEmployeeId(targetEmployeeId);
  const accessibleContract: Partial<Contract> = {};
  const restrictedContractFields: string[] = [];
  
  if (contract) {
    const contractFields: (keyof Contract)[] = [
      'contractId', 'contractType', 'country', 'weeklyHours', 
      'remoteWorkAllowed', 'maxRemoteDaysPerWeek', 'vacationDaysPerYear',
      'compensationBand', 'noticePeriodDays', 'contractStartDate', 'contractEndDate',
      'benefits'
    ];
    
    for (const field of contractFields) {
      const canRead = canReadField(
        actor.role,
        field,
        accessDecision.isSelf,
        accessDecision.isDirectReport
      );
      const redact = shouldRedactField(
        actor.role,
        field,
        accessDecision.isSelf,
        accessDecision.isDirectReport
      );
      
      if (canRead) {
        if (redact) {
          // @ts-expect-error - dynamic field access
          accessibleContract[field] = `[${field.toUpperCase()}_REDACTED]`;
          redactionsApplied.push(`contract.${field}`);
        } else {
          // @ts-expect-error - dynamic field access
          accessibleContract[field] = contract[field];
        }
      } else {
        restrictedContractFields.push(field);
      }
    }
  }
  
  // Filter payroll fields
  const payroll = getLatestPayrollRecord(targetEmployeeId);
  const accessiblePayroll: Partial<PayrollRecord> = {};
  const restrictedPayrollFields: string[] = [];
  
  if (payroll) {
    const payrollFields: (keyof PayrollRecord)[] = [
      'recordId', 'payrollMonth', 'payrollStatus', 'cutoffDate',
      'grossSalary', 'netSalary', 'bankAccountLast4', 'ibanCountry'
    ];
    
    for (const field of payrollFields) {
      const canRead = canReadField(
        actor.role,
        field,
        accessDecision.isSelf,
        accessDecision.isDirectReport
      );
      const redact = shouldRedactField(
        actor.role,
        field,
        accessDecision.isSelf,
        accessDecision.isDirectReport
      );
      
      if (canRead) {
        if (redact) {
          // @ts-expect-error - dynamic field access
          accessiblePayroll[field] = `[${field.toUpperCase()}_REDACTED]`;
          redactionsApplied.push(`payroll.${field}`);
        } else {
          // @ts-expect-error - dynamic field access
          accessiblePayroll[field] = payroll[field];
        }
      } else {
        restrictedPayrollFields.push(field);
      }
    }
  }
  
  return {
    actor: {
      employeeId: actor.employeeId,
      name: actor.name,
      role: actor.role,
    },
    targetEmployee: {
      employeeId: target.employeeId,
      name: target.name,
    },
    accessDecision,
    accessibleContext: {
      employee: Object.keys(accessibleEmployee).length > 0 ? accessibleEmployee : undefined,
      contract: Object.keys(accessibleContract).length > 0 ? accessibleContract : undefined,
      payroll: Object.keys(accessiblePayroll).length > 0 ? accessiblePayroll : undefined,
    },
    restrictedFields: {
      employee: restrictedEmployeeFields,
      contract: restrictedContractFields,
      payroll: restrictedPayrollFields,
    },
    redactionsApplied,
  };
}

/**
 * Get role capabilities
 */
export function getRoleCapabilities(role: EmployeeRole) {
  return getRolePermissions(role).capabilities;
}

/**
 * Check if actor can perform a specific action
 */
export function canPerformAction(
  actorId: string,
  action: 'approve_vacation' | 'approve_payroll_change' | 'view_salary_details' | 'view_bank_details'
): boolean {
  const actor = getEmployeeById(actorId);
  if (!actor) return false;
  
  const capabilities = getRoleCapabilities(actor.role);
  
  switch (action) {
    case 'approve_vacation':
      return capabilities.canApproveVacation;
    case 'approve_payroll_change':
      return capabilities.canApprovePayrollChanges;
    case 'view_salary_details':
      return capabilities.canViewSalaryDetails;
    case 'view_bank_details':
      return capabilities.canViewBankDetails;
    default:
      return false;
  }
}
