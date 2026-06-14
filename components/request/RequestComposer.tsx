'use client';

import React, { useState } from 'react';
import { scenarioGroups, Scenario } from '@/lib/scenarios';

interface RequestComposerProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  onPersonaChange?: (actorId: string) => void;
  isAnalyzing?: boolean;
}

export function RequestComposer({
  value,
  onChange,
  onAnalyze,
  onPersonaChange,
  isAnalyzing = false,
}: RequestComposerProps) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const handleScenarioClick = (scenario: Scenario) => {
    onChange(scenario.text);
    setSelectedLabel(scenario.label);
    if (scenario.persona && onPersonaChange) {
      onPersonaChange(scenario.persona);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Request
        </h2>

        <textarea
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (e.target.value !== value) setSelectedLabel(null);
          }}
          placeholder="Paste an HR Operations request here..."
          className="w-full h-36 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-700 placeholder:text-gray-400"
        />

        {/* Grouped Scenarios */}
        <div className="mt-4 space-y-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Demo scenarios</p>
          {scenarioGroups.map((group) => (
            <div key={group.group}>
              <p className={`text-xs font-semibold mb-1.5 ${group.color}`}>
                {group.group}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.scenarios.map((scenario) => {
                  const isSelected = selectedLabel === scenario.label;
                  return (
                    <button
                      key={scenario.label}
                      onClick={() => handleScenarioClick(scenario)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                        isSelected
                          ? `${group.bgColor} ${group.color} ${group.borderColor}`
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-gray-700'
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

        <button
          onClick={onAnalyze}
          disabled={!value.trim() || isAnalyzing}
          className="mt-5 w-full bg-red-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-red-700 active:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {isAnalyzing ? 'Analyzing…' : 'Analyze request'}
        </button>
      </div>
    </div>
  );
}
