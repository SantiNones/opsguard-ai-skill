import { ResolveOpsRequestOutput } from './types';

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

function formatDisplayLabel(value?: string): string {
  if (!value) return '—';
  const labelMap: Record<string, string> = {
    medium: 'Medium',
    high: 'High',
    low: 'Low',
    restricted: 'Restricted',
    time_correction: 'Time Correction',
    draft_action: 'Draft Action',
    restrict_access: 'Restrict Access',
    review_required: 'Review Required',
    access_restricted: 'Access Restricted',
  };
  return labelMap[value] ?? value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function isTimeCorrectionOutput(output: ResolveOpsRequestOutput): boolean {
  const searchable = `${output.request} ${output.draftAction?.type ?? ''} ${output.reviewPacket?.summary ?? ''}`.toLowerCase();
  return searchable.includes('time_correction') || searchable.includes('time correction') || searchable.includes('clock-in') || searchable.includes('clock in') || searchable.includes('overtime');
}

function uniqueFields(fields: string[]): string[] {
  return Array.from(new Set(fields.filter(Boolean)));
}

function missingFields(output: ResolveOpsRequestOutput): string[] {
  return uniqueFields(output.reviewPacket?.missingFields ?? output.draftAction?.missingFields ?? []);
}

function recommendedAction(output: ResolveOpsRequestOutput): string {
  if (output.draftAction?.type === 'time_correction_cutoff') {
    return 'Review payroll impact before applying any retroactive correction.';
  }
  if (isTimeCorrectionOutput(output)) {
    return 'Verify original scheduled hours, confirm manager approval, and route the correction for review.';
  }
  return output.reviewPacket?.recommendedAction || 'Review required';
}

function citationCodes(output: ResolveOpsRequestOutput): string[] {
  if (isTimeCorrectionOutput(output)) {
    return ['TT-01', 'TT-02', 'TT-04'].filter((code) => output.citations.some((citation) => citation.code === code));
  }
  return output.citations.map((citation) => citation.code);
}

export function formatSlackMessage(output: ResolveOpsRequestOutput): string {
  const riskEmoji = output.risk === 'low' ? '🟢' : output.risk === 'medium' ? '🟡' : '🔴';
  const reviewEmoji = output.needsReview ? '👁️' : '✅';
  const timeCorrection = isTimeCorrectionOutput(output);
  const missing = missingFields(output);
  
  return `*${timeCorrection ? 'Time Exception Review' : 'OpsGuard Alert'}* ${riskEmoji} ${reviewEmoji}

*Request:* ${output.request.slice(0, 100)}${output.request.length > 100 ? '...' : ''}
*Case Type:* ${timeCorrection ? 'Time Correction' : formatDisplayLabel(output.draftAction?.type)}
*Risk:* ${formatDisplayLabel(output.risk)}
*Route:* ${formatDisplayLabel(output.route)}
*Required Approval:* ${timeCorrection ? 'Direct Manager' : output.reviewPacket?.approver || 'TBD'}
*Confidence:* ${formatDisplayLabel(output.confidence)}
${timeCorrection ? '*Payroll Impact:* Potential payroll-impacting correction\n' : ''}${timeCorrection ? '*Audit Requirement:* Original entry, corrected entry, approver, timestamp, and reason must be logged\n' : ''}
*Action:* ${recommendedAction(output)}
${missing.length > 0 ? `*Missing Information:* ${missing.join(', ')}\n` : ''}
${citationCodes(output).length > 0 ? `*Citations:* ${citationCodes(output).join(', ')}` : ''}`;
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
  const timeCorrection = isTimeCorrectionOutput(output);
  const missing = missingFields(output);

  return `${timeCorrection ? 'Time Exception Review' : 'OpsGuard Review Ticket'}
========================

Request:
${output.request}

Case Summary:
- Case Type: ${timeCorrection ? 'Time Correction' : formatDisplayLabel(output.draftAction?.type)}
- Risk: ${formatDisplayLabel(output.risk)}
- Route: ${formatDisplayLabel(output.route)}
- Required Approval: ${timeCorrection ? 'Direct Manager' : output.reviewPacket?.approver || 'TBD'}
- Confidence: ${formatDisplayLabel(output.confidence)}
- Review Status: ${output.needsReview ? 'Review Required' : 'No Review Required'}
${timeCorrection ? '- Payroll Impact: Potential payroll-impacting correction\n- Audit Requirement: Original entry, corrected entry, approver, timestamp, and reason must be logged\n' : ''}
Explanation:
${output.explanation}

Reasoning:
${output.reasoning.map(r => `- ${r}`).join('\n')}

Recommended Action:
${recommendedAction(output)}

${missing.length > 0 ? `Missing Information:\n${missing.map(f => `- ${f}`).join('\n')}` : ''}

${output.citations.length > 0 ? `Citations:\n${output.citations.filter((citation) => !isTimeCorrectionOutput(output) || citationCodes(output).includes(citation.code)).map(c => `[${c.code}] ${c.title}: ${c.excerpt}`).join('\n')}` : ''}`;
}
