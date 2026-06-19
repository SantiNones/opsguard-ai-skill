# OpsGuard — Risk-aware AI Skill for HR Operations

[Live Demo](https://opsguard-ai-skill.vercel.app/) 

**AI does not just answer. It routes.**

OpsGuard is an AI Skill that routes HR Operations requests across policy answers, live employee data, access restrictions, and human review workflows. It demonstrates how enterprise AI systems can ground decisions in retrievable policy, enforce role-based access, and safely hand off sensitive cases to human reviewers.

---

## The Problem

HR Operations handles sensitive, high-stakes requests every day:

- Payroll adjustments, bank changes, cutoff emergencies
- Time tracking corrections, missed clock-ins, overtime disputes
- Leave balances, carryover rules, approval workflows
- Remote work across borders with tax and compliance implications
- Employee data privacy and field-level access control

Most AI assistants simply answer. They do not assess risk, verify policy, check permissions, or route to the right approver. This creates liability gaps, compliance blind spots, and operational risk.

## The Solution

For every request, OpsGuard:

1. Retrieves relevant policies using stable rule IDs like VL-01 and TT-02
2. Looks up enterprise context when needed, such as employee records and org chart data
3. Enforces access control before returning live employee data
4. Classifies risk as low, medium, or high
5. Chooses a safe route:
   - answer_directly — Low risk with policy citation or permitted live data
   - ask_for_info — Insufficient context, needs clarification
   - draft_action — Medium risk, creates a review case for approval
   - escalate — High risk or sensitive, immediate HR handoff
6. Prepares a review packet with citations, risk reasoning, owner, and recommended actions

## Core Workflows

| Request | Route | What Happens |
|---------|-------|--------------|
| “Can I carry over vacation days?” | answer_directly | Policy answer citing VL-01 |
| “How many vacation days do I have per year?” | answer_directly | Policy answer citing VL-05 |
| “What is my vacation balance?” | answer_directly | Live Data from the employee’s own record |
| Ana, an employee, asks for Carlos’s balance | answer_directly | Access restricted — no live data returned |
| Laura, a manager, asks for Carlos’s balance | answer_directly | Live Data — Carlos is her direct report |
| “I forgot to clock in yesterday and worked overtime” | draft_action | Review case created for manager approval |
| HR Ops opens a case in Review Queue | — | Sees owner, timestamp, policy references, and can resolve or delete |
| “I want to work from Portugal for 3 weeks” | escalate | Immediate HR specialist handoff |

## Time Operations Pack

OpsGuard now includes a focused Time Operations Pack for realistic HR and Time Operations exceptions: missed clock-ins, overtime corrections, payroll cutoff risk, and team member attendance access.

| Scenario | Route | Safe Outcome |
|----------|-------|--------------|
| Missed clock-in | draft_action | Manager review before correction |
| Overtime correction | draft_action | Manager / HR review before approval |
| Payroll cutoff risk | escalate | HR Operations / Payroll review before any change is applied |
| Team member attendance as employee | restrict_access | No private attendance data exposed |
| Team member attendance as manager | answer_directly | Permissioned attendance exceptions only |

Safety patterns demonstrated:

- role-based access control before returning employee data
- policy citations for explainable routing decisions
- human-in-the-loop review for medium-risk corrections
- payroll-risk escalation near cutoff windows
- privacy-preserving responses for denied peer access
- eval-backed behavior across routing, retrieval, and confidence cases

Current validation snapshot:

- Core evals: 20/20
- Retrieval evals: 14/14
- Confidence evals: 8/8
- Build: passing
- Lint: passing with existing warnings only

Production readiness note: this is a prototype of safe AI routing for HR / Time Operations, not a production system. A production version would require real SSO/auth, HRIS and Time integrations, API/tool-level permission checks, audit logs, observability, expanded evals from real customer edge cases, and approval gates before write actions.

## Architecture

Request  
↓  
Policy Retrieval  
(rule-level chunks, stable IDs)  
↓  
Enterprise Context Lookup  
(mock employee data, org chart)  
↓  
Access Control  
(role-based and field-level permissions)  
↓  
Risk / Routing Decision  
(deterministic or AI-assisted)  
↓  
Response Builder  
(employee answer + HR review packet)  
↓  
Review Packet / Review Queue  
(if human review is needed)  
↓  
Evals  
(route, risk, citations, retrieval, confidence)

## RAG / Policy Grounding

Policies are stored as Markdown files with stable rule IDs:

- VL-01 — Vacation Carryover
- VL-02 — Leave Approval
- VL-03 — Leave Balance
- VL-04 — PTO vs Vacation
- VL-05 — Annual Vacation Entitlement
- TT-01 — Missed Clock-Ins
- PA-01 — Payroll Cutoff Dates

Retrieval features:

- Rule-level chunking instead of arbitrary token windows
- Whole-word matching with policy-domain boosts
- Context budget of 1800 tokens
- Citation eligibility validation
- Retrieval evals: 14/14 cases, Recall@5 = 100%

The Knowledge Base allows users to browse policies by domain, inspect rule IDs, and search across policy titles and text.

## Enterprise Context & Access Control

OpsGuard uses a mock enterprise dataset with 8 fictitious employees, an org chart, roles, and permissioned data.

| Role | Self | Direct Reports | Others |
|------|------|----------------|--------|
| Employee | Full own data | None | None |
| Manager | Full own data | Work and leave status, no salary | Minimal |
| HR Ops | Full HR data | Contract and HR details | Partial HR access |
| Payroll Admin | Payroll data | Payroll records | Payroll-specific data only |

Access decisions happen before live data is shown.

Examples:

- Employees can see their own leave balance
- Managers can see direct report vacation status
- Peer employee data is restricted
- Salary and bank details require payroll-specific access
- Payroll Admin access does not automatically grant visibility into all non-payroll HR data

## Human-in-the-Loop Review Queue

Sensitive or action-oriented requests create review cases.

Review cases include:

- exact creation timestamp
- resolved owner when inferable
- owner role and department
- summary
- recommended action
- risk level
- route
- policy references
- source label for console-created cases

HR Ops can open cases, inspect policy references, mark cases as resolved, or delete them from the active queue.

For demo purposes, created review cases are stored in localStorage.

## Resolver Modes

OpsGuard supports two resolver modes:

| Mode | How to Enable | Use Case |
|------|---------------|----------|
| Deterministic | USE_AI=false or unset | Repeatable demos, evals, zero cost |
| AI-assisted | USE_AI=true and OPENAI_API_KEY | GPT-4o-mini with structured outputs and deterministic fallback |

Safe fallback is applied if the AI returns invalid JSON, unsupported citations, unsafe routing, or fails schema validation.

The UI does not toggle production environment variables. Resolver mode is controlled through environment configuration.

## Evals

Three eval suites validate routing, retrieval, and confidence behavior:

npm run eval — 20/20, route, risk, review, citations  
npm run eval:retrieval — 14/14, Recall@5, forbidden violations  
npm run eval:confidence — 8/8, confidence, no-policy, sensitive escalation

All evals run deterministically with no OpenAI calls unless explicitly enabled.

Eval coverage includes:

- policy questions with required citations
- annual vacation entitlement citing VL-05
- live data balance lookup
- manager querying a direct report’s vacation balance
- target employee resolution when a request contains both “I” and an explicit employee name
- time correction and overtime approval flows
- payroll cutoff escalation
- remote work abroad escalation
- no-policy and sensitive-request handling

## Tech Stack

- Next.js 16 — App Router, React Server Components
- TypeScript — End-to-end type safety
- Tailwind CSS — Utility-first styling
- Vercel — Deployment and hosting
- OpenAI — Optional GPT-4o-mini resolver with structured outputs
- localStorage — Demo Review Queue persistence
- Markdown — Human-readable, version-controlled policies

## Local Development

npm install  
npm run dev  
npm run lint  
npm run build  
USE_AI=false npm run eval  
npm run eval:retrieval  
USE_AI=false npm run eval:confidence

Open:

http://localhost:3000

## Limitations

This is a demonstration and interview project, not production software.

Current limitations:

- enterprise data is mock and fictitious
- no real HRIS integration
- no real authentication or SSO
- Review Queue uses localStorage, not a persistent backend database
- policies are local Markdown files, not synced from a real policy management system
- no vector database is currently used
- not security-hardened or compliance-certified for production use

## Production Roadmap

To take OpsGuard to production:

- SSO / Identity Provider — Okta, Azure AD, or Google Workspace
- Real HRIS integration — Workday, BambooHR, SAP SuccessFactors, or Factorial-style employee data APIs
- Postgres database — persistent cases, audit logs, request history, and case state
- Vector database — Pinecone, Weaviate, or pgvector for semantic policy retrieval
- Ticketing integration — Jira, ServiceNow, Zendesk, Linear, or internal HR ticketing tools
- Slack / Teams integration — conversational intake and handoff
- Audit logs — immutable request, retrieval, access-control, and routing records
- Admin dashboard — policy management, analytics, review queues, and human feedback loop
- Monitoring — observability, cost tracking, error alerting, and eval regression monitoring
- Compliance controls — data retention policies, permission reviews, redaction logs, and approval trails

---

Built by Santi Nones — AI should route safely, not just answer blindly.

MIT License — Built for AI Product Engineer interviews and production inspiration.
