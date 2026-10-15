import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bookmark, ExternalLink, Loader2, MapPin } from 'lucide-react';
import Navbar from '../components/Navbar';
import EmptyState from '../components/EmptyState';
import FitScoreBadge from '../components/FitScoreBadge';
import SkillChip from '../components/SkillChip';
import UnderratedBadge from '../components/UnderratedBadge';
import DeadlineChip from '../components/DeadlineChip';
import { useAuth } from '../context/useAuth';
import { fetchInternshipById, toggleSaveInternship, updateApplicationStatus } from '../lib/internships';
import type { ApplicationStatus, Internship } from '../types';

const STATUS_OPTIONS: ApplicationStatus[] = ['SAVED', 'APPLIED', 'INTERVIEW', 'REJECTED', 'SELECTED'];

function isUnderrated(type: Internship['type']) {
  return type === 'GOVERNMENT' || type === 'RESEARCH';
}

function formatStipend(min?: number, max?: number): string | null {
  if (min == null && max == null) return null;
  const fmt = (n: number) => `\u20b9${n.toLocaleString('en-IN')}`;
  if (min != null && max != null && min !== max) return `${fmt(min)}\u2013${fmt(max)} / month`;
  return `${fmt(min ?? max ?? 0)} / month`;
}

export default function InternshipDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: internship,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['internship', id],
    queryFn: () => fetchInternshipById(id as string),
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: () => toggleSaveInternship(id as string),
    onSuccess: (saved) => {
      queryClient.setQueryData<Internship>(['internship', id], (old) =>
        old ? { ...old, isSaved: saved, applicationStatus: saved ? 'SAVED' : undefined } : old
      );
      queryClient.invalidateQueries({ queryKey: ['internships'] });
      queryClient.invalidateQueries({ queryKey: ['saved'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: ApplicationStatus) => updateApplicationStatus(id as string, status),
    onSuccess: (_, status) => {
      queryClient.setQueryData<Internship>(['internship', id], (old) =>
        old ? { ...old, applicationStatus: status } : old
      );
      queryClient.invalidateQueries({ queryKey: ['saved'] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <Navbar />
        <div className="flex items-center justify-center py-24 text-[#5B6270]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading internship...
        </div>
      </div>
    );
  }

  if (isError || !internship) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <EmptyState
            title="Internship not found"
            message="It may have been removed, or the link is incorrect."
            actionLabel="Back to internships"
          />
        </div>
      </div>
    );
  }

  const stipend = formatStipend(internship.stipendMin, internship.stipendMax);
  const sourceCaption = internship.verified
    ? `Synced from ${internship.source}`
    : 'Added by InternRadar team';

  const fitPanel = (
    <div className="rounded-xl ring-1 ring-[#E4E7EC] bg-white p-5 flex flex-col items-center text-center">
      <FitScoreBadge score={internship.fitScore} size="detail" />

      {internship.fitScore !== undefined && (
        <div className="w-full mt-5 text-left">
          {internship.matchedSkills && internship.matchedSkills.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-[#5B6270] uppercase tracking-wide mb-1.5">
                Matched
              </p>
              <div className="flex flex-wrap gap-1.5">
                {internship.matchedSkills.map((s) => (
                  <SkillChip key={s} label={s} variant="matched" />
                ))}
              </div>
            </div>
          )}
          {internship.missingSkills && internship.missingSkills.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#5B6270] uppercase tracking-wide mb-1.5">
                Missing
              </p>
              <div className="flex flex-wrap gap-1.5">
                {internship.missingSkills.map((s) => (
                  <SkillChip key={s} label={s} variant="missing" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="w-full mt-5 flex flex-col gap-2">
        {user ? (
          <>
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                internship.isSaved
                  ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              <Bookmark className="w-4 h-4" fill={internship.isSaved ? 'currentColor' : 'none'} />
              {internship.isSaved ? 'Saved to shortlist' : 'Save to shortlist'}
            </button>

            {internship.isSaved && (
              <select
                value={internship.applicationStatus ?? 'SAVED'}
                onChange={(e) => statusMutation.mutate(e.target.value as ApplicationStatus)}
                disabled={statusMutation.isPending}
                className="w-full rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm bg-white"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            )}
          </>
        ) : (
          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-primary-50 text-primary-700 ring-1 ring-primary-200 hover:bg-primary-100"
          >
            <Bookmark className="w-4 h-4" />
            Log in to save to your shortlist
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Link
          to="/internships"
          className="inline-flex items-center gap-1.5 text-sm text-[#5B6270] hover:text-[#111317] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to internships
        </Link>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 min-w-0">
            <div className="rounded-xl ring-1 ring-[#E4E7EC] bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm text-[#5B6270]">{internship.company}</p>
                  <h1 className="text-2xl font-bold text-[#111317] mt-0.5">{internship.title}</h1>
                </div>
                <a
                  href={internship.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700 shrink-0"
                >
                  Apply on official site
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                {isUnderrated(internship.type) && <UnderratedBadge />}
                <DeadlineChip
                  deadline={internship.deadline}
                  reopenDate={internship.reopenDate}
                  status={internship.status}
                />
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm">
                {internship.location && (
                  <div>
                    <dt className="text-[#5B6270]">Location</dt>
                    <dd className="text-[#111317] font-medium flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {internship.location}
                      {internship.isRemote ? ' \u00b7 Remote' : ''}
                    </dd>
                  </div>
                )}
                {internship.duration && (
                  <div>
                    <dt className="text-[#5B6270]">Duration</dt>
                    <dd className="text-[#111317] font-medium mt-0.5">{internship.duration}</dd>
                  </div>
                )}
                {stipend && (
                  <div>
                    <dt className="text-[#5B6270]">Stipend</dt>
                    <dd className="text-[#111317] font-medium mt-0.5">{stipend}</dd>
                  </div>
                )}
                {internship.criteria && (
                  <div>
                    <dt className="text-[#5B6270]">Eligibility</dt>
                    <dd className="text-[#111317] font-medium mt-0.5">{internship.criteria}</dd>
                  </div>
                )}
              </dl>

              {internship.description && (
                <div className="mt-6">
                  <h2 className="font-semibold text-[#111317] mb-2">About this internship</h2>
                  <p className="text-sm text-[#5B6270] leading-relaxed whitespace-pre-line">
                    {internship.description}
                  </p>
                </div>
              )}

              {internship.skillsReq.length > 0 && (
                <div className="mt-6">
                  <h2 className="font-semibold text-[#111317] mb-2">Required skills</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {internship.skillsReq.map((s) => (
                      <SkillChip key={s} label={s} variant="neutral" />
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-[#5B6270] mt-6">{sourceCaption}</p>
            </div>
          </div>

          <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-4">{fitPanel}</div>
        </div>
      </div>
    </div>
  );
}
