# OpsGuard Architecture

**Version:** 0.1.0-mvp  
**Last Updated:** June 2026

---

## 1. Overview

OpsGuard is built as a modular AI Skill system with clear separation between the UI layer, decision layer, and policy/retrieval layer.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   Request    │  │   Decision   │  │   Action     │  │  System    │  │
│  │   Composer   │  │   Summary    │  │   Packet     │  │  Details   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         AI SKILL LAYER                                 │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              resolve_ops_request Skill                          │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │   │
│  │  │   Intent    │  │    Risk      │  │       Routing           │ │   │
│  │  │  Parsing    │→ │ Classification│→│      Engine             │ │   │
│  │  └─────────────┘  └──────────────┘  └─────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      RETRIEVAL & POLICY LAYER                            │
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Time Track  │  │   Payroll   │  │  Vacation   │  │   Remote    │     │
│  │   Policy    │  │   Policy    │  │   Policy    │  │   Policy    │     │
│  │   (TT-*)    │  │   (PA-*)    │  │   (VL-*)    │  │   (RW-*)    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                                         │
│  ┌─────────────┐  ┌─────────────────────────────────────────────────┐    │
│  │ Onboarding  │  │         Vector/Keyword Retrieval Engine          │    │
│  │   Policy    │  │              (Future: Chroma/Pinecone)           │    │
│  │   (ON-*)    │  └─────────────────────────────────────────────────┘    │
│  └─────────────┘                                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       HANDOFF & INTEGRATION LAYER                        │
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │    Slack    │  │    Teams    │  │    Jira     │  │   Email     │    │
│  │   Format    │  │   Format    │  │   Ticket    │  │   Alert     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Current Architecture (MVP)

### 2.1 Frontend (Next.js 16 + TypeScript)

**File Structure:**
```
app/
├── page.tsx           # Main 3-column workspace
├── layout.tsx         # Root layout with fonts
└── globals.css        # Tailwind + custom colors

components/
├── layout/
│   ├── Sidebar.tsx    # Navigation + wordmark
│   └── AppHeader.tsx   # Title, subtitle, principle strip
├── request/
│   └── RequestComposer.tsx  # Textarea + example chips
├── decision/
│   ├── DecisionSummary.tsx  # Risk badges, explanation
│   └── WorkflowStepper.tsx  # Visual progress indicator
├── action/
│   └── ActionPacket.tsx     # Review packet + copy buttons
└── system/
    └── SystemDetails.tsx    # Collapsible accordions
```

**State Management:**
- React `useState` for local component state
- No global state library (intentionally simple)
- Props flow: page.tsx → components

### 2.2 Decision Layer (Mock Resolver)

**File:** `lib/mockResolve.ts`

**Current Implementation:**
- Keyword-based classification (case-insensitive)
- Deterministic responses for 4 scenarios
- Returns fully-typed `ResolveOpsRequestOutput`

**Limitations:**
- No real AI inference
- No vector retrieval
- Limited to hardcoded examples

### 2.3 Type System

**File:** `lib/types.ts`

**Core Types:**
```typescript
type RiskLevel = 'low' | 'medium' | 'high';
type Route = 'answer_directly' | 'ask_for_info' | 'draft_action' | 'escalate';

interface ResolveOpsRequestOutput {
  request: string;
  risk: RiskLevel;
  route: Route;
  confidence: 'low' | 'medium' | 'high';
  needsReview: boolean;
  explanation: string;
  reasoning: string[];
  citations: Citation[];
  reviewPacket: ReviewPacket;
}
```

---

## 3. Future Architecture (Milestone 2+)

### 3.1 AI Layer (OpenAI Integration)

**Proposed Implementation:**
```typescript
// lib/ai/resolve.ts
export async function resolveWithAI(
  request: string,
  context: RetrievedPolicy[]
): Promise<ResolveOpsRequestOutput> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: buildPrompt(request, context),
    response_format: { type: 'json_object' },
    temperature: 0.2,  // Low creativity for safety
  });
  
  return validateAndParse(response);
}
```

**Prompt Strategy:**
- System prompt from `skills/resolve_ops_request.skill.md`
- Dynamic context injection (top-k retrieved policies)
- Few-shot examples from evals

### 3.2 Retrieval Layer

**Option A: Keyword Search (Current)**
- Simple regex matching
- Zero latency
- Limited semantic understanding

**Option B: Vector Search (Future)**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Request   │────→│  Embedding  │────→│  ChromaDB   │
│   Text      │     │   (OpenAI)  │     │  (top-k=3)  │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Retrieved  │
                                        │  Policies   │
                                        └─────────────┘
```

**Policy Storage:**
- Markdown files in `policies/` (version controlled)
- Chunked and embedded during build
- Cached in vector store

### 3.3 Safety Layer

**Guardrails:**
```typescript
// lib/safety/guardrails.ts
export function validateOutput(output: ResolveOpsRequestOutput): ValidationResult {
  // Check forbidden actions
  if (output.route === 'answer_directly' && isPayrollChange(output)) {
    return { valid: false, reason: 'Payroll changes require escalation' };
  }
  
  // Check confidence threshold
  if (output.confidence === 'low' && output.route !== 'ask_for_info') {
    return { valid: false, reason: 'Low confidence must ask for info' };
  }
  
  // Check citations present
  if (output.citations.length === 0 && output.route === 'answer_directly') {
    return { valid: false, reason: 'Direct answers require citations' };
  }
  
  return { valid: true };
}
```

### 3.4 Enterprise Context Layer

**Purpose:** Simulates role-based access control for HR/Payroll data

**Pipeline:**
```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Actor    │────→│   Access     │────→│  Permissioned │────→│   Redacted   │
│   (Who)     │     │   Control    │     │   Context     │     │   Context    │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Target Emp   │
                    │ (Whose data) │
                    └──────────────┘
```

**Components:**
- `data/enterprise/employees.ts` — Mock employee dataset (8 fictitious Spanish/European employees)
- `data/enterprise/contracts.ts` — Employment contract data
- `data/enterprise/payrollRecords.ts` — Payroll records (June 2026)
- `lib/accessControl.ts` — Role-based permission logic
- `lib/privacy/redaction.ts` — Field-level redaction utilities
- `lib/enterpriseContext.ts` — Context builder with diagnostics

**Roles:**
| Role | Self | Direct Reports | Others |
|------|------|----------------|--------|
| `employee` | Full | None | None |
| `manager` | Full | Partial (no salary/bank) | Minimal |
| `hr_ops` | Full | Full contract | Partial (no salary) |
| `payroll_admin` | Full | Payroll records | Full payroll access |

**Redaction Strategy:**
- Salary amounts → `[SALARY_AMOUNT_REDACTED]`
- Bank accounts → `ES91 **** **** 0123`
- Emails → `a***@c***.es`

**Demo UI:**
- `PersonaSwitcher` — Select actor role
- `EnterpriseContext` — Collapsible context panel showing access level and redactions

**Production Path:**
Current mock data → HRIS API + Identity Provider + Audit logging

### 3.5 Eval Layer

**File:** `evals/ops-evals.json`

**Eval Runner (Future):**
```typescript
// lib/evals/runner.ts
export async function runEvals(): Promise<EvalReport> {
  const cases = loadEvalCases();
  const results = await Promise.all(
    cases.map(async (testCase) => {
      const output = await resolve(testCase.input);
      return evaluate(testCase, output);
    })
  );
  
  return generateReport(results);
}
```

**Metrics:**
- Route accuracy (% correct routing decisions)
- Risk classification accuracy
- Citation recall (are expected rules cited?)
- Latency (p50, p95, p99)

---

## 4. Data Flow

### 4.1 Request Processing Flow

```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User   │───→│ Enterprise│───→│ Retrieve │───→│  Risk    │───→│  Route   │
│ Request │    │  Context │    │ Policies │    │  Class   │    │  Select  │
│+ Actor  │    │  (RBAC)  │    │          │    │          │    │          │
└─────────┘    └──────────┘    └──────────┘    └──────────┘    └────┬─────┘
                                                                    │
                              ┌──────────────────────────────────────┘
                              ▼
                       ┌──────────────┐
                       │ Safety Layer │
                       │  (Override)  │
                       └───────┬──────┘
                               │
                       ┌───────▼──────┐
                       │ Review Packet │
                       │  Generation  │
                       └───────┬──────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        ┌─────────┐     ┌─────────┐     ┌─────────┐
        │  Slack  │     │  Teams  │     │  Ticket │
        │  Handoff│     │  Handoff│     │  Handoff│
        └─────────┘     └─────────┘     └─────────┘
```

### 4.2 State Transitions

| Current State | Input | Next State | Condition |
|---------------|-------|------------|-----------|
| `idle` | User types | `input` | Text length > 0 |
| `input` | Click Analyze | `analyzing` | Valid input |
| `analyzing` | API returns | `decided` | Success |
| `analyzing` | API error | `error` | Exception |
| `decided` | Copy packet | `copied` | Clipboard success |
| `decided` | New request | `input` | Clear output |

---

## 5. Component Structure

### 5.1 Component Hierarchy

```
Page (page.tsx)
├── Sidebar
├── AppHeader
└── Main Content (3-column grid)
    ├── Column 1: Request
    │   └── RequestComposer
    │       └── ExampleChips
    ├── Column 2: Decision
    │   ├── DecisionSummary
    │   │   ├── RiskBadge
    │   │   ├── RouteBadge
    │   │   ├── ConfidenceBadge
    │   │   ├── CitationList
    │   │   └── ReasoningList
    │   └── WorkflowStepper
    └── Column 3: Action
        ├── ActionPacket
        │   ├── ReviewPacketCard
        │   └── CopyButtons (Slack, Teams, Ticket)
        └── SystemDetails
            ├── EvidenceAccordion
            ├── EvalAccordion
            └── ContractAccordion
```

### 5.2 Props Interface

**Data Flow (Top-Down):**
- `page.tsx` manages `request`, `output`, `isAnalyzing` state
- Passes `output` to DecisionSummary, WorkflowStepper, ActionPacket, SystemDetails
- Passes `request` and handlers to RequestComposer

**No State Lifting:**
- Components are mostly presentational
- Business logic in `lib/mockResolve.ts` (future: `lib/ai/resolve.ts`)

---

## 6. Integration Boundaries

### 6.1 Slack Integration (Future)

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Slack     │─────→│   OpsGuard  │─────→│   Slack     │
│   Message   │      │   API       │      │   Response  │
│   (DM/Channel)      │  (Webhook)  │      │  (Ephemeral)│
└─────────────┘      └─────────────┘      └─────────────┘
```

**Flow:**
1. User DMs OpsGuard bot
2. Bot calls resolve API
3. Bot returns formatted decision card
4. User clicks "Create Ticket" or "Escalate"

### 6.2 Teams Integration (Future)

Similar to Slack, using Teams Adaptive Cards for rich UI.

### 6.3 Ticket System (Future)

**Jira/ServiceNow Integration:**
- OpsGuard prepares ticket payload
- POST to ticketing API
- Includes summary, priority, assignee, citations

---

## 7. Deployment Architecture

### 7.1 Current (Vercel)

```
┌─────────────────────────────────────────┐
│              Vercel Edge               │
│  ┌─────────┐  ┌─────────┐  ┌────────┐ │
│  │  Next.js│  │  Static │  │  API   │ │
│  │   App   │  │  Assets │  │ Routes │ │
│  └─────────┘  └─────────┘  └────────┘ │
└─────────────────────────────────────────┘
```

**Benefits:**
- Zero-config deployments
- Edge caching
- Automatic preview deployments

### 7.2 Future (API + Frontend)

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Vercel    │←────────│   API       │←────────│   OpenAI    │
│  (Frontend) │  REST   │  (Fastify/  │  REST   │   + Vector  │
│             │         │   Express)  │         │   Store     │
└─────────────┘         └─────────────┘         └─────────────┘
```

---

## 8. Technology Decisions

### 8.1 Why Next.js?
- App Router for server components (future AI layer)
- Built-in TypeScript support
- Vercel deployment integration
- File-based routing

### 8.2 Why No State Library?
- MVP scope is small (single page)
- Avoid over-engineering
- Easy to add Zustand/Redux later if needed

### 8.3 Why Deterministic Mock?
- Faster iteration (no API keys needed)
- Predictable demo scenarios
- Clear contract definition before AI integration

### 8.4 Why Markdown Policies?
- Version controlled (git history)
- Human-readable
- Easy to embed/chunk
- Non-technical stakeholders can edit

---

## 9. Performance Considerations

### 9.1 Current (MVP)
- No API calls (instant response)
- Static imports
- No database queries

### 9.2 Future Optimizations
- Policy embedding cache (build-time)
- Request deduplication (React Query/SWR)
- Streaming responses for AI layer
- Edge caching for common queries

---

## 10. Security Considerations

### 10.1 Data Handling
- Never store PII in logs (hashed IDs only)
- Request text sanitized before AI processing
- No database = no SQL injection risk (current)

### 10.2 AI Safety
- Temperature 0.2 (low randomness)
- Structured outputs (JSON mode)
- Guardrails layer validates all outputs
- Human review required for high-risk actions

### 10.3 Future (API Layer)
- Rate limiting (per user, per IP)
- Authentication (OAuth/SSO)
- Audit logging (who requested what, when)
- PII detection and redaction

---

## 11. Monitoring & Observability (Future)

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Request   │  │   Decision  │  │   Handoff   │
│   Volume    │  │   Accuracy  │  │   Success   │
│   (Grafana) │  │   (Evals)   │  │   (Alerts)  │
└─────────────┘  └─────────────┘  └─────────────┘
```

**Metrics:**
- Requests per day/hour
- Route distribution (% direct vs escalate)
- Eval pass rate over time
- Latency percentiles
- Error rates by component

---

## 12. Dual Audience UX

### 12.1 Product Concept

OpsGuard serves two distinct audiences with different needs:

**Employees (External):**
- Need clear, simple answers to HR questions
- Should not see sensitive peer data or internal processes
- Get safe escalation messages for sensitive requests
- See privacy notes when data is redacted

**HR/Ops Teams (Internal):**
- Need structured packets for case review and action
- See full reasoning, risk assessment, and policy citations
- Get draft actions and recommended assignments
- Require audit trails for compliance

### 12.2 Response Flow

```
User Request + Actor Context
        ↓
   Resolver Output
        ↓
   Response Builder
   ┌─────────────────┐
   │                 │
   ▼                 ▼
Employee        HR Review
Response         Packet
   │                 │
   └─────┬───────────┘
         ▼
    API Response
   (Both outputs)
```

### 12.3 UI Components

```
Center Column (Decision Panel)
├── View Mode Toggle
│   ├── Both Views (default)
│   ├── Employee View
│   └── HR View
├── EmployeeResponse
│   ├── Status Badge
│   ├── Message
│   ├── Next Steps
│   ├── Missing Fields
│   ├── Citations (filtered)
│   └── Privacy Note
└── HRReviewPacket
    ├── Risk/Route Badges
    ├── Context Summary
    ├── Recommended Owner
    ├── Reasoning
    ├── Draft Action
    ├── Citations (full)
    └── Access Control Notes
```

### 12.4 Data Transformations

**Employee Response Rules:**
- `answer_directly` + low risk = "answered" with explanation
- `ask_for_info` = "needs_more_info" with required fields
- `draft_action` + high risk = "sent_to_hr_review"
- `escalate` = "sent_to_hr_review"
- Access denied = "not_allowed"

**Citation Filtering:**
- Employees see non-sensitive citations only
- HR sees all citations for audit trail
- Payroll/compensation citations hidden from non-HR roles

---

## 13. RAG Pipeline

### 13.1 Pipeline Flow

```
Policy markdown files (policies/*.md)
        ↓
  Rule-level chunking (### XX-NN pattern)
  + metadata: domain, sensitivity, keywords,
    citationEligible, tokenEstimate
        ↓
  Deterministic hybrid scoring per query
  [lexical | title | domain | ruleBoost | sensitivityBoost]
        ↓
  Rank candidates by score
        ↓
  Context budget filter (max 1800 tokens)
        ↓
  Citation-eligible chunks only
        ↓
  Resolver (AI or deterministic)
  + system prompt with allowed rule IDs
        ↓
  Citation validation (only retrieved IDs allowed)
        ↓
  Safety overrides (always applied)
        ↓
  Dual audience response (Employee + HR)
```

### 13.2 Chunk Metadata Schema

Each `PolicyChunk` contains:

| Field | Type | Purpose |
|-------|------|---------|
| `chunkId` | string | Stable ID, equals `ruleId` |
| `chunkType` | `"policy_rule"` | Always rule-level |
| `ruleId` | string | Stable rule ID (TT-01, etc.) |
| `policyName` | string | Parent policy name |
| `sourceFile` | string | Source markdown file |
| `domain` | enum | vacation / payroll / time-tracking / remote-work / onboarding |
| `sensitivity` | low / medium / high | Data sensitivity level |
| `keywords` | string[] | Domain + title keywords |
| `citationEligible` | boolean | Whether AI may cite this chunk |
| `tokenEstimate` | number | Rough token count for budget |

### 13.3 Scoring Components

| Component | Description | Max contribution |
|-----------|-------------|-----------------|
| Lexical | Whole-word overlap between query tokens and chunk text | Unbounded |
| Title | Whole-word matches in rule title (higher signal) | 2× per match |
| Domain | Query keywords matching chunk's domain keyword list | 1.5 per match |
| Rule boost | Explicit boost for known query/rule patterns | +10 |
| Sensitivity boost | High-sensitivity chunks get extra weight for sensitive queries | +3 per sensitive term |

Whole-word matching prevents false positives (e.g. "over" from "carry over" matching "overtime").

### 13.4 Context Budget

- Default budget: **1800 tokens** per request
- Chunks are added in score order until budget is hit
- Excluded chunks are surfaced in `RetrievalDiagnostics.excludedForBudget`
- Budget leaves room for ~800 token AI output + system prompt overhead

### 13.5 Separation of Concerns

| Layer | Data source | Purpose |
|-------|-------------|---------|
| Policy retrieval | `policies/*.md` | Citation-eligible business rules for answer grounding |
| Enterprise context | `data/enterprise/` | Permissioned structured employee/payroll data for access control |

These two layers are intentionally separate: policy retrieval is about what rules apply; enterprise context is about who is asking and what data they can see.

### 13.6 Retrieval Evals

Location: `evals/retrieval-evals.json` (12 cases)
Runner: `evals/run-retrieval-evals.ts`
Command: `npm run eval:retrieval`

Metrics reported:
- **Recall@5** — fraction of expected rules retrieved (target: ≥ 90%)
- **Precision@5** — fraction of retrieved rules that are expected
- **MRR** — mean reciprocal rank of first expected rule
- **Forbidden violations** — sensitive rules retrieved for wrong queries (target: 0)
- **Avg context tokens** — budget utilization

Current results: Recall@5 = 100%, MRR = 0.958, 0 forbidden violations.

---

## 14. Confidence, Confidentiality, and Observability

### Confidence Model (`lib/confidence.ts`)

Confidence is separate from risk. Risk describes the stakes of the request; confidence describes how certain the system is about its own answer quality.

**Inputs → score (0–1):**
- `retrievalDiagnostics.retrievalConfidence`: high=+0.25, medium=+0.10, low=−0.20
- `citations.length`: ≥2 → +0.10, 1 → +0.05, 0 → −0.15
- `route + risk`: answer_directly + low risk → +0.10; ask_for_info → −0.10
- Fallback mode: AI failure → −0.10
- Access level: none → −0.10; redactions > 0 → −0.05

Labels: high (≥0.70), medium (0.45–0.69), low (<0.45)

**No-policy-found detection:** `isNoPolicyFound(label, citationCount, retrievalConf)` gates on all three signals. When true, the employee response changes title to "Policy Not Found" and redirects to HR contact. This prevents the system from producing confident-sounding answers on topics outside its policy KB.

**ConfidenceResult** is added to `ResolveResult` and passed through to `buildDualAudienceResponse` to enable response-level adaptation.

### Confidentiality Diagnostics (`lib/privacy/confidentiality.ts`)

Detects sensitive data categories in the query via regex pattern matching — no real employee data values are inspected or exposed.

**Categories:** `payroll`, `salary`, `compensation`, `bank_account`, `personal_identifier`, `cross_border`, `email`, `phone`, `address`

**Level rules:**
- `high`: payroll/salary/bank_account/compensation detected OR ≥3 redactions OR accessLevel=none
- `medium`: PII or cross-border keywords OR any redactions
- `low`: no sensitive signals

`restrictedFields` is inferred from the combination of detected categories and redaction count — not from actual data values.

### Observability Metadata (`lib/observability.ts`)

A per-request `ObservabilityMetadata` record is computed after resolution and included in both the API response and the UI ObservabilityPanel:

```typescript
interface ObservabilityMetadata {
  requestId: string;           // req_<timestamp36>_<rand5>
  createdAt: string;           // ISO 8601
  resolverMode: 'ai' | 'fallback' | 'deterministic';
  fallbackReason?: string;
  latencyMs: number;
  modelName?: string;          // only when resolverMode === 'ai'
  retrievalChunkCount: number;
  estimatedContextTokens: number;
  topRuleIds: string[];
  confidenceLabel: 'low' | 'medium' | 'high';
  confidentialityLevel: 'low' | 'medium' | 'high';
  redactionsApplied: number;
  requiresHumanReview: boolean;
  tokenUsageEstimate: {
    inputTokensEstimate: number;
    outputTokensEstimate: number;
    estimatedCostUsd: number;   // 0 for deterministic/fallback
  };
}
```

Token estimates: input = estimatedContextTokens + 200 (system prompt overhead), output = 200 (typical structured JSON). Cost uses published GPT-4o-mini rates; 0 for non-AI runs.

### Confidence Eval Suite (`evals/confidence-evals.json`)

8 deterministic eval cases covering:
- Out-of-domain queries (benefits, equity, legal) → expect low confidence + no-policy-found
- Maximally vague queries → expect low confidence, no overconfident violation
- Sensitive data access (colleague's salary) → expect escalation
- High-confidence known policies (vacation carryover) → expect high
- Medium-confidence cases (payroll cutoff, overtime correction)

Run: `npm run eval:confidence`

---

## 15. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0-mvp | June 2026 | Initial architecture for weekend MVP |
| 0.4.0 | June 2026 | Enterprise context and access control |
| 0.5.0 | June 2026 | Dual audience UX with employee/HR responses |
| 0.6.0 | June 2026 | RAG quality layer: metadata, context budget, retrieval evals |
| 0.7.0 | June 2026 | Confidence modeling, confidentiality diagnostics, observability metadata, no-policy-found handling, eval:confidence |
