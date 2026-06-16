/**
 * Enterprise Context Builder
 * 
 * Builds permissioned enterprise context for HR Operations requests.
 * Integrates access control, policy retrieval, and redaction.
 */

import { 
  getEmployeeById, 
  findEmployeeByName,
  Employee 
} from '@/data/enterprise/employees';
import { 
  getAccessibleEmployeeContext,
  AccessDecision,
  AccessibleContext,
  RestrictedFields 
} from './accessControl';

export interface EnterpriseDiagnostics {
  actorRole: string;
  targetEmployeeId: string | null;
  targetDetected: boolean;
  detectionMethod: 'explicit' | 'inferred' | 'default_self' | 'none';
  accessibleRecords: string[];
  restrictedRecords: string[];
  redactionsApplied: string[];
  accessDecision: string;
  accessLevel: string;
}

export interface EnterpriseContextResult {
  // Actor information
  actor: {
    employeeId: string;
    name: string;
    role: string;
    department: string;
    country: string;
  };
  
  // Target employee (if applicable)
  targetEmployee: {
    employeeId: string;
    name: string;
    department: string;
    country: string;
    managerId: string | null;
  } | null;
  
  // Permissioned context
  accessibleContext: {
    employee?: Record<string, unknown>;
    contract?: Record<string, unknown>;
    payroll?: Record<string, unknown>;
  };
  
  // Access control metadata
  restrictedFields: RestrictedFields;
  redactionsApplied: string[];
  accessLevel: 'full' | 'partial' | 'minimal' | 'none';
  
  // Diagnostics
  diagnostics: EnterpriseDiagnostics;
}

/**
 * Infer target employee from request text
 * Looks for:
 * 1. Employee ID patterns (EMP-XXX)
 * 2. Name mentions
 * 3. Self-references ("my", "I", "me")
 */
function inferTargetEmployee(
  userRequest: string,
  actorId: string
): { employeeId: string | null; method: 'explicit' | 'inferred' | 'default_self' | 'none' } {
  const normalizedRequest = userRequest.toLowerCase();
  
  // Check for explicit employee ID
  const empIdMatch = userRequest.match(/EMP-\d{3}/);
  if (empIdMatch) {
    const empId = empIdMatch[0];
    if (getEmployeeById(empId)) {
      return { employeeId: empId, method: 'explicit' };
    }
  }
  
  // Try to find name mentions
  const nameMatch = findEmployeeByName(userRequest);
  if (nameMatch) {
    return { employeeId: nameMatch.employeeId, method: 'inferred' };
  }
  
  // Check for self-references (default to actor)
  const selfReferences = ['my ', 'myself', 'i ', "i'm", 'me ', 'my vacation', 'my salary', 'my payroll'];
  if (selfReferences.some(ref => normalizedRequest.includes(ref))) {
    return { employeeId: actorId, method: 'default_self' };
  }
  
  // No target detected - default to self for most cases
  // This is safer than showing random employee data
  return { employeeId: actorId, method: 'default_self' };
}

/**
 * Build enterprise context for a request
 */
export function buildEnterpriseContext(
  userRequest: string,
  actorId: string
): EnterpriseContextResult | null {
  const actor = getEmployeeById(actorId);
  if (!actor) {
    return null;
  }
  
  // Infer target employee
  const targetInference = inferTargetEmployee(userRequest, actorId);
  const targetEmployeeId = targetInference.employeeId;
  
  // Get accessible context for target
  const accessibleContext = targetEmployeeId 
    ? getAccessibleEmployeeContext(actorId, targetEmployeeId)
    : null;
  
  // Build result
  const result: EnterpriseContextResult = {
    actor: {
      employeeId: actor.employeeId,
      name: actor.name,
      role: actor.role,
      department: actor.department,
      country: actor.country,
    },
    targetEmployee: targetEmployeeId 
      ? buildTargetEmployeeSummary(targetEmployeeId)
      : null,
    accessibleContext: accessibleContext?.accessibleContext || {},
    restrictedFields: accessibleContext?.restrictedFields || { employee: [], contract: [], payroll: [] },
    redactionsApplied: accessibleContext?.redactionsApplied || [],
    accessLevel: accessibleContext?.accessDecision.accessLevel || 'none',
    diagnostics: buildDiagnostics(
      actor,
      targetEmployeeId,
      targetInference.method,
      accessibleContext
    ),
  };
  
  return result;
}

/**
 * Build summary of target employee (safe fields only)
 */
function buildTargetEmployeeSummary(employeeId: string) {
  const emp = getEmployeeById(employeeId);
  if (!emp) return null;
  
  return {
    employeeId: emp.employeeId,
    name: emp.name,
    department: emp.department,
    country: emp.country,
    managerId: emp.managerId,
  };
}

/**
 * Build diagnostics for the context
 */
function buildDiagnostics(
  actor: Employee,
  targetEmployeeId: string | null,
  detectionMethod: 'explicit' | 'inferred' | 'default_self' | 'none',
  accessibleContext: ReturnType<typeof getAccessibleEmployeeContext>
): EnterpriseDiagnostics {
  const accessibleRecords: string[] = [];
  const restrictedRecords: string[] = [];
  
  if (accessibleContext) {
    if (accessibleContext.accessibleContext.employee) {
      accessibleRecords.push('employee_profile');
    } else {
      restrictedRecords.push('employee_profile');
    }
    
    if (accessibleContext.accessibleContext.contract) {
      accessibleRecords.push('contract_details');
    } else {
      restrictedRecords.push('contract_details');
    }
    
    if (accessibleContext.accessibleContext.payroll) {
      accessibleRecords.push('payroll_record');
    } else {
      restrictedRecords.push('payroll_record');
    }
  }
  
  return {
    actorRole: actor.role,
    targetEmployeeId,
    targetDetected: targetEmployeeId !== null,
    detectionMethod,
    accessibleRecords,
    restrictedRecords,
    redactionsApplied: accessibleContext?.redactionsApplied || [],
    accessDecision: accessibleContext?.accessDecision.reason || 'No access',
    accessLevel: accessibleContext?.accessDecision.accessLevel || 'none',
  };
}

/**
 * Format enterprise context for inclusion in resolver prompt
 * Only includes safe, non-sensitive information
 */
export function formatEnterpriseContextForResolver(
  context: EnterpriseContextResult
): string {
  const lines: string[] = [];
  
  lines.push('## Enterprise Context');
  lines.push('');
  
  // Actor info
  lines.push(`Actor: ${context.actor.name} (${context.actor.role})`);
  lines.push(`Department: ${context.actor.department}`);
  lines.push(`Country: ${context.actor.country}`);
  lines.push('');
  
  // Target info
  if (context.targetEmployee) {
    lines.push(`Subject: ${context.targetEmployee.name}`);
    lines.push(`Subject Department: ${context.targetEmployee.department}`);
    lines.push(`Subject Country: ${context.targetEmployee.country}`);
    lines.push('');
  }
  
  // Access level
  lines.push(`Access Level: ${context.accessLevel}`);
  if (context.redactionsApplied.length > 0) {
    lines.push(`Note: ${context.redactionsApplied.length} fields redacted for privacy`);
  }
  lines.push('');
  
  // Accessible context (permissioned data only)
  if (context.accessibleContext.employee) {
    lines.push('### Employee Information');
    const emp = context.accessibleContext.employee;
    if (emp.employmentType) lines.push(`- Type: ${emp.employmentType}`);
    if (emp.startDate) lines.push(`- Start Date: ${emp.startDate}`);
    if (emp.payrollRegion) lines.push(`- Payroll Region: ${emp.payrollRegion}`);
    lines.push('');
  }
  
  if (context.accessibleContext.contract) {
    lines.push('### Contract Details');
    const contract = context.accessibleContext.contract;
    if (contract.contractType) lines.push(`- Type: ${contract.contractType}`);
    if (contract.weeklyHours) lines.push(`- Hours: ${contract.weeklyHours}/week`);
    if (contract.remoteWorkAllowed !== undefined) {
      lines.push(`- Remote: ${contract.remoteWorkAllowed ? 'Allowed' : 'Not allowed'}`);
    }
    if (contract.vacationDaysPerYear) {
      lines.push(`- Vacation: ${contract.vacationDaysPerYear} days/year`);
    }
    if (contract.noticePeriodDays) {
      lines.push(`- Notice: ${contract.noticePeriodDays} days`);
    }
    lines.push('');
  }
  
  if (context.accessibleContext.payroll) {
    lines.push('### Payroll Status');
    const payroll = context.accessibleContext.payroll;
    if (payroll.payrollStatus) lines.push(`- Status: ${payroll.payrollStatus}`);
    if (payroll.cutoffDate) lines.push(`- Cutoff: ${payroll.cutoffDate}`);
    if (payroll.ibanCountry) lines.push(`- Bank Country: ${payroll.ibanCountry}`);
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Get safe context summary for UI display
 */
export function getContextSummary(
  context: EnterpriseContextResult
): {
  role: string;
  target: string | null;
  accessLevel: 'full' | 'partial' | 'minimal' | 'none';
  redactionCount: number;
  hasContext: boolean;
} {
  return {
    role: context.actor.role,
    target: context.targetEmployee?.name || null,
    accessLevel: context.accessLevel,
    redactionCount: context.redactionsApplied.length,
    hasContext: Object.keys(context.accessibleContext).length > 0,
  };
}
