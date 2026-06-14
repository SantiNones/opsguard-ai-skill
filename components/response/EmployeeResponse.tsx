'use client';

import { EmployeeResponse } from '@/lib/types';

interface EmployeeResponseProps {
  response: EmployeeResponse;
}

const statusColors = {
  answered: 'bg-green-100 text-green-800',
  needs_more_info: 'bg-yellow-100 text-yellow-800',
  sent_to_hr_review: 'bg-blue-100 text-blue-800',
  not_allowed: 'bg-red-100 text-red-800',
};

const statusLabels = {
  answered: 'Answered',
  needs_more_info: 'Needs More Info',
  sent_to_hr_review: 'Sent to HR Review',
  not_allowed: 'Not Allowed',
};

export function EmployeeResponseComponent({ response }: EmployeeResponseProps) {
  const { title, message, status, visibleCitations, missingFields, nextStep, privacyNote } = response;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Employee Response</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        
        {/* Message */}
        <div className="text-sm text-gray-700 mb-4 whitespace-pre-wrap">{message}</div>

        {/* Next Step */}
        {nextStep && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Next Step</span>
            </div>
            <p className="text-sm text-gray-600">{nextStep}</p>
          </div>
        )}

        {/* Missing Fields */}
        {missingFields.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Information Needed</span>
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

        {/* Citations */}
        {visibleCitations.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">References</span>
            </div>
            <div className="space-y-2">
              {visibleCitations.map((citation, index) => (
                <div key={index} className="text-xs p-2 bg-gray-50 rounded border border-gray-100">
                  <div className="font-medium text-gray-900">{citation.code}: {citation.title}</div>
                  <div className="text-gray-600 mt-1">{citation.excerpt}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Privacy Note */}
        {privacyNote && (
          <div className="p-3 bg-blue-50 rounded-md">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Privacy Note</span>
                <p className="text-sm text-blue-700 mt-1">{privacyNote}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
