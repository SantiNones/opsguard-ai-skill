'use client';

import { useState } from 'react';
import { EmployeeRole, getDirectReports } from '@/data/enterprise/employees';
import { CreatedReviewCase, ReviewCaseStatus } from '@/lib/reviewCases';
import { Citation } from '@/lib/types';
import { normalizeMissingFields } from '@/lib/missingFields';
import { AppHeader } from '@/components/layout/AppHeader';
import { SearchIcon, ArrowRightIcon } from '@/components/ui/Icons';

interface ReviewCase {
  id: string;
  request: string;
  requester: string;
  risk: 'low' | 'medium' | 'high' | 'restricted';
  owner: string;
  ownerRole?: string;
  ownerDepartment?: string;
  type: string;
  time: string;
  status: ReviewCaseStatus;
  summary: string;
  source?: CreatedReviewCase['source'];
  actorId?: string;
  targetEmployeeId?: string;
  route?: CreatedReviewCase['route'];
  timestamp?: string;
  policyReferences?: Citation[];
  missingFields?: string[];
}

const mockCases: ReviewCase[] = [
  {
    id: 'CASE-1042',
    request: 'Missed clock-in + overtime',
    requester: 'Ana García López',
    risk: 'high',
    owner: 'HR Operations',
    type: 'Time correction',
    time: '9:41 AM',
    status: 'review_required',
    summary:
      'Employee missed clock-in and worked overtime. Requires manager approval and payroll verification before correction.',
    policyReferences: [
      { code: 'TT-01', title: 'Missed clock-in correction', excerpt: 'Missed clock-ins must be corrected through the time tracking workflow and include the original scheduled hours.' },
      { code: 'TT-02', title: 'Manager approval', excerpt: 'Retroactive time corrections require direct manager approval before payroll processing.' },
      { code: 'TT-04', title: 'Audit trail', excerpt: 'All time corrections must retain an audit trail with timestamp, requester, and approver.' },
    ],
    missingFields: ['Original scheduled hours', 'Manager approval'],
  },
  {
    id: 'CASE-1041',
    request: 'Payroll bank update',
    requester: 'Carlos Ruiz Hernández',
    risk: 'high',
    owner: 'Payroll',
    type: 'Payroll change',
    time: 'Yesterday',
    status: 'escalated',
    summary:
      'Bank account change requested before payroll cutoff. Escalated to Payroll Admin — sensitive financial data.',
  },
  {
    id: 'CASE-1038',
    request: 'Remote work abroad',
    requester: 'Laura Martín Sánchez',
    risk: 'medium',
    owner: 'HR Operations',
    type: 'Policy exception',
    time: 'Yesterday',
    status: 'review_required',
    summary:
      'Cross-border remote work request. Requires tax and compliance review before approval (RW-02).',
  },
  {
    id: 'CASE-1035',
    request: 'Vacation balance (Carlos)',
    requester: 'Laura Martín Sánchez',
    risk: 'low',
    owner: '—',
    type: 'Informational',
    time: 'May 22',
    status: 'answered',
    summary:
      'Manager queried direct report vacation balance. Answered directly from permissioned enterprise data.',
  },
  {
    id: 'CASE-1031',
    request: 'Colleague salary inquiry',
    requester: 'Ana García López',
    risk: 'restricted',
    owner: 'HR Operations',
    type: 'Data access',
    time: 'May 21',
    status: 'access_restricted',
    summary:
      'Employee requested a colleague\u2019s salary. Access denied by role-based access control. No data returned.',
  },
];

const riskStyles: Record<ReviewCase['risk'], string> = {
  low: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-red-50 text-red-700',
  restricted: 'bg-stone-100 text-stone-600',
};

const statusStyles: Record<ReviewCase['status'], string> = {
  review_required: 'bg-violet-50 text-violet-700 border-violet-200',
  escalated: 'bg-red-50 text-red-700 border-red-200',
  answered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  access_restricted: 'bg-stone-100 text-stone-600 border-stone-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const statusLabels: Record<ReviewCase['status'], string> = {
  review_required: 'Review required',
  escalated: 'Escalated',
  answered: 'Answered',
  access_restricted: 'Access restricted',
  resolved: 'Resolved',
};

const filters = ['All', 'High risk', 'Escalated', 'Review required'];

interface ReviewQueueProps {
  role: EmployeeRole;
  selectedActorId: string;
  createdCases: CreatedReviewCase[];
  onResolveCreatedCase: (caseId: string) => void;
  onDeleteCreatedCase: (caseId: string) => void;
}

function canSeeCreatedCase(role: EmployeeRole, selectedActorId: string, reviewCase: CreatedReviewCase): boolean {
  if (role === 'hr_ops') return true;
  if (role === 'payroll_admin') return reviewCase.owner === 'Payroll' || reviewCase.type.toLowerCase().includes('payroll') || reviewCase.risk === 'high';
  if (role === 'manager') {
    const directReportIds = getDirectReports(selectedActorId).map((employee) => employee.employeeId);
    return reviewCase.actorId === selectedActorId || directReportIds.includes(reviewCase.actorId) || !!reviewCase.targetEmployeeId && directReportIds.includes(reviewCase.targetEmployeeId);
  }
  return false;
}

function toQueueCase(reviewCase: CreatedReviewCase): ReviewCase {
  return {
    id: reviewCase.id,
    request: reviewCase.request,
    requester: reviewCase.requester,
    risk: reviewCase.risk,
    owner: reviewCase.owner,
    ownerRole: reviewCase.ownerRole,
    ownerDepartment: reviewCase.ownerDepartment,
    type: reviewCase.type,
    time: reviewCase.time,
    status: reviewCase.status,
    summary: reviewCase.summary,
    source: reviewCase.source,
    actorId: reviewCase.actorId,
    targetEmployeeId: reviewCase.targetEmployeeId,
    route: reviewCase.route,
    timestamp: reviewCase.timestamp,
    policyReferences: reviewCase.policyReferences,
    missingFields: normalizeMissingFields(reviewCase.missingFields ?? []),
  };
}

function formatCreatedAt(timestamp?: string): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return `Created ${date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function formatDisplayLabel(value?: string): string {
  if (!value) return '—';
  const labelMap: Record<string, string> = {
    medium: 'Medium',
    high: 'High',
    low: 'Low',
    restricted: 'Restricted',
    time_correction: 'Time correction',
    time_correction_cutoff: 'Time correction cutoff',
    payroll_account_change: 'Payroll account change',
    remote_work_abroad: 'Remote work abroad',
    salary_access: 'Salary access',
    employee_data_access: 'Employee data access',
    draft_action: 'Draft action',
    restrict_access: 'Restrict access',
    review_required: 'Review required',
    access_restricted: 'Access restricted',
  };
  return labelMap[value] ?? value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function isTimeCorrectionCase(reviewCase: ReviewCase): boolean {
  const searchable = `${reviewCase.request} ${reviewCase.type} ${reviewCase.summary}`.toLowerCase();
  return searchable.includes('time correction') || searchable.includes('clock-in') || searchable.includes('clock in') || searchable.includes('overtime');
}

function uniqueFields(fields: string[]): string[] {
  return Array.from(new Set(fields.filter(Boolean)));
}

function getMissingFields(reviewCase: ReviewCase): string[] {
  if (reviewCase.missingFields && reviewCase.missingFields.length > 0) return uniqueFields(reviewCase.missingFields);
  if (isTimeCorrectionCase(reviewCase)) return ['Original scheduled hours', 'Manager approval'];
  return [];
}

function getReviewTitle(reviewCase: ReviewCase): string {
  return isTimeCorrectionCase(reviewCase) ? 'Time Exception Review' : 'Review Case';
}

function getRecommendedAction(reviewCase: ReviewCase): string {
  const searchable = `${reviewCase.request} ${reviewCase.type} ${reviewCase.summary}`.toLowerCase();
  if (searchable.includes('payroll cutoff') || searchable.includes('time_correction_cutoff')) {
    return 'Review payroll impact before applying any retroactive correction.';
  }
  if (isTimeCorrectionCase(reviewCase)) {
    return 'Verify original scheduled hours, confirm manager approval, and route the correction for review.';
  }
  return `Review the request, verify required fields, and route to ${reviewCase.owner === '—' ? 'the appropriate owner' : reviewCase.owner}.`;
}

export function ReviewQueue({ role, selectedActorId, createdCases, onResolveCreatedCase, onDeleteCreatedCase }: ReviewQueueProps) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openCase, setOpenCase] = useState<ReviewCase | null>(null);
  const [hiddenMockCaseIds, setHiddenMockCaseIds] = useState<string[]>([]);

  // Payroll Admin sees a payroll-weighted queue
  const visibleCreatedCases = createdCases
    .filter((reviewCase) => reviewCase.status !== 'resolved')
    .filter((reviewCase) => canSeeCreatedCase(role, selectedActorId, reviewCase))
    .map(toQueueCase);

  const baseCases =
    role === 'payroll_admin'
      ? mockCases.filter((c) => c.owner === 'Payroll' || c.type === 'Payroll change' || c.risk === 'high')
      : mockCases;
  const activeBaseCases = baseCases.filter((c) => !hiddenMockCaseIds.includes(c.id));
  const roleScoped = [...visibleCreatedCases, ...activeBaseCases];

  const handleResolveCase = (reviewCase: ReviewCase) => {
    if (reviewCase.source === 'created_from_request_console') {
      onResolveCreatedCase(reviewCase.id);
    } else {
      setHiddenMockCaseIds((current) => current.includes(reviewCase.id) ? current : [...current, reviewCase.id]);
    }
    setOpenCase(null);
    setSelectedId((current) => current === reviewCase.id ? null : current);
  };

  const handleDeleteCase = (reviewCase: ReviewCase) => {
    if (reviewCase.source === 'created_from_request_console') {
      onDeleteCreatedCase(reviewCase.id);
    } else {
      setHiddenMockCaseIds((current) => current.includes(reviewCase.id) ? current : [...current, reviewCase.id]);
    }
    setOpenCase(null);
    setSelectedId((current) => current === reviewCase.id ? null : current);
  };

  const filtered = roleScoped.filter((c) => {
    const matchesFilter =
      activeFilter === 'All' ||
      (activeFilter === 'High risk' && c.risk === 'high') ||
      (activeFilter === 'Escalated' && c.status === 'escalated') ||
      (activeFilter === 'Review required' && c.status === 'review_required');
    const matchesQuery =
      !query ||
      c.request.toLowerCase().includes(query.toLowerCase()) ||
      c.requester.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  const selected = filtered.find((c) => c.id === selectedId) ?? null;
  const queueMetrics = [
    { label: 'Total cases', value: roleScoped.length, tone: 'text-stone-900', bg: 'bg-white' },
    { label: 'High risk', value: roleScoped.filter((c) => c.risk === 'high').length, tone: 'text-red-700', bg: 'bg-red-50' },
    { label: 'Review required', value: roleScoped.filter((c) => c.status === 'review_required').length, tone: 'text-violet-700', bg: 'bg-violet-50' },
    { label: 'Restricted', value: roleScoped.filter((c) => c.status === 'access_restricted').length, tone: 'text-stone-700', bg: 'bg-stone-100' },
  ];

  return (
    <>
      <AppHeader title="Review Queue" subtitle="Cases that require your attention." />

      <div className="flex-1 px-8 py-6 og-scroll overflow-y-auto">
        <div className="max-w-[1500px] space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {queueMetrics.map((m) => (
              <div key={m.label} className="og-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.11em] text-stone-400">{m.label}</p>
                  <span className={`w-8 h-8 rounded-xl ${m.bg} border border-[#eadeda]`} />
                </div>
                <p className={`mt-2 text-3xl font-black tracking-tight ${m.tone}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1 p-1.5 bg-white/75 border border-[#eadeda] rounded-2xl shadow-sm">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeFilter === f ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-100' : 'text-stone-500 hover:text-stone-900 hover:bg-[#fff7f5]'
                  }`}
                >
                  {f}
                  {f === 'All' && (
                    <span className="ml-1.5 text-xs text-stone-400">{roleScoped.length}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative">
              <SearchIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cases…"
                className="og-input pl-9 pr-3 py-2.5 w-64 text-sm placeholder:text-stone-400"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-5 items-start">
            {/* Table */}
            <div className={`og-card overflow-hidden ${selected ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-stone-400 border-b border-[#eadeda] bg-[#fff7f5]/65">
                    <th className="font-bold px-5 py-3.5">Request</th>
                    <th className="font-bold px-3 py-3.5">Risk</th>
                    <th className="font-bold px-3 py-3.5 hidden md:table-cell">Owner</th>
                    <th className="font-bold px-3 py-3.5 hidden lg:table-cell max-w-36">Type</th>
                    <th className="font-bold px-3 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}
                      className={`border-b border-[#f5efec] last:border-0 cursor-pointer transition-all ${
                        selectedId === c.id ? 'bg-brand-50/60 shadow-[inset_3px_0_0_#e11d48]' : 'hover:bg-[#fff7f5]'
                      }`}
                    >
                      <td className="px-5 py-4 min-w-0">
                        <p className="font-bold text-stone-950 break-words">{c.request}</p>
                        <p className="text-xs text-stone-400 break-words">
                          {c.requester} · {c.time}
                          {c.source === 'created_from_request_console' && (
                            <span className="ml-2 text-brand-600 font-semibold">Created from console</span>
                          )}
                        </p>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={`inline-flex max-w-full items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-normal break-words ${riskStyles[c.risk]}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                          {c.risk === 'restricted' ? 'Restricted' : c.risk.charAt(0).toUpperCase() + c.risk.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-stone-600 hidden md:table-cell min-w-0">
                        <p className="font-semibold text-stone-700 break-words">{c.owner}</p>
                        {c.ownerRole && (
                          <p className="text-[11px] font-medium text-stone-400 break-words">
                            {c.ownerRole}{c.ownerDepartment ? ` · ${c.ownerDepartment}` : ''}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-stone-600 hidden lg:table-cell max-w-36 min-w-0">
                        <span className="block max-w-full whitespace-normal break-words text-xs font-semibold text-stone-700 leading-snug">{formatDisplayLabel(c.type)}</span>
                      </td>
                      <td className="px-3 py-3.5 min-w-0">
                        <span className={`inline-block max-w-full px-2 py-0.5 rounded-md text-[11px] font-medium border whitespace-normal break-words leading-snug ${statusStyles[c.status]}`}>
                          {statusLabels[c.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-sm text-stone-400">
                        No cases match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Case preview */}
            {selected && (
              <div className="lg:col-span-4 og-card p-5 og-fade-up relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 via-brand-600 to-[#ff7a59]" />
                <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
                  <span className="text-xs font-mono text-stone-400 break-words min-w-0">{selected.id}</span>
                  <span className={`shrink-0 max-w-[60%] px-2 py-0.5 rounded-md text-[11px] font-medium border whitespace-normal break-words leading-snug ${statusStyles[selected.status]}`}>
                    {statusLabels[selected.status]}
                  </span>
                </div>
                <h3 className="text-lg font-black tracking-tight text-stone-950 mb-1 break-words">{selected.request}</h3>
                <p className="text-xs text-stone-400 mb-4 break-words">{selected.requester} · {selected.time}</p>
                <p className="text-sm text-stone-600 leading-relaxed mb-5 rounded-2xl bg-[#fff7f5] border border-[#eadeda] p-3 break-words">{selected.summary}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-5">
                  <div className="rounded-xl bg-white/70 border border-[#eadeda] p-3 min-w-0">
                    <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-0.5">Owner</p>
                    <p className="text-stone-800 font-bold break-words">{selected.owner}</p>
                    {selected.ownerRole && (
                      <p className="text-xs font-semibold text-stone-500 mt-0.5 break-words">
                        {selected.ownerRole}{selected.ownerDepartment ? ` · ${selected.ownerDepartment}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl bg-white/70 border border-[#eadeda] p-3 min-w-0">
                    <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-0.5">Type</p>
                    <p className="text-stone-800 font-bold break-words leading-snug">{formatDisplayLabel(selected.type)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpenCase(selected)}
                  className="og-btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm"
                >
                  Open case
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {openCase && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-stone-950/25 backdrop-blur-sm p-3 sm:p-4">
          <div className="og-card w-full max-w-3xl max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2rem)] relative overflow-hidden flex flex-col">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 via-brand-600 to-[#ff7a59]" />
            <div className="flex items-start justify-between gap-4 px-4 sm:px-6 py-5 border-b border-[#eadeda] shrink-0">
              <div className="min-w-0">
                <p className="text-xs font-mono text-stone-400 mb-1">{openCase.id}</p>
                <h3 className="text-xl font-black tracking-tight text-stone-950">{getReviewTitle(openCase)}</h3>
                <p className="text-sm font-semibold text-stone-700 mt-1 break-words">{openCase.request}</p>
                <p className="text-sm text-stone-500 mt-1">{openCase.requester} · {openCase.time}</p>
                {formatCreatedAt(openCase.timestamp) && (
                  <p className="text-xs font-semibold text-stone-400 mt-1">{formatCreatedAt(openCase.timestamp)}</p>
                )}
              </div>
              <button
                onClick={() => setOpenCase(null)}
                className="og-btn-ghost px-3 py-1.5 text-sm shrink-0"
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto og-scroll px-4 sm:px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                <div className="rounded-xl bg-[#fff7f5] border border-[#eadeda] p-3 min-w-0">
                  <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-0.5">Risk</p>
                  <p className="text-sm font-bold text-stone-900 break-words">{formatDisplayLabel(openCase.risk)}</p>
                </div>
                <div className="rounded-xl bg-[#fff7f5] border border-[#eadeda] p-3 min-w-0">
                  <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-0.5">Owner</p>
                  <p className="text-sm font-bold text-stone-900 break-words">{openCase.owner}</p>
                  {openCase.ownerRole && (
                    <p className="text-xs font-semibold text-stone-500 mt-0.5 break-words">
                      {openCase.ownerRole}{openCase.ownerDepartment ? ` · ${openCase.ownerDepartment}` : ''}
                    </p>
                  )}
                </div>
                <div className="rounded-xl bg-[#fff7f5] border border-[#eadeda] p-3 min-w-0">
                  <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-0.5">Status</p>
                  <p className="text-sm font-bold text-stone-900 break-words">{formatDisplayLabel(openCase.status)}</p>
                </div>
                {openCase.route && (
                  <div className="rounded-xl bg-[#fff7f5] border border-[#eadeda] p-3 min-w-0">
                    <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-0.5">Route</p>
                    <p className="text-sm font-bold text-stone-900 break-words">{formatDisplayLabel(openCase.route)}</p>
                  </div>
                )}
                <div className="rounded-xl bg-[#fff7f5] border border-[#eadeda] p-3 min-w-0">
                  <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-0.5">Type</p>
                  <p className="text-sm font-bold text-stone-900 break-words">{formatDisplayLabel(openCase.type)}</p>
                </div>
              </div>
              {isTimeCorrectionCase(openCase) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/75 border border-[#eadeda] p-3 min-w-0">
                    <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-0.5">Case Type</p>
                    <p className="text-sm font-bold text-stone-900 break-words">Time correction</p>
                  </div>
                  <div className="rounded-xl bg-white/75 border border-[#eadeda] p-3 min-w-0">
                    <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-0.5">Required Approval</p>
                    <p className="text-sm font-bold text-stone-900 break-words">Direct Manager</p>
                  </div>
                  <div className="rounded-xl bg-white/75 border border-[#eadeda] p-3 min-w-0">
                    <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-0.5">Payroll Impact</p>
                    <p className="text-sm font-bold text-stone-900 break-words">Potential payroll-impacting correction</p>
                  </div>
                  <div className="rounded-xl bg-white/75 border border-[#eadeda] p-3 min-w-0">
                    <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-0.5">Audit Requirement</p>
                    <p className="text-sm font-bold text-stone-900 break-words">Original entry, corrected entry, approver, timestamp, and reason must be logged</p>
                  </div>
                </div>
              )}
              <div className="rounded-2xl bg-white/75 border border-[#eadeda] p-4">
                <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-1">Summary</p>
                <p className="text-sm text-stone-700 leading-relaxed">{openCase.summary}</p>
              </div>
              {getMissingFields(openCase).length > 0 && (
                <div className="rounded-2xl bg-amber-50/80 border border-amber-100 p-4">
                  <p className="text-[11px] text-amber-700 uppercase tracking-wide mb-2 font-bold">Missing fields</p>
                  <div className="flex flex-wrap gap-2">
                    {getMissingFields(openCase).map((field) => (
                      <span key={field} className="inline-flex max-w-full items-center rounded-full border border-amber-200 bg-white/70 px-2.5 py-1 text-xs font-semibold text-amber-800 break-words">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="rounded-2xl bg-white/75 border border-[#eadeda] p-4">
                <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-2">Policy references</p>
                {openCase.policyReferences && openCase.policyReferences.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {openCase.policyReferences.slice(0, 4).map((ref) => (
                      <div key={ref.code} className="flex flex-col sm:flex-row gap-2 text-sm min-w-0">
                        <span className="inline-flex w-fit min-w-[3.25rem] shrink-0 justify-center whitespace-nowrap font-mono font-bold text-brand-700 bg-brand-50 border border-brand-100 rounded-md px-2 py-0.5 h-fit">
                          {ref.code}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-stone-800 break-words">{ref.title}</p>
                          <p className="text-xs text-stone-500 leading-relaxed">{ref.excerpt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-medium text-stone-400">No policy references captured for this case.</p>
                )}
              </div>
              <div className="rounded-2xl bg-brand-50/70 border border-brand-100 p-4">
                <p className="text-[11px] text-brand-500 uppercase tracking-wide mb-1">Recommended action</p>
                <p className="text-sm font-semibold text-brand-800 leading-relaxed">
                  {getRecommendedAction(openCase)}
                </p>
                {openCase.source === 'created_from_request_console' && (
                  <p className="mt-2 text-xs font-semibold text-brand-600">Source: created from Request Console</p>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#eadeda] px-4 sm:px-6 py-4 shrink-0 bg-white/85">
              <button
                onClick={() => handleResolveCase(openCase)}
                className="og-btn-primary flex items-center justify-center px-4 py-2.5 text-sm"
              >
                Mark as resolved
              </button>
              <button
                onClick={() => handleDeleteCase(openCase)}
                className="rounded-xl border border-red-100 bg-red-50/60 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
              >
                Delete case
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
