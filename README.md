# OpsGuard

**Risk-aware AI Skill for HR Operations**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-View%20App-blue)](https://opsguard-ai-skill.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-black)](https://github.com/SantiNones/opsguard-ai-skill)

---

## The Problem

HR Operations teams handle sensitive, high-stakes requests daily: payroll adjustments, time corrections, remote work approvals, leave policies. These requests often involve:

- **Compliance risks** (tax implications, labor law violations)
- **Financial exposure** (incorrect payroll, overtime disputes)
- **Data privacy concerns** (PII handling, access controls)
- **Urgency conflicts** (payroll deadlines vs. thorough review)

Most AI assistants simply answer. They don't assess risk, check policy, or route to appropriate approvers. This creates liability gaps and operational blind spots.

## The Solution

OpsGuard is an AI Skill that doesn't just answer—it **routes safely**. For every request, it:

1. **Retrieves** relevant policies and precedents
2. **Classifies risk** (low / medium / high)
3. **Chooses a safe route** based on confidence and constraints
4. **Prepares a human-review packet** with citations and recommended actions

### Core Workflow

```
Request → Policy Retrieval → Risk Classification → Safe Route → Human Review Packet
```

**Allowed Routes:**
- `answer_directly` — Low risk, high confidence, documented answer
- `ask_missing_info` — Insufficient context, needs clarification
- `draft_action` — Medium risk, requires approval chain
- `escalate` — High risk, immediate specialist handoff

### Why This Matters

AI in operations shouldn't be a black box that gives answers. It should be a **transparent decision system** that:
- Knows its limits (when to escalate)
- Shows its work (citations, reasoning)
- Respects boundaries (never auto-approves sensitive actions)
- Prepares handoffs (structured packets for humans)

## Key Features

- ✅ **3-Column Workspace** — Request intake, decision summary, action packet
- ✅ **Risk Visualization** — Color-coded badges (green safe, amber warning, red critical)
- ✅ **Policy Citations** — Automatic rule matching with excerpts
- ✅ **Workflow Stepper** — Visual progress through decision pipeline
- ✅ **Multi-Channel Handoff** — Copy formatted packets for Slack, Teams, or tickets
- ✅ **Example Library** — Vacation, clock-in, payroll, remote work scenarios

## AI Product Engineering Concepts

This project demonstrates modern AI Product Engineering patterns:

| Concept | Implementation |
|---------|---------------|
| **Spec-Driven Development** | [`skills/resolve_ops_request.skill.md`](./skills/resolve_ops_request.skill.md) defines the AI contract |
| **AI Skills** | Reusable, versioned capability with explicit inputs/outputs |
| **RAG-Style Grounding** | Policy retrieval layer with stable rule IDs (TT-01, PA-03, etc.) |
| **Structured Outputs** | Typed responses with risk levels, routes, and citations |
| **Human-in-the-Loop** | Review gates for medium/high risk actions |
| **Evals** | [`evals/ops-evals.json`](./evals/ops-evals.json) — test cases for regression testing |
| **Safe Action Routing** | Forbidden actions explicitly defined (no auto-approvals) |

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI Layer:** Deterministic mock (OpenAI integration in next milestone)
- **Deployment:** Vercel

## Project Structure

```
app/              # Next.js application
components/       # UI components (layout, request, decision, action, system)
lib/              # Types, mock resolver, copy utilities
docs/             # SPEC.md, ARCHITECTURE.md
skills/           # AI Skill contracts
policies/         # HR policy documents with rule IDs
evals/            # Test cases and eval suite
```

## Current Status

**Milestone 3B Complete:** OpenAI structured resolver with deterministic fallback

- ✅ **OpenAI Integration** — GPT-4o-mini with structured JSON outputs
- ✅ **Zod Validation** — Schema validation for AI responses with citation verification
- ✅ **Safe Fallback** — Deterministic resolver on any AI failure (invalid JSON, bad citations, unsafe routing)
- ✅ **Cost Controls** — 
  - Uses gpt-4o-mini by default
  - Only calls OpenAI on "Analyze request" click
  - Max 5 policy chunks, max 800 tokens output
  - Deterministic evals by default (no surprise costs)
- ✅ **Eval Runner** — 
  - `npm run eval` → deterministic mode (free)
  - `USE_AI=true npm run eval` → AI mode (costs apply)

**Milestone 3A.1 Complete:** Deterministic eval performance optimized

- ✅ **Eval Results: 100% Pass Rate**
  - Route Accuracy: 100%
  - Risk Accuracy: 100%
  - Review Safety: 100%
  - Citation Recall: 100%
- ✅ **Policy Retrieval** — Loads markdown policy files, parses rule sections (TT-01, PA-03, etc.), keyword-based relevance scoring with explicit rule ID boosting
- ✅ **Safety Rules** — Deterministic overrides for sensitive topics (payroll, compensation, cross-border, legal)
- ✅ **Unified Resolver** — Orchestrates retrieval + AI/deterministic classification + safety layer
- ✅ **API Route** — `/api/resolve` endpoint with structured request/response
- ✅ **UI/API Integration** — Frontend calls API with graceful fallback to local mock

**Milestone 5 Complete:** Dual Audience UX — Employee Answer + HR Review Packet

- ✅ **Dual Output Types** — EmployeeResponse and HRReviewPacket interfaces
- ✅ **Response Builder** — Transforms resolver output into audience-specific responses
- ✅ **Employee-Facing UI** — Clear, safe answers with status badges and privacy notes
- ✅ **HR Review UI** — Structured packets with risk, reasoning, and recommended actions
- ✅ **View Mode Toggle** — Switch between Employee, HR, or Both views
- ✅ **Safe Escalation** — Sensitive requests automatically routed to HR review
- ✅ **Access-Aware Citations** — Employees only see non-sensitive policy references
- ✅ **Backward Compatibility** — Existing UI components and evals preserved

**Dual Audience Examples:**
| Request | Employee Sees | HR Sees |
|---------|---------------|---------|
| "Can I carry over vacation days?" | Direct answer with policy citation | Review packet with low risk |
| "What is Ana's salary?" | "Not allowed" with privacy note | Access denied packet with audit trail |
| "Need payroll bank update" | "Sent to HR review" message | Escalation packet with draft action |

**Milestone 4 Complete:** Enterprise Context & Access Control Simulation

- ✅ **Fictitious Enterprise Dataset** — 8 Spanish/European employees, contracts, payroll records
- ✅ **Role-Based Access Control** — Employee, Manager, HR Ops, Payroll Admin roles
- ✅ **Permissioned Context** — Field-level access control for sensitive HR/Payroll data
- ✅ **Redaction Layer** — Automatic masking of salary, bank accounts, sensitive fields
- ✅ **Persona Switcher** — UI component to view as different roles
- ✅ **Enterprise Context Panel** — Collapsible panel showing access level and redactions
- ✅ **No Real Data** — All mock data is fictitious; no PII risk
- 📖 See `docs/ACCESS_CONTROL.md` for full access control documentation

**Access Levels by Role:**
| Role | Self | Direct Reports | Others |
|------|------|----------------|--------|
| Employee | Full | None | None |
| Manager | Full | Partial (no salary) | Minimal |
| HR Ops | Full | Full contract | Partial |
| Payroll Admin | Full | Payroll records | Full payroll |

**Milestone 1-2 Complete:** Frontend MVP with documentation

- ✅ Premium internal-tool UI
- ✅ 4 example scenarios with mock classification
- ✅ Risk badges and workflow visualization
- ✅ Copy-to-clipboard for handoff
- ✅ Product spec, architecture docs, AI Skill contract
- ✅ 5 policy documents with stable rule IDs
- ✅ Eval suite with 10 test cases

## Next Milestone

**Milestone 3B:** OpenAI Integration

- [ ] OpenAI API integration (GPT-4 with structured outputs)
- [ ] Enhanced policy retrieval with vector embeddings
- [ ] LLM-based classification with citation grounding
- [ ] Improved confidence scoring
- [ ] Request history and audit logging

## Live Demo

🚀 **[https://opsguard-ai-skill.vercel.app/](https://opsguard-ai-skill.vercel.app/)**

Try the example chips:
- **Vacation** → Low risk, direct answer
- **Clock-in** → Medium risk, draft action
- **Payroll** → High risk, escalate
- **Remote abroad** → High risk, escalate

## Repository

📁 **[https://github.com/SantiNones/opsguard-ai-skill](https://github.com/SantiNones/opsguard-ai-skill)**

## Local Development

```bash
npm install
npm run dev          # Start dev server on http://localhost:3000
npm run eval         # Run eval suite and see accuracy report
npm run build        # Production build
npm run lint         # ESLint check
```

Open [http://localhost:3000](http://localhost:3000)

## How It Works

### Policy Retrieval (Deterministic)

The system loads markdown policy files from `/policies/` and parses them into searchable chunks:

```
Request: "I forgot to clock in yesterday"
         ↓
Retrieved Chunks:
  - TT-01: Missed Clock-Ins
  - TT-02: Manager Approval Required
  - TT-03: Overtime Corrections
         ↓
Resolver: Classifies as medium risk, draft_action route
         ↓
Safety Rules: Applies overrides if needed
         ↓
Output: Structured decision with citations
```

**Scoring method:** Keyword overlap with policy type bonuses (TT, PA, VL, RW, ON)

**Future:** Will be replaced with vector similarity search (Chroma/Pinecone)

### Safety Rules

Deterministic overrides prevent unsafe routing:

| Trigger | Action |
|---------|--------|
| Payroll keywords | Risk → medium/high, must escalate if action requested |
| Compensation keywords | Must escalate, never answer directly |
| Cross-border work | Risk → high, must escalate |
| Missing citations | Route → ask_for_info |
| Time + overtime | Risk → medium, route → draft_action |

### Eval Runner

```bash
npm run eval
```

Runs 10 test cases and reports:
- Route accuracy (%)
- Risk classification accuracy (%)
- Human review safety (%)
- Citation recall (%)
- Average latency (ms)
- Per-case detailed results

### OpenAI Integration with Safe Fallback

OpsGuard uses OpenAI when `USE_AI=true` and `OPENAI_API_KEY` is set:

```bash
# .env.local
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
USE_AI=true
```

**Fallback Triggers:**
- AI returns invalid JSON
- AI cites rules not in retrieved chunks (hallucination)
- AI attempts to auto-approve sensitive actions (payroll, compensation, cross-border)
- OpenAI API error or timeout
- Schema validation fails

```
Request → Policy Retrieval → Try AI → [Valid?] → Apply Safety → Output
                              ↓
                        [Invalid/Unsafe]
                              ↓
                    Fallback to Deterministic
```

This ensures HR Operations workflows degrade safely.

### Enterprise Context and Access Control

OpsGuard simulates how an enterprise HR Operations AI handles permissioned data:

**Fictitious Enterprise Dataset:**
- 8 Spanish/European employees (fictitious names, no real PII)
- 2 Managers, 1 HR Ops, 1 Payroll Admin, 4 Employees
- Contracts, payroll records, and org chart relationships

**Role-Based Access:**
```
Employee:     Can see own data only
Manager:      Can see direct reports' work status (not salary)
HR Ops:       Can see contract details for HR cases
Payroll Admin: Can see payroll records (salary, bank last4)
```

**Redaction Examples:**
- `ana.garcia@company.es` → `a***@c***.es`
- `€42,000/year` → `[SALARY_AMOUNT_REDACTED]`
- `ES91 2345 6789 0123` → `ES91 **** **** 0123`

**Demo Usage:**
1. Select a persona in the UI (e.g., "Manager — Laura Martín")
2. Submit a request about a direct report (e.g., "What's Carlos's vacation balance?")
3. View the Enterprise Context panel to see:
   - Access level granted (full/partial/minimal)
   - Fields that were redacted
   - Why certain data is hidden

**Production Path:**
Mock data → HRIS API (Workday/BambooHR) + Identity Provider (Okta/Azure AD) + Audit logging

See `docs/ACCESS_CONTROL.md` for full documentation.

### Dual Audience UX

OpsGuard provides two distinct views for HR Operations requests:

**Employee Response:**
- Clear, simple answers in employee-friendly language
- Status badges: Answered, Needs More Info, Sent to HR Review, Not Allowed
- Privacy notes when data is redacted
- Safe escalation messages for sensitive requests
- Limited to non-sensitive policy citations

**HR Review Packet:**
- Structured internal packet with risk assessment
- Complete reasoning and policy citations
- Draft actions for HR to execute
- Access control notes and audit trail
- Recommended owner assignment

**View Modes:**
- **Both Views** (default): Shows employee response first, then HR packet
- **Employee View**: Shows only what the employee would see
- **HR View**: Shows only the internal review packet

**Example Flows:**
1. **Simple Policy Question** → Employee gets direct answer, HR gets low-risk packet
2. **Missing Information** → Employee sees what's needed, HR gets escalation packet
3. **Sensitive Request** → Employee gets "sent to HR review", HR gets detailed packet with draft action
4. **Access Denied** → Employee sees "not allowed", HR sees access control audit

## License

MIT — Built for AI Product Engineer interviews and production inspiration.

---

**Built with ❤️ by Santi Nones** — *AI should route safely, not just answer blindly.*
