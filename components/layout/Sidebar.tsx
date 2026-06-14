'use client';

import React from 'react';
import { EmployeeRole, employees } from '@/data/enterprise/employees';
import { NavView, NAV_LABELS, roleDefinitions } from '@/lib/roleConfig';
import { Logo } from '@/components/ui/Logo';
import {
  ConsoleIcon,
  ReviewIcon,
  KnowledgeIcon,
  AnalyticsIcon,
  SettingsIcon,
  ArrowRightIcon,
} from '@/components/ui/Icons';

interface SidebarProps {
  role: EmployeeRole;
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  personaName: string;
  onSwitchRole: () => void;
}

const allViews: NavView[] = ['console', 'review', 'knowledge', 'analytics', 'settings'];

const viewIcons: Record<NavView, React.ReactNode> = {
  console: <ConsoleIcon className="w-[18px] h-[18px]" />,
  review: <ReviewIcon className="w-[18px] h-[18px]" />,
  knowledge: <KnowledgeIcon className="w-[18px] h-[18px]" />,
  analytics: <AnalyticsIcon className="w-[18px] h-[18px]" />,
  settings: <SettingsIcon className="w-[18px] h-[18px]" />,
};

function initials(name: string) {
  const parts = name.split(' ').filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function Sidebar({ role, activeView, onSelectView, personaName, onSwitchRole }: SidebarProps) {
  const def = roleDefinitions[role];
  const persona = employees.find((employee) => employee.name === personaName);
  const roleLabel: Record<EmployeeRole, string> = {
    employee: 'Employee',
    manager: 'Manager',
    hr_ops: 'HR Operations',
    payroll_admin: 'Payroll Admin',
  };
  const personaRole = persona ? roleLabel[persona.role] : def.title;
  const personaDetail = persona?.department ? `${personaRole} · ${persona.department}` : personaRole;

  return (
    <aside className="w-[272px] bg-white/82 backdrop-blur-xl border-r border-[#eadeda] flex flex-col h-screen sticky top-0 shadow-[18px_0_48px_-42px_rgba(120,38,56,0.42)]">
      <div className="px-5 py-5 border-b border-[#f3e8e4]">
        <Logo size={30} wordmarkClassName="text-xl font-semibold tracking-[-0.04em] text-stone-950" />
        <p className="mt-2 text-[11px] font-semibold text-stone-400 uppercase tracking-[0.16em]">Operations Console</p>
      </div>

      <nav className="flex-1 px-3 py-4 og-scroll overflow-y-auto">
        <p className="px-3 mb-2 og-section-title">Workspace</p>
        <ul className="space-y-1.5">
          {allViews.map((view) => {
            const accessible = def.views.includes(view);
            const isActive = activeView === view;
            return (
              <li key={view}>
                <button
                  disabled={!accessible}
                  onClick={() => accessible && onSelectView(view)}
                  title={accessible ? undefined : 'Not available for this role'}
                  className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-50 to-[#fff7f5] text-brand-700 shadow-sm ring-1 ring-brand-100'
                      : accessible
                      ? 'text-stone-600 hover:bg-[#fff7f5] hover:text-stone-950'
                      : 'text-stone-300 cursor-not-allowed bg-stone-50/50'
                  }`}
                >
                  {isActive && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full og-brand-gradient" />}
                  <span className={isActive ? 'text-brand-600' : accessible ? 'text-stone-400 group-hover:text-brand-500' : 'text-stone-300'}>{viewIcons[view]}</span>
                  <span className="flex-1 text-left">{NAV_LABELS[view]}</span>
                  {!accessible && (
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide bg-white border border-stone-200 rounded-full px-2 py-0.5">Locked</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Profile area */}
      <div className="px-3 pb-4 pt-3 border-t border-[#eadeda] bg-gradient-to-b from-transparent to-[#fff7f5]/70">
        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white/75 border border-[#eadeda] shadow-sm">
          <span className="w-11 h-11 rounded-2xl og-brand-gradient text-white text-xs font-black flex items-center justify-center shrink-0 shadow-[0_12px_28px_-16px_rgba(190,18,60,0.75)] ring-2 ring-white">
            {initials(personaName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-stone-950 truncate">{personaName}</p>
            <p className="text-xs font-medium text-stone-500 truncate">{personaDetail}</p>
          </div>
        </div>
        <button
          onClick={onSwitchRole}
          className="mt-1 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
        >
          Switch role
          <ArrowRightIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
