import { Routes, Route, Navigate } from 'react-router-dom';

// Pages (we'll build these one by one)
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Profile from './pages/Profile';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;