'use client';

import React from 'react';
import { ResolveOpsRequestOutput, RiskLevel, Route } from '@/lib/types';

interface DecisionSummaryProps {
  output: ResolveOpsRequestOutput | null;
}

function getRiskStyles(risk: RiskLevel) {
  switch (risk) {
    case 'low':
      return {
        badge: 'bg-green-100 text-green-700 border-green-200',
        dot: 'bg-green-500',
      };
    case 'medium':
      return {
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'high':
      return {
        badge: 'bg-red-100 text-red-700 border-red-200',
        dot: 'bg-red-500',
      };
  }
}

function getRouteStyles(route: Route) {
  switch (route) {
    case 'answer_directly':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'ask_for_info':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'draft_action':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'escalate':
      return 'bg-purple-100 text-purple-700 border-purple-200';
  }
}

function formatRoute(route: Route): string {
  return route.replace(/_/g, ' ');
}

export function DecisionSummary({ output }: DecisionSummaryProps) {
  if (!output) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
            Decision
          </h2>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">
              Enter a request to see the AI decision
            </p>
          </div>
        </div>
      </div>
    );
  }

  const riskStyles = getRiskStyles(output.risk);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
          Decision
        </h2>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className={`px-3 py-2 rounded-lg border ${riskStyles.badge}`}>
            <p className="text-xs text-gray-500 mb-0.5">Risk</p>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${riskStyles.dot}`} />
              <span className="font-semibold capitalize">{output.risk}</span>
            </div>
          </div>
          
          <div className={`px-3 py-2 rounded-lg border ${getRouteStyles(output.route)}`}>
            <p className="text-xs text-gray-500 mb-0.5">Route</p>
            <span className="font-semibold capitalize">{formatRoute(output.route)}</span>
          </div>
          
          <div className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 mb-0.5">Confidence</p>
            <span className="font-semibold capitalize text-gray-700">{output.confidence}</span>
          </div>
          
          <div className={`px-3 py-2 rounded-lg border ${output.needsReview ? 'bg-purple-50 border-purple-200' : 'bg-green-50 border-green-200'}`}>
            <p className="text-xs text-gray-500 mb-0.5">Review</p>
            <span className={`font-semibold ${output.needsReview ? 'text-purple-700' : 'text-green-700'}`}>
              {output.needsReview ? 'Required' : 'Not needed'}
            </span>
          </div>
        </div>
        
        <div className="mb-5">
          <p className="text-sm font-medium text-gray-900 mb-2">Recommended next step</p>
          <p className="text-sm text-gray-600 leading-relaxed">{output.explanation}</p>
        </div>
        
        <div className="mb-5">
          <p className="text-sm font-medium text-gray-900 mb-2">Why this route?</p>
          <ul className="space-y-1.5">
            {output.reasoning.map((reason, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-red-500 mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {output.citations.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-900 mb-2">Citations</p>
            <div className="space-y-2">
              {output.citations.map((citation) => (
                <div key={citation.code} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                      {citation.code}
                    </span>
                    <span className="text-xs font-medium text-gray-700">{citation.title}</span>
                  </div>
                  <p className="text-xs text-gray-500 italic">&ldquo;{citation.excerpt}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
