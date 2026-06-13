'use client';

import React from 'react';

const navItems = [
  { label: 'Review Console', active: true },
  { label: 'Evidence', active: false },
  { label: 'Evals', active: false },
  { label: 'Skill Contract', active: false },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">OG</span>
          </div>
          <span className="font-semibold text-gray-900 text-lg tracking-tight">OpsGuard</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.label}>
              <button
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-red-50 text-red-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-4 pb-4">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Weekend MVP
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            One focused workflow: request → decision → review packet.
          </p>
        </div>
      </div>
    </aside>
  );
}
