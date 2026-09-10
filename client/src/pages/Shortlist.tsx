import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import EmptyState from '../components/EmptyState';
import FitScoreBadge from '../components/FitScoreBadge';
import DeadlineChip from '../components/DeadlineChip';
import UnderratedBadge from '../components/UnderratedBadge';
import { fetchSaved, toggleSaveInternship, updateApplicationStatus } from '../lib/internships';
import type { ApplicationStatus, ShortlistItem } from '../types';

const COLUMNS: { status: ApplicationStatus; label: string }[] = [
  { status: 'SAVED', label: 'Saved' },
  { status: 'APPLIED', label: 'Applied' },
  { status: 'INTERVIEW', label: 'Interview' },
  { status: 'REJECTED', label: 'Rejected' },
  { status: 'SELECTED', label: 'Selected' },
];

function isUnderrated(type: ShortlistItem['type']) {
  return type === 'GOVERNMENT' || type === 'RESEARCH';
}

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Saved today';
  if (days === 1) return 'Saved yesterday';
  return `Saved ${days}d ago`;
}

export default function Shortlist() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const { data: items, isLoading, isError } = useQuery({
    queryKey: ['saved'],
    queryFn: fetchSaved,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      updateApplicationStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['saved'] });
      const previous = queryClient.getQueryData<ShortlistItem[]>(['saved']);
      queryClient.setQueryData<ShortlistItem[]>(['saved'], (old) =>
        old?.map((i) => (i.id === id ? { ...i, applicationStatus: status } : i))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['saved'], context.previous);
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: (id: string) => toggleSaveInternship(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['saved'] });
      const previous = queryClient.getQueryData<ShortlistItem[]>(['saved']);
      queryClient.setQueryData<ShortlistItem[]>(['saved'], (old) =>
        old?.filter((i) => i.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['saved'], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['internships'] });
    },
  });

  const handleDrop = (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) statusMutation.mutate({ id, status });
    setDraggingId(null);
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-[#111317]">Shortlist</h1>
        <p className="text-sm text-[#5B6270] mt-0.5 mb-6">
          Drag a card between columns, or use the status dropdown on each one.
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-[#5B6270]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading your shortlist...
          </div>
        ) : isError ? (
          <EmptyState
            title="Couldn't load your shortlist"
            message="Something went wrong reaching the server. Try again in a moment."
          />
        ) : !items || items.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="Nothing shortlisted yet"
            message="Save internships from the listings board to track them here."
            actionLabel="Browse internships"
            onAction={() => navigate('/internships')}
          />
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((col) => {
              const colItems = items.filter((i) => i.applicationStatus === col.status);
              return (
                <div
                  key={col.status}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, col.status)}
                  className="w-72 shrink-0 rounded-xl bg-white ring-1 ring-[#E4E7EC] flex flex-col"
                >
                  <div className="px-3 py-2.5 border-b border-[#E4E7EC] flex items-center justify-between">
                    <span className="font-semibold text-sm text-[#111317]">{col.label}</span>
                    <span className="text-xs text-[#5B6270] bg-[#FAFBFC] rounded-full px-2 py-0.5">
                      {colItems.length}
                    </span>
                  </div>

                  <div className="p-2 flex flex-col gap-2 min-h-[120px]">
                    {colItems.length === 0 && (
                      <p className="text-xs text-[#5B6270] text-center py-6">No internships here</p>
                    )}
                    {colItems.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', item.id);
                          setDraggingId(item.id);
                        }}
                        onDragEnd={() => setDraggingId(null)}
                        className={`rounded-lg ring-1 ring-[#E4E7EC] bg-white p-3 cursor-grab active:cursor-grabbing transition-opacity ${
                          draggingId === item.id ? 'opacity-40' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/internships/${item.id}`)}
                            className="text-left min-w-0"
                          >
                            <p className="text-xs text-[#5B6270] truncate">{item.company}</p>
                            <p className="text-sm font-semibold text-[#111317] leading-snug line-clamp-2 hover:text-primary-600">
                              {item.title}
                            </p>
                          </button>
                          <FitScoreBadge score={item.fitScore} size="compact" className="shrink-0" />
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap mt-2">
                          {isUnderrated(item.type) && <UnderratedBadge />}
                          <DeadlineChip deadline={item.deadline} status={item.status} />
                        </div>

                        <p className="text-[11px] text-[#5B6270] mt-2">{timeAgo(item.savedAt)}</p>

                        <div className="flex items-center gap-2 mt-2">
                          <select
                            value={item.applicationStatus}
                            onChange={(e) =>
                              statusMutation.mutate({
                                id: item.id,
                                status: e.target.value as ApplicationStatus,
                              })
                            }
                            className="flex-1 text-xs rounded-md border border-[#E4E7EC] px-1.5 py-1 bg-white"
                          >
                            {COLUMNS.map((c) => (
                              <option key={c.status} value={c.status}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => unsaveMutation.mutate(item.id)}
                            aria-label="Remove from shortlist"
                            className="text-[#5B6270] hover:text-fit-red"
                          >
                            <Bookmark className="w-4 h-4" fill="currentColor" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
