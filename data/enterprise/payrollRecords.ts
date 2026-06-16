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
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  grossSalary: number; // Annual gross (sensitive)
  grossPay: number;
  netSalary: number; // Monthly net (sensitive)
  currency: string;
  bankAccountLast4: string; // Last 4 digits only
  ibanCountry: string; // IBAN country prefix only (e.g., "ES", "PT")
  payrollStatus: PayrollStatus;
  cutoffDate: string; // ISO date
  lastUpdated: string; // ISO timestamp
  earnings: PayrollLineItem[];
  deductions: PayrollLineItem[];
  employerContributions: PayrollLineItem[];
  notes?: string;
}

export interface PayrollLineItem {
  label: string;
  amount: number;
}

interface PayrollBaseRecord {
  employeeId: string;
  annualGross: number;
  monthlyNet: number;
  currency: string;
  bankAccountLast4: string;
  ibanCountry: string;
  cutoffDay: number;
  notes?: string;
}

/**
 * Mock payroll dataset - June 2026 payroll run
 * All amounts are fictitious and for demonstration only.
 */
const payrollBaseRecords: PayrollBaseRecord[] = [
  {
    employeeId: 'EMP-001',
    annualGross: 42000,
    monthlyNet: 2650,
    currency: 'EUR',
    bankAccountLast4: '4821',
    ibanCountry: 'ES',
    cutoffDay: 20,
  },
  {
    employeeId: 'EMP-002',
    annualGross: 55000,
    monthlyNet: 3350,
    currency: 'EUR',
    bankAccountLast4: '7392',
    ibanCountry: 'ES',
    cutoffDay: 20,
  },
  {
    employeeId: 'EMP-003',
    annualGross: 75000,
    monthlyNet: 4450,
    currency: 'EUR',
    bankAccountLast4: '1584',
    ibanCountry: 'ES',
    cutoffDay: 20,
  },
  {
    employeeId: 'EMP-004',
    annualGross: 22000,
    monthlyNet: 1450,
    currency: 'EUR',
    bankAccountLast4: '6739',
    ibanCountry: 'PT',
    cutoffDay: 18,
  },
  {
    employeeId: 'EMP-005',
    annualGross: 85000,
    monthlyNet: 4850,
    currency: 'EUR',
    bankAccountLast4: '2947',
    ibanCountry: 'ES',
    cutoffDay: 20,
  },
  {
    employeeId: 'EMP-006',
    annualGross: 52000,
    monthlyNet: 3150,
    currency: 'EUR',
    bankAccountLast4: '8456',
    ibanCountry: 'ES',
    cutoffDay: 20,
  },
  {
    employeeId: 'EMP-007',
    annualGross: 58000,
    monthlyNet: 3550,
    currency: 'EUR',
    bankAccountLast4: '5218',
    ibanCountry: 'ES',
    cutoffDay: 20,
  },
  {
    employeeId: 'EMP-008',
    annualGross: 48000,
    monthlyNet: 2950,
    currency: 'EUR',
    bankAccountLast4: '3947',
    ibanCountry: 'DK',
    cutoffDay: 22,
    notes: 'Remote Denmark - local tax applied',
  },
];

const payrollMonths = [
  { month: '2026-06', periodStart: '2026-06-01', periodEnd: '2026-06-30', paymentDate: '2026-06-28', netMultiplier: 1 },
  { month: '2026-05', periodStart: '2026-05-01', periodEnd: '2026-05-31', paymentDate: '2026-05-28', netMultiplier: 0.997 },
  { month: '2026-04', periodStart: '2026-04-01', periodEnd: '2026-04-30', paymentDate: '2026-04-28', netMultiplier: 1.004 },
];

function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function buildPayrollRecord(base: PayrollBaseRecord, month: typeof payrollMonths[number]): PayrollRecord {
  const grossPay = roundCurrency(base.annualGross / 12);
  const netSalary = roundCurrency(base.monthlyNet * month.netMultiplier);
  const socialSecurity = roundCurrency(grossPay * 0.064);
  const employeeBenefits = roundCurrency(grossPay * 0.01);
  const incomeTax = roundCurrency(Math.max(grossPay - socialSecurity - employeeBenefits - netSalary, 0));
  const employerSocialSecurity = roundCurrency(grossPay * 0.31);

  return {
    recordId: `PAY-${base.employeeId.replace('EMP-', '')}-${month.month}`,
    employeeId: base.employeeId,
    payrollMonth: month.month,
    periodStart: month.periodStart,
    periodEnd: month.periodEnd,
    paymentDate: month.paymentDate,
    grossSalary: base.annualGross,
    grossPay,
    netSalary,
    currency: base.currency,
    bankAccountLast4: base.bankAccountLast4,
    ibanCountry: base.ibanCountry,
    payrollStatus: 'paid',
    cutoffDate: `${month.month}-${String(base.cutoffDay).padStart(2, '0')}`,
    lastUpdated: `${month.month}-${String(base.cutoffDay + 1).padStart(2, '0')}T10:30:00Z`,
    earnings: [
      { label: 'Base salary', amount: grossPay },
    ],
    deductions: [
      { label: 'Income tax withholding', amount: incomeTax },
      { label: 'Employee social security', amount: socialSecurity },
      { label: 'Benefits and adjustments', amount: employeeBenefits },
    ],
    employerContributions: [
      { label: 'Employer social security', amount: employerSocialSecurity },
    ],
    notes: base.notes,
  };
}

export const payrollRecords: PayrollRecord[] = payrollBaseRecords.flatMap(base =>
  payrollMonths.map(month => buildPayrollRecord(base, month))
);

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

export function getRecentPayrollRecords(employeeId: string, limit = 3): PayrollRecord[] {
  return payrollRecords
    .filter(p => p.employeeId === employeeId)
    .sort((a, b) => b.payrollMonth.localeCompare(a.payrollMonth))
    .slice(0, limit);
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
