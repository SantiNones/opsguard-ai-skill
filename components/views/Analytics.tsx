'use client';

import type { CSSProperties } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';

interface Metric {
  label: string;
  value: string;
  sub: string;
  trend?: string;
  trendUp?: boolean;
  accentStyle: CSSProperties;
}

const metrics: Metric[] = [
  { label: 'Auto-answer rate', value: '62%', sub: 'of all requests', trend: '+4%', trendUp: true, accentStyle: { background: 'linear-gradient(90deg, #34d399, #14b8a6)' } },
  { label: 'Escalation rate', value: '18%', sub: 'routed to specialists', trend: '-2%', trendUp: false, accentStyle: { background: 'linear-gradient(90deg, #fb7185, #e11d48)' } },
  { label: 'Confidence average', value: '0.78', sub: 'across resolved cases', trend: '+0.03', trendUp: true, accentStyle: { background: 'linear-gradient(90deg, #a78bfa, #d946ef)' } },
  { label: 'Access restricted', value: '7', sub: 'blocked this week', trend: '+1', trendUp: false, accentStyle: { background: 'linear-gradient(90deg, #a8a29e, #57534e)' } },
  { label: 'Policy coverage', value: '25', sub: 'rules across 5 domains', accentStyle: { background: 'linear-gradient(90deg, #fbbf24, #f97316)' } },
  { label: 'Estimated AI cost', value: '$0.00', sub: 'deterministic mode', accentStyle: { background: 'linear-gradient(90deg, #38bdf8, #06b6d4)' } },
];

const routeBreakdown = [
  { label: 'Answer directly', pct: 62, color: 'bg-emerald-400' },
  { label: 'Draft action', pct: 14, color: 'bg-sky-400' },
  { label: 'Escalate', pct: 18, color: 'bg-rose-400' },
  { label: 'Ask for info', pct: 6, color: 'bg-amber-400' },
];

export function Analytics() {
  return (
    <>
      <AppHeader title="Analytics" subtitle="How OpsGuard is routing HR Operations requests." />

      <div className="flex-1 px-8 py-6 og-scroll overflow-y-auto">
        <div className="max-w-6xl space-y-5">
          <div className="og-panel p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-stone-950">Routing intelligence</p>
              <p className="text-sm text-stone-500">Operational signals from request routing, retrieval, access checks, and review outcomes.</p>
            </div>
            <span className="og-soft-label">Demo telemetry · last 7 days</span>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((m) => (
              <div key={m.label} className="og-card p-5 relative overflow-hidden">
                <span className="absolute inset-x-0 top-0 h-1" style={m.accentStyle} />
                <p className="text-xs font-bold text-stone-400 uppercase tracking-[0.11em] mb-2">{m.label}</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black tracking-tight text-stone-950">{m.value}</span>
                  {m.trend && (
                    <span className={`text-xs font-bold mb-1 px-2 py-0.5 rounded-full ${m.trendUp ? 'text-emerald-700 bg-emerald-50' : 'text-stone-500 bg-stone-100'}`}>
                      {m.trend}
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-stone-400 mt-1">{m.sub}</p>
              </div>
            ))}
          </div>

          {/* Route distribution */}
          <div className="og-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-base font-black text-stone-950">Route distribution</p>
                <p className="text-xs text-stone-500">How requests resolved across the current demo dataset.</p>
              </div>
              <span className="og-soft-label">100 routed</span>
            </div>
            <div className="flex h-4 rounded-full overflow-hidden mb-5 bg-stone-100 ring-1 ring-[#eadeda]">
              {routeBreakdown.map((r) => (
                <div key={r.label} className={r.color} style={{ width: `${r.pct}%` }} title={`${r.label}: ${r.pct}%`} />
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {routeBreakdown.map((r) => (
                <div key={r.label} className="flex items-center gap-2 rounded-2xl bg-[#fff7f5] border border-[#eadeda] p-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${r.color}`} />
                  <div>
                    <p className="text-sm font-black text-stone-900">{r.pct}%</p>
                    <p className="text-xs text-stone-400">{r.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-stone-400">
            Illustrative demo metrics. Production would aggregate from the resolver&apos;s observability records.
          </p>
        </div>
      </div>
    </>
  );
}
