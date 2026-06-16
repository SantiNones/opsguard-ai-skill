'use client';

import { EmployeeRole } from '@/data/enterprise/employees';
import { roleDefinitions } from '@/lib/roleConfig';
import { AppHeader } from '@/components/layout/AppHeader';
import { CheckIcon, LockIcon } from '@/components/ui/Icons';

interface SettingsProps {
  role: EmployeeRole;
  personaName: string;
}

interface SettingRow {
  label: string;
  value: string;
  note: string;
  locked?: boolean;
}

export function Settings({ role, personaName }: SettingsProps) {
  const def = roleDefinitions[role];

  const sections: { title: string; rows: SettingRow[] }[] = [
    {
      title: 'Workspace',
      rows: [
        { label: 'Demo role', value: def.title, note: `Acting as ${personaName}` },
        { label: 'Environment', value: 'Demo', note: 'Fictitious data — no real employees' },
        { label: 'Accessible views', value: `${def.views.length} of 5`, note: def.views.join(', ') },
      ],
    },
    {
      title: 'AI & Resolver',
      rows: [
        { label: 'Current resolver mode', value: 'Deterministic demo mode', note: 'Used for repeatable demos and deterministic evals' },
        { label: 'AI-assisted mode', value: 'Available via env', note: 'USE_AI=true enables AI-assisted routing with deterministic fallback' },
        { label: 'Model', value: 'gpt-4o-mini', note: 'Used only when AI mode is enabled outside the UI' },
        { label: 'Citation grounding', value: 'Enabled', note: 'AI may only cite retrieved rule IDs', locked: true },
      ],
    },
    {
      title: 'Safety & Access Control',
      rows: [
        { label: 'Safety overrides', value: 'Enforced', note: 'Payroll, compensation, cross-border never auto-approved', locked: true },
        { label: 'Role-based access', value: 'Enforced', note: 'Field-level permissions per role', locked: true },
        { label: 'Leave balance access', value: 'Restricted', note: 'Self, direct manager, and HR Ops only', locked: true },
      ],
    },
  ];

  return (
    <>
      <AppHeader title="Settings" subtitle="Demo configuration and guardrails." />

      <div className="flex-1 px-8 py-6 og-scroll overflow-y-auto">
        <div className="max-w-5xl space-y-6">
          <div className="og-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-stone-950">Workspace guardrails</p>
              <p className="text-sm text-stone-500">Demo controls are read-only. Safety, access control, and citation grounding stay enforced.</p>
            </div>
            <span className="og-soft-label">
              <LockIcon className="w-3.5 h-3.5" />
              Locked demo config
            </span>
          </div>

          <div className="og-card p-5">
            <p className="og-section-title mb-2">Resolver mode explained</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#fff7f5] border border-[#eadeda] p-4">
                <p className="text-sm font-black text-stone-950">Deterministic demo mode</p>
                <p className="mt-1 text-xs font-medium text-stone-500 leading-relaxed">
                  The demo uses deterministic routing for repeatable interviews, predictable manual QA, and local evals.
                </p>
              </div>
              <div className="rounded-2xl bg-white/70 border border-[#eadeda] p-4">
                <p className="text-sm font-black text-stone-950">AI-assisted mode</p>
                <p className="mt-1 text-xs font-medium text-stone-500 leading-relaxed">
                  AI mode can be enabled with USE_AI=true and falls back to deterministic rules when validation fails. This page is status-only and does not change environment settings.
                </p>
              </div>
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <p className="og-section-title mb-2.5">{section.title}</p>
              <div className="og-card divide-y divide-[#f5efec] overflow-hidden">
                {section.rows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[#fff7f5] transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-stone-950">{row.label}</p>
                      <p className="text-xs font-medium text-stone-500">{row.note}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {row.locked ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-full">
                          <LockIcon className="w-3 h-3" />
                          {row.value}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                          <CheckIcon className="w-3 h-3" />
                          {row.value}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <p className="text-xs text-stone-400 font-medium">
            Settings are read-only in this demo. Guardrails marked with a lock cannot be disabled.
          </p>
        </div>
      </div>
    </>
  );
}
