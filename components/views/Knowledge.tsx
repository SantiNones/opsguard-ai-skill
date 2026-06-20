'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { ClockIcon, PayrollIcon, CalendarIcon, GlobeIcon, EmployeeIcon, SearchIcon } from '@/components/ui/Icons';

interface PolicyCategory {
  name: string;
  description: string;
  count: number;
  icon: React.ReactNode;
  tint: string;
  updated: string;
  rules: {
    id: string;
    title: string;
    text: string;
    tags: string[];
  }[];
}

const categories: PolicyCategory[] = [
  {
    name: 'Time Tracking Policy',
    description: 'Guidelines for clock-in, clock-out, overtime, and time corrections.',
    count: 5,
    icon: <ClockIcon className="w-5 h-5" />,
    tint: 'bg-rose-50 text-rose-600',
    updated: 'Updated May 2026',
    rules: [
      { id: 'TT-01', title: 'Missed clock-in correction', text: 'Missed clock-ins must be corrected through the time tracking workflow and include the original scheduled hours.', tags: ['time', 'correction'] },
      { id: 'TT-02', title: 'Manager approval', text: 'Retroactive time corrections require direct manager approval before payroll processing.', tags: ['manager', 'approval'] },
      { id: 'TT-03', title: 'Overtime approval', text: 'Overtime corrections require additional review before payroll can apply the adjustment.', tags: ['overtime', 'payroll'] },
      { id: 'TT-04', title: 'Audit trail', text: 'All time corrections must retain an audit trail with timestamp, requester, and approver.', tags: ['audit', 'compliance'] },
    ],
  },
  {
    name: 'Payroll Policy',
    description: 'Payroll cycles, payments, changes, and data protection.',
    count: 7,
    icon: <PayrollIcon className="w-5 h-5" />,
    tint: 'bg-amber-50 text-amber-600',
    updated: 'Updated Jun 2026',
    rules: [
      { id: 'PA-01', title: 'Payroll cutoff dates', text: 'Changes near payroll cutoff require payroll specialist review and may need manual handling.', tags: ['cutoff', 'payroll'] },
      { id: 'PA-02', title: 'Evidence required', text: 'Payroll and compensation adjustments require supporting documentation before approval.', tags: ['evidence', 'approval'] },
      { id: 'PA-03', title: 'Payroll entity rules', text: 'Cross-border work may create payroll entity, tax, or compliance restrictions.', tags: ['cross-border', 'tax'] },
      { id: 'PA-04', title: 'Sensitive payroll data', text: 'Payroll data is restricted and may only be accessed by authorized roles.', tags: ['sensitive', 'access'] },
    ],
  },
  {
    name: 'Leave Policy',
    description: 'Vacation, sick leave, public holidays, and leave balance.',
    count: 5,
    icon: <CalendarIcon className="w-5 h-5" />,
    tint: 'bg-emerald-50 text-emerald-600',
    updated: 'Updated Apr 2026',
    rules: [
      { id: 'VL-01', title: 'Vacation Carryover', text: 'Up to 5 unused vacation days may be carried over per calendar year. Carried days expire March 31 of the following year.', tags: ['carryover', 'vacation'] },
      { id: 'VL-02', title: 'Leave Approval', text: 'Vacation requests require manager approval with 2 weeks notice, with limited emergency exceptions.', tags: ['approval', 'notice'] },
      { id: 'VL-03', title: 'Leave Balance', text: 'Employees cannot take vacation with a negative balance. Remaining balance is answered from permissioned HR data.', tags: ['balance', 'live data'] },
      { id: 'VL-04', title: 'PTO vs Vacation', text: 'This policy applies only to vacation days. PTO, where offered, follows a separate PTO policy.', tags: ['pto', 'vacation'] },
      { id: 'VL-05', title: 'Annual Vacation Entitlement', text: 'Full-time employees are entitled to 23 paid vacation days per calendar year. Individual entitlements may vary by contract, seniority, or local employment agreement.', tags: ['annual', 'entitlement'] },
    ],
  },
  {
    name: 'Remote Work Policy',
    description: 'Remote work, international work, and travel guidelines.',
    count: 4,
    icon: <GlobeIcon className="w-5 h-5" />,
    tint: 'bg-sky-50 text-sky-600',
    updated: 'Updated Mar 2026',
    rules: [
      { id: 'RW-01', title: 'Domestic remote work', text: 'Domestic remote work may be approved when role expectations and equipment requirements are met.', tags: ['remote', 'domestic'] },
      { id: 'RW-02', title: 'Cross-border work', text: 'International remote work requires prior review because tax, payroll entity, and employment law issues may apply.', tags: ['international', 'compliance'] },
      { id: 'RW-03', title: 'Travel overlap', text: 'Work performed while traveling may need HRBP review when location or duration changes employment obligations.', tags: ['travel', 'location'] },
    ],
  },
  {
    name: 'Onboarding Policy',
    description: 'Pre-start checklist, documents, and first-day requirements.',
    count: 3,
    icon: <EmployeeIcon className="w-5 h-5" />,
    tint: 'bg-violet-50 text-violet-600',
    updated: 'Updated May 2026',
    rules: [
      { id: 'ON-01', title: 'Pre-start checklist', text: 'New hires must complete pre-start documents and required setup before their first day.', tags: ['documents', 'pre-start'] },
      { id: 'ON-02', title: 'Manager onboarding tasks', text: 'Managers must confirm onboarding plans, equipment readiness, and first-week schedule.', tags: ['manager', 'new hire'] },
      { id: 'ON-03', title: 'First-week guidance', text: 'First-week onboarding includes orientation, policy acknowledgement, and required training.', tags: ['training', 'orientation'] },
    ],
  },
];

export function Knowledge() {
  const [query, setQuery] = useState('');
  const [openName, setOpenName] = useState<string | null>(null);

  const normalizedQuery = query.toLowerCase();
  const filtered = categories
    .map((category) => ({
      ...category,
      rules: category.rules.filter((rule) =>
        !normalizedQuery ||
        category.name.toLowerCase().includes(normalizedQuery) ||
        category.description.toLowerCase().includes(normalizedQuery) ||
        rule.id.toLowerCase().includes(normalizedQuery) ||
        rule.title.toLowerCase().includes(normalizedQuery) ||
        rule.text.toLowerCase().includes(normalizedQuery) ||
        rule.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
      ),
    }))
    .filter((category) => category.rules.length > 0);

  return (
    <>
      <AppHeader title="Policy Library" subtitle="Policies and rule IDs used to route requests safely." />

      <div className="flex-1 px-8 py-6 og-scroll overflow-y-auto">
        <div className="max-w-6xl">
          <div className="og-panel p-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-stone-950">Policy grounding layer</p>
              <p className="text-xs text-stone-500">Stable rule IDs feed retrieval, citations, and review packets.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="og-soft-label">Used by RAG</span>
              <span className="og-soft-label">Stable rule IDs</span>
              <span className="og-soft-label">Read-only demo</span>
            </div>
          </div>

          <div className="relative mb-5 max-w-md">
            <SearchIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search policies…"
              className="og-input pl-9 pr-3 py-2.5 w-full text-sm placeholder:text-stone-400"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {filtered.map((cat) => {
              const open = openName === cat.name;
              return (
                <div key={cat.name} className="og-card overflow-hidden">
                  <button
                    onClick={() => setOpenName(open ? null : cat.name)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[#fff7f5] transition-colors"
                  >
                    <span className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${cat.tint} ring-1 ring-inset ring-black/5`}>
                      {cat.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-black text-stone-950">{cat.name}</p>
                        <span className="text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-100 rounded-full px-2 py-0.5">RAG</span>
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-2">{cat.description}</p>
                      <p className="mt-1 text-[11px] font-medium text-stone-400">{cat.updated}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
                      {cat.rules.length} rules
                    </span>
                  </button>
                  {open && (
                    <div className="px-5 pb-4 pt-1 border-t border-[#eadeda] og-fade-up">
                      <div className="grid gap-2.5 mt-3">
                        {cat.rules.map((rule) => (
                          <div key={rule.id} className="text-sm text-stone-700 bg-[#fff7f5] rounded-xl px-3 py-3 border border-[#eadeda]">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="text-[11px] font-mono font-bold text-brand-700 bg-white border border-brand-100 rounded-md px-1.5 py-0.5">
                                {rule.id}
                              </span>
                              <p className="font-black text-stone-900">{rule.title}</p>
                            </div>
                            <p className="text-xs leading-relaxed text-stone-600">{rule.text}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {rule.tags.map((tag) => (
                                <span key={tag} className="text-[10px] font-bold uppercase tracking-wide text-stone-400 bg-white/80 border border-[#eadeda] rounded-full px-2 py-0.5">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-stone-400">Citations link back to these stable rule IDs.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
