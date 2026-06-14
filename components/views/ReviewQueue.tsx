'use client';

import { useState } from 'react';
import { EmployeeRole, getDirectReports } from '@/data/enterprise/employees';
import { CreatedReviewCase, ReviewCaseStatus } from '@/lib/reviewCases';
import { AppHeader } from '@/components/layout/AppHeader';
import { SearchIcon, ArrowRightIcon } from '@/components/ui/Icons';

interface ReviewCase {
  id: string;
  request: string;
  requester: string;
  risk: 'low' | 'medium' | 'high' | 'restricted';
  owner: string;
  type: string;
  time: string;
  status: ReviewCaseStatus;
  summary: string;
  source?: CreatedReviewCase['source'];
  actorId?: string;
  targetEmployeeId?: string;
  route?: CreatedReviewCase['route'];
  timestamp?: string;
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
    type: reviewCase.type,
    time: reviewCase.time,
    status: reviewCase.status,
    summary: reviewCase.summary,
    source: reviewCase.source,
    actorId: reviewCase.actorId,
    targetEmployeeId: reviewCase.targetEmployeeId,
    route: reviewCase.route,
    timestamp: reviewCase.timestamp,
  };
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
                    <th className="font-bold px-3 py-3.5 hidden lg:table-cell">Type</th>
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
                      <td className="px-5 py-4">
                        <p className="font-bold text-stone-950">{c.request}</p>
                        <p className="text-xs text-stone-400">
                          {c.requester} · {c.time}
                          {c.source === 'created_from_request_console' && (
                            <span className="ml-2 text-brand-600 font-semibold">Created from console</span>
                          )}
                        </p>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${riskStyles[c.risk]}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                          {c.risk === 'restricted' ? 'Restricted' : c.risk.charAt(0).toUpperCase() + c.risk.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-stone-600 hidden md:table-cell">{c.owner}</td>
                      <td className="px-3 py-3.5 text-stone-600 hidden lg:table-cell">{c.type}</td>
                      <td className="px-3 py-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium border ${statusStyles[c.status]}`}>
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
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-stone-400">{selected.id}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${statusStyles[selected.status]}`}>
                    {statusLabels[selected.status]}
                  </span>
                </div>
                <h3 className="text-lg font-black tracking-tight text-stone-950 mb-1">{selected.request}</h3>
                <p className="text-xs text-stone-400 mb-4">{selected.requester} · {selected.time}</p>
                <p className="text-sm text-stone-600 leading-relaxed mb-5 rounded-2xl bg-[#fff7f5] border border-[#eadeda] p-3">{selected.summary}</p>
                <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                  <div className="rounded-xl bg-white/70 border border-[#eadeda] p-3">
                    <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-0.5">Owner</p>
                    <p className="text-stone-800 font-bold">{selected.owner}</p>
                  </div>
                  <div className="rounded-xl bg-white/70 border border-[#eadeda] p-3">
                    <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-0.5">Type</p>
                    <p className="text-stone-800 font-bold">{selected.type}</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/25 backdrop-blur-sm px-4">
          <div className="og-card w-full max-w-2xl p-6 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 via-brand-600 to-[#ff7a59]" />
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs font-mono text-stone-400 mb-1">{openCase.id}</p>
                <h3 className="text-xl font-black tracking-tight text-stone-950">{openCase.request}</h3>
                <p className="text-sm text-stone-500 mt-1">{openCase.requester} · {openCase.time}</p>
              </div>
              <button
                onClick={() => setOpenCase(null)}
                className="og-btn-ghost px-3 py-1.5 text-sm shrink-0"
              >
                Close
              </button>
            </div>
            <div className="grid sm:grid-cols-4 gap-3 mb-4">
              <div className="rounded-xl bg-[#fff7f5] border border-[#eadeda] p-3">
                <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-0.5">Risk</p>
                <p className="text-sm font-bold text-stone-900">{openCase.risk === 'restricted' ? 'Restricted' : openCase.risk}</p>
              </div>
              <div className="rounded-xl bg-[#fff7f5] border border-[#eadeda] p-3">
                <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-0.5">Owner</p>
                <p className="text-sm font-bold text-stone-900">{openCase.owner}</p>
              </div>
              <div className="rounded-xl bg-[#fff7f5] border border-[#eadeda] p-3">
                <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-0.5">Status</p>
                <p className="text-sm font-bold text-stone-900">{statusLabels[openCase.status]}</p>
              </div>
              <div className="rounded-xl bg-[#fff7f5] border border-[#eadeda] p-3">
                <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-0.5">Type</p>
                <p className="text-sm font-bold text-stone-900">{openCase.type}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-white/75 border border-[#eadeda] p-4 mb-3">
              <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-1">Summary</p>
              <p className="text-sm text-stone-700 leading-relaxed">{openCase.summary}</p>
            </div>
            <div className="rounded-2xl bg-brand-50/70 border border-brand-100 p-4">
              <p className="text-[11px] text-brand-500 uppercase tracking-wide mb-1">Recommended action</p>
              <p className="text-sm font-semibold text-brand-800">
                Review the request, verify required fields, and route to {openCase.owner === '—' ? 'the appropriate owner' : openCase.owner}.
              </p>
              {openCase.source === 'created_from_request_console' && (
                <p className="mt-2 text-xs font-semibold text-brand-600">Source: created from Request Console</p>
              )}
            </div>
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#eadeda] pt-4">
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
