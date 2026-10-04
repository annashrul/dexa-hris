import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useAuth } from './store/auth';
import { useNotifications } from './store/notifications';
import LoginPage from './pages/LoginPage';
import AdminAppShell from './components/AdminAppShell';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import AttendanceMonitoringPage from './pages/AttendanceMonitoringPage';

function RequireAuth({ children, role }: { children: JSX.Element; role?: string }) {
  const auth = useAuth();

  if (!auth.isHydrated) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress size={32} thickness={5} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
            Memeriksa sesi login...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!auth.isAuthenticated) return <Navigate to="/login" replace />;
  const userRole = String(auth.user?.role || '').toLowerCase();
  const expected = String(role || '').toLowerCase();
  if (expected && userRole !== expected) return <Navigate to="/login" replace />;
  return children;
}

function AuthHydrationGate({ children }: { children: JSX.Element }) {
  const auth = useAuth();
  const notifications = useNotifications();

  useEffect(() => {
    if (!auth.isHydrated) {
      auth.init();
    }
  }, [auth]);

  useEffect(() => {
    if (auth.isAuthenticated && auth.isHydrated) {
      const cleanup = notifications.setupSocketListener();
      return cleanup;
    }
  }, [auth.isAuthenticated, auth.isHydrated, notifications]);

  if (!auth.isHydrated && (typeof window !== 'undefined')) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress size={32} thickness={5} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
            Memeriksa sesi login...
          </Typography>
        </Stack>
      </Box>
    );
  }
  return children;
}

export default function App() {
  return (
    <AuthHydrationGate>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth role="hrd">
              <AdminAppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="attendance" element={<AttendanceMonitoringPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthHydrationGate>
  );
}
