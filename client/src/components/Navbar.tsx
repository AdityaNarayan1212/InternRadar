import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, LogOut, Radar } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { fetchUnreadCount } from '../lib/notifications';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/internships', label: 'Internships' },
  { to: '/shortlist', label: 'Shortlist' },
  { to: '/profile', label: 'Profile' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const links = user?.isAdmin ? [...LINKS, { to: '/admin', label: 'Admin' }] : LINKS;

  const { data: unreadCount } = useQuery({
    queryKey: ['unread-count'],
    queryFn: fetchUnreadCount,
    refetchInterval: 60_000,
    enabled: !!user,
  });

  // Internships/Internships-detail are browsable while logged out, so this
  // header needs a variant that doesn't assume an authenticated session.
  if (!user) {
    return (
      <header className="border-b border-[#E4E7EC] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold text-primary-700 tracking-tight flex items-center gap-1.5">
            <Radar className="w-4 h-4" strokeWidth={2.5} />
            InternRadar
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-[#5B6270] hover:text-[#111317]">
              Log in
            </Link>
            <Link
              to="/login?mode=register"
              className="text-sm font-medium rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-[#E4E7EC] bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="font-bold text-primary-700 tracking-tight">
            InternRadar
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {links.map((link) => {
              const active = location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-[#5B6270] hover:text-[#111317]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative w-8 h-8 rounded-full flex items-center justify-center text-[#5B6270] hover:bg-[#FAFBFC]"
          >
            <Bell className="w-4 h-4" strokeWidth={2} />
            {!!unreadCount && unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-fit-red" />
            )}
          </Link>
          <span className="hidden sm:inline text-sm text-[#5B6270]">{user.name}</span>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-1.5 text-sm text-[#5B6270] hover:text-[#111317]"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>
      <nav className="sm:hidden flex items-center gap-1 px-4 pb-2 -mt-1">
        {links.map((link) => {
          const active = location.pathname.startsWith(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                active ? 'text-primary-700 bg-primary-50' : 'text-[#5B6270]'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
