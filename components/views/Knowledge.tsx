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
  rules: string[];
}

const categories: PolicyCategory[] = [
  {
    name: 'Time Tracking Policy',
    description: 'Guidelines for clock-in, clock-out, overtime, and time corrections.',
    count: 5,
    icon: <ClockIcon className="w-5 h-5" />,
    tint: 'bg-rose-50 text-rose-600',
    updated: 'Updated May 2026',
    rules: ['TT-01 Missed clock-ins', 'TT-02 Manager approval', 'TT-03 Overtime corrections', 'TT-04 Audit trail'],
  },
  {
    name: 'Payroll Policy',
    description: 'Payroll cycles, payments, changes, and data protection.',
    count: 7,
    icon: <PayrollIcon className="w-5 h-5" />,
    tint: 'bg-amber-50 text-amber-600',
    updated: 'Updated Jun 2026',
    rules: ['PA-01 Cutoff dates', 'PA-02 Evidence required', 'PA-03 Bank changes', 'PA-04 Compensation'],
  },
  {
    name: 'Leave Policy',
    description: 'Vacation, sick leave, public holidays, and leave balance.',
    count: 6,
    icon: <CalendarIcon className="w-5 h-5" />,
    tint: 'bg-emerald-50 text-emerald-600',
    updated: 'Updated Apr 2026',
    rules: ['VL-01 Carryover', 'VL-02 Approval notice', 'VL-03 Balance inquiries', 'VL-04 Sick leave'],
  },
  {
    name: 'Remote Work Policy',
    description: 'Remote work, international work, and travel guidelines.',
    count: 4,
    icon: <GlobeIcon className="w-5 h-5" />,
    tint: 'bg-sky-50 text-sky-600',
    updated: 'Updated Mar 2026',
    rules: ['RW-01 Domestic remote', 'RW-02 Cross-border work', 'RW-03 Travel'],
  },
  {
    name: 'Onboarding Policy',
    description: 'Pre-start checklist, documents, and first-day requirements.',
    count: 3,
    icon: <EmployeeIcon className="w-5 h-5" />,
    tint: 'bg-violet-50 text-violet-600',
    updated: 'Updated May 2026',
    rules: ['ON-01 Pre-start checklist', 'ON-02 Documents', 'ON-03 First week'],
  },
];

export function Knowledge() {
  const [query, setQuery] = useState('');
  const [openName, setOpenName] = useState<string | null>(null);

  const filtered = categories.filter(
    (c) => !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <AppHeader title="Knowledge Base" subtitle="Policies and guides used to resolve requests." />

      <div className="flex-1 px-8 py-6 og-scroll overflow-y-auto">
        <div className="max-w-6xl">
          <div className="og-panel p-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-stone-950">Policy knowledge layer</p>
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
                      {cat.count} policies
                    </span>
                  </button>
                  {open && (
                    <div className="px-5 pb-4 pt-1 border-t border-[#eadeda] og-fade-up">
                      <div className="grid sm:grid-cols-2 gap-2 mt-3">
                        {cat.rules.map((r) => (
                          <div key={r} className="text-sm text-stone-700 bg-[#fff7f5] rounded-xl px-3 py-2.5 border border-[#eadeda]">
                            <span className="text-[11px] font-mono font-bold text-brand-700 bg-white border border-brand-100 rounded-md px-1.5 py-0.5 mr-2">
                              {r.split(' ')[0]}
                            </span>
                            {r.split(' ').slice(1).join(' ')}
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
