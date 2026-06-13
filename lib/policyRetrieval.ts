import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export interface PolicyChunk {
  policyName: string;
  policyId: string;
  ruleId: string;
  title: string;
  content: string;
  excerpt: string;
}

interface ScoredChunk extends PolicyChunk {
  score: number;
}

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
  
  // Extract policy ID and name from frontmatter or filename
  const policyId = filename.replace('.md', '').toUpperCase().slice(0, 2);
  const policyName = extractPolicyName(content, filename);

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

    chunks.push({
      policyName,
      policyId,
      ruleId,
      title,
      content: ruleContent,
      excerpt,
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
 * Calculate keyword overlap score between query and chunk.
 * Simple deterministic scoring - easy to replace with embeddings later.
 */
function calculateScore(query: string, chunk: PolicyChunk): number {
  const queryWords = normalizeAndTokenize(query);
  const chunkText = `${chunk.title} ${chunk.content}`.toLowerCase();
  
  let score = 0;
  
  for (const word of queryWords) {
    // Exact word match
    if (chunkText.includes(word)) {
      score += 1;
      
      // Bonus if in title
      if (chunk.title.toLowerCase().includes(word)) {
        score += 2;
      }
      
      // Bonus if in rule ID (e.g., "TT-01" matches "clock" queries)
      const ruleTypeMatches: Record<string, string[]> = {
        'TT': ['clock', 'time', 'overtime', 'hours', 'tracking'],
        'PA': ['payroll', 'salary', 'payment', 'bank', 'deposit', 'cutoff'],
        'VL': ['vacation', 'leave', 'PTO', 'time off', 'carryover'],
        'RW': ['remote', 'work from home', 'abroad', 'cross-border', 'location'],
        'ON': ['onboarding', 'new hire', 'start date', 'first day'],
      };
      
      const prefix = chunk.ruleId.slice(0, 2);
      if (ruleTypeMatches[prefix]?.some(match => word.includes(match) || match.includes(word))) {
        score += 1;
      }
    }
  }
  
  // Boost for high-priority keywords (safety-sensitive terms)
  const highPriorityTerms = ['payroll', 'compensation', 'salary', 'termination', 'legal', 'cross-border', 'tax'];
  for (const term of highPriorityTerms) {
    if (query.toLowerCase().includes(term) && chunkText.includes(term)) {
      score += 3;
    }
  }
  
  return score;
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
 * Uses simple keyword overlap scoring - designed to be replaced with
 * vector similarity search in the future.
 */
export function retrievePolicyChunks(query: string, limit: number = 3): PolicyChunk[] {
  const allChunks = loadPolicies();
  
  if (!query.trim()) {
    return [];
  }
  
  // Score all chunks
  const scoredChunks: ScoredChunk[] = allChunks.map(chunk => ({
    ...chunk,
    score: calculateScore(query, chunk),
  }));
  
  // Sort by score descending
  scoredChunks.sort((a, b) => b.score - a.score);
  
  // Return top N chunks that have a score > 0
  return scoredChunks
    .filter(c => c.score > 0)
    .slice(0, limit)
    .map(({ score, ...chunk }) => chunk);
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
