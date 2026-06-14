'use client';

import { useState } from 'react';

interface ConfidentialityPanelProps {
  confidentiality: {
    sensitiveDataDetected: boolean;
    sensitiveCategories: string[];
    redactionsApplied: number;
    restrictedFields: string[];
    confidentialityLevel: 'low' | 'medium' | 'high';
  } | null;
}

const LEVEL_CONFIG = {
  high: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', label: 'High' },
  medium: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', label: 'Medium' },
  low: { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-400', label: 'Low' },
};

const CATEGORY_LABELS: Record<string, string> = {
  payroll: 'Payroll',
  salary: 'Salary',
  bank_account: 'Bank Account',
  personal_identifier: 'Personal ID',
  email: 'Email',
  phone: 'Phone',
  address: 'Address',
  cross_border: 'Cross-border',
  compensation: 'Compensation',
};

export function ConfidentialityPanel({ confidentiality }: ConfidentialityPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!confidentiality) return null;

  const cfg = LEVEL_CONFIG[confidentiality.confidentialityLevel];
  const hasSensitive = confidentiality.sensitiveDataDetected;

  return (
    <div className={`rounded-lg border ${cfg.border} ${cfg.bg} text-sm`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <svg className={`w-4 h-4 ${cfg.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span className={`font-semibold ${cfg.color}`}>
            Confidentiality: {cfg.label}
          </span>
          {confidentiality.redactionsApplied > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
              {confidentiality.redactionsApplied} redacted
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 ${cfg.color} transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className={`px-4 pb-4 border-t ${cfg.border} space-y-3 pt-3`}>
          {/* Sensitive categories */}
          {hasSensitive && confidentiality.sensitiveCategories.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1.5">Sensitive categories detected</p>
              <div className="flex flex-wrap gap-1.5">
                {confidentiality.sensitiveCategories.map(cat => (
                  <span key={cat} className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-mono">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Redactions */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Redactions applied</span>
            <span className="font-mono text-gray-700">{confidentiality.redactionsApplied}</span>
          </div>

          {/* Restricted fields */}
          {confidentiality.restrictedFields.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1.5">Restricted fields</p>
              <div className="flex flex-wrap gap-1.5">
                {confidentiality.restrictedFields.map(f => (
                  <span key={f} className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded font-mono">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!hasSensitive && (
            <p className="text-xs text-gray-500">No sensitive categories detected.</p>
          )}
        </div>
      )}
    </div>
  );
}
