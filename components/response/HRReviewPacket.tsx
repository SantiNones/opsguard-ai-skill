'use client';

import { HRReviewPacket } from '@/lib/types';
import { HROpsIcon, DocumentIcon, LockIcon } from '@/components/ui/Icons';

interface HRReviewPacketProps {
  packet: HRReviewPacket;
}

const riskColors = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-red-50 text-red-700 border-red-200',
};

const routeColors = {
  answer_directly: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ask_for_info: 'bg-amber-50 text-amber-700 border-amber-200',
  draft_action: 'bg-sky-50 text-sky-700 border-sky-200',
  escalate: 'bg-red-50 text-red-700 border-red-200',
};

export function HRReviewPacketComponent({ packet }: HRReviewPacketProps) {
  const {
    riskLevel,
    route,
    requiresHumanReview,
    reasoning,
    missingFields,
    citations,
    draftAction,
    recommendedOwner,
    accessControlNotes,
    redactionsApplied,
    enterpriseContextSummary,
  } = packet;

  return (
    <div className="og-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[#f0e8e4] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
            <HROpsIcon className="w-4 h-4" />
          </span>
          <span className="text-sm font-semibold text-stone-700">HR Review Packet</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${riskColors[riskLevel]}`}>
            {riskLevel.toUpperCase()} RISK
          </span>
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${routeColors[route]}`}>
            {route.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4 space-y-4">
        {/* Enterprise Context Summary */}
        <div className="p-3 bg-[#faf6f4] rounded-xl border border-[#f0e8e4]">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Context</span>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-stone-400">Actor:</span>
              <span className="ml-1 text-stone-800 font-medium">{enterpriseContextSummary.actorRole}</span>
            </div>
            <div>
              <span className="text-stone-400">Access:</span>
              <span className="ml-1 text-stone-800 font-medium">{enterpriseContextSummary.accessLevel}</span>
            </div>
            {enterpriseContextSummary.targetEmployee && (
              <div>
                <span className="text-stone-400">Target:</span>
                <span className="ml-1 text-stone-800 font-medium">{enterpriseContextSummary.targetEmployee}</span>
              </div>
            )}
            <div>
              <span className="text-stone-400">Redacted:</span>
              <span className="ml-1 text-stone-800 font-medium">{redactionsApplied} fields</span>
            </div>
          </div>
        </div>

        {/* Recommended Owner */}
        <div>
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Recommended owner</span>
          <p className="mt-0.5 text-sm font-medium text-stone-900">{recommendedOwner}</p>
        </div>

        {/* Reasoning */}
        <div>
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Reasoning</span>
          <ul className="mt-1.5 text-sm text-stone-600 space-y-1.5">
            {reasoning.map((reason, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-500 text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">{index + 1}</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Missing Fields */}
        {missingFields.length > 0 && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide">Missing information</span>
            <ul className="mt-1.5 text-sm text-amber-700 space-y-1">
              {missingFields.map((field, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5" />
                  <span>{field}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Draft Action */}
        {draftAction && (
          <div className="p-3 bg-sky-50 rounded-xl border border-sky-100">
            <span className="text-[11px] font-semibold text-sky-800 uppercase tracking-wide">Draft action</span>
            <div className="mt-1.5 text-sm space-y-1">
              <div><span className="text-sky-600 font-medium">Type:</span><span className="ml-1 text-sky-900">{draftAction.type}</span></div>
              <div><span className="text-sky-600 font-medium">Description:</span><span className="ml-1 text-sky-900">{draftAction.description}</span></div>
              <div><span className="text-sky-600 font-medium">Approver:</span><span className="ml-1 text-sky-900">{draftAction.approver}</span></div>
            </div>
          </div>
        )}

        {/* Citations */}
        {citations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DocumentIcon className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Policy citations</span>
            </div>
            <div className="space-y-2">
              {citations.map((citation, index) => (
                <div key={index} className="text-xs p-2.5 bg-[#faf6f4] rounded-lg border border-[#f0e8e4]">
                  <div className="font-semibold text-stone-800">{citation.code}: {citation.title}</div>
                  <div className="text-stone-500 mt-0.5">{citation.excerpt}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Access Control Notes */}
        <div className="p-3 bg-sky-50 rounded-xl border border-sky-100">
          <div className="flex items-center gap-2 mb-1">
            <LockIcon className="w-3.5 h-3.5 text-sky-500" />
            <span className="text-[11px] font-semibold text-sky-800 uppercase tracking-wide">Access control</span>
          </div>
          <p className="text-sm text-sky-700">{accessControlNotes}</p>
        </div>

        {/* Human Review Required */}
        {requiresHumanReview && (
          <div className="p-3 bg-red-50 rounded-xl border border-red-100">
            <span className="text-[11px] font-semibold text-red-800 uppercase tracking-wide">Human review required</span>
            <p className="text-sm text-red-700 mt-0.5">This case requires manual review before any action can be taken.</p>
          </div>
        )}
      </div>
    </div>
  );
}
