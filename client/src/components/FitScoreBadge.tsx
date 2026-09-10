import { Lock } from 'lucide-react';

interface FitScoreBadgeProps {
  /** Undefined = locked (no resume/analysis yet) - never render as 0. */
  score?: number;
  size?: 'card' | 'detail' | 'compact';
  /** Shown under the lock icon when locked. Keep short. */
  lockedLabel?: string;
  className?: string;
}

function tierFor(score: number): { text: string; bg: string; ring: string } {
  if (score >= 80) return { text: 'text-fit-green', bg: 'bg-fit-green/10', ring: 'ring-fit-green/30' };
  if (score >= 55) return { text: 'text-fit-amber', bg: 'bg-fit-amber/10', ring: 'ring-fit-amber/30' };
  return { text: 'text-fit-red', bg: 'bg-fit-red/10', ring: 'ring-fit-red/30' };
}

const SIZE_STYLES = {
  card: { wrap: 'px-2.5 py-1', num: 'text-lg', label: 'text-[10px]' },
  compact: { wrap: 'px-2 py-0.5', num: 'text-sm', label: 'text-[9px]' },
  detail: { wrap: 'px-6 py-4', num: 'text-5xl', label: 'text-xs' },
} as const;

export default function FitScoreBadge({
  score,
  size = 'card',
  lockedLabel = 'Upload resume to see your match',
  className = '',
}: FitScoreBadgeProps) {
  const s = SIZE_STYLES[size];

  if (score === undefined) {
    return (
      <div
        className={`inline-flex flex-col items-center justify-center rounded-xl ring-1 ring-[#E4E7EC] bg-[#FAFBFC] text-[#5B6270] ${s.wrap} ${className}`}
        title={lockedLabel}
      >
        <Lock className={size === 'detail' ? 'w-6 h-6' : 'w-3.5 h-3.5'} strokeWidth={1.75} />
        {size === 'detail' && (
          <span className={`mt-1 ${s.label} text-center max-w-[10rem] leading-tight`}>{lockedLabel}</span>
        )}
      </div>
    );
  }

  const rounded = Math.round(score);
  const tier = tierFor(rounded);

  return (
    <div
      className={`inline-flex flex-col items-center justify-center rounded-xl ring-1 ${tier.ring} ${tier.bg} ${className}`}
    >
      <span className={`font-bold leading-none ${s.num} ${tier.text} ${s.wrap}`}>
        {rounded}%
      </span>
      {size === 'detail' && (
        <span className={`${s.label} text-[#5B6270] pb-3 -mt-2`}>Fit Score</span>
      )}
    </div>
  );
}
