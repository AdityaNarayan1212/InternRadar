import { Link } from 'react-router-dom';
import { MapPin, Bookmark } from 'lucide-react';
import type { Internship } from '../types';
import FitScoreBadge from './FitScoreBadge';
import UnderratedBadge from './UnderratedBadge';
import DeadlineChip from './DeadlineChip';

interface InternshipCardProps {
  internship: Internship;
  onToggleSave?: (id: string) => void;
  isTogglingSave?: boolean;
}

function formatStipend(min?: number, max?: number): string | null {
  if (min == null && max == null) return null;
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  if (min != null && max != null && min !== max) return `${fmt(min)}–${fmt(max)}/mo`;
  return `${fmt(min ?? max ?? 0)}/mo`;
}

// Underrated = the low-visibility org categories InternRadar exists to
// surface (government/defence/research), mirrored from the same rule the
// backend uses to derive this - there's no separate flag in the data.
function isUnderrated(type: Internship['type']) {
  return type === 'GOVERNMENT' || type === 'RESEARCH';
}

export default function InternshipCard({
  internship,
  onToggleSave,
  isTogglingSave,
}: InternshipCardProps) {
  const stipend = formatStipend(internship.stipendMin, internship.stipendMax);

  return (
    <div className="relative rounded-xl ring-1 ring-[#E4E7EC] bg-white p-4 hover:shadow-md transition-shadow flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm shrink-0">
            {internship.company.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[#5B6270] truncate">{internship.company}</p>
            <Link
              to={`/internships/${internship.id}`}
              className="font-semibold text-[#111317] hover:text-primary-600 leading-snug line-clamp-2"
            >
              {internship.title}
            </Link>
          </div>
        </div>
        <FitScoreBadge score={internship.fitScore} size="card" className="shrink-0" />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5B6270]">
        {internship.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" strokeWidth={2} />
            {internship.location}
            {internship.isRemote ? ' · Remote' : ''}
          </span>
        )}
        {!internship.location && internship.isRemote && <span>Remote</span>}
        {internship.duration && <span>{internship.duration}</span>}
        {stipend && <span>{stipend}</span>}
      </div>

      <div className="flex items-center gap-2">
        {isUnderrated(internship.type) && <UnderratedBadge />}
        <DeadlineChip deadline={internship.deadline} status={internship.status} />
        {onToggleSave && (
          <button
            type="button"
            onClick={() => onToggleSave(internship.id)}
            disabled={isTogglingSave}
            aria-pressed={internship.isSaved}
            aria-label={internship.isSaved ? 'Remove from shortlist' : 'Save to shortlist'}
            className={`ml-auto w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              internship.isSaved
                ? 'text-primary-600 bg-primary-50'
                : 'text-[#5B6270] hover:bg-[#FAFBFC]'
            }`}
          >
            <Bookmark
              className="w-4 h-4"
              strokeWidth={2}
              fill={internship.isSaved ? 'currentColor' : 'none'}
            />
          </button>
        )}
      </div>
    </div>
  );
}
