import { useState } from 'react';
import { Clock } from 'lucide-react';
import type { InternshipStatus } from '../types';

interface DeadlineChipProps {
  deadline?: string;
  status?: InternshipStatus;
  className?: string;
}

export default function DeadlineChip({ deadline, status, className = '' }: DeadlineChipProps) {
  // Date.now() is impure to call directly in render (React's purity lint
  // flags it) - snapshot it once per mount instead.
  const [now] = useState(() => Date.now());

  const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium';
  const neutral = `${base} bg-[#FAFBFC] text-[#5B6270] ring-1 ring-[#E4E7EC]`;
  const amber = `${base} bg-fit-amber/10 text-fit-amber ring-1 ring-fit-amber/30`;
  const red = `${base} bg-fit-red/10 text-fit-red ring-1 ring-fit-red/30`;

  if (status === 'CLOSED') {
    return <span className={`${neutral} ${className}`}>Closed</span>;
  }
  if (status === 'REOPENING') {
    return <span className={`${neutral} ${className}`}>Reopening soon</span>;
  }
  if (!deadline) {
    return <span className={`${neutral} ${className}`}>No deadline listed</span>;
  }

  const daysLeft = Math.ceil((new Date(deadline).getTime() - now) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return <span className={`${neutral} ${className}`}>Deadline passed</span>;
  }

  const label =
    daysLeft === 0 ? 'Due today' : daysLeft === 1 ? 'Due tomorrow' : `${daysLeft}d left`;

  const style = daysLeft <= 2 ? red : daysLeft <= 7 ? amber : neutral;

  return (
    <span className={`${style} ${className}`}>
      <Clock className="w-3 h-3" strokeWidth={2} />
      {label}
    </span>
  );
}
