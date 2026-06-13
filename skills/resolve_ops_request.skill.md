# Skill: resolve_ops_request

**Version:** 0.1.0-mvp  
**Owner:** AI Product Engineering  
**Last Updated:** June 2026  
**Status:** Active

---

## Purpose

Analyze sensitive HR Operations requests, classify risk, and determine the safest resolution path while preparing a structured human-review packet.

This skill does not modify data. It only classifies, routes, and prepares handoff materials.

---

## Input Schema

```typescript
interface ResolveOpsRequestInput {
  /** The employee's request text */
  request: string;
  
  /** Optional: Employee ID for context lookup */
  employeeId?: string;
  
  /** Optional: Current region for policy selection */
  region?: 'US' | 'EU' | 'APAC';
  
  /** Optional: Request channel (affects urgency assumptions) */
  channel?: 'email' | 'slack' | 'ticket' | 'portal';
}
```

---

## Retrieved Context

The skill retrieves relevant policy context before classification:

```typescript
interface RetrievedPolicy {
  /** Stable rule identifier (e.g., TT-01, PA-03) */
  ruleId: string;
  
  /** Policy document name */
  policyName: string;
  
  /** Relevant excerpt (1-3 sentences) */
  excerpt: string;
  
  /** Relevance score (0.0 - 1.0) */
  relevanceScore: number;
}
```

**Retrieval Strategy:**
- Top-k=3 most relevant policies
- Keyword matching (current) → Vector similarity (future)
- Filter by region if specified
- Include precedence rules (e.g., payroll overrides time-tracking)

---

## Output Schema

```typescript
interface ResolveOpsRequestOutput {
  /** Original request text */
  request: string;
  
  /** Risk classification */
  risk: 'low' | 'medium' | 'high';
  
  /** Selected resolution route */
  route: 'answer_directly' | 'ask_missing_info' | 'draft_action' | 'escalate';
  
  /** Confidence in the decision */
  confidence: 'low' | 'medium' | 'high';
  
  /** Whether human review is required */
  needsReview: boolean;
  
  /** Short explanation of the decision (1-2 sentences) */
  explanation: string;
  
  /** 2-3 bullet points explaining why this route was chosen */
  reasoning: string[];
  
  /** Policy citations supporting the decision */
  citations: Array<{
    code: string;
    title: string;
    excerpt: string;
  }>;
  
  /** Optional: Draft action details (when route=draft_action) */
  draftAction?: {
    type: string;
    description: string;
    approver: string;
    missingFields: string[];
  };
  
  /** Human-review packet for handoff */
  reviewPacket: {
    summary: string;
    recommendedAction: string;
    approver: string;
    missingFields: string[];
  };
}
```

---

## Allowed Routes

### 1. answer_directly
**Use when:**
- Risk is LOW
- Confidence is HIGH
- Clear policy citation exists
- No PII modification required
- No approval chain needed

**Output requirements:**
- Must include at least one citation
- Must explain the answer in plain language
- Must note any limitations (e.g., "up to 5 days")

### 2. ask_missing_info
**Use when:**
- Cannot classify risk (ambiguous request)
- Missing required fields (dates, amounts, IDs)
- Multiple possible interpretations
- Confidence is LOW

**Output requirements:**
- List specific questions (not vague "tell us more")
- Indicate which missing fields are blocking

### 3. draft_action
**Use when:**
- Risk is MEDIUM
- Requires documented approval chain
- Has clear workflow (manager, specialist, etc.)
- Audit trail required

**Output requirements:**
- Specify action type (correction, adjustment, request)
- Name the approver(s)
- List any missing fields needed for approval

### 4. escalate
**Use when:**
- Risk is HIGH
- Compliance implications (tax, labor law)
- Time-sensitive deadline conflict
- Financial exposure >$1000
- Cross-border implications
- Compensation changes

**Output requirements:**
- Urgency level (standard, high, critical)
- Recommended specialist team
- Brief risk summary

---

## Forbidden Actions

This skill MUST NEVER:

1. **Auto-approve any action** — All approvals require human sign-off
2. **Modify payroll data** — Only prepare packets for specialists
3. **Authorize cross-border work** — Always escalate to Legal/HRBP
4. **Process post-cutoff payroll changes** — Always escalate to Payroll Lead
5. **Approve compensation adjustments** — Always escalate to HR Director
6. **Export employee data** — Always require DPO review
7. **Make irreversible changes** — All actions must be reversible pending review

---

## Risk Classification Rules

### LOW Risk
**Indicators:**
- Policy query with documented answer
- No financial impact
- No compliance implications
- Routine operational question

**Examples:**
- Vacation carryover limits
- Standard leave policies
- Holiday schedules
- Policy clarifications

### MEDIUM Risk
**Indicators:**
- Requires documented approval
- Minor financial impact ($100-$1000)
- Audit trail required
- Manager sign-off needed

**Examples:**
- Time corrections (clock-in/out)
- Schedule changes
- Local remote work requests
- Minor expense adjustments

### HIGH Risk
**Indicators:**
- Compliance implications (tax, labor law)
- Significant financial impact (>$1000)
- Cross-border elements
- Post-deadline changes
- Compensation changes

**Examples:**
- Cross-border remote work
- Post-cutoff payroll changes
- Salary adjustments
- Termination procedures

---

## Reliability Requirements

### Latency
- **Target p95:** < 2 seconds (AI + retrieval)
- **Current MVP:** < 100ms (deterministic)

### Availability
- **Target:** 99.9% uptime
- **Fallback:** If AI layer fails, default to `escalate` with system error note

### Accuracy
- **Route accuracy:** > 90% (evaluated against labeled test cases)
- **Citation precision:** All cited rules must be relevant
- **Confidence calibration:** High confidence predictions should be correct > 95% of the time

---

## Eval Criteria

The skill is evaluated against `evals/ops-evals.json`:

```typescript
interface EvalCase {
  id: string;
  input: string;
  expectedRoute: Route;
  expectedRiskLevel: RiskLevel;
  mustRequireHumanReview: boolean;
  mustCiteRuleIds: string[];
}
```

**Pass Criteria:**
- Route matches expected (exact)
- Risk level matches expected (exact)
- `needsReview` matches `mustRequireHumanReview`
- All `mustCiteRuleIds` are present in `citations`

**Scoring:**
- Pass: All criteria met
- Fail: Any criterion missed
- Score: % of eval cases passing

---

## Example Input/Output

### Example 1: Vacation Carryover (Low Risk)

**Input:**
```json
{
  "request": "I have 5 unused vacation days from last year. Can I carry them over?",
  "region": "US"
}
```

**Retrieved Context:**
```json
[
  {
    "ruleId": "VL-01",
    "policyName": "Vacation Leave Policy",
    "excerpt": "Up to 5 unused days may be carried over per calendar year.",
    "relevanceScore": 0.95
  }
]
```

**Output:**
```json
{
  "request": "I have 5 unused vacation days from last year. Can I carry them over?",
  "risk": "low",
  "route": "answer_directly",
  "confidence": "high",
  "needsReview": false,
  "explanation": "Standard vacation policy query with clear precedent.",
  "reasoning": [
    "Query matches documented vacation policy VL-01",
    "No personal data modification required",
    "No compliance triggers detected"
  ],
  "citations": [
    {
      "code": "VL-01",
      "title": "Vacation Leave Policy",
      "excerpt": "Up to 5 unused days may be carried over per calendar year."
    }
  ],
  "reviewPacket": {
    "summary": "Employee inquiry about vacation carryover policy.",
    "recommendedAction": "Provide policy reference VL-01.",
    "approver": "HR Operations",
    "missingFields": []
  }
}
```

---

### Example 2: Missed Clock-in + Overtime (Medium Risk)

**Input:**
```json
{
  "request": "I forgot to clock in yesterday and worked 2 hours overtime. How do I report this?"
}
```

**Retrieved Context:**
```json
[
  {
    "ruleId": "TT-01",
    "policyName": "Time Tracking Corrections",
    "excerpt": "All retroactive time entries require manager sign-off."
  },
  {
    "ruleId": "TT-02",
    "policyName": "Overtime Reporting",
    "excerpt": "Overtime must be pre-approved or flagged for review."
  }
]
```

**Output:**
```json
{
  "request": "I forgot to clock in yesterday and worked 2 hours overtime. How do I report this?",
  "risk": "medium",
  "route": "draft_action",
  "confidence": "high",
  "needsReview": true,
  "explanation": "Time correction requires documented approval chain.",
  "reasoning": [
    "Time entry modification requires manager approval per TT-01",
    "Overtime component triggers payroll review per TT-02",
    "Audit trail required per TT-03"
  ],
  "citations": [
    {
      "code": "TT-01",
      "title": "Time Tracking Corrections",
      "excerpt": "All retroactive time entries require manager sign-off."
    },
    {
      "code": "TT-02",
      "title": "Overtime Reporting",
      "excerpt": "Overtime must be pre-approved or flagged for review."
    }
  ],
  "draftAction": {
    "type": "time_correction",
    "description": "Submit missed clock-in and overtime for approval.",
    "approver": "Direct Manager",
    "missingFields": ["Original scheduled hours", "Manager approval"]
  },
  "reviewPacket": {
    "summary": "Time correction request with overtime component.",
    "recommendedAction": "Draft correction ticket, route to manager.",
    "approver": "Direct Manager",
    "missingFields": ["Original scheduled hours", "Manager approval"]
  }
}
```

---

### Example 3: Payroll After Cutoff (High Risk)

**Input:**
```json
{
  "request": "I need to adjust my bank account for this month's payroll. The cutoff is tomorrow."
}
```

**Output:**
```json
{
  "request": "I need to adjust my bank account for this month's payroll. The cutoff is tomorrow.",
  "risk": "high",
  "route": "escalate",
  "confidence": "medium",
  "needsReview": true,
  "explanation": "Payroll deadline breach requires immediate specialist intervention.",
  "reasoning": [
    "Cutoff proximity creates payment risk per PA-01",
    "Bank account changes require verification per PA-03",
    "Time-sensitive: manual override may be needed"
  ],
  "citations": [
    {
      "code": "PA-01",
      "title": "Payroll Cutoff Policy",
      "excerpt": "Changes within 48h of cutoff require specialist review."
    }
  ],
  "reviewPacket": {
    "summary": "Urgent payroll account change near cutoff.",
    "recommendedAction": "Escalate to Payroll Operations immediately.",
    "approver": "Payroll Operations Lead",
    "missingFields": ["Verification docs", "Emergency contact"]
  }
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0-mvp | June 2026 | Initial skill definition for MVP |

---

## Notes

- This skill is designed for HR Operations in US/EU regions
- All monetary thresholds are USD-equivalent
- Cross-border requests always require escalation regardless of other factors
- Temperature should be 0.2 when using LLM (low creativity for safety)
