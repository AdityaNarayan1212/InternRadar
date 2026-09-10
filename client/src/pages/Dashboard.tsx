import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Sparkles, TrendingUp } from 'lucide-react';
import Navbar from '../components/Navbar';
import InternshipCard from '../components/InternshipCard';
import { useAuth } from '../context/useAuth';
import { fetchInternships, fetchSaved, toggleSaveInternship } from '../lib/internships';
import type { Internship, PaginatedInternships, ShortlistItem } from '../types';

// Pulls a broad, fitScore-sorted snapshot once and derives both the "top
// matches" strip and the quick stats from it. Fine at this app's current
// scale (a few dozen listings) - a real-scale version would want a small
// dedicated stats endpoint instead of computing this client-side.
const SNAPSHOT_LIMIT = 50;
const TOP_MATCHES_COUNT = 6;
const DEADLINE_WINDOW_DAYS = 7;

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // Date.now() is impure to call directly in render - snapshot it once.
  const [now] = useState(() => Date.now());

  const { data: snapshot, isLoading: internshipsLoading } = useQuery({
    queryKey: ['internships', { sort: 'fitScore' }, 1, SNAPSHOT_LIMIT],
    queryFn: () => fetchInternships({ sort: 'fitScore' }, 1, SNAPSHOT_LIMIT),
  });

  const { data: saved, isLoading: savedLoading } = useQuery({
    queryKey: ['saved'],
    queryFn: fetchSaved,
  });

  const saveMutation = useMutation({
    mutationFn: (id: string) => toggleSaveInternship(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['internships'] });
      queryClient.setQueriesData<{ pages: PaginatedInternships[] } | PaginatedInternships | undefined>(
        { queryKey: ['internships'] },
        (old: unknown) => {
          if (!old) return old as never;
          const patch = (p: PaginatedInternships): PaginatedInternships => ({
            ...p,
            data: p.data.map((i: Internship) => (i.id === id ? { ...i, isSaved: !i.isSaved } : i)),
          });
          if (typeof old === 'object' && old !== null && 'pages' in old) {
            const paged = old as { pages: PaginatedInternships[]; pageParams: unknown[] };
            return { ...paged, pages: paged.pages.map(patch) };
          }
          return patch(old as PaginatedInternships);
        }
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['saved'] }),
  });

  const internships = snapshot?.data ?? [];
  const topMatches = internships
    .filter((i) => i.fitScore !== undefined)
    .slice(0, TOP_MATCHES_COUNT);

  const analyzedCount = internships.filter((i) => i.fitScore !== undefined).length;
  const avgFitScore =
    analyzedCount > 0
      ? Math.round(
          internships.reduce((sum, i) => sum + (i.fitScore ?? 0), 0) / analyzedCount
        )
      : null;

  const upcomingDeadlines: ShortlistItem[] = (saved ?? [])
    .filter((i) => {
      if (!i.deadline) return false;
      const days = Math.ceil((new Date(i.deadline).getTime() - now) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= DEADLINE_WINDOW_DAYS;
    })
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

  const applicationsTracked = (saved ?? []).filter((i) => i.applicationStatus !== 'SAVED').length;

  const hasSkills = (user?.skills.length ?? 0) > 0;
  const completeness =
    ((user?.name ? 1 : 0) +
      (user?.college ? 1 : 0) +
      (user?.branch ? 1 : 0) +
      (user?.year ? 1 : 0) +
      (hasSkills ? 1 : 0)) /
    5;
  const completenessPct = Math.round(completeness * 100);

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111317]">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-[#5B6270] mt-0.5">Here's where things stand.</p>
        </div>

        {!hasSkills ? (
          <div className="rounded-xl ring-1 ring-primary-200 bg-primary-50 p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold text-primary-800">Add your skills to unlock fit scores</p>
              <p className="text-sm text-primary-700/80 mt-0.5">
                Every internship on InternRadar gets a personal match score once we know what you know.
              </p>
            </div>
            <Link
              to="/profile"
              className="shrink-0 rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700"
            >
              Set up profile
            </Link>
          </div>
        ) : (
          completenessPct < 100 && (
            <div className="rounded-xl ring-1 ring-[#E4E7EC] bg-white p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[#111317] font-medium">
                  Your profile is {completenessPct}% complete
                </span>
                <Link to="/profile" className="text-primary-600 font-medium hover:text-primary-700">
                  Finish it
                </Link>
              </div>
              <div className="h-1.5 rounded-full bg-[#E4E7EC] overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all"
                  style={{ width: `${completenessPct}%` }}
                />
              </div>
            </div>
          )
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Internships matched', value: analyzedCount },
            { label: 'Average fit score', value: avgFitScore !== null ? `${avgFitScore}%` : '\u2014' },
            { label: 'Shortlisted', value: saved?.length ?? 0 },
            { label: 'Applications tracked', value: applicationsTracked },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl ring-1 ring-[#E4E7EC] bg-white p-4">
              <p className="text-2xl font-bold text-[#111317]">{stat.value}</p>
              <p className="text-xs text-[#5B6270] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[#111317] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary-600" />
              Top matches
            </h2>
            <Link to="/internships" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>

          {internshipsLoading ? (
            <div className="flex items-center justify-center py-12 text-[#5B6270]">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading matches...
            </div>
          ) : topMatches.length === 0 ? (
            <div className="rounded-xl ring-1 ring-[#E4E7EC] bg-white p-8 text-center">
              <Sparkles className="w-5 h-5 text-[#5B6270] mx-auto mb-2" />
              <p className="text-sm text-[#5B6270]">
                {hasSkills
                  ? 'Scores are still being computed - check back shortly, or try Recompute on your profile.'
                  : 'Add skills to your profile to see personalized matches here.'}
              </p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
              {topMatches.map((internship) => (
                <div key={internship.id} className="w-72 shrink-0 snap-start">
                  <InternshipCard
                    internship={internship}
                    onToggleSave={(id) => saveMutation.mutate(id)}
                    isTogglingSave={saveMutation.isPending && saveMutation.variables === internship.id}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold text-[#111317] mb-3">Deadlines approaching</h2>
          {savedLoading ? (
            <div className="flex items-center justify-center py-8 text-[#5B6270]">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading...
            </div>
          ) : upcomingDeadlines.length === 0 ? (
            <div className="rounded-xl ring-1 ring-[#E4E7EC] bg-white p-4 text-sm text-[#5B6270]">
              Nothing shortlisted with a deadline in the next {DEADLINE_WINDOW_DAYS} days.
            </div>
          ) : (
            <div className="rounded-xl ring-1 ring-[#E4E7EC] bg-white divide-y divide-[#E4E7EC]">
              {upcomingDeadlines.map((item) => {
                const days = Math.ceil(
                  (new Date(item.deadline!).getTime() - now) / (1000 * 60 * 60 * 24)
                );
                const urgent = days <= 2;
                return (
                  <Link
                    key={item.id}
                    to={`/internships/${item.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#FAFBFC]"
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        urgent ? 'bg-fit-red' : 'bg-fit-amber'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#111317] truncate">{item.title}</p>
                      <p className="text-xs text-[#5B6270] truncate">{item.company}</p>
                    </div>
                    <span className={`text-xs font-medium shrink-0 ${urgent ? 'text-fit-red' : 'text-fit-amber'}`}>
                      {days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `${days}d left`}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
