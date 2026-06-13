import OpenAI from 'openai';
import { ResolveOpsRequestOutput } from './types';
import { PolicyChunk } from './policyRetrieval';
import { validateAIOutput, validateCitations } from './schemas';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MAX_TOKENS = 800;

// Lazy-loaded OpenAI client
let openai: OpenAI | null = null;
function getOpenAIClient(): OpenAI | null {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

/**
 * Check if AI mode is enabled and API key is available.
 */
export function isAIEnabled(): boolean {
  return process.env.USE_AI === 'true' && !!process.env.OPENAI_API_KEY;
}

/**
 * Build system prompt for the AI resolver.
 */
function buildSystemPrompt(policyChunks: PolicyChunk[]): string {
  const policyContext = policyChunks
    .map(
      (c, i) =>
        `[${i + 1}] ${c.ruleId}: ${c.title}\n${c.excerpt.slice(0, 200)}`
    )
    .join('\n\n');

  return `You are OpsGuard, an AI assistant for HR Operations.

Your task: Analyze employee requests and determine the safest resolution path.

## Available Policy Rules
${policyContext || 'No specific policies retrieved.'}

## Allowed Routes
- answer_directly: Low risk, clear policy answer exists
- ask_for_info: Insufficient context to decide
- draft_action: Medium risk, requires manager approval
- escalate: High risk (payroll, legal, cross-border, compensation)

## Risk Levels
- low: Routine policy queries
- medium: Requires documented approval
- high: Compliance/financial exposure

## Rules
1. Cite ONLY the rule IDs listed above. Do not invent policies.
2. If uncertain, use ask_for_info or escalate.
3. Always include 2-3 reasoning bullets.
4. Keep explanations under 150 characters.
5. All payroll, compensation, and cross-border requests are high risk.

## Output Format
Respond with ONLY valid JSON matching this exact structure:
{
  "request": "original request text",
  "risk": "low|medium|high",
  "route": "answer_directly|ask_for_info|draft_action|escalate",
  "confidence": "low|medium|high",
  "needsReview": boolean,
  "explanation": "brief explanation",
  "reasoning": ["reason 1", "reason 2"],
  "citations": [{"code": "XX-01", "title": "...", "excerpt": "..."}],
  "reviewPacket": {
    "summary": "...",
    "recommendedAction": "...",
    "approver": "...",
    "missingFields": []
  }
}

Do not include markdown, explanations, or text outside the JSON.`;
}

/**
 * Call OpenAI to resolve request with structured output.
 */
export async function aiResolve(
  userRequest: string,
  policyChunks: PolicyChunk[]
): Promise<
  | { success: true; output: ResolveOpsRequestOutput }
  | { success: false; error: string }
> {
  if (!isAIEnabled()) {
    return { success: false, error: 'AI not enabled' };
  }

  const client = getOpenAIClient();
  if (!client) {
    return { success: false, error: 'OpenAI client not available' };
  }

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(policyChunks),
        },
        {
          role: 'user',
          content: `Request: "${userRequest}"`,
        },
      ],
      temperature: 0.2,
      max_tokens: MAX_TOKENS,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return { success: false, error: 'Empty response from OpenAI' };
    }

    // Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return { success: false, error: 'Invalid JSON from OpenAI' };
    }

    // Validate against schema
    const validated = validateAIOutput(parsed);
    if (!validated) {
      return { success: false, error: 'Schema validation failed' };
    }

    // Verify citations are from retrieved chunks (prevent hallucinations)
    const allowedRuleIds = policyChunks.map(c => c.ruleId);
    const citationCheck = validateCitations(validated.citations, allowedRuleIds);

    if (!citationCheck.valid) {
      return {
        success: false,
        error: `Invalid citations: ${citationCheck.invalidCitations.join(', ')}`,
      };
    }

    // Ensure request field matches input
    const output: ResolveOpsRequestOutput = {
      ...validated,
      request: userRequest,
    };

    return { success: true, output };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `OpenAI error: ${errorMessage}` };
  }
}
