'use client';

import { EmployeeRole } from '@/data/enterprise/employees';
import { roleDefinitions, roleOrder } from '@/lib/roleConfig';
import { Logo } from '@/components/ui/Logo';
import { HeroVisual } from '@/components/landing/HeroVisual';
import {
  EmployeeIcon,
  ManagerIcon,
  HROpsIcon,
  PayrollIcon,
  ArrowRightIcon,
} from '@/components/ui/Icons';

interface LandingScreenProps {
  onEnter: (role: EmployeeRole) => void;
}

const roleIcons: Record<EmployeeRole, React.ReactNode> = {
  employee: <EmployeeIcon className="w-5 h-5" />,
  manager: <ManagerIcon className="w-5 h-5" />,
  hr_ops: <HROpsIcon className="w-5 h-5" />,
  payroll_admin: <PayrollIcon className="w-5 h-5" />,
};

export function LandingScreen({ onEnter }: LandingScreenProps) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-44 -right-32 w-[680px] h-[680px] rounded-full og-glow blur-2xl opacity-90" />
      <div className="pointer-events-none absolute left-[-18rem] bottom-[-22rem] w-[720px] h-[720px] rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.08),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/50 to-transparent" />

      <div className="relative max-w-6xl mx-auto px-6 py-7 lg:py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-10 lg:mb-12">
          <Logo
            size={108}
            markClassName="relative inline-flex items-center justify-center -mr-4"
            wordmarkClassName="text-[25px] font-semibold tracking-[-0.045em] text-stone-950"
            className="flex items-center gap-0"
          />
          <span className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-stone-600 px-3.5 py-2 rounded-full border border-[#eadeda] bg-white/75 shadow-sm backdrop-blur">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Demo workspace · no real data
          </span>
        </div>

        {/* Hero */}
        <div className="grid lg:grid-cols-[0.96fr_1.04fr] gap-9 lg:gap-12 items-center mb-10 lg:mb-12">
          <div className="og-fade-up">
            <span className="og-soft-label mb-5">
              <span className="w-1.5 h-1.5 rounded-full og-brand-gradient" />
              HR operations, safely routed
            </span>
            <h1 className="text-5xl lg:text-6xl font-semibold tracking-[-0.045em] leading-[1.04] text-stone-950">
              AI does not just answer.
              <br />
              <span className="og-brand-text font-bold">It routes.</span>
            </h1>
            <p className="mt-5 text-base lg:text-lg text-stone-600 max-w-lg leading-relaxed">
              Resolve HR Operations requests with policy grounding, permissioned
              context, and human review.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {['Policy grounded', 'Permissioned context', 'Human-in-the-loop'].map((tag) => (
                <span
                  key={tag}
                  className="og-chip shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="h-[360px] lg:h-[430px] og-panel relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_45%)]" />
            <HeroVisual />
          </div>
        </div>

        {/* Role cards */}
        <div className="og-fade-up">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <p className="og-section-title mb-1">Continue as</p>
              <p className="text-sm text-stone-500">Choose a workspace lens for the demo.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roleOrder.map((role) => {
              const def = roleDefinitions[role];
              return (
                <button
                  key={role}
                  onClick={() => onEnter(role)}
                  className="group og-card min-h-[190px] p-5 text-left relative overflow-hidden hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-brand-200"
                >
                  <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 via-brand-600 to-[#ff7a59] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="inline-flex w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 items-center justify-center mb-4 ring-1 ring-brand-100 group-hover:og-brand-gradient group-hover:text-white transition-all group-hover:scale-105">
                    {roleIcons[role]}
                  </span>
                  <h3 className="text-[15px] font-bold text-stone-950 mb-1">{def.title}</h3>
                  <p className="text-[13px] text-stone-500 leading-relaxed mb-5 min-h-[52px]">{def.description}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700">
                    Enter workspace
                    <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-10 text-center text-xs text-stone-400">
          Secure. Private. Built for HR Operations. — All data is fictitious for demonstration.
        </p>
      </div>
    </div>
  );
}
