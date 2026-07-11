import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MapPin, ExternalLink, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { analyzeInternshipFit, fetchInternships, toggleSaveInternship } from '../lib/internships';
import { fetchSavedInternships } from '../lib/internships';
import { AiAnalysis, Internship, InternshipType } from '../types';

const TYPE_OPTIONS: { label: string; value: InternshipType | '' }[] = [
  { label: 'All types', value: '' },
  { label: 'Government', value: 'GOVERNMENT' },
  { label: 'Startup', value: 'STARTUP' },
  { label: 'Corporate', value: 'CORPORATE' },
  { label: 'Research', value: 'RESEARCH' },
];

export default function Dashboard() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<InternshipType | ''>('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [analysisState, setAnalysisState] = useState<
    Record<string, { loading: boolean; error?: string; data?: AiAnalysis; cached?: boolean }>
  >({});

  const queryClient = useQueryClient();

  const filters = {
    search: search || undefined,
    type: type || undefined,
    isRemote: remoteOnly || undefined,
    page,
    limit: 12,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['internships', filters],
    queryFn: () => fetchInternships(filters),
  });

  // Used only to know which internships are already saved, so the bookmark icon reflects real state
  const { data: saved } = useQuery({
    queryKey: ['savedInternships'],
    queryFn: fetchSavedInternships,
  });
  const savedIds = new Set((saved ?? []).map((s) => s.internshipId));

  const saveMutation = useMutation({
    mutationFn: toggleSaveInternship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedInternships'] });
    },
  });

  const internships = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">InternRadar</h1>
        <p className="text-gray-500 mt-1 mb-6">
          {pagination ? `${pagination.total} internships found` : 'Loading internships...'}
        </p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title or company..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as InternshipType | '');
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => {
                setRemoteOnly(e.target.checked);
                setPage(1);
              }}
            />
            Remote only
          </label>
        </div>

        {isLoading && <p className="text-gray-500">Loading internships...</p>}
        {isError && (
          <p className="text-red-500">
            Couldn't load internships. Is the backend running on the expected port?
          </p>
        )}

        {!isLoading && !isError && internships.length === 0 && (
          <p className="text-gray-500">
            No internships match your filters yet. Try clearing a filter, or run the seed script.
          </p>
        )}

        {/* Internship grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {internships.map((internship) => (
            <InternshipCard
              key={internship.id}
              internship={internship}
              isSaved={savedIds.has(internship.id)}
              onToggleSave={() => saveMutation.mutate(internship.id)}
              analysis={analysisState[internship.id]}
              onAnalyzeFit={async () => {
                setAnalysisState((prev) => ({
                  ...prev,
                  [internship.id]: { loading: true, error: undefined },
                }));

                try {
                  const result = await analyzeInternshipFit(internship.id);
                  setAnalysisState((prev) => ({
                    ...prev,
                    [internship.id]: {
                      loading: false,
                      data: result.data,
                      cached: result.cached,
                      error: undefined,
                    },
                  }));
                } catch {
                  setAnalysisState((prev) => ({
                    ...prev,
                    [internship.id]: {
                      loading: false,
                      error: 'Could not analyze fit right now.',
                    },
                  }));
                }
              }}
            />
          ))}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-3 py-1.5 text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InternshipCard({
  internship,
  isSaved,
  onToggleSave,
  analysis,
  onAnalyzeFit,
}: {
  internship: Internship;
  isSaved: boolean;
  onToggleSave: () => void;
  analysis?: { loading: boolean; error?: string; data?: AiAnalysis; cached?: boolean };
  onAnalyzeFit: () => Promise<void>;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900 leading-tight">{internship.title}</h3>
          <p className="text-sm text-gray-500">{internship.company}</p>
        </div>
        <button
          onClick={onToggleSave}
          aria-label={isSaved ? 'Unsave internship' : 'Save internship'}
          className="text-primary-600 shrink-0"
        >
          {isSaved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs">
        <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full">
          {internship.type}
        </span>
        {internship.isRemote && (
          <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full">Remote</span>
        )}
        {internship.verified && (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">Verified</span>
        )}
      </div>

      {internship.location && (
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <MapPin size={14} /> {internship.location}
        </p>
      )}

      {(internship.stipendMin || internship.stipendMax) && (
        <p className="text-sm text-gray-700">
          ₹{internship.stipendMin?.toLocaleString()} - ₹{internship.stipendMax?.toLocaleString()}
          {internship.duration ? ` · ${internship.duration}` : ''}
        </p>
      )}

      <button
        onClick={onAnalyzeFit}
        disabled={analysis?.loading}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {analysis?.loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Analyzing...
          </>
        ) : (
          'Analyze Fit'
        )}
      </button>

      {analysis?.cached && (
        <span className="inline-flex w-fit items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
          Cached Analysis
        </span>
      )}

      {analysis?.data && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-gray-700">Fit Score</span>
            <span className="font-semibold text-primary-700">{analysis.data.fitScore ?? 0}/100</span>
          </div>

          {analysis.data.matchReasons.length > 0 && (
            <div className="mt-2">
              <p className="font-medium text-gray-700">Match Reasons</p>
              <ul className="mt-1 list-disc pl-5 text-gray-600">
                {analysis.data.matchReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.data.missingSkills.length > 0 && (
            <div className="mt-2">
              <p className="font-medium text-gray-700">Missing Skills</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {analysis.data.missingSkills.map((skill) => (
                  <span key={skill} className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-600">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {analysis?.error && <p className="text-sm text-red-500">{analysis.error}</p>}

      <a
        href={internship.applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto pt-2 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
      >
        Apply <ExternalLink size={14} />
      </a>
    </div>
  );
}
