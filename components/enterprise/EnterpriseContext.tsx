'use client';

import { useState } from 'react';

interface EnterpriseContextProps {
  context: {
    actor?: { employeeId: string; name: string; role: string };
    targetEmployee?: { employeeId: string; name: string } | null;
    accessLevel: string;
    redactionsApplied: number;
    hasContext: boolean;
  } | null;
}

const accessLevelColors: Record<string, string> = {
  full: 'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  minimal: 'bg-orange-100 text-orange-800',
  none: 'bg-red-100 text-red-800',
};

export function EnterpriseContext({ context }: EnterpriseContextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!context) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-500">Enterprise Context</h3>
          <span className="text-xs text-gray-400">Not available</span>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Submit a request to see permissioned enterprise context.
        </p>
      </div>
    );
  }

  const { actor, targetEmployee, accessLevel, redactionsApplied, hasContext } = context;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Enterprise Context</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${accessLevelColors[accessLevel] || 'bg-gray-100 text-gray-800'}`}>
            {accessLevel} access
          </span>
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {/* Actor */}
          <div className="mt-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actor</h4>
            <p className="mt-1 text-sm text-gray-800">{actor?.name}</p>
            <p className="text-xs text-gray-500">{actor?.role} • {actor?.employeeId}</p>
          </div>

          {/* Target */}
          {targetEmployee && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</h4>
              <p className="mt-1 text-sm text-gray-800">{targetEmployee.name}</p>
              <p className="text-xs text-gray-500">{targetEmployee.employeeId}</p>
            </div>
          )}

          {/* Access Summary */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Access Summary</h4>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Access Level</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${accessLevelColors[accessLevel] || 'bg-gray-100'}`}>
                  {accessLevel}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Redactions</span>
                <span className="text-gray-800 font-medium">
                  {redactionsApplied > 0 ? `${redactionsApplied} fields` : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Context Available</span>
                <span className={`text-xs ${hasContext ? 'text-green-600' : 'text-gray-500'}`}>
                  {hasContext ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          {redactionsApplied > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-xs text-gray-500">
                  Some fields were redacted based on your role permissions. 
                  Sensitive data like exact salary and bank details are masked.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
