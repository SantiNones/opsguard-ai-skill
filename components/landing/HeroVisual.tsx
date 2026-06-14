'use client';

import { DocumentIcon, HROpsIcon, CheckIcon } from '@/components/ui/Icons';

/**
 * Original abstract hero visual built in CSS/SVG.
 *
 * Communicates: an incoming request being routed through policy grounding
 * and human review toward a trusted, approved outcome. Soft rose glow,
 * glassy floating cards, connecting route lines, and a handshake motif.
 *
 * No cartoon people, no stock illustration, no network-diagram look.
 */
export function HeroVisual() {
  return (
    <div className="relative w-full h-full min-h-[360px] select-none">
      {/* Soft ambient glow */}
      <div className="absolute inset-0 og-glow rounded-3xl" />

      {/* Connecting route lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400" fill="none" preserveAspectRatio="xMidYMid meet">
        <path d="M90 110 C 170 120, 180 200, 250 200" stroke="url(#og-line)" strokeWidth="2" strokeDasharray="4 6" strokeLinecap="round" />
        <path d="M110 290 C 180 280, 190 210, 250 200" stroke="url(#og-line)" strokeWidth="2" strokeDasharray="4 6" strokeLinecap="round" />
        <path d="M250 200 C 300 200, 310 150, 330 150" stroke="url(#og-line)" strokeWidth="2" strokeDasharray="4 6" strokeLinecap="round" />
        <defs>
          <linearGradient id="og-line" x1="0" y1="0" x2="400" y2="400" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fb7088" />
            <stop offset="1" stopColor="#ff7a59" />
          </linearGradient>
        </defs>
      </svg>

      {/* Incoming request card (top-left) */}
      <div className="absolute left-[6%] top-[16%] og-float">
        <div className="og-card px-4 py-3 w-44 backdrop-blur-sm bg-white/85">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <DocumentIcon className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Request</span>
          </div>
          <div className="space-y-1.5">
            <div className="h-1.5 rounded-full bg-stone-200 w-full" />
            <div className="h-1.5 rounded-full bg-stone-200 w-3/4" />
          </div>
        </div>
      </div>

      {/* Policy document card (bottom-left) */}
      <div className="absolute left-[10%] bottom-[12%] og-float-delayed">
        <div className="og-card px-4 py-3 w-40 backdrop-blur-sm bg-white/85">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DocumentIcon className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Policy</span>
          </div>
          <div className="text-[11px] font-medium text-stone-600">VL-01 · Leave</div>
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-20 h-20 og-float">
          <div className="absolute inset-0 rounded-full bg-white/75 border border-brand-100 shadow-[0_20px_50px_-24px_rgba(190,18,60,0.55)] backdrop-blur" />
          <div className="absolute left-1/2 top-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full og-brand-gradient shadow-[0_0_0_8px_rgba(244,63,94,0.08)]" />
          <div className="absolute left-4 top-4 w-2.5 h-2.5 rounded-full bg-brand-200" />
          <div className="absolute right-4 top-5 w-2.5 h-2.5 rounded-full bg-[#ffb199]" />
          <div className="absolute left-5 bottom-4 w-2.5 h-2.5 rounded-full bg-emerald-200" />
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 80" fill="none">
            <path d="M22 22 C 32 28, 34 34, 40 40" stroke="#f43f5e" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
            <path d="M58 25 C 49 29, 46 34, 40 40" stroke="#ff7a59" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
            <path d="M25 59 C 32 52, 35 47, 40 40" stroke="#f43f5e" strokeWidth="1.6" strokeLinecap="round" opacity="0.42" />
          </svg>
        </div>
      </div>

      {/* Human review card (right) */}
      <div className="absolute right-[8%] top-[20%] og-float-delayed">
        <div className="og-card px-4 py-3 w-44 backdrop-blur-sm bg-white/85">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <HROpsIcon className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Human review</span>
          </div>
          <div className="text-[11px] font-medium text-stone-600">Routed to HR Ops</div>
        </div>
      </div>

      {/* Approved outcome chip (bottom-right) */}
      <div className="absolute right-[12%] bottom-[18%] og-float">
        <div className="og-card px-3.5 py-2.5 flex items-center gap-2 backdrop-blur-sm bg-white/90">
          <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckIcon className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-semibold text-stone-700">Resolved safely</span>
        </div>
      </div>
    </div>
  );
}
