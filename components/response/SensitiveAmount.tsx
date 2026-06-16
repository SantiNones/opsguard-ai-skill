'use client';

import { EyeIcon } from '@/components/ui/Icons';

interface SensitiveAmountProps {
  value: string;
  visible: boolean;
  onToggle: () => void;
  className?: string;
  size?: 'sm' | 'lg';
  revealedClassName?: string;
}

export function SensitiveAmount({
  value,
  visible,
  onToggle,
  className = '',
  size = 'sm',
  revealedClassName = 'text-stone-900',
}: SensitiveAmountProps) {
  const amountSize = size === 'lg' ? 'text-lg mt-1' : 'text-sm';

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 ${className}`}
      aria-label={visible ? 'Hide sensitive payroll amount' : 'Reveal sensitive payroll amount'}
      aria-pressed={visible}
    >
      {visible && <EyeIcon className="w-3.5 h-3.5 text-stone-400" />}
      <span className={`${amountSize} font-bold ${visible ? revealedClassName : 'text-stone-900 blur-[5px] select-none'}`}>
        {value}
      </span>
    </button>
  );
}
