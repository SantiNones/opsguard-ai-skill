import { EnterpriseContextMetadata } from '../types';

export type ConfidentialityLevel = 'low' | 'medium' | 'high';

export type SensitiveCategory =
  | 'payroll'
  | 'salary'
  | 'bank_account'
  | 'personal_identifier'
  | 'email'
  | 'phone'
  | 'address'
  | 'cross_border'
  | 'compensation';

export interface ConfidentialityMetadata {
  sensitiveDataDetected: boolean;
  sensitiveCategories: SensitiveCategory[];
  redactionsApplied: number;
  restrictedFields: string[];
  confidentialityLevel: ConfidentialityLevel;
}

// Query pattern → sensitive category mapping
const SENSITIVITY_PATTERNS: Array<{
  patterns: RegExp[];
  category: SensitiveCategory;
}> = [
  {
    patterns: [/payroll/i, /pay\s*run/i, /pay\s*slip/i],
    category: 'payroll',
  },
  {
    patterns: [/salary/i, /raise/i, /higher\s*pay/i, /pay\s*increase/i],
    category: 'salary',
  },
  {
    patterns: [/compensation/i, /bonus/i, /equity/i, /stock\s*option/i, /vesting/i],
    category: 'compensation',
  },
  {
    patterns: [/bank\s*account/i, /direct\s*deposit/i, /iban/i, /routing\s*number/i],
    category: 'bank_account',
  },
  {
    patterns: [/employee\s*id/i, /national\s*id/i, /ssn/i, /passport/i, /tax\s*id/i],
    category: 'personal_identifier',
  },
  {
    patterns: [/\bemail\b/i],
    category: 'email',
  },
  {
    patterns: [/\bphone\b/i, /\bmobile\b/i, /\bcell\b/i],
    category: 'phone',
  },
  {
    patterns: [/\baddress\b/i, /home\s*address/i],
    category: 'address',
  },
  {
    patterns: [
      /abroad/i,
      /cross.border/i,
      /portugal/i,
      /mexico/i,
      /overseas/i,
      /international/i,
      /foreign\s*country/i,
    ],
    category: 'cross_border',
  },
];

// Categories considered high-sensitivity
const HIGH_SENSITIVITY: SensitiveCategory[] = [
  'payroll',
  'salary',
  'bank_account',
  'compensation',
];

// Categories considered medium-sensitivity
const MEDIUM_SENSITIVITY: SensitiveCategory[] = [
  'personal_identifier',
  'cross_border',
  'email',
  'phone',
  'address',
];

/**
 * Assess confidentiality risk for a query given enterprise context.
 * Uses existing redaction/access-control outputs — does not duplicate access-control logic.
 */
export function assessConfidentiality(
  query: string,
  enterpriseContext: EnterpriseContextMetadata | undefined
): ConfidentialityMetadata {
  const detected: SensitiveCategory[] = [];

  for (const { patterns, category } of SENSITIVITY_PATTERNS) {
    if (patterns.some(p => p.test(query))) {
      detected.push(category);
    }
  }

  const redactionsApplied = enterpriseContext?.redactionsApplied ?? 0;

  // If access was explicitly denied, treat personal_identifier as involved
  if (
    enterpriseContext?.accessLevel === 'none' &&
    !detected.includes('personal_identifier')
  ) {
    detected.push('personal_identifier');
  }

  // Restricted fields inferred from context (no real data values exposed)
  const restrictedFields: string[] = [];
  if (redactionsApplied > 0) {
    if (detected.includes('bank_account')) restrictedFields.push('bank_account_number');
    if (detected.includes('salary') || detected.includes('compensation')) {
      restrictedFields.push('base_salary', 'compensation_band');
    }
    if (detected.includes('payroll')) restrictedFields.push('payroll_record');
    if (detected.includes('personal_identifier')) restrictedFields.push('employee_id');
  }

  // Determine level
  let level: ConfidentialityLevel = 'low';
  if (
    detected.some(c => HIGH_SENSITIVITY.includes(c)) ||
    redactionsApplied >= 3 ||
    enterpriseContext?.accessLevel === 'none'
  ) {
    level = 'high';
  } else if (
    detected.some(c => MEDIUM_SENSITIVITY.includes(c)) ||
    redactionsApplied > 0
  ) {
    level = 'medium';
  }

  return {
    sensitiveDataDetected: detected.length > 0 || redactionsApplied > 0,
    sensitiveCategories: detected,
    redactionsApplied,
    restrictedFields,
    confidentialityLevel: level,
  };
}
