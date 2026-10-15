import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SlidersHorizontal, X, SearchX, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import InternshipCard from '../components/InternshipCard';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/useAuth';
import { fetchInternships, toggleSaveInternship } from '../lib/internships';
import type { Internship, InternshipFilters, InternshipType, PaginatedInternships, SortOption } from '../types';

const TYPE_OPTIONS: { value: InternshipType; label: string }[] = [
  { value: 'GOVERNMENT', label: 'Government' },
  { value: 'RESEARCH', label: 'Research' },
  { value: 'STARTUP', label: 'Startup' },
  { value: 'CORPORATE', label: 'Corporate' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'fitScore', label: 'Best fit' },
  { value: 'recency', label: 'Most recent' },
  { value: 'deadline', label: 'Deadline soonest' },
];

export default function Internships() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [type, setType] = useState<InternshipType | ''>('');
  const [domains, setDomains] = useState<string[]>([]);
  const [isRemote, setIsRemote] = useState(false);
  const [underratedOnly, setUnderratedOnly] = useState(false);
  const [minFitScore, setMinFitScore] = useState(0);
  const [minStipend, setMinStipend] = useState('');
  const [sort, setSort] = useState<SortOption>('fitScore');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const filters: InternshipFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      type: type || undefined,
      domain: domains.length ? domains : undefined,
      isRemote: isRemote || undefined,
      underratedOnly: underratedOnly || undefined,
      minFitScore: minFitScore > 0 ? minFitScore : undefined,
      minStipend: minStipend ? Number(minStipend) : undefined,
      sort,
    }),
    [debouncedSearch, type, domains, isRemote, underratedOnly, minFitScore, minStipend, sort]
  );

  const queryClient = useQueryClient();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useInfiniteQuery({
      queryKey: ['internships', filters],
      placeholderData: keepPreviousData,
      queryFn: ({ pageParam }) => fetchInternships(filters, pageParam),
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.pagination.page < lastPage.pagination.totalPages
          ? lastPage.pagination.page + 1
          : undefined,
    });

  const internships = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  const availableDomains = useMemo(() => {
    const set = new Set<string>();
    internships.forEach((i) => i.domain.forEach((d) => set.add(d)));
    return [...set].sort();
  }, [internships]);

  const saveMutation = useMutation({
    mutationFn: (id: string) => toggleSaveInternship(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['internships'] });
      const previous = queryClient.getQueriesData<
        | { pages: PaginatedInternships[]; pageParams: unknown[] }
        | PaginatedInternships
      >({ queryKey: ['internships'] });
      queryClient.setQueriesData<
        | { pages: PaginatedInternships[]; pageParams: unknown[] }
        | PaginatedInternships
        | undefined
      >(
        { queryKey: ['internships'] },
        (old) => {
          if (!old) return old;
          const patchPage = (page: PaginatedInternships): PaginatedInternships => ({
            ...page,
            data: page.data.map((i: Internship) =>
              i.id === id ? { ...i, isSaved: !i.isSaved } : i
            ),
          });
          if ('pages' in old) {
            return { ...old, pages: old.pages.map(patchPage) };
          }
          return patchPage(old);
        }
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      context?.previous?.forEach(([key, prevData]) => queryClient.setQueryData(key, prevData));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['saved'] }),
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const activeFilterCount =
    (type ? 1 : 0) +
    domains.length +
    (isRemote ? 1 : 0) +
    (underratedOnly ? 1 : 0) +
    (minFitScore > 0 ? 1 : 0) +
    (minStipend ? 1 : 0);

  const clearFilters = () => {
    setType('');
    setDomains([]);
    setIsRemote(false);
    setUnderratedOnly(false);
    setMinFitScore(0);
    setMinStipend('');
  };

  const toggleDomain = (d: string) =>
    setDomains((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-semibold text-[#5B6270] uppercase tracking-wide">
          Organization type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as InternshipType | '')}
          className="mt-2 w-full rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm bg-white"
        >
          <option value="">All types</option>
          {TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {availableDomains.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-[#5B6270] uppercase tracking-wide">
            Domain
          </label>
          <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {availableDomains.map((d) => (
              <label key={d} className="flex items-center gap-2 text-sm text-[#111317]">
                <input
                  type="checkbox"
                  checked={domains.includes(d)}
                  onChange={() => toggleDomain(d)}
                  className="rounded border-[#E4E7EC] text-primary-600 focus:ring-primary-500"
                />
                {d}
              </label>
            ))}
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-[#111317]">
        <input
          type="checkbox"
          checked={isRemote}
          onChange={(e) => setIsRemote(e.target.checked)}
          className="rounded border-[#E4E7EC] text-primary-600 focus:ring-primary-500"
        />
        Remote only
      </label>

      <div>
        <label className="text-xs font-semibold text-[#5B6270] uppercase tracking-wide">
          Minimum stipend (\u20b9/mo)
        </label>
        <input
          type="number"
          min={0}
          step={1000}
          value={minStipend}
          onChange={(e) => setMinStipend(e.target.value)}
          placeholder="e.g. 10000"
          className="mt-2 w-full rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[#5B6270] uppercase tracking-wide">
            Minimum fit score
          </label>
          <span className="text-xs font-medium text-primary-600">
            {minFitScore > 0 ? `${minFitScore}%+` : 'Any'}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={90}
          step={5}
          value={minFitScore}
          onChange={(e) => setMinFitScore(Number(e.target.value))}
          className="mt-2 w-full accent-primary-500"
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-[#111317] rounded-lg ring-1 ring-underrated/30 bg-underrated/5 p-3">
        <input
          type="checkbox"
          checked={underratedOnly}
          onChange={(e) => setUnderratedOnly(e.target.checked)}
          className="mt-0.5 rounded border-[#E4E7EC] text-underrated focus:ring-underrated"
        />
        <span>
          <span className="font-medium">Underrated only</span>
          <br />
          <span className="text-xs text-[#5B6270]">
            Government, defence &amp; research roles most students miss
          </span>
        </span>
      </label>

      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={clearFilters}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Clear filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#111317]">Internships</h1>
            <p className="text-sm text-[#5B6270] mt-0.5">
              {data?.pages[0]?.pagination.total ?? 0} listings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, company, or location"
              className="w-full sm:w-72 rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm bg-white"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm bg-white"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="md:hidden flex items-center gap-1.5 rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm bg-white"
            >
              <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 w-4 h-4 rounded-full bg-primary-600 text-white text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-6 items-start">
          <aside className="hidden md:block w-64 shrink-0 rounded-xl ring-1 ring-[#E4E7EC] bg-white p-4 sticky top-4">
            {filterPanel}
          </aside>

          {filtersOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div
                className="absolute inset-0 bg-black/30"
                onClick={() => setFiltersOpen(false)}
              />
              <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-[#111317]">Filters</h2>
                  <button type="button" onClick={() => setFiltersOpen(false)}>
                    <X className="w-5 h-5 text-[#5B6270]" />
                  </button>
                </div>
                {filterPanel}
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-24 text-[#5B6270]">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading internships...
              </div>
            ) : isError ? (
              <EmptyState
                title="Couldn't load internships"
                message="Check that the API is running and VITE_API_URL points to it, then try again."
                actionLabel="Retry"
                onAction={() => refetch()}
              />
            ) : internships.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No internships match these filters"
                message="Try widening your search or clearing a few filters."
                actionLabel={activeFilterCount > 0 ? 'Clear filters' : undefined}
                onAction={activeFilterCount > 0 ? clearFilters : undefined}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {internships.map((internship) => (
                    <InternshipCard
                      key={internship.id}
                      internship={internship}
                      onToggleSave={user ? (id) => saveMutation.mutate(id) : undefined}
                      isTogglingSave={saveMutation.isPending && saveMutation.variables === internship.id}
                    />
                  ))}
                </div>
                <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-4">
                  {isFetchingNextPage && (
                    <Loader2 className="w-5 h-5 animate-spin text-[#5B6270]" />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
