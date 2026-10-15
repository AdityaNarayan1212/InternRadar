import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Loader2, Sparkles, UploadCloud, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/useAuth';
import { updateProfile, recomputeScores } from '../lib/user';
import { uploadResumeFile, deleteResumeFile, fetchResumeUrl } from '../lib/resume';
import type { User } from '../types';

const YEAR_OPTIONS = [
  { value: '1', label: '1st Year' },
  { value: '2', label: '2nd Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' },
];

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export default function Profile() {
  const { user } = useAuth();

  // Gate on user being loaded rather than syncing form state from it via an
  // effect - ProfileForm below derives its initial state straight from the
  // prop, so there's nothing to keep in sync after mount.
  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <Navbar />
        <div className="flex items-center justify-center py-24 text-[#5B6270]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading your profile...
        </div>
      </div>
    );
  }

  return <ProfileForm user={user} />;
}

function ProfileForm({ user }: { user: User }) {
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user.name ?? '');
  const [college, setCollege] = useState(user.college ?? '');
  const [branch, setBranch] = useState(user.branch ?? '');
  const [year, setYear] = useState(user.year ? String(user.year) : '');
  const [skills, setSkills] = useState<string[]>(user.skills ?? []);
  const [skillInput, setSkillInput] = useState('');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const invalidateMatchQueries = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['internships'] }),
      queryClient.invalidateQueries({ queryKey: ['internship'] }),
    ]);

  const recomputeMutation = useMutation({
    mutationFn: recomputeScores,
    onSuccess: invalidateMatchQueries,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      updateProfile({
        name,
        college: college || undefined,
        branch: branch || undefined,
        year: year ? Number(year) : undefined,
        skills,
      }),
    onSuccess: async () => {
      await refreshUser();
      setSavedMessage('Profile saved.');
      if (skills.length > 0) {
        recomputeMutation.mutate();
      }
    },
  });

  // Upload itself already runs text extraction + Groq skill extraction
  // synchronously server-side (reflected in this mutation's pending state).
  // The fit-score recompute it triggers afterward is fire-and-forget on the
  // server, so we don't track its completion here - just say it's underway.
  const uploadMutation = useMutation({
    mutationFn: uploadResumeFile,
    onSuccess: async (result) => {
      setSkills(result.data.skills);
      setResumeError(null);
      await refreshUser();
      await invalidateMatchQueries();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setResumeError(e.response?.data?.message ?? 'Upload failed - try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResumeFile,
    onSuccess: async () => {
      await refreshUser();
      setConfirmDeleteOpen(false);
    },
  });

  const viewMutation = useMutation({
    mutationFn: fetchResumeUrl,
    onSuccess: (url) => {
      window.open(url, '_blank', 'noopener,noreferrer');
    },
  });

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setResumeError('Only PDF files are supported.');
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      setResumeError('File is too large - max 5MB.');
      return;
    }
    setResumeError(null);
    uploadMutation.mutate(file);
  };

  const addSkill = () => {
    const value = skillInput.trim();
    if (value && !skills.includes(value)) {
      setSkills((prev) => [...prev, value]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  const completeness =
    (name ? 1 : 0) +
    (college ? 1 : 0) +
    (branch ? 1 : 0) +
    (year ? 1 : 0) +
    (skills.length > 0 ? 1 : 0);
  const completenessPct = Math.round((completeness / 5) * 100);

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-[#111317]">Your Profile</h1>
        <p className="text-sm text-[#5B6270] mt-0.5 mb-6">
          Skills here drive your fit scores across every listing.
        </p>

        {completenessPct < 100 && (
          <div className="rounded-xl ring-1 ring-[#E4E7EC] bg-white p-4 mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[#111317] font-medium">Profile completeness</span>
              <span className="text-[#5B6270]">{completenessPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#E4E7EC] overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all"
                style={{ width: `${completenessPct}%` }}
              />
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSavedMessage(null);
            saveMutation.mutate();
          }}
          className="space-y-6"
        >
          <div className="rounded-xl ring-1 ring-[#E4E7EC] bg-white p-5">
            <h2 className="font-semibold text-[#111317] mb-4">Basic info</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#5B6270] uppercase tracking-wide">
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#5B6270] uppercase tracking-wide">
                  College
                </label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. VIT Chennai"
                  className="mt-1.5 w-full rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-[#5B6270] uppercase tracking-wide">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. CSE"
                    className="mt-1.5 w-full rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-[#5B6270] uppercase tracking-wide">
                    Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Select</option>
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y.value} value={y.value}>
                        {y.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl ring-1 ring-[#E4E7EC] bg-white p-5">
            <h2 className="font-semibold text-[#111317] mb-1">Skills</h2>
            <p className="text-xs text-[#5B6270] mb-4">
              Add every skill you'd list on a resume - matching runs against this list.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="e.g. Python, React, Figma"
                className="flex-1 rounded-lg border border-[#E4E7EC] px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={addSkill}
                className="rounded-lg bg-primary-50 text-primary-700 px-4 py-2 text-sm font-medium hover:bg-primary-100"
              >
                Add
              </button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-[#FAFBFC] text-[#111317] ring-1 ring-[#E4E7EC]"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSkill(s)}
                      aria-label={`Remove ${s}`}
                      className="hover:text-fit-red"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl ring-1 ring-[#E4E7EC] bg-white p-5">
            <h2 className="font-semibold text-[#111317] mb-1">Resume</h2>
            <p className="text-xs text-[#5B6270] mb-4">
              Uploading a PDF automatically pulls skills into the list above.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="hidden"
            />

            {user.resumeUrl ? (
              <div className="flex items-center justify-between rounded-lg ring-1 ring-[#E4E7EC] bg-[#FAFBFC] px-4 py-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-600" />
                  <span className="text-sm text-[#111317] font-medium">
                    {uploadMutation.isPending ? 'Uploading...' : 'Resume on file'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => viewMutation.mutate()}
                    disabled={viewMutation.isPending}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[#5B6270] hover:text-[#111317] font-medium"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteOpen(true)}
                    className="text-fit-red hover:underline font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFile(e.dataTransfer.files[0]);
                }}
                className="border-2 border-dashed border-[#E4E7EC] rounded-lg p-6 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-colors"
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="w-5 h-5 text-primary-600 mx-auto mb-2 animate-spin" />
                ) : (
                  <UploadCloud className="w-5 h-5 text-[#5B6270] mx-auto mb-2" />
                )}
                <p className="text-sm text-[#111317] font-medium">
                  {uploadMutation.isPending
                    ? 'Uploading and reading your resume...'
                    : 'Click or drag a PDF resume here'}
                </p>
                <p className="text-xs text-[#5B6270] mt-1">PDF only, up to 5MB</p>
              </div>
            )}

            {resumeError && <p className="text-sm text-fit-red mt-2">{resumeError}</p>}

            {uploadMutation.isSuccess && !uploadMutation.isPending && (
              <p className="flex items-center gap-1.5 text-sm text-fit-green mt-2">
                <Sparkles className="w-4 h-4" />
                Extracted {uploadMutation.data.skillsExtracted} skill
                {uploadMutation.data.skillsExtracted === 1 ? '' : 's'} - fit scores updating in
                the background.
              </p>
            )}
            {uploadMutation.isSuccess &&
              !uploadMutation.isPending &&
              uploadMutation.data.extractionWarning && (
                <p className="text-sm text-fit-amber mt-1">
                  {uploadMutation.data.extractionWarning} Review the list above and add anything
                  missing.
                </p>
              )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="rounded-lg bg-primary-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save profile'}
            </button>

            {savedMessage && !recomputeMutation.isPending && !recomputeMutation.data && (
              <span className="text-sm text-[#5B6270]">{savedMessage}</span>
            )}

            {recomputeMutation.isPending && (
              <span className="flex items-center gap-1.5 text-sm text-[#5B6270]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Recomputing your fit scores...
              </span>
            )}

            {recomputeMutation.data && !recomputeMutation.isPending && (
              <span className="flex items-center gap-1.5 text-sm text-fit-green">
                <Sparkles className="w-4 h-4" />
                {recomputeMutation.data.skipped
                  ? recomputeMutation.data.reason
                  : `Updated ${recomputeMutation.data.computed} internship${
                      recomputeMutation.data.computed === 1 ? '' : 's'
                    }${recomputeMutation.data.failed > 0 ? ` (${recomputeMutation.data.failed} failed)` : ''}`}
              </span>
            )}
          </div>
          {saveMutation.isError && (
            <p className="text-sm text-fit-red">Couldn't save your profile. Try again.</p>
          )}
        </form>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete your resume?"
        message="This removes the file from storage. Your skills list stays as-is - only the uploaded PDF is deleted."
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmDeleteOpen(false)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
