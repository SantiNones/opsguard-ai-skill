# Access Control & Enterprise Context

**Version:** 0.1.0  
**Last Updated:** June 2026

---

## Why HR Operations AI Needs Permission-Aware Context

In HR and Payroll workflows, **who is asking matters as much as what is being asked**. An employee asking about their own vacation balance is routine. A manager asking about a direct report's salary is sensitive. An employee asking about a coworker's bank account is a compliance violation waiting to happen.

OpsGuard's enterprise context layer simulates how a production HR Operations AI should:

1. **Identify the actor** — Who is making this request?
2. **Determine the target** — Whose data is being accessed?
3. **Apply role-based permissions** — What can this actor see?
4. **Redact sensitive fields** — Mask data the actor shouldn't access
5. **Audit access** — Log what was accessed and why

---

## Roles and Permissions

### Employee (`employee`)

**Can see:**
- Their own profile (name, department, country, start date)
- Their own contract details (type, hours, vacation days, compensation band)
- Their own payroll status (processed/pending - not amounts)
- Their own manager's name

**Cannot see:**
- Exact salary or net pay amounts
- Bank account details
- Other employees' personal information
- Other employees' salary data

**Use case:**
> "How many vacation days do I have left?" → Employee sees their own vacation balance and contract terms.

---

### Manager (`manager`)

**Can see:**
- Direct reports' basic profiles and work status
- Team availability and vacation schedules
- Contract details relevant to workforce planning
- Their own full profile

**Cannot see:**
- Direct reports' exact salary or net pay
- Bank account information
- Compensation bands (only knows there *is* a band)
- Cannot approve payroll-sensitive changes alone

**Use case:**
> "Can Carlos take vacation next week?" → Manager sees Carlos's availability and vacation balance, but not his salary.

---

### HR Operations (`hr_ops`)

**Can see:**
- Employee profiles and contract information for HR case resolution
- Full organizational structure
- Compensation bands (A, B, C, D, E) for workforce planning
- Limited payroll status information

**Cannot see:**
- Exact salary amounts or net pay
- Bank account details (even last 4 digits)
- Cannot directly approve payroll-sensitive actions alone

**Use case:**
> "What's the onboarding checklist for the new hire?" → HR Ops sees contract terms and required documents, but not payroll setup details.

---

### Payroll Administrator (`payroll_admin`)

**Can see:**
- Payroll records needed for payroll cases
- Bank account last 4 digits for verification
- Gross/net salary amounts (with audit trail implied)
- Payroll status and cutoff dates
- Country-specific payroll requirements

**Restrictions:**
- High-risk payroll changes still require human review/escalation
- All access is logged for compliance
- Cannot approve cross-border work arrangements alone (needs HR Ops)

**Use case:**
> "Has the payroll cutoff passed for this month?" → Payroll Admin sees cutoff dates and status for all employees.

---

## How Restricted Fields Are Redacted

When an actor requests data they don't have permission to see, the system applies **redaction** rather than denial. This provides a better user experience while maintaining security.

### Redaction Examples

| Field | Actual Value | Redacted for Unauthorized Role |
|-------|--------------|-------------------------------|
| Email | `ana.garcia@company.es` | `a***@c***.es` |
| Salary | `€42,000/year` | `[SALARY_AMOUNT_REDACTED]` |
| Bank Account | `ES91 2345 6789 0123` | `ES91 **** **** 0123` |
| Compensation Band | `Band C` | `[COMPENSATION_BAND_C]` (meaningful but vague) |

### Redaction vs. Denial

- **Redaction** = "I can see there *is* a salary, but not the amount"
- **Denial** = "You cannot access this record at all"

OpsGuard uses redaction for fields where knowing the field *exists* is harmless, and denial for truly restricted records.

---

## Enterprise Context Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. USER REQUEST                                            │
│     "What is Ana's salary?"                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  2. ACTOR IDENTIFICATION                                    │
│     Actor: Carlos Ruiz (employee)                           │
│     Target: Ana García (inferred from request)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  3. ACCESS CONTROL CHECK                                    │
│     • Is Carlos asking about himself? No                    │
│     • Is Ana his direct report? No                          │
│     • Does Carlos have HR/payroll role? No                  │
│     → Access Level: MINIMAL                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  4. FIELD-LEVEL REDACTION                                   │
│     • Name: Ana García ✓ (visible)                          │
│     • Department: Engineering ✓ (visible)                     │
│     • Salary: [REDACTED] ✗ (no permission)                   │
│     • Bank: [REDACTED] ✗ (no permission)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  5. SAFE CONTEXT TO RESOLVER                                │
│     Actor knows: "Ana exists, works in Engineering"         │
│     Actor doesn't know: "Ana's salary is €42k"               │
│     → Request escalates to HR for approval                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Mock Data vs. Production

### Current (MVP)
OpsGuard uses **typed mock data** stored in TypeScript files:
- `data/enterprise/employees.ts` — 8 fictitious Spanish/European employees
- `data/enterprise/contracts.ts` — Employment contracts
- `data/enterprise/payrollRecords.ts` — June 2026 payroll run
- `data/enterprise/orgChart.ts` — Manager/report relationships
- `data/enterprise/roles.ts` — Role permission definitions

**Benefits of mock data:**
- No database to configure
- No real PII to protect
- Fast iteration
- Deterministic for testing
- Easy to version control

### Production Path
In a production environment, this would connect to:
- **HRIS** (Human Resources Information System) — Workday, BambooHR, etc.
- **Payroll System** — ADP, Paychex, local payroll providers
- **Identity Provider** — Okta, Azure AD, etc.
- **Audit Log** — For compliance (GDPR, SOX, etc.)

**Changes needed for production:**
1. Replace mock data imports with API clients
2. Add authentication middleware
3. Implement real audit logging
4. Add caching layer for performance
5. Implement proper error handling for external service failures

---

## Example Scenarios

### Scenario 1: Employee Views Own Data
**Actor:** Ana García (EMP-001, employee)  
**Request:** "How many vacation days do I have left?"

**Access Decision:**
- Target: EMP-001 (self)
- Access Level: FULL
- Redactions: 0

**Result:** Ana sees her vacation balance, contract terms, and payroll status.

---

### Scenario 2: Manager Views Direct Report
**Actor:** Laura Martín (EMP-003, manager)  
**Request:** "What's Carlos's vacation balance?"

**Access Decision:**
- Target: EMP-002 (direct report)
- Access Level: PARTIAL
- Redactions: 3 (email, salary, bank details)

**Result:** Laura sees Carlos's vacation days and availability, but not his salary.

---

### Scenario 3: Employee Tries to View Coworker Salary
**Actor:** Carlos Ruiz (EMP-002, employee)  
**Request:** "What is Ana's salary?"

**Access Decision:**
- Target: EMP-001 (peer, not direct report)
- Access Level: MINIMAL
- Redactions: 5+ (salary, bank, compensation band)

**Result:** Carlos sees that Ana exists and works in Engineering, but cannot see her salary. The request is flagged for review if it mentions payroll/salary terms.

---

### Scenario 4: Payroll Admin Views Sensitive Data
**Actor:** Diego Costa (EMP-007, payroll_admin)  
**Request:** "Has the June payroll been processed?"

**Access Decision:**
- Target: All employees (payroll scope)
- Access Level: FULL (for payroll fields)
- Redactions: 0 (for payroll fields)

**Result:** Diego sees payroll status, cutoff dates, and can verify bank account last 4 digits for support requests.

---

## Privacy Principles

1. **Least Privilege** — Users see only what they need for their role
2. **Redaction > Denial** — Show that data exists but mask sensitive values
3. **Audit Everything** — Log access for compliance (simulated in MVP)
4. **Fail Closed** — If uncertain, restrict access
5. **No Real Data** — All examples use fictitious European employees

---

## Testing Access Control

Use the **Persona Switcher** in the UI to test different roles:

1. Select "Employee — Ana García"
2. Submit: "What is my salary?"
3. Check Enterprise Context panel — should show full access

4. Select "Manager — Laura Martín"
5. Submit: "What is Carlos's salary?"
6. Check Enterprise Context panel — should show redacted fields

7. Select "Employee — Carlos Ruiz"
8. Submit: "What is Ana's salary?"
9. Check Enterprise Context panel — should show minimal access with redactions

---

## Security Note

This is a **demonstration system**. While the access control logic is sound, a production system would need:

- Real authentication (OAuth 2.0, SAML, etc.)
- Encrypted data at rest and in transit
- Comprehensive audit logging
- Regular security reviews
- Compliance with GDPR, CCPA, and local labor laws
- Penetration testing

The mock data ensures no real employee information is ever at risk in this demo.
