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

**Milestone 1 Complete:** Frontend MVP with deterministic mock logic

- ✅ Premium internal-tool UI
- ✅ 4 example scenarios with mock classification
- ✅ Risk badges and workflow visualization
- ✅ Copy-to-clipboard for handoff

## Next Milestone

**Milestone 2:** Real AI + Retrieval

- [ ] OpenAI API integration (GPT-4 with structured outputs)
- [ ] Policy retrieval layer (vector DB or keyword search)
- [ ] Eval runner with pass/fail reporting
- [ ] Confidence scoring improvements
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
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## License

MIT — Built for AI Product Engineer interviews and production inspiration.

---

**Built with ❤️ by Santi Nones** — *AI should route safely, not just answer blindly.*
