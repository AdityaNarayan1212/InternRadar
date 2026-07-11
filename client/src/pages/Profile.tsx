import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import { User } from '../types';

export default function Profile() {
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [college, setCollege] = useState(user?.college ?? '');
  const [branch, setBranch] = useState(user?.branch ?? '');
  const [year, setYear] = useState(user?.year?.toString() ?? '');
  const [skillsInput, setSkillsInput] = useState((user?.skills ?? []).join(', '));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const skills = skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await api.patch<{ success: boolean; data: User }>('/users/profile', {
        name,
        college: college || undefined,
        branch: branch || undefined,
        year: year ? Number(year) : undefined,
        skills,
      });

      setUser(res.data.data);
      setSaved(true);
    } catch {
      setError('Could not update your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h1>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
            />
          </Field>

          <Field label="College">
            <input value={college} onChange={(e) => setCollege(e.target.value)} className="input" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Branch">
              <input value={branch} onChange={(e) => setBranch(e.target.value)} className="input" />
            </Field>
            <Field label="Year">
              <select value={year} onChange={(e) => setYear(e.target.value)} className="input">
                <option value="">Select</option>
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Skills (comma separated)">
            <input
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="React, TypeScript, Node.js"
              className="input"
            />
          </Field>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {saved && <p className="text-green-600 text-sm">Profile updated.</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}
