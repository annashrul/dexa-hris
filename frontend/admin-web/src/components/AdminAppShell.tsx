import { useState, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  useTheme,
  useMediaQuery,
  SwipeableDrawer,
  Badge,
  Menu,
  MenuItem,
  ListItemSecondaryAction,
  Divider,
  Avatar,
  Tooltip,
  Snackbar,
  Alert,
  Slide,
  Button,
  InputBase,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PaymentIcon from '@mui/icons-material/Payment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import StorageIcon from '@mui/icons-material/Storage';
import SettingsIcon from '@mui/icons-material/Settings';

import { useAuth } from '../store/auth';
import { useNotifications, NotificationPayload } from '../store/notifications';
import dayjs from 'dayjs';

const drawerWidth = 260;

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/employees', label: 'Employees', icon: <PeopleIcon /> },
  { path: '/attendance', label: 'Attendance', icon: <AccessTimeIcon /> },
  
];

const DexaLogo = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'center' }}>
    <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 15 L88 85 H12 Z" stroke="#B71C1C" strokeWidth="8" strokeLinejoin="round" />
      <path d="M50 38 C42 38 42 50 50 52 C58 54 58 66 50 66 C42 66 42 54 50 52 C58 50 58 38 50 38 Z" stroke="#B71C1C" strokeWidth="6" strokeLinejoin="round" />
    </svg>
    <Typography variant="h6" fontWeight={800} sx={{ color: '#1A1A1A', letterSpacing: '-0.02em', m: 0, lineHeight: 1 }}>
      Dexa<Box component="span" sx={{ fontWeight: 400 }}>Group</Box>
    </Typography>
  </Box>
);

function severityFromType(type: NotificationPayload['type']) {
  switch (type) {
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'info';
  }
}

export default function AdminAppShell() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const notificationsStore = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event &&
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' ||
        (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setMobileOpen(open);
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    notificationsStore.markAllRead();
  };

  const handleNotificationClose = () => {
    setAnchorEl(null);
  };

  const handleClearAll = () => {
    notificationsStore.clearAll();
    setAnchorEl(null);
  };

  const handleLogout = () => {
    auth.logout();
    navigate('/login', { replace: true });
  };

  const drawerContent = (
    <Box sx={{ width: drawerWidth, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          px: 3,
          py: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        <DexaLogo />
      </Box>
      <List sx={{ px: 2, py: 1, flexGrow: 1, overflowY: 'auto' }}>
        {navItems.map((item) => {
          const selected = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={selected}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  '&.Mui-selected': {
                    bgcolor: '#B71C1C',
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#861313',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: selected ? 'white' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{ 
                    fontWeight: selected ? 700 : 500,
                    fontSize: '0.9rem'
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      {/* Bottom Sidebar Image */}
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            component="img"
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop"
            sx={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
          />
          <Box sx={{ p: 1.5 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Build for a
            </Typography>
            <Typography variant="subtitle2" fontWeight={800} color="#B71C1C">
              Healthier Tomorrow
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  const recent10 = notificationsStore.items.slice(0, 10);

  return (
    <Box ref={containerRef} sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F9FAFB' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: isDesktop ? `calc(100% - ${drawerWidth}px)` : '100%',
          ml: isDesktop ? `${drawerWidth}px` : 0,
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: '#F9FAFB',
          color: 'text.primary',
          borderBottom: 'none'
        }}
      >
        <Toolbar sx={{ minHeight: 80, gap: 2, px: { xs: 2, md: 4 } }}>
          {!isDesktop && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }}>
           
          </Box>

          {/* Search Bar */}
          

         

          

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 35,
                height: 35,
                bgcolor: 'primary.main',
                color: 'white',
                fontWeight: 700,
                fontSize: 14,
              }}
              src={auth.user?.photo || undefined}
            >
              {auth.user?.name?.charAt(0).toUpperCase() ?? 'A'}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="subtitle2" sx={{ lineHeight: 1.2, fontWeight: 700 }}>
                {auth.user?.name ?? 'Annasrul'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {auth.user?.role ?? 'Admin HRD'}
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              aria-controls="notification-menu"
              aria-haspopup="true"
              onClick={handleNotificationClick}
              sx={{ 
                position: 'relative', 
                bgcolor: 'white', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Badge
                badgeContent={notificationsStore.unreadCount}
                color="error"
                max={99}
                invisible={notificationsStore.unreadCount === 0}
              >
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="Logout">
            <IconButton onClick={handleLogout} color="error" size="small">
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 480,
            mt: 1.5,
            borderRadius: 3,
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Notifications
          </Typography>
          {notificationsStore.items.length > 0 && (
            <Button
              size="small"
              color="error"
              startIcon={<DeleteSweepIcon fontSize="small" />}
              onClick={handleClearAll}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Clear all
            </Button>
          )}
        </Box>
        {recent10.length === 0 ? (
          <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications yet.
            </Typography>
          </Box>
        ) : (
          recent10.map((n) => (
            <MenuItem key={n.id} sx={{ py: 1.5, alignItems: 'flex-start', gap: 1.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor:
                    n.type === 'success'
                      ? 'success.main'
                      : n.type === 'error'
                      ? 'error.main'
                      : n.type === 'warning'
                      ? 'warning.main'
                      : 'info.main',
                  mt: 1,
                  flexShrink: 0,
                }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box display="flex" justifyContent="space-between" gap={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                    {n.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                    {dayjs(n.timestamp).fromNow()}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {n.message}
                </Typography>
              </Box>
              <ListItemSecondaryAction>
                <IconButton edge="end" size="small" onClick={() => setAnchorEl(null)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </MenuItem>
          ))
        )}
      </Menu>

      {isDesktop ? (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { 
              width: drawerWidth, 
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
              boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      ) : (
        <SwipeableDrawer
          anchor="left"
          open={mobileOpen}
          onClose={toggleDrawer(false)}
          onOpen={toggleDrawer(true)}
        >
          {drawerContent}
        </SwipeableDrawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 8, md: 10 },
        }}
      >
        <Outlet />
      </Box>

      <Snackbar
        open={notificationsStore.snackbar.open}
        autoHideDuration={6000}
        onClose={notificationsStore.closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={(props) => <Slide {...props} direction="left" />}
      >
        <Alert
          severity={notificationsStore.snackbar.payload ? severityFromType(notificationsStore.snackbar.payload.type) : 'info'}
          sx={{
            width: '100%',
            minWidth: 320,
            borderRadius: 3,
            boxShadow: 3,
            fontWeight: 500,
          }}
          onClose={notificationsStore.closeSnackbar}
        >
          {notificationsStore.snackbar.payload && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {notificationsStore.snackbar.payload.title}
              </Typography>
              <Typography variant="body2">{notificationsStore.snackbar.payload.message}</Typography>
            </>
          )}
        </Alert>
      </Snackbar>
    </Box>
  );
}