import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, Plus, ShieldAlert, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/useAuth';
import {
  fetchAdminInternships,
  createAdminInternship,
  updateAdminInternship,
  deactivateAdminInternship,
} from '../lib/admin';
import type { Internship, InternshipStatus, InternshipType } from '../types';

const TYPE_OPTIONS: InternshipType[] = ['GOVERNMENT', 'RESEARCH', 'STARTUP', 'CORPORATE'];

interface FormState {
  title: string;
  company: string;
  type: InternshipType;
  domain: string;
  location: string;
  isRemote: boolean;
  stipendMin: string;
  stipendMax: string;
  duration: string;
  deadline: string;
  applyUrl: string;
  skillsReq: string;
  criteria: string;
  description: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  company: '',
  type: 'CORPORATE',
  domain: '',
  location: '',
  isRemote: false,
  stipendMin: '',
  stipendMax: '',
  duration: '',
  deadline: '',
  applyUrl: '',
  skillsReq: '',
  criteria: '',
  description: '',
};

function toFormState(i: Internship): FormState {
  return {
    title: i.title,
    company: i.company,
    type: i.type,
    domain: i.domain.join(', '),
    location: i.location ?? '',
    isRemote: i.isRemote,
    stipendMin: i.stipendMin != null ? String(i.stipendMin) : '',
    stipendMax: i.stipendMax != null ? String(i.stipendMax) : '',
    duration: i.duration ?? '',
    deadline: i.deadline ? i.deadline.slice(0, 10) : '',
    applyUrl: i.applyUrl,
    skillsReq: i.skillsReq.join(', '),
    criteria: i.criteria ?? '',
    description: i.description ?? '',
  };
}

function toPayload(form: FormState) {
  return {
    title: form.title,
    company: form.company,
    type: form.type,
    domain: form.domain.split(',').map((s) => s.trim()).filter(Boolean),
    location: form.location || undefined,
    isRemote: form.isRemote,
    stipendMin: form.stipendMin ? Number(form.stipendMin) : undefined,
    stipendMax: form.stipendMax ? Number(form.stipendMax) : undefined,
    duration: form.duration || undefined,
    deadline: form.deadline || undefined,
    applyUrl: form.applyUrl,
    skillsReq: form.skillsReq.split(',').map((s) => s.trim()).filter(Boolean),
    criteria: form.criteria || undefined,
    description: form.description || undefined,
  };
}

export default function Admin() {
  const { user } = useAuth();

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16">
          <EmptyState
            icon={ShieldAlert}
            title="Admins only"
            message="This area is restricted to InternRadar admin accounts."
            actionLabel="Back to dashboard"
          />
        </div>
      </div>
    );
  }

  return <AdminPanel />;
}

function AdminPanel() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data: internships, isLoading } = useQuery({
    queryKey: ['admin', 'internships'],
    queryFn: fetchAdminInternships,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'internships'] });
    queryClient.invalidateQueries({ queryKey: ['internships'] });
  };

  const createMutation = useMutation({
    mutationFn: createAdminInternship,
    onSuccess: () => {
      invalidateAll();
      closeForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReturnType<typeof toPayload> }) =>
      updateAdminInternship(id, payload),
    onSuccess: () => {
      invalidateAll();
      closeForm();
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateAdminInternship,
    onSuccess: invalidateAll,
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (i: Internship) => {
    setEditingId(i.id);
    setForm(toFormState(i));
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = toPayload(form);
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  const statusStyle = (status: InternshipStatus) =>
    status === 'OPEN'
      ? 'text-fit-green bg-fit-green/10'
      : status === 'REOPENING'
      ? 'text-fit-amber bg-fit-amber/10'
      : 'text-[#5B6270] bg-[#FAFBFC]';

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#111317]">Manage internships</h1>
            <p className="text-sm text-[#5B6270] mt-0.5">
              {internships?.length ?? 0} listings total
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            Add internship
          </button>
        </div>

        {formOpen && (
          <form
            onSubmit={handleSubmit}
            className="rounded-xl ring-1 ring-[#E4E7EC] bg-white p-5 mb-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#111317]">
                {editingId ? 'Edit internship' : 'New internship'}
              </h2>
              <button type="button" onClick={closeForm} aria-label="Close">
                <X className="w-4 h-4 text-[#5B6270]" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                required
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Company / organization"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                className="rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm"
              />
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as InternshipType }))}
                className="rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm bg-white"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              <input
                placeholder="Domain tags, comma separated"
                value={form.domain}
                onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
                className="rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm"
              />
              <input
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-[#111317]">
                <input
                  type="checkbox"
                  checked={form.isRemote}
                  onChange={(e) => setForm((f) => ({ ...f, isRemote: e.target.checked }))}
                  className="rounded border-[#E4E7EC]"
                />
                Remote
              </label>
              <input
                type="number"
                placeholder="Stipend min (\u20b9/mo)"
                value={form.stipendMin}
                onChange={(e) => setForm((f) => ({ ...f, stipendMin: e.target.value }))}
                className="rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Stipend max (\u20b9/mo)"
                value={form.stipendMax}
                onChange={(e) => setForm((f) => ({ ...f, stipendMax: e.target.value }))}
                className="rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm"
              />
              <input
                placeholder="Duration (e.g. 3 months)"
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                className="rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Apply URL"
                value={form.applyUrl}
                onChange={(e) => setForm((f) => ({ ...f, applyUrl: e.target.value }))}
                className="rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm sm:col-span-2"
              />
              <input
                placeholder="Required skills, comma separated"
                value={form.skillsReq}
                onChange={(e) => setForm((f) => ({ ...f, skillsReq: e.target.value }))}
                className="rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm sm:col-span-2"
              />
              <input
                placeholder="Eligibility criteria"
                value={form.criteria}
                onChange={(e) => setForm((f) => ({ ...f, criteria: e.target.value }))}
                className="rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm sm:col-span-2"
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm sm:col-span-2"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create listing'}
            </button>
          </form>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-[#5B6270]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading listings...
          </div>
        ) : (
          <div className="rounded-xl ring-1 ring-[#E4E7EC] bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E4E7EC] text-left text-xs text-[#5B6270] uppercase tracking-wide">
                  <th className="px-4 py-2.5 font-semibold">Title</th>
                  <th className="px-4 py-2.5 font-semibold">Company</th>
                  <th className="px-4 py-2.5 font-semibold">Type</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC]">
                {(internships ?? []).map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-2.5">
                      <Link to={`/internships/${i.id}`} className="hover:text-primary-600 font-medium">
                        {i.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-[#5B6270]">{i.company}</td>
                    <td className="px-4 py-2.5 text-[#5B6270]">
                      {i.type.charAt(0) + i.type.slice(1).toLowerCase()}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle(i.status)}`}>
                        {i.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => openEdit(i)}
                          className="text-[#5B6270] hover:text-primary-600"
                          aria-label="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {i.status !== 'CLOSED' && (
                          <button
                            type="button"
                            onClick={() => deactivateMutation.mutate(i.id)}
                            disabled={deactivateMutation.isPending}
                            className="text-xs font-medium text-fit-red hover:underline"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
