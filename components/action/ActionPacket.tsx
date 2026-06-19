'use client';

import React, { useMemo, useState } from 'react';
import { EmployeeRole, getEmployeeById } from '@/data/enterprise/employees';
import { CreatedReviewCase, ReviewCaseStatus } from '@/lib/reviewCases';
import { ResolveOpsRequestOutput } from '@/lib/types';
import { copyToClipboard, formatSlackMessage, formatTicket } from '@/lib/copyPacket';
import { ArrowRightIcon, CopyIcon, CheckIcon, DocumentIcon } from '@/components/ui/Icons';

interface ActionPacketProps {
  output: ResolveOpsRequestOutput | null;
  requestText: string;
  actorId: string;
  actorRole: EmployeeRole;
  actorName: string;
  targetName?: string;
  targetEmployeeId?: string;
  onCreateReviewCase: (reviewCase: CreatedReviewCase) => void;
}

const riskBadge: Record<string, string> = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-red-50 text-red-700 border-red-200',
};

const routeLabel: Record<string, string> = {
  answer_directly: 'Answer',
  ask_for_info: 'Ask for info',
  draft_action: 'Draft action',
  restrict_access: 'Restrict access',
  escalate: 'Escalate',
};

const roleLabel: Record<EmployeeRole, string> = {
  employee: 'Employee',
  manager: 'Manager',
  hr_ops: 'HR Operations',
  payroll_admin: 'Payroll Admin',
};

function statusFromOutput(output: ResolveOpsRequestOutput): ReviewCaseStatus {
  if (output.route === 'restrict_access') return 'access_restricted';
  if (output.route === 'escalate') return 'escalated';
  if (output.needsReview || output.route === 'draft_action') return 'review_required';
  return 'answered';
}

function ownerFromOutput(output: ResolveOpsRequestOutput): string {
  if (output.reviewPacket?.approver) return output.reviewPacket.approver;
  if (output.route === 'restrict_access') return '—';
  if (output.route === 'escalate') return 'HR Operations';
  if (output.route === 'draft_action') return 'Manager / HR Operations';
  return '—';
}

function resolveOwnerDetails(output: ResolveOpsRequestOutput, actorId: string) {
  const fallbackOwner = ownerFromOutput(output);
  if (fallbackOwner === 'Direct Manager' || fallbackOwner === 'Manager / HR Operations') {
    const actor = getEmployeeById(actorId);
    const manager = actor?.managerId ? getEmployeeById(actor.managerId) : undefined;
    if (manager) {
      return {
        owner: manager.name,
        ownerRole: roleLabel[manager.role],
        ownerDepartment: manager.department,
      };
    }
  }
  return { owner: fallbackOwner };
}

function typeFromOutput(output: ResolveOpsRequestOutput): string {
  if (output.draftAction?.type === 'time_correction') return 'Time Correction';
  if (output.draftAction?.type) return output.draftAction.type;
  if (output.answerSource === 'enterprise_context') return 'Live data lookup';
  if (output.route === 'restrict_access') return 'Data access';
  if (output.route === 'escalate') return 'Escalation';
  return 'Policy guidance';
}

export function ActionPacket({
  output,
  requestText,
  actorId,
  actorRole,
  actorName,
  targetName,
  targetEmployeeId,
  onCreateReviewCase,
}: ActionPacketProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [createdCaseKey, setCreatedCaseKey] = useState<string | null>(null);
  const caseKey = useMemo(
    () => output ? `${output.request || requestText}|${actorId}|${output.route}|${output.risk}` : '',
    [actorId, output, requestText]
  );
  const caseCreated = !!caseKey && createdCaseKey === caseKey;
  const ownerDetails = output ? resolveOwnerDetails(output, actorId) : null;

  const handleCopy = async (format: 'slack' | 'ticket') => {
    if (!output) return;
    const text = format === 'slack' ? formatSlackMessage(output) : formatTicket(output);
    await copyToClipboard(text);
    setCopied(format);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreateCase = () => {
    if (!output || caseCreated) return;
    const now = new Date();
    const reviewCase: CreatedReviewCase = {
      id: `CASE-${now.getTime().toString().slice(-6)}`,
      request: output.request || requestText,
      requester: actorName,
      actorId,
      actorRole,
      targetName,
      targetEmployeeId,
      risk: output.risk,
      route: output.route,
      status: statusFromOutput(output),
      owner: ownerDetails?.owner ?? ownerFromOutput(output),
      ownerRole: ownerDetails?.ownerRole,
      ownerDepartment: ownerDetails?.ownerDepartment,
      type: typeFromOutput(output),
      summary: output.reviewPacket?.summary ?? output.explanation,
      timestamp: now.toISOString(),
      time: 'Just now',
      policyReferences: output.citations,
      missingFields: output.reviewPacket?.missingFields ?? output.draftAction?.missingFields ?? [],
      source: 'created_from_request_console',
    };
    onCreateReviewCase(reviewCase);
    setCreatedCaseKey(caseKey);
  };

  if (!output) {
    return (
      <div className="og-card p-6 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-300 via-brand-500 to-[#ff7a59] opacity-60" />
        <h2 className="text-base font-black tracking-tight text-stone-950 mb-4">Review Case</h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 bg-brand-50 rounded-3xl flex items-center justify-center mb-3 ring-1 ring-brand-100">
            <DocumentIcon className="w-6 h-6 text-brand-500" />
          </div>
          <p className="text-stone-500 text-sm leading-relaxed max-w-[220px]">
            Route a request to prepare a review case for handoff.
          </p>
        </div>
      </div>
    );
  }

  const packet = output.reviewPacket;

  return (
    <div className="og-card p-5 xl:p-6 relative overflow-hidden min-w-0">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 via-brand-600 to-[#ff7a59]" />
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="og-section-title mb-1">Prepared handoff</p>
          <h2 className="text-lg font-black tracking-tight text-stone-950">Review Case</h2>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${riskBadge[output.risk]}`}>
            {output.risk.toUpperCase()} RISK
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border border-brand-100 bg-brand-50 text-brand-700 whitespace-nowrap">
            {routeLabel[output.route] ?? output.route}
          </span>
        </div>
      </div>

      {/* Packet preview */}
      <div className="space-y-3 mb-5">
        <div className="rounded-2xl bg-[#fff7f5] border border-[#eadeda] p-3.5">
          <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-1">Summary</p>
          <p className="text-sm text-stone-700">{packet?.summary}</p>
        </div>
        <div className="rounded-2xl bg-white/70 border border-[#eadeda] p-3.5">
          <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-1">Recommended action</p>
          <p className="text-sm font-medium text-stone-900">{packet?.recommendedAction}</p>
        </div>
        <div className="rounded-2xl bg-white/70 border border-[#eadeda] p-3.5">
          <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-1">Owner</p>
          <p className="text-sm font-bold text-stone-800">{ownerDetails?.owner ?? packet?.approver}</p>
          {ownerDetails?.ownerRole && (
            <p className="text-xs font-semibold text-stone-500 mt-0.5">
              {ownerDetails.ownerRole}{ownerDetails.ownerDepartment ? ` · ${ownerDetails.ownerDepartment}` : ''}
            </p>
          )}
        </div>
        {packet?.missingFields && packet.missingFields.length > 0 && (
          <div>
            <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-1">Missing fields</p>
            <ul className="text-sm text-stone-700 space-y-1">
              {packet.missingFields.map((field, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {field}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Primary CTA */}
      <button
        onClick={handleCreateCase}
        disabled={caseCreated}
        className="og-btn-primary w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm disabled:cursor-default disabled:opacity-75"
      >
        {caseCreated ? (
          <>
            <CheckIcon className="w-4 h-4" />
            Review case created
          </>
        ) : (
          <>
            Create review case
            <ArrowRightIcon className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Secondary actions */}
      <div className="mt-2.5 grid grid-cols-1 xl:grid-cols-2 gap-2">
        <button
          onClick={() => handleCopy('slack')}
          className="og-btn-ghost min-h-[40px] flex items-center justify-center gap-2 py-2 px-3 text-xs text-center"
        >
          {copied === 'slack' ? <CheckIcon className="w-3.5 h-3.5 text-emerald-600" /> : <CopyIcon className="w-3.5 h-3.5" />}
          {copied === 'slack' ? 'Copied' : 'Copy Slack summary'}
        </button>
        <button
          onClick={() => handleCopy('ticket')}
          className="og-btn-ghost min-h-[40px] flex items-center justify-center gap-2 py-2 px-3 text-xs text-center"
        >
          {copied === 'ticket' ? <CheckIcon className="w-3.5 h-3.5 text-emerald-600" /> : <CopyIcon className="w-3.5 h-3.5" />}
          {copied === 'ticket' ? 'Copied' : 'Copy ticket payload'}
        </button>
      </div>
    </div>
  );
}
