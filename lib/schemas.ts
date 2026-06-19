import { z } from 'zod';

/**
 * Zod schemas for validating AI output.
 * Ensures structured responses match expected types.
 */

export const RiskLevelSchema = z.enum(['low', 'medium', 'high']);

export const RouteSchema = z.enum([
  'answer_directly',
  'ask_for_info',
  'draft_action',
  'restrict_access',
  'escalate',
  'restrict_access',
]);

export const ConfidenceSchema = z.enum(['low', 'medium', 'high']);

export const CitationSchema = z.object({
  code: z.string(),
  title: z.string(),
  excerpt: z.string().max(300),
});

export const DraftActionSchema = z.object({
  type: z.string(),
  description: z.string(),
  approver: z.string(),
  missingFields: z.array(z.string()),
});

export const ReviewPacketSchema = z.object({
  summary: z.string(),
  recommendedAction: z.string(),
  approver: z.string(),
  missingFields: z.array(z.string()),
});

export const ResolveOpsRequestOutputSchema = z.object({
  request: z.string(),
  risk: RiskLevelSchema,
  route: RouteSchema,
  confidence: ConfidenceSchema,
  needsReview: z.boolean(),
  explanation: z.string().max(300),
  reasoning: z.array(z.string()).min(1).max(5),
  citations: z.array(CitationSchema).max(5),
  draftAction: DraftActionSchema.optional(),
  reviewPacket: ReviewPacketSchema,
});

export type ValidatedResolveOutput = z.infer<typeof ResolveOpsRequestOutputSchema>;

/**
 * Validate AI output against schema.
 * Returns validated data or null if invalid.
 */
export function validateAIOutput(
  data: unknown
): ValidatedResolveOutput | null {
  try {
    return ResolveOpsRequestOutputSchema.parse(data);
  } catch (error) {
    console.error('AI output validation failed:', error);
    return null;
  }
}

/**
 * Check if citations are from the retrieved policy chunks.
 * Prevents hallucinated rule IDs.
 */
export function validateCitations(
  citations: { code: string }[],
  allowedRuleIds: string[]
): { valid: boolean; invalidCitations: string[] } {
  const invalidCitations = citations
    .filter(c => !allowedRuleIds.includes(c.code))
    .map(c => c.code);

  return {
    valid: invalidCitations.length === 0,
    invalidCitations,
  };
}
