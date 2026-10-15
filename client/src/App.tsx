import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Internships from './pages/Internships';
import InternshipDetail from './pages/InternshipDetail';
import Shortlist from './pages/Shortlist';
import Notifications from './pages/Notifications';
import Admin from './pages/Admin';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

// Root ("/") is the public landing page for logged-out visitors, but a
// returning logged-in user landing on "/" almost certainly wants their
// dashboard, not the marketing page.
function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  );
  return user ? <Navigate to="/dashboard" replace /> : <Landing />;
}

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  );
  return user ? <Navigate to="/dashboard" replace /> : <Login />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      {/* Browsable while logged out - fit scores/save just show as locked
          without an account, matching the brief's public "Browse
          internships" flow. Detail/list personalize automatically once
          logged in via optionalAuth on the backend. */}
      <Route path="/internships" element={<Internships />} />
      <Route path="/internships/:id" element={<InternshipDetail />} />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/shortlist" element={
        <ProtectedRoute><Shortlist /></ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute><Notifications /></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><Profile /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute><Admin /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
