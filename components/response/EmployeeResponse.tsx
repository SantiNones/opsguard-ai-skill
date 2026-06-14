'use client';

import { EmployeeResponse } from '@/lib/types';
import { EmployeeIcon, ArrowRightIcon, DocumentIcon, LockIcon, SparkleIcon } from '@/components/ui/Icons';

interface EmployeeResponseProps {
  response: EmployeeResponse;
}

const statusColors = {
  answered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  needs_more_info: 'bg-amber-50 text-amber-700 border-amber-200',
  sent_to_hr_review: 'bg-violet-50 text-violet-700 border-violet-200',
  not_allowed: 'bg-red-50 text-red-700 border-red-200',
};

const statusLabels = {
  answered: 'Answered',
  needs_more_info: 'Needs more info',
  sent_to_hr_review: 'Sent to HR review',
  not_allowed: 'Access restricted',
};

function renderWithBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold text-stone-900">{part}</strong> : part
  );
}

export function EmployeeResponseComponent({ response }: EmployeeResponseProps) {
  const { title, message, status, visibleCitations, missingFields, nextStep, privacyNote, answerSource } = response;
  const repeatsStatus = title.trim().toLowerCase() === statusLabels[status].toLowerCase();

  return (
    <div className="og-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[#f0e8e4] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
            <EmployeeIcon className="w-4 h-4" />
          </span>
          <span className="text-sm font-semibold text-stone-700">OpsGuard Response</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-2.5">
          {!repeatsStatus && <h3 className="text-lg font-semibold text-stone-900">{title}</h3>}
          {answerSource === 'enterprise_context' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              <SparkleIcon className="w-3 h-3" />
              Live Data
            </span>
          )}
        </div>

        <div className="text-sm text-stone-600 leading-relaxed mb-4 whitespace-pre-wrap">
          {renderWithBold(message)}
        </div>

        {/* Next Step */}
        {nextStep && (
          <div className="mb-3 p-3 bg-[#faf6f4] rounded-xl border border-[#f0e8e4]">
            <div className="flex items-center gap-2 mb-1">
              <ArrowRightIcon className="w-3.5 h-3.5 text-brand-500" />
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Next step</span>
            </div>
            <p className="text-sm text-stone-600">{nextStep}</p>
          </div>
        )}

        {/* Missing Fields */}
        {missingFields.length > 0 && (
          <div className="mb-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide">Information needed</span>
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

        {/* Citations */}
        {visibleCitations.length > 0 && (
          <div className="mb-1">
            <div className="flex items-center gap-2 mb-2">
              <DocumentIcon className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Policy references</span>
            </div>
            <div className="space-y-2">
              {visibleCitations.map((citation, index) => (
                <div key={index} className="text-xs p-2.5 bg-[#faf6f4] rounded-lg border border-[#f0e8e4]">
                  <div className="font-semibold text-stone-800">{citation.code}: {citation.title}</div>
                  <div className="text-stone-500 mt-0.5">{citation.excerpt}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Privacy Note */}
        {privacyNote && (
          <div className="mt-3 p-3 bg-sky-50 rounded-xl border border-sky-100">
            <div className="flex items-start gap-2">
              <LockIcon className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] font-semibold text-sky-800 uppercase tracking-wide">Privacy note</span>
                <p className="text-sm text-sky-700 mt-0.5">{privacyNote}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
