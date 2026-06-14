'use client';

import { HRReviewPacket } from '@/lib/types';

interface HRReviewPacketProps {
  packet: HRReviewPacket;
}

const riskColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

const routeColors = {
  answer_directly: 'bg-green-100 text-green-800',
  ask_for_info: 'bg-yellow-100 text-yellow-800',
  draft_action: 'bg-orange-100 text-orange-800',
  escalate: 'bg-red-100 text-red-800',
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
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">HR Review Packet</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskColors[riskLevel]}`}>
              {riskLevel.toUpperCase()} RISK
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${routeColors[route]}`}>
              {route.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4">
        {/* Enterprise Context Summary */}
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Context</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Actor:</span>
              <span className="ml-1 text-gray-900">{enterpriseContextSummary.actorRole}</span>
            </div>
            <div>
              <span className="text-gray-500">Access:</span>
              <span className="ml-1 text-gray-900">{enterpriseContextSummary.accessLevel}</span>
            </div>
            {enterpriseContextSummary.targetEmployee && (
              <div>
                <span className="text-gray-500">Target:</span>
                <span className="ml-1 text-gray-900">{enterpriseContextSummary.targetEmployee}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Redacted:</span>
              <span className="ml-1 text-gray-900">{redactionsApplied} fields</span>
            </div>
          </div>
        </div>

        {/* Recommended Owner */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Recommended Owner</span>
          </div>
          <p className="text-sm font-medium text-gray-900">{recommendedOwner}</p>
        </div>

        {/* Reasoning */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Reasoning</span>
          </div>
          <ul className="text-sm text-gray-700 space-y-1">
            {reasoning.map((reason, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">{index + 1}.</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Missing Fields */}
        {missingFields.length > 0 && (
          <div className="p-3 bg-amber-50 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Missing Information</span>
            </div>
            <ul className="text-sm text-amber-700 space-y-1">
              {missingFields.map((field, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>{field}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Draft Action */}
        {draftAction && (
          <div className="p-3 bg-orange-50 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-xs font-semibold text-orange-800 uppercase tracking-wide">Draft Action</span>
            </div>
            <div className="text-sm space-y-1">
              <div>
                <span className="text-orange-700 font-medium">Type:</span>
                <span className="ml-1 text-orange-900">{draftAction.type}</span>
              </div>
              <div>
                <span className="text-orange-700 font-medium">Description:</span>
                <span className="ml-1 text-orange-900">{draftAction.description}</span>
              </div>
              <div>
                <span className="text-orange-700 font-medium">Approver:</span>
                <span className="ml-1 text-orange-900">{draftAction.approver}</span>
              </div>
            </div>
          </div>
        )}

        {/* Citations */}
        {citations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Policy Citations</span>
            </div>
            <div className="space-y-2">
              {citations.map((citation, index) => (
                <div key={index} className="text-xs p-2 bg-gray-50 rounded border border-gray-100">
                  <div className="font-medium text-gray-900">{citation.code}: {citation.title}</div>
                  <div className="text-gray-600 mt-1">{citation.excerpt}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Access Control Notes */}
        <div className="p-3 bg-blue-50 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Access Control</span>
          </div>
          <p className="text-sm text-blue-700">{accessControlNotes}</p>
        </div>

        {/* Human Review Required */}
        {requiresHumanReview && (
          <div className="p-3 bg-red-50 rounded-md border border-red-100">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs font-semibold text-red-800 uppercase tracking-wide">Human Review Required</span>
            </div>
            <p className="text-sm text-red-700 mt-1">This case requires manual review before any action can be taken.</p>
          </div>
        )}
      </div>
    </div>
  );
}
