import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import EmployeeAppShell from './components/EmployeeAppShell';
import AttendancePage from './pages/AttendancePage';
import AttendanceHistoryPage from './pages/AttendanceHistoryPage';
import ProfilePage from './pages/ProfilePage';

function isAuthenticated(): boolean {
  return !!localStorage.getItem('emp_token');
}

function RequireAuth({ children }: { children: JSX.Element }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <EmployeeAppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/attendance" replace />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="history" element={<AttendanceHistoryPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
