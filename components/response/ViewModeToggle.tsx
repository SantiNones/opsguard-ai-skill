'use client';

import { EmployeeIcon, HROpsIcon } from '@/components/ui/Icons';

type ViewMode = 'employee' | 'hr';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  const modes = [
    { value: 'employee' as ViewMode, label: 'Employee View', icon: <EmployeeIcon className="w-4 h-4" /> },
    { value: 'hr' as ViewMode, label: 'HR Review View', icon: <HROpsIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="inline-flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
      {modes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => onViewModeChange(mode.value)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            viewMode === mode.value
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          {mode.icon}
          <span>{mode.label}</span>
        </button>
      ))}
    </div>
  );
}
