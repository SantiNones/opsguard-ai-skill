#!/usr/bin/env node
/**
 * OpsGuard Eval Runner
 * 
 * Runs evaluation cases against the resolveOpsRequest function
 * and generates a terminal report with pass/fail metrics.
 * 
 * By default, evals run in deterministic mode to avoid OpenAI costs.
 * To run with AI mode: USE_AI=true npm run eval
 */

import { resolveOpsRequest } from '../lib/resolveOpsRequest';
import { RiskLevel, Route } from '../lib/types';
import * as fs from 'fs';
import * as path from 'path';

// Detect eval mode
const useAI = process.env.USE_AI === 'true';
const evalMode = useAI ? 'AI' : 'Deterministic';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface EvalCase {
  id: string;
  input: string;
  expectedRoute: Route;
  expectedRiskLevel: RiskLevel;
  mustRequireHumanReview: boolean;
  mustCiteRuleIds: string[];
  notes?: string;
}

interface EvalResult {
  caseId: string;
  passed: boolean;
  routeMatch: boolean;
  riskMatch: boolean;
  reviewMatch: boolean;
  citationsMatch: boolean;
  actualRoute: Route;
  actualRisk: RiskLevel;
  actualReview: boolean;
  missingCitations: string[];
  extraCitations: string[];
  processingTimeMs: number;
  mode: 'ai' | 'fallback';
  fallbackReason?: string;
  errors: string[];
}

interface EvalSuite {
  metadata: {
    version: string;
    description: string;
  };
  cases: EvalCase[];
}

/**
 * Load eval cases from JSON file
 */
function loadEvalCases(): EvalCase[] {
  const evalPath = path.join(process.cwd(), 'evals', 'ops-evals.json');
  
  if (!fs.existsSync(evalPath)) {
    console.error(`${colors.red}Error: Eval file not found at ${evalPath}${colors.reset}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(evalPath, 'utf-8');
  const suite: EvalSuite = JSON.parse(content);
  
  return suite.cases;
}

/**
 * Run a single eval case
 */
async function runEvalCase(testCase: EvalCase): Promise<EvalResult> {
  const errors: string[] = [];
  
  try {
    const result = await resolveOpsRequest(testCase.input);
    const output = result.output;
    
    // Check route match
    const routeMatch = output.route === testCase.expectedRoute;
    if (!routeMatch) {
      errors.push(`Route: expected "${testCase.expectedRoute}", got "${output.route}"`);
    }
    
    // Check risk match
    const riskMatch = output.risk === testCase.expectedRiskLevel;
    if (!riskMatch) {
      errors.push(`Risk: expected "${testCase.expectedRiskLevel}", got "${output.risk}"`);
    }
    
    // Check review requirement
    const reviewMatch = output.needsReview === testCase.mustRequireHumanReview;
    if (!reviewMatch) {
      errors.push(`Review: expected ${testCase.mustRequireHumanReview}, got ${output.needsReview}`);
    }
    
    // Check citations
    const actualRuleIds = output.citations.map(c => c.code);
    const missingCitations = testCase.mustCiteRuleIds.filter(
      required => !actualRuleIds.includes(required)
    );
    const extraCitations = actualRuleIds.filter(
      actual => !testCase.mustCiteRuleIds.includes(actual)
    );
    const citationsMatch = missingCitations.length === 0;
    
    if (missingCitations.length > 0) {
      errors.push(`Missing citations: ${missingCitations.join(', ')}`);
    }
    
    const passed = routeMatch && riskMatch && reviewMatch && citationsMatch;
    
    return {
      caseId: testCase.id,
      passed,
      routeMatch,
      riskMatch,
      reviewMatch,
      citationsMatch,
      actualRoute: output.route,
      actualRisk: output.risk,
      actualReview: output.needsReview,
      missingCitations,
      extraCitations,
      processingTimeMs: result.processingTimeMs,
      mode: result.mode,
      fallbackReason: result.fallbackReason,
      errors,
    };
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    errors.push(`Exception: ${errorMessage}`);
    
    return {
      caseId: testCase.id,
      passed: false,
      routeMatch: false,
      riskMatch: false,
      reviewMatch: false,
      citationsMatch: false,
      actualRoute: 'escalate' as Route, // Fallback
      actualRisk: 'high' as RiskLevel, // Fallback
      actualReview: true,
      missingCitations: testCase.mustCiteRuleIds,
      extraCitations: [],
      processingTimeMs: 0,
      mode: 'fallback',
      fallbackReason: errorMessage,
      errors,
    };
  }
}

/**
 * Generate terminal report
 */
function generateReport(results: EvalResult[], cases: EvalCase[]): number {
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  
  // Calculate metrics by dimension
  const routeAccuracy = results.filter(r => r.routeMatch).length / total;
  const riskAccuracy = results.filter(r => r.riskMatch).length / total;
  const reviewAccuracy = results.filter(r => r.reviewMatch).length / total;
  const citationAccuracy = results.filter(r => r.citationsMatch).length / total;
  
  // Average processing time
  const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTimeMs, 0) / total;
  
  // Print header
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.bright}${colors.cyan}OpsGuard Eval Runner${colors.reset}`);
  console.log(`${colors.dim}Version: 0.3.0 | Mode: ${evalMode}${colors.reset}`);
  if (useAI) {
    console.log(`${colors.yellow}⚠ Running in AI mode (costs apply)${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ Running in deterministic mode (no costs)${colors.reset}`);
  }
  console.log('='.repeat(70) + '\n');
  
  // Print summary
  console.log(`${colors.bright}Summary${colors.reset}`);
  console.log('-'.repeat(50));
  
  const passColor = failed === 0 ? colors.green : failed > total * 0.3 ? colors.red : colors.yellow;
  
  console.log(`Total Cases:     ${total}`);
  console.log(`${passColor}Passed:          ${passed}${colors.reset}`);
  console.log(`${failed > 0 ? colors.red : colors.green}Failed:          ${failed}${colors.reset}`);
  console.log(`Success Rate:    ${(passed / total * 100).toFixed(1)}%`);
  console.log(`Avg Latency:     ${avgProcessingTime.toFixed(1)}ms`);
  console.log();
  
  // Print accuracy breakdown
  console.log(`${colors.bright}Accuracy Breakdown${colors.reset}`);
  console.log('-'.repeat(50));
  
  const routeColor = routeAccuracy >= 0.9 ? colors.green : routeAccuracy >= 0.7 ? colors.yellow : colors.red;
  const riskColor = riskAccuracy >= 0.9 ? colors.green : riskAccuracy >= 0.7 ? colors.yellow : colors.red;
  const reviewColor = reviewAccuracy >= 0.9 ? colors.green : reviewAccuracy >= 0.7 ? colors.yellow : colors.red;
  const citationColor = citationAccuracy >= 0.9 ? colors.green : citationAccuracy >= 0.7 ? colors.yellow : colors.red;
  
  console.log(`Route Accuracy:  ${routeColor}${(routeAccuracy * 100).toFixed(0)}%${colors.reset} (${results.filter(r => r.routeMatch).length}/${total})`);
  console.log(`Risk Accuracy:   ${riskColor}${(riskAccuracy * 100).toFixed(0)}%${colors.reset} (${results.filter(r => r.riskMatch).length}/${total})`);
  console.log(`Review Safety:   ${reviewColor}${(reviewAccuracy * 100).toFixed(0)}%${colors.reset} (${results.filter(r => r.reviewMatch).length}/${total})`);
  console.log(`Citation Recall: ${citationColor}${(citationAccuracy * 100).toFixed(0)}%${colors.reset} (${results.filter(r => r.citationsMatch).length}/${total})`);
  
  // Fallback stats (only relevant in AI mode)
  if (useAI) {
    const fallbackCount = results.filter(r => r.mode === 'fallback').length;
    const fallbackRate = fallbackCount / total;
    const fallbackColor = fallbackRate > 0.3 ? colors.yellow : colors.green;
    console.log(`Fallback Rate:   ${fallbackColor}${(fallbackRate * 100).toFixed(0)}%${colors.reset} (${fallbackCount}/${total})`);
  }
  console.log();
  
  // Print individual results
  console.log(`${colors.bright}Detailed Results${colors.reset}`);
  console.log('-'.repeat(50));
  
  for (const result of results) {
    const statusColor = result.passed ? colors.green : colors.red;
    const statusIcon = result.passed ? '✓' : '✗';
    
    console.log(`\n${statusColor}${statusIcon} ${result.caseId}${colors.reset}`);
    
    // Show expected vs actual
    const caseInfo = cases.find(c => c.id === result.caseId);
    if (caseInfo) {
      console.log(`  Input: ${caseInfo.input.slice(0, 60)}${caseInfo.input.length > 60 ? '...' : ''}`);
    }
    
    console.log(`  Route:  ${result.routeMatch ? colors.green : colors.red}${result.actualRoute}${colors.reset} (expected: ${caseInfo?.expectedRoute})`);
    console.log(`  Risk:   ${result.riskMatch ? colors.green : colors.red}${result.actualRisk}${colors.reset} (expected: ${caseInfo?.expectedRiskLevel})`);
    console.log(`  Review: ${result.reviewMatch ? colors.green : colors.red}${result.actualReview}${colors.reset} (expected: ${caseInfo?.mustRequireHumanReview})`);
    
    if (result.missingCitations.length > 0) {
      console.log(`  ${colors.red}Missing citations: ${result.missingCitations.join(', ')}${colors.reset}`);
    }
    
    if (result.extraCitations.length > 0) {
      console.log(`  ${colors.yellow}Extra citations: ${result.extraCitations.join(', ')}${colors.reset}`);
    }
    
    console.log(`  Latency: ${result.processingTimeMs}ms`);
    
    if (useAI) {
      const modeColor = result.mode === 'ai' ? colors.green : colors.yellow;
      console.log(`  Mode:   ${modeColor}${result.mode}${colors.reset}${result.fallbackReason ? ` (${result.fallbackReason})` : ''}`);
    }
    
    if (result.errors.length > 0) {
      console.log(`  ${colors.red}Errors:${colors.reset}`);
      for (const error of result.errors) {
        console.log(`    - ${error}`);
      }
    }
  }
  
  // Print footer
  console.log('\n' + '='.repeat(70));
  
  if (failed === 0) {
    console.log(`${colors.green}${colors.bright}✓ All evals passed!${colors.reset}`);
  } else if (failed <= total * 0.2) {
    console.log(`${colors.yellow}⚠ ${failed} eval(s) failed. Review recommended.${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ ${failed} eval(s) failed. Significant issues detected.${colors.reset}`);
  }
  
  console.log('='.repeat(70) + '\n');
  
  // Return exit code based on pass rate
  const passRate = passed / total;
  return passRate >= 0.8 ? 0 : 1;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log('\nLoading eval cases...');
  const cases = loadEvalCases();
  console.log(`Found ${cases.length} eval cases\n`);
  
  console.log('Running evals...\n');
  const results: EvalResult[] = [];
  
  for (let i = 0; i < cases.length; i++) {
    const testCase = cases[i];
    process.stdout.write(`  [${i + 1}/${cases.length}] ${testCase.id}... `);
    
    const result = await runEvalCase(testCase);
    results.push(result);
    
    const status = result.passed 
      ? `${colors.green}PASS${colors.reset}` 
      : `${colors.red}FAIL${colors.reset}`;
    process.stdout.write(`${status}\n`);
  }
  
  const exitCode = generateReport(results, cases);
  process.exit(exitCode);
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { runEvalCase, loadEvalCases, generateReport };
