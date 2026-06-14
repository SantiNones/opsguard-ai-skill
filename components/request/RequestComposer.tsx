'use client';

import React, { useState } from 'react';
import { employees } from '@/data/enterprise/employees';
import { scenarioGroups, Scenario } from '@/lib/scenarios';
import { SparkleIcon, ArrowRightIcon } from '@/components/ui/Icons';

interface RequestComposerProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing?: boolean;
}

export function RequestComposer({
  value,
  onChange,
  onAnalyze,
  isAnalyzing = false,
}: RequestComposerProps) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [recommendedPersona, setRecommendedPersona] = useState<string | null>(null);

  const handleScenarioClick = (scenario: Scenario) => {
    onChange(scenario.text);
    setSelectedLabel(scenario.label);
    setRecommendedPersona(scenario.persona ?? null);
  };

  const recommendedEmployee = recommendedPersona
    ? employees.find((employee) => employee.employeeId === recommendedPersona)
    : null;

  return (
    <div className="og-card p-5 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 via-brand-600 to-[#ff7a59]" />
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center ring-1 ring-brand-100">
            <SparkleIcon className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-base font-bold text-stone-950 tracking-tight">Route a request</h2>
            <p className="text-xs text-stone-500">Policy, data, review, or restriction.</p>
          </div>
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (e.target.value !== value) {
            setSelectedLabel(null);
            setRecommendedPersona(null);
          }
        }}
        placeholder="Describe your HR request, or pick a scenario below…"
        className="og-input w-full h-[120px] p-3.5 resize-none text-sm placeholder:text-stone-400"
      />

      <button
        onClick={onAnalyze}
        disabled={!value.trim() || isAnalyzing}
        className="og-btn-primary mt-3 w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm"
      >
        {isAnalyzing ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Routing…
          </>
        ) : (
          <>
            Route request
            <ArrowRightIcon className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Grouped Scenarios */}
      <div className="mt-5 pt-5 border-t border-[#eadeda]">
        <div className="flex items-baseline justify-between gap-3 mb-0.5">
          <p className="text-sm font-bold text-stone-800">Or try a scenario</p>
          {recommendedEmployee && (
            <p className="text-[11px] font-medium text-stone-400">
              Recommended role: {recommendedEmployee.role === 'hr_ops' ? 'HR Ops' : recommendedEmployee.role === 'manager' ? 'Manager' : recommendedEmployee.role === 'payroll_admin' ? 'Payroll Admin' : 'Employee'}
            </p>
          )}
        </div>
        <p className="text-xs text-stone-400 mb-4">
          Choose a scenario to see how OpsGuard routes different HR workflows.
        </p>
        <div className="space-y-4">
          {scenarioGroups.map((group) => (
            <div key={group.group}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-1.5 h-1.5 rounded-full ${group.bgColor} ring-2 ring-inset ${group.borderColor}`} />
                <p className={`text-[11px] font-bold uppercase tracking-[0.12em] ${group.color}`}>
                  {group.group}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {group.scenarios.map((scenario) => {
                  const isSelected = selectedLabel === scenario.label;
                  return (
                    <button
                      key={scenario.label}
                      onClick={() => handleScenarioClick(scenario)}
                      className={`min-h-[48px] px-3 py-2 rounded-xl text-left text-xs font-bold leading-snug transition-all border flex items-center ${
                        isSelected
                          ? `${group.bgColor} ${group.color} ${group.borderColor} shadow-sm`
                          : 'bg-white/78 text-stone-600 border-[#eadeda] hover:border-brand-200 hover:bg-[#fff7f5] hover:text-brand-700'
                      }`}
                    >
                      {scenario.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
