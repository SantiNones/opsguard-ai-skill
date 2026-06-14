#!/usr/bin/env node
/**
 * OpsGuard Confidence Eval Runner
 *
 * Runs confidence model evaluation cases deterministically (no OpenAI calls).
 * Tests: confidence label accuracy, no-policy-found detection,
 * overconfident answer violations, sensitive escalation accuracy.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as fs from 'fs';
import * as path from 'path';
import { resolveOpsRequest } from '../lib/resolveOpsRequest';
import { isNoPolicyFound } from '../lib/confidence';

// ── Types ──────────────────────────────────────────────────────────────────

interface ConfidenceEvalCase {
  id: string;
  query: string;
  expectedConfidenceLabel: 'low' | 'medium' | 'high';
  expectNoPolicyFound: boolean;
  expectOverconfidentViolation: boolean;
  expectSensitiveEscalation: boolean;
  notes?: string;
}

interface ConfidenceEvalResult {
  id: string;
  passed: boolean;
  confidenceLabelMatch: boolean;
  noPolicyFoundAccurate: boolean;
  overconfidentViolation: boolean;
  sensitiveEscalationAccurate: boolean;
  actualLabel: 'low' | 'medium' | 'high';
  actualNoPolicyFound: boolean;
  actualEscalated: boolean;
  errors: string[];
}

// ── ANSI colours ──────────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

// ── Load cases ────────────────────────────────────────────────────────────

function loadCases(): ConfidenceEvalCase[] {
  const p = path.join(process.cwd(), 'evals', 'confidence-evals.json');
  if (!fs.existsSync(p)) {
    console.error(`${c.red}Error: confidence-evals.json not found at ${p}${c.reset}`);
    process.exit(1);
  }
  const suite = JSON.parse(fs.readFileSync(p, 'utf-8'));
  return suite.cases as ConfidenceEvalCase[];
}

// ── Run single case ───────────────────────────────────────────────────────

async function runCase(tc: ConfidenceEvalCase): Promise<ConfidenceEvalResult> {
  const errors: string[] = [];

  try {
    const result = await resolveOpsRequest(tc.query);
    const { output, confidence, retrievalDiagnostics } = result;

    const actualLabel = confidence?.confidenceLabel ?? 'low';
    const actualNoPolicyFound = isNoPolicyFound(
      actualLabel,
      output.citations.length,
      retrievalDiagnostics?.retrievalConfidence
    );

    // 1. Confidence label accuracy (allow one level off for edge cases)
    const labelOrder = ['low', 'medium', 'high'];
    const expectedIdx = labelOrder.indexOf(tc.expectedConfidenceLabel);
    const actualIdx = labelOrder.indexOf(actualLabel);
    const confidenceLabelMatch = Math.abs(expectedIdx - actualIdx) <= 1;
    if (!confidenceLabelMatch) {
      errors.push(`Confidence: expected "${tc.expectedConfidenceLabel}", got "${actualLabel}"`);
    }

    // 2. No-policy-found accuracy
    const noPolicyFoundAccurate = tc.expectNoPolicyFound === actualNoPolicyFound;
    if (!noPolicyFoundAccurate) {
      errors.push(`No-policy-found: expected ${tc.expectNoPolicyFound}, got ${actualNoPolicyFound}`);
    }

    // 3. Overconfident answer violation
    // A violation = low-confidence case producing answer_directly with no citations
    const overconfidentViolation =
      tc.expectOverconfidentViolation === false &&
      actualLabel === 'low' &&
      output.route === 'answer_directly' &&
      output.citations.length === 0;
    if (overconfidentViolation) {
      errors.push('Overconfident violation: low-confidence with answer_directly and no citations');
    }

    // 4. Sensitive escalation accuracy
    const actualEscalated =
      output.route === 'escalate' || output.route === 'ask_for_info';
    const sensitiveEscalationAccurate =
      !tc.expectSensitiveEscalation || actualEscalated;
    if (!sensitiveEscalationAccurate) {
      errors.push(`Sensitive escalation: expected escalate/ask_for_info, got "${output.route}"`);
    }

    const passed =
      confidenceLabelMatch &&
      noPolicyFoundAccurate &&
      !overconfidentViolation &&
      sensitiveEscalationAccurate;

    return {
      id: tc.id,
      passed,
      confidenceLabelMatch,
      noPolicyFoundAccurate,
      overconfidentViolation,
      sensitiveEscalationAccurate,
      actualLabel,
      actualNoPolicyFound,
      actualEscalated,
      errors,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    errors.push(`Exception: ${msg}`);
    return {
      id: tc.id,
      passed: false,
      confidenceLabelMatch: false,
      noPolicyFoundAccurate: false,
      overconfidentViolation: false,
      sensitiveEscalationAccurate: false,
      actualLabel: 'low',
      actualNoPolicyFound: false,
      actualEscalated: false,
      errors,
    };
  }
}

// ── Report ────────────────────────────────────────────────────────────────

function report(results: ConfidenceEvalResult[], cases: ConfidenceEvalCase[]): number {
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;

  const labelAccuracy = results.filter(r => r.confidenceLabelMatch).length / total;
  const noPolicyAccuracy = results.filter(r => r.noPolicyFoundAccurate).length / total;
  const overconfidentViolations = results.filter(r => r.overconfidentViolation).length;
  const sensitiveAccuracy = results.filter(r => r.sensitiveEscalationAccurate).length / total;

  console.log('\n' + '='.repeat(56));
  console.log(`${c.bright}${c.cyan}OpsGuard Confidence Eval Report${c.reset}`);
  console.log(`${c.dim}Deterministic mode — no OpenAI calls${c.reset}`);
  console.log('='.repeat(56));

  const passClr = failed === 0 ? c.green : c.red;
  console.log(`\nTotal cases:            ${total}`);
  console.log(`${passClr}  Passed:               ${passed} / ${total}${c.reset}`);
  console.log(`  Failed:               ${failed}`);
  console.log();
  console.log(`  Confidence accuracy:  ${(labelAccuracy * 100).toFixed(0)}%`);
  console.log(`  No-policy accuracy:   ${(noPolicyAccuracy * 100).toFixed(0)}%`);
  console.log(`  Sensitive escalation: ${(sensitiveAccuracy * 100).toFixed(0)}%`);
  console.log(`${overconfidentViolations > 0 ? c.red : c.green}  Overconfident violations: ${overconfidentViolations}${c.reset}`);

  console.log('\n' + '='.repeat(56));
  console.log(`${c.bright}Detailed Results:${c.reset}`);

  for (const r of results) {
    const tc = cases.find(x => x.id === r.id)!;
    const icon = r.passed ? `${c.green}✓ PASS${c.reset}` : `${c.red}✗ FAIL${c.reset}`;
    console.log(`\n  [${icon}] ${r.id}`);
    console.log(`    Query:     ${tc.query.slice(0, 60)}${tc.query.length > 60 ? '…' : ''}`);
    console.log(`    Confidence: ${r.actualLabel} (expected: ${tc.expectedConfidenceLabel})`);
    console.log(`    No-policy:  ${r.actualNoPolicyFound} (expected: ${tc.expectNoPolicyFound})`);
    console.log(`    Escalated:  ${r.actualEscalated}`);
    if (r.errors.length > 0) {
      for (const e of r.errors) console.log(`    ${c.red}✗ ${e}${c.reset}`);
    }
  }

  console.log('\n' + '='.repeat(56));
  if (failed === 0) {
    console.log(`${c.green}${c.bright}✓ All confidence evals passed!${c.reset}`);
  } else {
    console.log(`${c.red}✗ ${failed} confidence eval(s) failed.${c.reset}`);
  }
  console.log('='.repeat(56) + '\n');

  return failed === 0 ? 0 : 1;
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\nRunning 8 confidence eval cases (deterministic, no OpenAI)...');
  const cases = loadCases();
  const results: ConfidenceEvalResult[] = [];

  for (const tc of cases) {
    process.stdout.write(`  ${tc.id}... `);
    const r = await runCase(tc);
    results.push(r);
    const status = r.passed ? `${c.green}PASS${c.reset}` : `${c.red}FAIL${c.reset}`;
    process.stdout.write(`${status}\n`);
  }

  const exitCode = report(results, cases);
  process.exit(exitCode);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
