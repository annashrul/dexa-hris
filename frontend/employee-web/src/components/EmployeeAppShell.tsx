import { Box, BottomNavigation, BottomNavigationAction, Paper, Typography, useTheme, Container, IconButton, Tooltip } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { useQueryClient } from '@tanstack/react-query';

const tabs = [
  { path: '/attendance', label: 'Attendance', icon: <AccessTimeIcon /> },
  { path: '/history', label: 'History', icon: <HistoryIcon /> },
  { path: '/profile', label: 'Profile', icon: <PersonIcon /> },
];

export default function EmployeeAppShell() {
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const queryClient = useQueryClient();

  const currentTab = tabs.find((t) => location.pathname.startsWith(t.path))?.path ?? '/attendance';

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  const handleLogout = () => {
    localStorage.removeItem('emp_token');
    localStorage.removeItem('emp_user');
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', pb: { xs: 'env(safe-area-inset-bottom)', md: 0 } }}>
      
      {/* HEADER LOGO */}
      <Box 
        sx={{ 
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none', // Allow clicking outside the container if needed
        }}
      >
        <Container 
          maxWidth="sm" 
          disableGutters 
          sx={{ 
            bgcolor: 'background.paper', 
            borderBottom: 1, 
            borderColor: 'divider', 
            py: 1.5, 
            px: 2, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            pointerEvents: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}
        >
          <Typography variant="h6" fontWeight={800} color="primary" letterSpacing="-0.02em" sx={{ pl: 1 }}>
            DEXA HRIS
          </Typography>
          <Tooltip title="Log Out">
            <IconButton onClick={handleLogout} color="error" size="small" sx={{ bgcolor: 'rgba(211,47,47,0.08)', '&:hover': { bgcolor: 'rgba(211,47,47,0.15)' } }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Container>
      </Box>

      {/* MAIN CONTENT */}
      <Box sx={{ pb: '72px' }}>
        <Outlet />
      </Box>

      {/* BOTTOM NAVIGATION */}
      <Box 
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <Container maxWidth="sm" disableGutters sx={{ pointerEvents: 'auto' }}>
          <Paper
            elevation={0}
            sx={{
              borderTop: 1,
              borderColor: 'divider',
              pb: 'env(safe-area-inset-bottom)',
              bgcolor: 'background.paper',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.03)'
            }}
          >
            <BottomNavigation
              showLabels
              value={currentTab}
              onChange={handleChange}
              sx={{
                height: 64,
                '& .MuiBottomNavigationAction-root': {
                  color: 'text.secondary',
                  minWidth: 'auto',
                  padding: '6px 0',
                  '&.Mui-selected': {
                    color: 'primary.main',
                  },
                  '& .MuiBottomNavigationAction-label': {
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    marginTop: '4px',
                    '&.Mui-selected': {
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: 24,
                    mb: 0.5,
                    transition: 'all 0.2s',
                    '&.Mui-selected': {
                      fontSize: 26,
                    }
                  }
                }
              }}
            >
              {tabs.map((t) => (
                <BottomNavigationAction
                  key={t.path}
                  value={t.path}
                  label={t.label}
                  icon={t.icon}
                  disableRipple
                />
              ))}
            </BottomNavigation>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}
