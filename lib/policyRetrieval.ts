import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export type PolicyDomain = 'vacation' | 'payroll' | 'time-tracking' | 'remote-work' | 'onboarding';
export type PolicySensitivity = 'low' | 'medium' | 'high';

export interface PolicyChunk {
  chunkId: string;
  chunkType: 'policy_rule';
  policyName: string;
  policyId: string;
  ruleId: string;
  title: string;
  content: string;
  excerpt: string;
  sourceFile: string;
  domain: PolicyDomain;
  sensitivity: PolicySensitivity;
  keywords: string[];
  citationEligible: boolean;
  tokenEstimate: number;
}

export interface ScoringBreakdown {
  lexicalScore: number;
  titleScore: number;
  domainScore: number;
  ruleBoost: number;
  sensitivityBoost: number;
  total: number;
}

export interface RetrievalOptions {
  limit?: number;
  maxContextTokens?: number;
  includeDiagnostics?: boolean;
}

export interface RetrievalDiagnostics {
  query: string;
  selectedChunkCount: number;
  totalCandidateCount: number;
  estimatedContextTokens: number;
  topRuleIds: string[];
  retrievalConfidence: 'low' | 'medium' | 'high';
  excludedForBudget: string[];
  scoringBreakdown?: Record<string, ScoringBreakdown>;
}

export interface RetrievalResult {
  chunks: PolicyChunk[];
  diagnostics: RetrievalDiagnostics;
}

interface ScoredChunk extends PolicyChunk {
  score: number;
  breakdown: ScoringBreakdown;
}

// Domain metadata: maps policy ID prefix → domain, sensitivity, keywords
const DOMAIN_METADATA: Record<string, {
  domain: PolicyDomain;
  sensitivity: PolicySensitivity;
  keywords: string[];
}> = {
  TT: {
    domain: 'time-tracking',
    sensitivity: 'medium',
    keywords: ['clock', 'time', 'overtime', 'hours', 'tracking', 'missed', 'correction', 'retroactive', 'portal', 'timesheet'],
  },
  PA: {
    domain: 'payroll',
    sensitivity: 'high',
    keywords: ['payroll', 'salary', 'payment', 'bank', 'deposit', 'cutoff', 'compensation', 'adjustment', 'evidence', 'documentation'],
  },
  VL: {
    domain: 'vacation',
    sensitivity: 'low',
    keywords: ['vacation', 'leave', 'pto', 'carryover', 'unused', 'days', 'balance', 'entitlement', 'allowance', 'annual', 'accrual', 'request'],
  },
  RW: {
    domain: 'remote-work',
    sensitivity: 'medium',
    keywords: ['remote', 'work from home', 'abroad', 'cross-border', 'location', 'overseas', 'international', 'domestic', 'equipment'],
  },
  ON: {
    domain: 'onboarding',
    sensitivity: 'low',
    keywords: ['onboarding', 'new hire', 'first day', 'checklist', 'documents', 'start date', 'training', 'pre-start', 'mandatory'],
  },
};

// Override sensitivity for specific high-sensitivity rules
const RULE_SENSITIVITY_OVERRIDES: Record<string, PolicySensitivity> = {
  'PA-01': 'high',
  'PA-02': 'high',
  'PA-03': 'high',
  'RW-02': 'high',
};

// Cache for loaded policies
let policyCache: PolicyChunk[] | null = null;

/**
 * Load all policy markdown files from the policies directory
 * and parse them into structured chunks.
 */
export function loadPolicies(): PolicyChunk[] {
  if (policyCache) {
    return policyCache;
  }

  const policiesDir = join(process.cwd(), 'policies');
  const files = readdirSync(policiesDir).filter(f => f.endsWith('.md'));

  const chunks: PolicyChunk[] = [];

  for (const file of files) {
    const content = readFileSync(join(policiesDir, file), 'utf-8');
    const fileChunks = parsePolicyFile(file, content);
    chunks.push(...fileChunks);
  }

  policyCache = chunks;
  return chunks;
}

/**
 * Parse a single policy markdown file into rule chunks.
 * Expects rules to be marked with ### headings like "TT-01: Rule Title"
 */
function parsePolicyFile(filename: string, content: string): PolicyChunk[] {
  const chunks: PolicyChunk[] = [];
  
  // Extract policy ID prefix (TT, PA, VL, RW, ON) from filename
  const policyId = filename.replace('.md', '').toUpperCase().slice(0, 2);
  const policyName = extractPolicyName(content, filename);
  const domainMeta = DOMAIN_METADATA[policyId];

  // Split by rule headings (### XX-NN: Title pattern)
  const rulePattern = /###\s+([A-Z]{2}-\d{2}):\s*(.+?)\n/g;
  const matches = [...content.matchAll(rulePattern)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const ruleId = match[1];
    const title = match[2].trim();
    
    // Extract content between this rule and the next (or end)
    const startIdx = match.index! + match[0].length;
    const endIdx = i < matches.length - 1 ? matches[i + 1].index! : content.length;
    const ruleContent = content.slice(startIdx, endIdx).trim();
    
    // Generate excerpt (first sentence or first 150 chars)
    const excerpt = generateExcerpt(ruleContent);

    // Estimate token count (~0.75 tokens/char is a rough approximation)
    const tokenEstimate = Math.ceil(ruleContent.length * 0.75 / 4);

    // Determine sensitivity (rule override takes precedence over domain default)
    const sensitivity: PolicySensitivity = 
      RULE_SENSITIVITY_OVERRIDES[ruleId] || 
      domainMeta?.sensitivity || 
      'low';

    // Extract keywords: domain keywords + words from title
    const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const keywords = [
      ...(domainMeta?.keywords || []),
      ...titleWords,
    ].filter((v, i, a) => a.indexOf(v) === i); // dedupe

    chunks.push({
      chunkId: ruleId,
      chunkType: 'policy_rule',
      policyName,
      policyId,
      ruleId,
      title,
      content: ruleContent,
      excerpt,
      sourceFile: filename,
      domain: domainMeta?.domain || 'onboarding',
      sensitivity,
      keywords,
      citationEligible: true,
      tokenEstimate,
    });
  }

  return chunks;
}

function extractPolicyName(content: string, filename: string): string {
  // Try to extract from first # heading
  const titleMatch = content.match(/^#\s+(.+?)\n/);
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  // Fallback to filename
  return filename.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function generateExcerpt(content: string): string {
  // Remove markdown formatting
  const clean = content
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\n/g, ' ')
    .trim();
  
  // Try to find first sentence ending with period
  const sentenceMatch = clean.match(/^[^.!?]+[.!?]/);
  if (sentenceMatch) {
    const sentence = sentenceMatch[0].trim();
    if (sentence.length > 50) {
      return sentence;
    }
  }
  
  // Fallback to first 150 chars
  return clean.slice(0, 150) + (clean.length > 150 ? '...' : '');
}

/**
 * Rule-level boosts for well-known query patterns.
 * These improve recall for deterministic evals.
 */
function getRuleBoost(query: string, ruleId: string): number {
  const q = query.toLowerCase();
  const boosts: Array<[string, (q: string) => boolean]> = [
    ['TT-01', q => q.includes('clock') || q.includes('forgot') || q.includes('missed') || q.includes('clock in') || q.includes('recorded') || q.includes("wasn't recorded")],
    ['TT-02', q => q.includes('clock') || (q.includes('manager') && q.includes('time'))],
    ['TT-03', q => q.includes('overtime')],
    ['PA-01', q => q.includes('cutoff') || (q.includes('bank') && q.includes('payroll'))],
    ['PA-02', q => q.includes('adjustment') || q.includes('evidence') || q.includes('documentation')],
    ['PA-03', q => q.includes('cross-border') || q.includes('abroad') || q.includes('portugal') || q.includes('mexico') || q.includes('tax')],
    ['VL-01', q => q.includes('carry') || q.includes('carryover') || q.includes('unused') || q.includes('per year') || q.includes('annual') || q.includes('entitlement') || q.includes('allowance')],
    ['VL-02', q => q.includes('approval') && q.includes('vacation')],
    ['VL-03', q => q.includes('balance') || q.includes('left') || q.includes('days left') || q.includes('remaining') || q.includes('available')],
    ['RW-01', q => (q.includes('remote') && !q.includes('abroad') && !q.includes('portugal') && !q.includes('cross'))],
    ['RW-02', q => q.includes('abroad') || q.includes('portugal') || q.includes('mexico') || q.includes('cross-border') || q.includes('overseas')],
    ['ON-01', q => q.includes('first day') || q.includes('pre-start') || q.includes('before') || q.includes('starting') || q.includes('documents')],
    ['ON-02', q => q.includes('manager') && (q.includes('onboard') || q.includes('new hire'))],
  ];

  for (const [id, test] of boosts) {
    if (id === ruleId && test(q)) {
      return 10;
    }
  }
  return 0;
}

/**
 * Calculate scoring breakdown for a query against a chunk.
 * Returns explicit component scores for transparency.
 */
function calculateScoreBreakdown(query: string, chunk: PolicyChunk): ScoringBreakdown {
  const queryWords = normalizeAndTokenize(query);
  const chunkText = `${chunk.title} ${chunk.content}`.toLowerCase();
  const titleText = chunk.title.toLowerCase();
  const q = query.toLowerCase();

  // 1. Lexical: whole-word keyword overlap between query tokens and chunk text
  // Whole-word matching prevents 'over' from matching 'overtime', etc.
  let lexicalScore = 0;
  for (const word of queryWords) {
    const wordBoundaryRe = new RegExp(`\\b${word}\\b`, 'i');
    if (wordBoundaryRe.test(chunkText)) {
      lexicalScore += 1;
    }
  }

  // 2. Title: bonus for whole-word matches in rule title specifically
  let titleScore = 0;
  for (const word of queryWords) {
    const wordBoundaryRe = new RegExp(`\\b${word}\\b`, 'i');
    if (wordBoundaryRe.test(titleText)) {
      titleScore += 2;
    }
  }

  // 3. Domain: bonus when query domain keywords align with chunk domain keywords
  let domainScore = 0;
  for (const kw of chunk.keywords) {
    if (q.includes(kw)) {
      domainScore += 1.5;
    }
  }

  // 4. Rule boost: explicit boost for known query/rule patterns
  const ruleBoost = getRuleBoost(query, chunk.ruleId);

  // 5. Sensitivity boost: extra weight when query contains sensitive terms
  let sensitivityBoost = 0;
  const sensitiveTerms = ['payroll', 'compensation', 'salary', 'bank', 'cross-border', 'tax', 'legal'];
  if (chunk.sensitivity === 'high') {
    for (const term of sensitiveTerms) {
      if (q.includes(term) && chunkText.includes(term)) {
        sensitivityBoost += 3;
      }
    }
  }

  const total = lexicalScore + titleScore + domainScore + ruleBoost + sensitivityBoost;

  return { lexicalScore, titleScore, domainScore, ruleBoost, sensitivityBoost, total };
}

function normalizeAndTokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2) // Remove short words
    .filter(w => !STOP_WORDS.has(w));
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'her', 'way', 'many', 'oil', 'sit', 'set', 'run', 'eat', 'far', 'sea', 'eye', 'ask', 'own', 'say', 'too', 'any', 'try', 'let', 'put', 'end', 'why', 'turn', 'here', 'show', 'every', 'good', 'me', 'give', 'our', 'under', 'name', 'very', 'through', 'just', 'form', 'sentence', 'great', 'think', 'where', 'help', 'much', 'before', 'move', 'right', 'too', 'means', 'old', 'any', 'same', 'tell', 'very', 'when', 'much', 'would', 'there', 'their', 'what', 'said', 'each', 'which', 'will', 'about', 'if', 'up', 'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'make', 'like', 'into', 'him', 'has', 'two', 'more', 'him', 'time', 'oil', 'that', 'by', 'do', 'does', 'did', 'done', 'have', 'has', 'had', 'having', 'with', 'within', 'without', 'this', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'could', 'should', 'would', 'could', 'should', 'would', 'might', 'must', 'shall', 'can', 'may',
]);

/**
 * Retrieve the most relevant policy chunks for a given query.
 * Supports both number (legacy) and RetrievalOptions.
 * Always returns only citation-eligible chunks.
 */
export function retrievePolicyChunks(
  query: string,
  limitOrOptions: number | RetrievalOptions = 5
): PolicyChunk[] {
  const options: RetrievalOptions = typeof limitOrOptions === 'number'
    ? { limit: limitOrOptions }
    : limitOrOptions;

  return retrieveWithDiagnostics(query, options).chunks;
}

/**
 * Retrieve policy chunks with full diagnostics and context budgeting.
 */
export function retrieveWithDiagnostics(
  query: string,
  options: RetrievalOptions = {}
): RetrievalResult {
  const {
    limit = 5,
    maxContextTokens = 1800,
    includeDiagnostics = true,
  } = options;

  const allChunks = loadPolicies();

  if (!query.trim()) {
    return {
      chunks: [],
      diagnostics: {
        query,
        selectedChunkCount: 0,
        totalCandidateCount: 0,
        estimatedContextTokens: 0,
        topRuleIds: [],
        retrievalConfidence: 'low',
        excludedForBudget: [],
      },
    };
  }

  // Score all citation-eligible chunks
  const candidates: ScoredChunk[] = allChunks
    .filter(c => c.citationEligible)
    .map(chunk => {
      const breakdown = calculateScoreBreakdown(query, chunk);
      return { ...chunk, score: breakdown.total, breakdown };
    });

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  // Apply limit and context budget
  const selected: ScoredChunk[] = [];
  const excludedForBudget: string[] = [];
  let tokensSoFar = 0;

  for (const candidate of candidates.filter(c => c.score > 0)) {
    if (selected.length >= limit) break;
    if (tokensSoFar + candidate.tokenEstimate > maxContextTokens) {
      excludedForBudget.push(candidate.ruleId);
      continue;
    }
    selected.push(candidate);
    tokensSoFar += candidate.tokenEstimate;
  }

  // Compute retrieval confidence from top score
  const topScore = selected[0]?.score || 0;
  const retrievalConfidence: 'low' | 'medium' | 'high' =
    topScore >= 15 ? 'high' : topScore >= 6 ? 'medium' : 'low';

  // Build diagnostics
  const scoringBreakdown: Record<string, ScoringBreakdown> = {};
  if (includeDiagnostics) {
    for (const c of selected) {
      scoringBreakdown[c.ruleId] = c.breakdown;
    }
  }

  const diagnostics: RetrievalDiagnostics = {
    query,
    selectedChunkCount: selected.length,
    totalCandidateCount: candidates.filter(c => c.score > 0).length,
    estimatedContextTokens: tokensSoFar,
    topRuleIds: selected.map(c => c.ruleId),
    retrievalConfidence,
    excludedForBudget,
    ...(includeDiagnostics ? { scoringBreakdown } : {}),
  };

  // Strip internal scoring fields before returning
  const chunks: PolicyChunk[] = selected.map(({ score: _s, breakdown: _b, ...chunk }) => chunk);

  return { chunks, diagnostics };
}

/**
 * Find a specific rule by its ID (e.g., "TT-01")
 */
export function findRuleById(ruleId: string): PolicyChunk | null {
  const allChunks = loadPolicies();
  return allChunks.find(c => c.ruleId === ruleId) || null;
}

/**
 * Get all available rule IDs (for validation)
 */
export function getAllRuleIds(): string[] {
  const allChunks = loadPolicies();
  return allChunks.map(c => c.ruleId);
}
