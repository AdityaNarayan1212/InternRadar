import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Radar } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import RadarRings from '../components/RadarRings';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get('mode') === 'register');
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
    <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-4 relative overflow-hidden">
      <RadarRings className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]" />
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-[#E4E7EC] w-full max-w-md p-8 relative">

        {/* Logo */}
        <Link to="/" className="block text-center mb-8">
          <h1 className="text-2xl font-bold text-[#111317] flex items-center justify-center gap-2">
            <Radar className="w-5 h-5 text-primary-600" strokeWidth={2.5} />
            InternRadar
          </h1>
          <p className="text-[#5B6270] text-sm mt-1">
            Find internships that actually match you
          </p>
        </Link>

        {/* Toggle */}
        <div className="flex bg-[#FAFBFC] rounded-lg p-1 mb-6">
          <button
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              !isRegister ? 'bg-white shadow-sm text-[#111317]' : 'text-[#5B6270]'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              isRegister ? 'bg-white shadow-sm text-[#111317]' : 'text-[#5B6270]'
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
              className="w-full border border-[#E4E7EC] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full border border-[#E4E7EC] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className="w-full border border-[#E4E7EC] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />

          {isRegister && (
            <>
              <input
                type="text"
                placeholder="College (e.g. VIT Chennai)"
                value={form.college}
                onChange={e => setForm({ ...form, college: e.target.value })}
                className="w-full border border-[#E4E7EC] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Branch (e.g. CSE)"
                  value={form.branch}
                  onChange={e => setForm({ ...form, branch: e.target.value })}
                  className="flex-1 border border-[#E4E7EC] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <select
                  value={form.year}
                  onChange={e => setForm({ ...form, year: e.target.value })}
                  className="flex-1 border border-[#E4E7EC] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <p className="text-fit-red text-sm bg-fit-red/5 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
