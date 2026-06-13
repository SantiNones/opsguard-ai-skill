/**
 * Fictitious Payroll Records
 * 
 * Payroll data for enterprise context simulation.
 * No real personal data. All amounts are illustrative.
 */

export type PayrollStatus = 'draft' | 'pending-approval' | 'processed' | 'paid' | 'held';

export interface PayrollRecord {
  recordId: string;
  employeeId: string;
  payrollMonth: string; // YYYY-MM
  grossSalary: number; // Annual gross (sensitive)
  netSalary: number; // Monthly net (sensitive)
  currency: string;
  bankAccountLast4: string; // Last 4 digits only
  ibanCountry: string; // IBAN country prefix only (e.g., "ES", "PT")
  payrollStatus: PayrollStatus;
  cutoffDate: string; // ISO date
  lastUpdated: string; // ISO timestamp
  notes?: string;
}

/**
 * Mock payroll dataset - June 2026 payroll run
 * All amounts are fictitious and for demonstration only.
 */
export const payrollRecords: PayrollRecord[] = [
  {
    recordId: 'PAY-001-2026-06',
    employeeId: 'EMP-001',
    payrollMonth: '2026-06',
    grossSalary: 42000, // Annual
    netSalary: 2650, // Monthly
    currency: 'EUR',
    bankAccountLast4: '4821',
    ibanCountry: 'ES',
    payrollStatus: 'processed',
    cutoffDate: '2026-06-20',
    lastUpdated: '2026-06-21T10:30:00Z',
  },
  {
    recordId: 'PAY-002-2026-06',
    employeeId: 'EMP-002',
    payrollMonth: '2026-06',
    grossSalary: 55000,
    netSalary: 3350,
    currency: 'EUR',
    bankAccountLast4: '7392',
    ibanCountry: 'ES',
    payrollStatus: 'processed',
    cutoffDate: '2026-06-20',
    lastUpdated: '2026-06-21T10:30:00Z',
  },
  {
    recordId: 'PAY-003-2026-06',
    employeeId: 'EMP-003',
    payrollMonth: '2026-06',
    grossSalary: 75000,
    netSalary: 4450,
    currency: 'EUR',
    bankAccountLast4: '1584',
    ibanCountry: 'ES',
    payrollStatus: 'processed',
    cutoffDate: '2026-06-20',
    lastUpdated: '2026-06-21T10:30:00Z',
  },
  {
    recordId: 'PAY-004-2026-06',
    employeeId: 'EMP-004',
    payrollMonth: '2026-06',
    grossSalary: 22000, // Part-time
    netSalary: 1450,
    currency: 'EUR',
    bankAccountLast4: '6739',
    ibanCountry: 'PT',
    payrollStatus: 'processed',
    cutoffDate: '2026-06-18', // Earlier for Portugal
    lastUpdated: '2026-06-19T09:00:00Z',
  },
  {
    recordId: 'PAY-005-2026-06',
    employeeId: 'EMP-005',
    payrollMonth: '2026-06',
    grossSalary: 85000,
    netSalary: 4850,
    currency: 'EUR',
    bankAccountLast4: '2947',
    ibanCountry: 'ES',
    payrollStatus: 'processed',
    cutoffDate: '2026-06-20',
    lastUpdated: '2026-06-21T10:30:00Z',
  },
  {
    recordId: 'PAY-006-2026-06',
    employeeId: 'EMP-006',
    payrollMonth: '2026-06',
    grossSalary: 52000,
    netSalary: 3150,
    currency: 'EUR',
    bankAccountLast4: '8456',
    ibanCountry: 'ES',
    payrollStatus: 'processed',
    cutoffDate: '2026-06-20',
    lastUpdated: '2026-06-21T10:30:00Z',
  },
  {
    recordId: 'PAY-007-2026-06',
    employeeId: 'EMP-007',
    payrollMonth: '2026-06',
    grossSalary: 58000,
    netSalary: 3550,
    currency: 'EUR',
    bankAccountLast4: '5218',
    ibanCountry: 'ES',
    payrollStatus: 'processed',
    cutoffDate: '2026-06-20',
    lastUpdated: '2026-06-21T10:30:00Z',
  },
  {
    recordId: 'PAY-008-2026-06',
    employeeId: 'EMP-008',
    payrollMonth: '2026-06',
    grossSalary: 48000,
    netSalary: 2950,
    currency: 'EUR',
    bankAccountLast4: '3947',
    ibanCountry: 'DK',
    payrollStatus: 'processed',
    cutoffDate: '2026-06-22', // Denmark later
    lastUpdated: '2026-06-21T10:30:00Z',
    notes: 'Remote Denmark - local tax applied',
  },
];

/**
 * Get payroll record by employee ID and month
 */
export function getPayrollRecord(employeeId: string, month: string): PayrollRecord | undefined {
  return payrollRecords.find(p => p.employeeId === employeeId && p.payrollMonth === month);
}

/**
 * Get latest payroll record for employee
 */
export function getLatestPayrollRecord(employeeId: string): PayrollRecord | undefined {
  const records = payrollRecords.filter(p => p.employeeId === employeeId);
  if (records.length === 0) return undefined;
  
  // Sort by month descending and return first
  return records.sort((a, b) => b.payrollMonth.localeCompare(a.payrollMonth))[0];
}

/**
 * Check if payroll is still editable (before cutoff)
 */
export function isPayrollEditable(payrollStatus: PayrollStatus): boolean {
  return ['draft', 'pending-approval'].includes(payrollStatus);
}

/**
 * Get days until cutoff
 */
export function daysUntilCutoff(cutoffDate: string): number {
  const cutoff = new Date(cutoffDate);
  const today = new Date();
  const diff = cutoff.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
