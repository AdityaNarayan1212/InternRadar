import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    college: '',
    branch: '',
    year: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register({
          email: form.email,
          password: form.password,
          name: form.name,
          college: form.college,
          branch: form.branch,
          year: form.year ? parseInt(form.year) : undefined,
        });
      } else {
        await login(form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            🎯 InternRadar
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Find internships that actually match you
          </p>
        </div>

        {/* Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              !isRegister ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              isRegister ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <input
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />

          {isRegister && (
            <>
              <input
                type="text"
                placeholder="College (e.g. VIT Chennai)"
                value={form.college}
                onChange={e => setForm({ ...form, college: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Branch (e.g. CSE)"
                  value={form.branch}
                  onChange={e => setForm({ ...form, branch: e.target.value })}
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={form.year}
                  onChange={e => setForm({ ...form, year: e.target.value })}
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </>
          )}

          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}