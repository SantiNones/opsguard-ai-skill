/**
 * Privacy Redaction Utilities
 * 
 * Simple redaction helpers for sensitive enterprise data.
 * Masks or replaces sensitive fields based on access control rules.
 */

/**
 * Redact an email address
 * Example: ana.garcia@company.es → a***@c***.es
 */
export function redactEmail(email: string): string {
  if (!email || !email.includes('@')) return '[EMAIL_REDACTED]';
  
  const [localPart, domain] = email.split('@');
  const [domainName, tld] = domain.split('.');
  
  const redactedLocal = localPart.charAt(0) + '***';
  const redactedDomain = domainName.charAt(0) + '***';
  
  return `${redactedLocal}@${redactedDomain}.${tld}`;
}

/**
 * Redact a phone number
 * Example: +34 612 345 678 → +34 *** *** 678
 */
export function redactPhone(phone: string): string {
  if (!phone) return '[PHONE_REDACTED]';
  
  // Remove non-numeric for processing
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length < 4) return '[PHONE_REDACTED]';
  
  // Keep last 4 digits, mask the rest
  const last4 = digits.slice(-4);
  const masked = '*'.repeat(digits.length - 4);
  
  return `${masked}${last4}`;
}

/**
 * Redact a bank account/IBAN
 * Example: ES91 2345 6789 0123 4567 8901 → ES91 **** **** **** **** 8901
 */
export function redactBankAccount(account: string): string {
  if (!account) return '[BANK_ACCOUNT_REDACTED]';
  
  // Remove spaces
  const clean = account.replace(/\s/g, '');
  
  if (clean.length < 8) return '[BANK_ACCOUNT_REDACTED]';
  
  // Keep country code (2 chars) and last 4 digits
  const countryCode = clean.slice(0, 2);
  const last4 = clean.slice(-4);
  const masked = '*'.repeat(clean.length - 6);
  
  return `${countryCode}${masked}${last4}`;
}

/**
 * Redact a salary amount
 * Always returns a redaction placeholder
 */
export function redactSalaryAmount(amount: number | string): string {
  if (typeof amount === 'number') {
    return '[SALARY_AMOUNT_REDACTED]';
  }
  return '[SALARY_AMOUNT_REDACTED]';
}

/**
 * Redact a salary band to show only the band letter
 * Example: C → "Band C"
 */
export function redactCompensationBand(band: string): string {
  return `[COMPENSATION_BAND_${band}]`;
}

/**
 * Redact sensitive text (generic)
 * Replaces with [FIELD_NAME_REDACTED]
 */
export function redactSensitiveText(fieldName: string): string {
  return `[${fieldName.toUpperCase()}_REDACTED]`;
}

/**
 * Partially redact a name (show first name only)
 * Example: "Ana García López" → "Ana G***"
 */
export function redactName(name: string): string {
  if (!name) return '[NAME_REDACTED]';
  
  const parts = name.split(' ');
  if (parts.length === 0) return '[NAME_REDACTED]';
  
  // Keep first name, mask rest
  const firstName = parts[0];
  const maskedRest = parts.slice(1).map(part => 
    part.charAt(0) + '*'.repeat(part.length - 1)
  ).join(' ');
  
  return maskedRest ? `${firstName} ${maskedRest}` : firstName;
}

/**
 * Redact an employee ID (show last 3 digits)
 * Example: EMP-001 → EMP-***
 */
export function redactEmployeeId(employeeId: string): string {
  if (!employeeId || employeeId.length < 4) return '[ID_REDACTED]';
  
  const parts = employeeId.split('-');
  if (parts.length === 2) {
    return `${parts[0]}-***`;
  }
  
  return employeeId.slice(0, 3) + '***';
}

/**
 * Apply redaction based on access level
 */
export function applyRedaction(
  value: string | number | undefined,
  fieldName: string,
  shouldRedact: boolean
): string | number | undefined {
  if (!shouldRedact) return value;
  if (value === undefined || value === null) return undefined;
  
  // Determine redaction type based on field name
  const fieldLower = fieldName.toLowerCase();
  
  if (fieldLower.includes('email')) {
    return redactEmail(String(value));
  }
  
  if (fieldLower.includes('phone')) {
    return redactPhone(String(value));
  }
  
  if (fieldLower.includes('bank') || fieldLower.includes('iban') || fieldLower.includes('account')) {
    return redactBankAccount(String(value));
  }
  
  if (fieldLower.includes('salary') || fieldLower.includes('gross') || fieldLower.includes('net')) {
    return redactSalaryAmount(value);
  }
  
  if (fieldLower.includes('compensation') || fieldLower.includes('band')) {
    return redactCompensationBand(String(value));
  }
  
  // Generic redaction
  return redactSensitiveText(fieldName);
}

/**
 * Create a redaction log entry for audit
 */
export function createRedactionLog(
  actorId: string,
  targetEmployeeId: string,
  redactedFields: string[]
): {
  timestamp: string;
  actorId: string;
  targetEmployeeId: string;
  redactedFields: string[];
  reason: string;
} {
  return {
    timestamp: new Date().toISOString(),
    actorId,
    targetEmployeeId,
    redactedFields,
    reason: 'Access control: insufficient permissions',
  };
}
