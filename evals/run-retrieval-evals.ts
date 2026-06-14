#!/usr/bin/env node
/**
 * OpsGuard Retrieval Eval Runner
 *
 * Evaluates policy retrieval quality using rule-level chunking.
 * Metrics: Recall@K, Precision@K, MRR, forbidden violations.
 *
 * Deterministic only — does NOT call OpenAI.
 */

import { retrieveWithDiagnostics } from '../lib/policyRetrieval';
import * as fs from 'fs';
import * as path from 'path';

interface RetrievalEvalCase {
  id: string;
  query: string;
  expectedRuleIds: string[];
  forbiddenRuleIds?: string[];
  topK: number;
  notes?: string;
}

interface RetrievalEvalResult {
  id: string;
  query: string;
  expectedRuleIds: string[];
  forbiddenRuleIds: string[];
  retrievedRuleIds: string[];
  confidence: string;
  estimatedTokens: number;
  recallAtK: number;
  precisionAtK: number;
  reciprocalRank: number;
  forbiddenViolations: string[];
  pass: boolean;
  notes?: string;
}

function runRetrievalEval(evalCase: RetrievalEvalCase): RetrievalEvalResult {
  const { query, expectedRuleIds, forbiddenRuleIds = [], topK } = evalCase;

  const { chunks, diagnostics } = retrieveWithDiagnostics(query, {
    limit: topK,
    maxContextTokens: 1800,
    includeDiagnostics: true,
  });

  const retrievedRuleIds = chunks.map(c => c.ruleId);

  // Recall@K: fraction of expected rules that appear in retrieved
  const recallAtK = expectedRuleIds.length === 0
    ? 1 // vacuously true for ambiguous queries
    : expectedRuleIds.filter(id => retrievedRuleIds.includes(id)).length / expectedRuleIds.length;

  // Precision@K: fraction of retrieved rules that are expected (only meaningful when expected is non-empty)
  const precisionAtK = retrievedRuleIds.length === 0 || expectedRuleIds.length === 0
    ? expectedRuleIds.length === 0 ? 1 : 0
    : expectedRuleIds.filter(id => retrievedRuleIds.includes(id)).length / retrievedRuleIds.length;

  // MRR: reciprocal rank of first expected rule in results
  let reciprocalRank = 0;
  if (expectedRuleIds.length > 0) {
    for (let i = 0; i < retrievedRuleIds.length; i++) {
      if (expectedRuleIds.includes(retrievedRuleIds[i])) {
        reciprocalRank = 1 / (i + 1);
        break;
      }
    }
  } else {
    reciprocalRank = 1; // vacuous
  }

  // Forbidden violations
  const forbiddenViolations = forbiddenRuleIds.filter(id => retrievedRuleIds.includes(id));

  // Pass: recall == 1 AND no forbidden violations
  const pass = recallAtK === 1 && forbiddenViolations.length === 0;

  return {
    id: evalCase.id,
    query,
    expectedRuleIds,
    forbiddenRuleIds,
    retrievedRuleIds,
    confidence: diagnostics.retrievalConfidence,
    estimatedTokens: diagnostics.estimatedContextTokens,
    recallAtK,
    precisionAtK,
    reciprocalRank,
    forbiddenViolations,
    pass,
    notes: evalCase.notes,
  };
}

function generateReport(results: RetrievalEvalResult[]): void {
  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = total - passed;

  const avgRecall = results.reduce((s, r) => s + r.recallAtK, 0) / total;
  const avgPrecision = results.reduce((s, r) => s + r.precisionAtK, 0) / total;
  const avgMRR = results.reduce((s, r) => s + r.reciprocalRank, 0) / total;
  const avgTokens = Math.round(results.reduce((s, r) => s + r.estimatedTokens, 0) / total);
  const totalForbiddenViolations = results.reduce((s, r) => s + r.forbiddenViolations.length, 0);

  const confidenceCounts = results.reduce(
    (acc, r) => { acc[r.confidence] = (acc[r.confidence] || 0) + 1; return acc; },
    {} as Record<string, number>
  );

  console.log('\n' + '='.repeat(55));
  console.log('  OpsGuard Retrieval Eval Report');
  console.log('='.repeat(55));
  console.log(`  Total cases:            ${total}`);
  console.log(`  Passed:                 ${passed} / ${total}`);
  console.log(`  Failed:                 ${failed}`);
  console.log('');
  console.log(`  Recall@5:               ${(avgRecall * 100).toFixed(1)}%`);
  console.log(`  Precision@5:            ${(avgPrecision * 100).toFixed(1)}%`);
  console.log(`  MRR:                    ${avgMRR.toFixed(3)}`);
  console.log(`  Forbidden violations:   ${totalForbiddenViolations}`);
  console.log('');
  console.log(`  Avg context tokens:     ~${avgTokens} / 1800 budget`);
  console.log(`  Confidence dist:        high=${confidenceCounts['high'] || 0} medium=${confidenceCounts['medium'] || 0} low=${confidenceCounts['low'] || 0}`);
  console.log('='.repeat(55));

  // Per-case output
  console.log('\nDetailed Results:\n');
  for (const r of results) {
    const status = r.pass ? '✓ PASS' : '✗ FAIL';
    console.log(`  [${status}] ${r.id}`);
    console.log(`    Query:     ${r.query.slice(0, 70)}${r.query.length > 70 ? '…' : ''}`);
    console.log(`    Expected:  [${r.expectedRuleIds.join(', ') || 'any'}]`);
    console.log(`    Retrieved: [${r.retrievedRuleIds.join(', ')}]`);
    console.log(`    Recall:    ${(r.recallAtK * 100).toFixed(0)}%  |  Precision: ${(r.precisionAtK * 100).toFixed(0)}%  |  RR: ${r.reciprocalRank.toFixed(2)}`);
    console.log(`    Confidence: ${r.confidence}  |  ~${r.estimatedTokens} tokens`);
    if (r.forbiddenViolations.length > 0) {
      console.log(`    ⚠ Forbidden violations: [${r.forbiddenViolations.join(', ')}]`);
    }
    if (!r.pass && r.expectedRuleIds.length > 0) {
      const missing = r.expectedRuleIds.filter(id => !r.retrievedRuleIds.includes(id));
      if (missing.length > 0) {
        console.log(`    ✗ Missing: [${missing.join(', ')}]`);
      }
    }
    if (r.notes) {
      console.log(`    Notes: ${r.notes}`);
    }
    console.log('');
  }

  if (passed === total) {
    console.log('='.repeat(55));
    console.log('  ✓ All retrieval evals passed!');
    console.log('='.repeat(55));
  } else {
    console.log(`  ${failed} eval case(s) failed.`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const evalsPath = path.join(process.cwd(), 'evals', 'retrieval-evals.json');
  const evalCases: RetrievalEvalCase[] = JSON.parse(fs.readFileSync(evalsPath, 'utf-8'));

  console.log(`\nRunning ${evalCases.length} retrieval eval cases (deterministic, no OpenAI)...`);

  const results: RetrievalEvalResult[] = evalCases.map(runRetrievalEval);
  generateReport(results);
}

main().catch(err => {
  console.error('Retrieval eval runner failed:', err);
  process.exit(1);
});
