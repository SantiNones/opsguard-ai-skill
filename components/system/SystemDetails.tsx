'use client';

import React, { useState } from 'react';
import { ResolveOpsRequestOutput } from '@/lib/types';

interface SystemDetailsProps {
  output: ResolveOpsRequestOutput | null;
}

export function SystemDetails({ output }: SystemDetailsProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (!output) return null;

  const sections = [
    {
      id: 'evidence',
      title: 'Evidence / Policy Citations',
      content: output.citations.length > 0 ? (
        <div className="space-y-2">
          {output.citations.map((c) => (
            <div key={c.code} className="p-3 bg-gray-50 rounded border border-gray-100">
              <p className="text-sm font-medium text-gray-900">[{c.code}] {c.title}</p>
              <p className="text-sm text-gray-600 mt-1">{c.excerpt}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No policy citations for this request.</p>
      ),
    },
    {
      id: 'eval',
      title: 'Eval Snapshot',
      content: (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Risk Model</span>
            <span className="text-gray-900">v1.0-weekend</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Route Confidence</span>
            <span className="text-gray-900 capitalize">{output.confidence}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Review Triggered</span>
            <span className={output.needsReview ? 'text-purple-600' : 'text-green-600'}>
              {output.needsReview ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Processing Time</span>
            <span className="text-gray-900">&lt;100ms</span>
          </div>
        </div>
      ),
    },
    {
      id: 'contract',
      title: 'Skill Contract',
      content: (
        <div className="space-y-2 text-sm text-gray-600">
          <p>OpsGuard Skill v0.1.0-mvp</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Analyzes HR operations requests</li>
            <li>Classifies risk (low/medium/high)</li>
            <li>Routes to appropriate handler</li>
            <li>Prepares review packets</li>
            <li>Never modifies data directly</li>
          </ul>
          <p className="text-xs text-gray-400 mt-3">Fallback: Always escalate uncertain requests.</p>
        </div>
      ),
    },
  ];

  return (
    <div className="mt-6 space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide px-1">
        System Details
      </h3>
      
      {sections.map((section) => (
        <div key={section.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-900">{section.title}</span>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSection === section.id && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="pt-3">
                {section.content}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
