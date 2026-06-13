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

## License

MIT — Built for AI Product Engineer interviews and production inspiration.

---

**Built with ❤️ by Santi Nones** — *AI should route safely, not just answer blindly.*
