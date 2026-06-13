'use client';

import React from 'react';
import { ResolveOpsRequestOutput } from '@/lib/types';

interface WorkflowStepperProps {
  output: ResolveOpsRequestOutput | null;
}

const steps = [
  { id: 'request', label: 'Request' },
  { id: 'retrieve', label: 'Retrieve' },
  { id: 'risk', label: 'Risk' },
  { id: 'route', label: 'Route' },
  { id: 'review', label: 'Review' },
];

export function WorkflowStepper({ output }: WorkflowStepperProps) {
  const activeStep = output ? 4 : -1;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
          Workflow
        </h2>
        
        <div className="relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200">
            <div 
              className="h-full bg-red-500 transition-all duration-500"
              style={{ width: output ? '100%' : '0%' }}
            />
          </div>
          
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const isComplete = output && index <= activeStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors z-10 ${
                      isComplete
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {isComplete ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${isComplete ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
