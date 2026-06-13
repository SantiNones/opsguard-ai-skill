'use client';

import React, { useState } from 'react';
import { ExampleRequest } from '@/lib/types';

interface RequestComposerProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  examples: ExampleRequest[];
  isAnalyzing?: boolean;
}

export function RequestComposer({
  value,
  onChange,
  onAnalyze,
  examples,
  isAnalyzing = false,
}: RequestComposerProps) {
  const [selectedExample, setSelectedExample] = useState<string | null>(null);

  const handleExampleClick = (example: ExampleRequest) => {
    onChange(example.text);
    setSelectedExample(example.label);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
          Request
        </h2>
        
        <textarea
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (e.target.value !== value) {
              setSelectedExample(null);
            }
          }}
          placeholder="Paste an HR Operations request here..."
          className="w-full h-40 p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-700 placeholder:text-gray-400"
        />
        
        <div className="mt-4">
          <p className="text-xs text-gray-500 mb-2">Load example:</p>
          <div className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example.label}
                onClick={() => handleExampleClick(example)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedExample === example.label
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>
        
        <button
          onClick={onAnalyze}
          disabled={!value.trim() || isAnalyzing}
          className="mt-6 w-full bg-red-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze request'}
        </button>
      </div>
    </div>
  );
}
