'use client';

import React from 'react';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function AppHeader({ title, subtitle, right }: AppHeaderProps) {
  return (
    <header className="bg-white/72 backdrop-blur-xl border-b border-[#eadeda] sticky top-0 z-10 shadow-[0_16px_42px_-40px_rgba(120,38,56,0.5)]">
      <div className="px-5 sm:px-8 py-[18px] flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="min-w-[260px] flex-1">
          <p className="og-section-title mb-1">OpsGuard</p>
          <h1 className="text-2xl font-black text-stone-950 tracking-[-0.035em] whitespace-nowrap">{title}</h1>
          {subtitle && <p className="mt-1 text-sm font-medium text-stone-500 max-w-2xl leading-snug">{subtitle}</p>}
        </div>
        {right && <div className="flex flex-wrap items-center gap-3 min-w-0">{right}</div>}
      </div>
    </header>
  );
}
