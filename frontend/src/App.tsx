import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppShell from './components/layout/AppShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import GstWorkspace from './pages/GstWorkspace';
import ItrWorkspace from './pages/ItrWorkspace';
import Tasks from './pages/Tasks';
import Kanban from './pages/Kanban';
import Compliance from './pages/Compliance';
import Documents from './pages/Documents';
import Credentials from './pages/Credentials';
import Employees from './pages/Employees';
import FollowUps from './pages/FollowUps';
import Revenue from './pages/Revenue';
import Activity from './pages/Activity';
import Reports from './pages/Reports';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/gst" element={<GstWorkspace />} />
        <Route path="/itr" element={<ItrWorkspace />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/credentials" element={<Credentials />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/kanban" element={<Kanban />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/followups" element={<FollowUps />} />
        <Route path="/revenue" element={<Revenue />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/reports" element={<Reports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
