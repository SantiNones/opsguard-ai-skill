'use client';

import Image from 'next/image';

interface LogoProps {
  size?: number;          // logo mark size in px
  showWordmark?: boolean;
  wordmarkClassName?: string;
  markClassName?: string;
  className?: string;
}

/**
 * OpsGuard brand lockup — uses the real logo asset at
 * /assets/images/opsguard-logo.png plus an optional wordmark.
 */
export function Logo({ size = 32, showWordmark = true, wordmarkClassName, markClassName, className }: LogoProps) {
  return (
    <div className={className ?? 'flex items-center gap-3.5'}>
      <span className={markClassName ?? 'relative inline-flex items-center justify-center rounded-[1.35rem] bg-white p-2 shadow-[0_14px_34px_-20px_rgba(190,18,60,0.5)] ring-1 ring-rose-100'}>
        <Image
          src="/assets/images/opsguard-logo.png"
          alt="OpsGuard"
          width={size}
          height={size}
          priority
          className="object-contain"
        />
      </span>
      {showWordmark && (
        <span className={wordmarkClassName ?? 'text-lg font-semibold tracking-[-0.035em] text-stone-950'}>
          Ops<span className="og-brand-text">Guard</span>
        </span>
      )}
    </div>
  );
}
