import type { ComponentType } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl ring-1 ring-[#E4E7EC] bg-[#FAFBFC] ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-white ring-1 ring-[#E4E7EC] flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-[#5B6270]" strokeWidth={1.75} />
      </div>
      <p className="font-semibold text-[#111317]">{title}</p>
      {message && <p className="text-sm text-[#5B6270] mt-1 max-w-sm">{message}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
