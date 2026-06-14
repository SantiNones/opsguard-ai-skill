'use client';

import { useEffect, useState } from 'react';

const STEPS = [
  'Retrieving policy context',
  'Checking enterprise permissions',
  'Classifying risk',
  'Applying safety rules',
  'Preparing employee answer',
  'Preparing HR packet',
];

const STEP_INTERVAL_MS = 420;

interface LoadingSequenceProps {
  isActive: boolean;
}

export function LoadingSequence({ isActive }: LoadingSequenceProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, STEP_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      setCurrentStep(0); // reset for next activation
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="og-card p-5 og-fade-up">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-stone-700">Routing your request</p>
      </div>
      <ul className="space-y-2.5">
        {STEPS.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          const pending = i > currentStep;

          return (
            <li key={step} className="flex items-center gap-2.5 text-sm">
              <span className="shrink-0 w-4 h-4 flex items-center justify-center">
                {done && (
                  <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {active && (
                  <span className="w-3 h-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin block" />
                )}
                {pending && <span className="w-2 h-2 rounded-full bg-stone-200 block" />}
              </span>
              <span className={done ? 'text-stone-400' : active ? 'text-stone-900 font-medium' : 'text-stone-400'}>
                {step}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
