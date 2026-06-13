'use client';

import React from 'react';

export function AppHeader() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-8 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          AI Operations Review Console
        </h1>
        
        <p className="mt-2 text-gray-600 max-w-2xl">
          Paste a sensitive HR Operations request. OpsGuard finds the safe route, 
          explains why, and prepares the handoff.
        </p>
        
        <div className="mt-4 flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-medium border border-red-100">
            AI does not just answer. It routes.
          </span>
        </div>
      </div>
    </header>
  );
}
