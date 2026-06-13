# OpsGuard Product Specification

**Version:** 0.1.0-mvp  
**Last Updated:** June 2026  
**Status:** Draft

---

## 1. Product Goal

OpsGuard is a risk-aware AI Skill that helps HR Operations teams analyze sensitive operational requests, classify risk, choose a safe route, and prepare a human-review packet.

**Core Principle:** AI should not just answer. It should decide whether to answer directly, ask for missing information, draft an action, or escalate to human review.

---

## 2. Target User

**Primary:** HR Operations Specialists, HR Business Partners (HRBPs), Payroll Operations

**Context:**
- Processes 20-100 employee requests per day
- Must balance speed with compliance
- Cannot afford errors on payroll, time tracking, or policy violations
- Works in Slack/Teams/email with multiple stakeholders

---

## 3. User Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. REQUEST INTAKE                                               │
│    Employee submits request (email, Slack, ticket)             │
│    OpsGuard parses and extracts intent                          │
├─────────────────────────────────────────────────────────────────┤
│ 2. POLICY RETRIEVAL                                             │
│    Match request to relevant policy rules (TT-01, PA-03, etc.) │
│    Retrieve excerpts and precedent cases                        │
├─────────────────────────────────────────────────────────────────┤
│ 3. RISK CLASSIFICATION                                          │
│    Analyze: compliance risk, financial exposure, urgency        │
│    Output: LOW / MEDIUM / HIGH                                  │
├─────────────────────────────────────────────────────────────────┤
│ 4. SAFE ROUTE SELECTION                                         │
│    Based on risk + confidence + constraints                   │
│    Choose: answer_directly | ask_missing_info | draft_action | escalate│
├─────────────────────────────────────────────────────────────────┤
│ 5. HUMAN REVIEW PACKET                                          │
│    Generate structured packet with:                             │
│    - Summary, recommended action, approver, citations           │
│    - Formatted for Slack/Teams/ticket systems                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Non-Goals

**Explicitly Out of Scope for MVP:**
- ❌ Direct database mutations (no auto-approvals)
- ❌ Real-time Slack/Teams bot integration
- ❌ Employee self-service portal
- ❌ Multi-language support
- ❌ Advanced analytics dashboard
- ❌ Machine learning model training

**Future Considerations:**
- Slack bot with ephemeral messages
- Auto-routing to Jira/ServiceNow
- Manager approval workflows
- Audit trail and compliance reporting

---

## 5. Allowed Routes

### 5.1 `answer_directly`
**When to use:** Low risk, high confidence, documented policy available

**Criteria:**
- Risk level: LOW
- Confidence: HIGH (≥0.8)
- Has relevant policy citation
- No PII modification required
- No compliance triggers

**Example:** "Can I carry over 5 vacation days?" → Cites VL-01, provides answer

---

### 5.2 `ask_missing_info`
**When to use:** Insufficient context to make a decision

**Criteria:**
- Cannot classify risk (ambiguous request)
- Missing required fields (employee ID, dates, amounts)
- Multiple possible interpretations

**Example:** "I need help with payroll" → Ask: which pay period, what issue, employee ID

---

### 5.3 `draft_action`
**When to use:** Medium risk, requires approval chain

**Criteria:**
- Risk level: MEDIUM
- Requires manager or specialist approval
- Needs documented audit trail
- Has clear approval workflow

**Example:** "I forgot to clock in and worked overtime" → Draft correction ticket, route to manager

---

### 5.4 `escalate`
**When to use:** High risk, immediate specialist attention required

**Criteria:**
- Risk level: HIGH
- Compliance violations possible
- Time-sensitive (payroll cutoff, legal deadlines)
- Cross-border implications
- Compensation changes

**Example:** "Payroll cutoff is tomorrow, I need to change my bank account" → Escalate to Payroll Lead

---

## 6. Risk Levels

### LOW
- **Definition:** Routine policy queries with documented answers
- **Financial Impact:** <$100 or none
- **Compliance Impact:** None
- **Examples:** Vacation carryover, standard leave queries, policy clarifications

### MEDIUM
- **Definition:** Modifications requiring documented approval
- **Financial Impact:** $100-$1000
- **Compliance Impact:** Minor (requires audit trail)
- **Examples:** Time corrections, schedule changes, local remote work

### HIGH
- **Definition:** High-stakes actions with compliance or financial exposure
- **Financial Impact:** >$1000 or recurring
- **Compliance Impact:** Significant (tax, labor law, data privacy)
- **Examples:** Cross-border remote work, post-cutoff payroll changes, compensation adjustments

---

## 7. Success Criteria

### 7.1 Functional
- [x] 4 example scenarios correctly classified (vacation, clock-in, payroll, remote)
- [x] All routes produce valid, structured output
- [x] Human-review packets include all required fields
- [x] Copy-to-clipboard works for all 3 formats (Slack, Teams, ticket)

### 7.2 UX
- [x] 3-column layout responsive on desktop (≥1280px)
- [x] Risk badges clearly distinguish low/medium/high
- [x] Example chips populate textarea correctly
- [x] Empty states guide user to first action

### 7.3 Safety
- [x] Never auto-approves sensitive actions
- [x] All medium/high risk flagged for review
- [x] Citations included for all policy-based decisions

---

## 8. Failure Modes

### 8.1 Low Confidence Routing
**Problem:** Request matches multiple policies ambiguously
**Fallback:** Route to `ask_missing_info` with specific clarifying questions

### 8.2 Missing Policy Coverage
**Problem:** Request is valid but no matching policy rule
**Fallback:** Default to `escalate` with note: "No policy match, requires human review"

### 8.3 Urgency Conflict
**Problem:** High-risk request with time pressure (payroll cutoff)
**Fallback:** Escalate with urgency flag, bypass normal queue

### 8.4 System Unavailable
**Problem:** AI/retrieval layer down
**Fallback:** Graceful degradation to ticket creation with manual routing

---

## 9. Safety Constraints

### Forbidden Actions (Never Auto-Approve)
1. **Payroll changes** — Always require specialist review
2. **Time entry modifications** — Always require manager approval
3. **Cross-border work authorizations** — Always require Legal + HRBP
4. **Compensation adjustments** — Always require HR Director approval
5. **Personal data exports** — Always require DPO review

### Required Guardrails
- Maximum confidence threshold: 0.95 (never 100% certain)
- All citations must include rule ID and excerpt
- Missing fields must be explicitly listed in packet
- Review status must be visible in UI

---

## 10. Open Questions

1. Should we add a `defer` route for non-urgent requests?
2. How should we handle conflicting policies (region A vs region B)?
3. Should managers receive proactive notifications or passive queue?
4. What's the retention policy for request history?

---

## 11. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0-mvp | June 2026 | Initial spec for weekend MVP |
