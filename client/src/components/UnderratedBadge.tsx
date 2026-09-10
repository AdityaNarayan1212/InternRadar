interface UnderratedBadgeProps {
  className?: string;
}

export default function UnderratedBadge({ className = '' }: UnderratedBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ring-1 ring-underrated text-underrated bg-underrated/5 ${className}`}
    >
      Underrated
    </span>
  );
}
