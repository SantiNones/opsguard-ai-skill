import { ResolveOpsRequestOutput } from './types';

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function formatSlackMessage(output: ResolveOpsRequestOutput): string {
  const riskEmoji = output.risk === 'low' ? '🟢' : output.risk === 'medium' ? '🟡' : '🔴';
  const reviewEmoji = output.needsReview ? '👁️' : '✅';
  
  return `*OpsGuard Alert* ${riskEmoji} ${reviewEmoji}

*Request:* ${output.request.slice(0, 100)}${output.request.length > 100 ? '...' : ''}
*Risk:* ${output.risk.toUpperCase()}
*Route:* ${output.route.replace(/_/g, ' ')}
*Confidence:* ${output.confidence}

*Action:* ${output.reviewPacket?.recommendedAction || 'Review required'}
*Approver:* ${output.reviewPacket?.approver || 'TBD'}

${output.citations.length > 0 ? `*Citations:* ${output.citations.map(c => c.code).join(', ')}` : ''}`;
}

export function formatTeamsMessage(output: ResolveOpsRequestOutput): string {
  const riskEmoji = output.risk === 'low' ? '🟢' : output.risk === 'medium' ? '🟡' : '🔴';
  
  return `**OpsGuard Alert** ${riskEmoji}

**Request:** ${output.request.slice(0, 100)}${output.request.length > 100 ? '...' : ''}
**Risk:** ${output.risk.toUpperCase()}
**Route:** ${output.route.replace(/_/g, ' ')}
**Confidence:** ${output.confidence}

**Action:** ${output.reviewPacket?.recommendedAction || 'Review required'}
**Approver:** ${output.reviewPacket?.approver || 'TBD'}

${output.citations.length > 0 ? `**Citations:** ${output.citations.map(c => c.code).join(', ')}` : ''}`;
}

export function formatTicket(output: ResolveOpsRequestOutput): string {
  return `OpsGuard Review Ticket
========================

Request:
${output.request}

Risk Assessment:
- Risk Level: ${output.risk.toUpperCase()}
- Route: ${output.route}
- Confidence: ${output.confidence}
- Requires Review: ${output.needsReview ? 'YES' : 'NO'}

Explanation:
${output.explanation}

Reasoning:
${output.reasoning.map(r => `- ${r}`).join('\n')}

Recommended Action:
${output.reviewPacket?.recommendedAction || 'Review required'}

Approver: ${output.reviewPacket?.approver || 'TBD'}

${output.reviewPacket?.missingFields && output.reviewPacket.missingFields.length > 0 ? `Missing Fields:\n${output.reviewPacket.missingFields.map(f => `- ${f}`).join('\n')}` : ''}

${output.citations.length > 0 ? `Citations:\n${output.citations.map(c => `[${c.code}] ${c.title}: ${c.excerpt}`).join('\n')}` : ''}`;
}
