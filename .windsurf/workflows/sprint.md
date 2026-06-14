---
description: OpsGuard sprint workflow — branch, implement, quality gate, PR summary, await merge approval
---

## Sprint Workflow

### 1. Start a feature branch
```bash
git checkout main && git pull
git checkout -b sprint/<name>   # e.g. sprint/7-policy-coverage
```

### 2. Implement sprint scope
- Stay within the requested sprint scope only.
- Do not commit `.env.local` or any secrets.
- Do not weaken safety rules, access-control rules, or eval expectations unless explicitly instructed.

### 3. Run quality gates (in order)
```bash
npm run lint
npm run build
USE_AI=false npm run eval
npm run eval:retrieval          # only if evals/run-retrieval-evals.ts exists
```
All gates must pass before proceeding. Do not re-run `USE_AI=true` eval repeatedly.

### 4. Commit to feature branch
```bash
git add -A
git commit -m "feat: <sprint description>"
git push -u origin sprint/<name>
```
**Do NOT push to main** unless the user explicitly says so.

### 5. Provide PR-style summary
Before merging, output a summary covering:
- Files changed and why
- Quality gate results (lint / build / eval / retrieval eval)
- Any deliberate trade-offs or deferred items
- Merge command (do not run it yet)

### 6. Wait for approval
Do not merge to main until the user explicitly approves.

### Approved merge (only after explicit approval)
```bash
git checkout main
git merge --no-ff sprint/<name>
git push
```

---

## Commands Requiring Explicit User Approval
Do not run these without an explicit "yes, run it":

- `rm -rf`
- `git reset --hard`
- `git clean -fd`
- `npm audit fix --force`
- Deleting major folders or files
- Changing the package manager
- Modifying `.env` files
- Changing eval expectations (pass thresholds, expected routes, citations)
- Weakening safety or access-control rules
- Pushing directly to `main`
