import { useQuery } from '@tanstack/react-query';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Stack,
  Chip,
  Divider,
  Skeleton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import api from '../lib/api';
import { useNotifications } from '../store/notifications';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  Employee,
  AttendanceFlatRecord,
  AttendanceSummaryResponse,
  unwrapEmployees,
  unwrapAttendanceSummary,
  flattenAttendance,
} from '../lib/api-types';

dayjs.extend(relativeTime);

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
  trend,
  trendColor,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: string;
  trendColor?: string;
}) {
  return (
    <Card elevation={0} sx={{ border: 'none', height: '100%', bgcolor: color, borderRadius: 4 }}>
      <CardContent sx={{ p: 3, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <Box sx={{ color: 'text.primary', display: 'flex', alignItems: 'center' }}>
              {icon}
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {title}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="baseline" spacing={1} mb={0.5}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary' }}>
              {value}
            </Typography>
            {trend && (
              <Typography variant="caption" sx={{ fontWeight: 700, color: trendColor }}>
                {trend}
              </Typography>
            )}
          </Stack>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {/* Decorative background icon */}
        <Box
          sx={{
            position: 'absolute',
            right: -10,
            bottom: -10,
            opacity: 0.1,
            transform: 'scale(3)',
            color: 'text.primary',
            pointerEvents: 'none',
          }}
        >
          {icon}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const notifications = useNotifications();
  const today = dayjs().format('YYYY-MM-DD');

  const {
    data: employees,
    isLoading: empLoading,
  } = useQuery<Employee[]>({
    queryKey: ['admin', 'employees'],
    queryFn: async () => {
      const { data } = await api.get('/admin/employees');
      return unwrapEmployees(data);
    },
  });

  const {
    data: summary,
    isLoading: attLoading,
  } = useQuery<AttendanceSummaryResponse>({
    queryKey: ['admin', 'attendance', { from: today, to: today }],
    queryFn: async () => {
      const { data } = await api.get('/admin/attendance', {
        params: { from: today, to: today },
      });
      return unwrapAttendanceSummary(data);
    },
  });

  const totalEmployees = employees?.length ?? 0;
  const checkedInToday = summary?.masukCount ?? 0;
  const checkedOutToday = summary?.pulangCount ?? 0;
  const todayRecords = (summary ? summary.masukCount + summary.pulangCount : 0);

  const activityList: AttendanceFlatRecord[] = summary ? flattenAttendance(summary) : [];

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} lg={3}>
          {empLoading ? (
            <Skeleton variant="rounded" height={140} sx={{ borderRadius: 4 }} />
          ) : (
            <StatCard
              title="Total Employees"
              value={totalEmployees}
              color="#FFF0F2"
              icon={<PeopleIcon color="error" />}
              subtitle="+24 from last month"
              trend="↑ 2%"
              trendColor="success.main"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          {attLoading ? (
            <Skeleton variant="rounded" height={140} sx={{ borderRadius: 4 }} />
          ) : (
            <StatCard
              title="Present Today"
              value={checkedInToday}
              color="#E8F5E9"
              icon={<LoginIcon color="success" />}
              subtitle="of total employees"
              trend="↑ 81%"
              trendColor="success.main"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          {attLoading ? (
            <Skeleton variant="rounded" height={140} sx={{ borderRadius: 4 }} />
          ) : (
            <StatCard
              title="Late Today"
              value={Math.floor(checkedInToday * 0.1)} // dummy logic to show late
              color="#FFF8E1"
              icon={<AccessTimeIcon color="warning" />}
              subtitle="of total employees"
              trend="↑ 7%"
              trendColor="warning.main"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          {attLoading ? (
            <Skeleton variant="rounded" height={140} sx={{ borderRadius: 4 }} />
          ) : (
            <StatCard
              title="Absent Today"
              value={Math.max(0, totalEmployees - checkedInToday)} // dummy absent
              color="#FFEBEE"
              icon={<LogoutIcon color="error" />}
              subtitle="of total employees"
              trend="↓ 12%"
              trendColor="error.main"
            />
          )}
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Today Attendance Activity
                </Typography>
                <Chip label={`${todayRecords} records`} size="small" color="primary" variant="outlined" />
              </Stack>
              <Divider sx={{ mb: 1 }} />
              {attLoading ? (
                <Stack spacing={2} pt={1}>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} variant="rounded" height={64} />
                  ))}
                </Stack>
              ) : activityList.length > 0 ? (
                <List disablePadding sx={{ maxHeight: 420, overflowY: 'auto' }}>
                  {activityList.map((rec, idx) => {
                    const statusUpper = String(rec.status).toUpperCase();
                    const isIn = statusUpper === 'MASUK' || statusUpper === 'CHECK-IN';
                    const displayStatus = isIn ? 'CHECK-IN' : 'CHECK-OUT';
                    const initial = (rec.employeeName || rec.employee?.name || 'E').charAt(0).toUpperCase();
                    return (
                      <div key={`${rec.id}-${idx}`}>
                        <ListItem sx={{ px: 1, py: 1.5 }}>
                          <ListItemAvatar>
                            <Avatar
                              src={rec.employee?.photo || undefined}
                              sx={{
                                bgcolor: isIn ? 'success.main' : 'info.main',
                                color: 'white',
                                fontWeight: 700,
                              }}
                            >
                              {initial}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                  {rec.employeeName || rec.employee?.name || `Employee #${rec.employeeId}`}
                                </Typography>
                                <Chip
                                  label={displayStatus}
                                  size="small"
                                  color={isIn ? 'success' : 'info'}
                                  sx={{ fontWeight: 700 }}
                                />
                              </Stack>
                            }
                            secondary={
                              <Stack direction="row" spacing={2} mt={0.5} flexWrap="wrap">
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}
                                >
                                  <AccessTimeIcon fontSize="inherit" />
                                  {rec.date} {rec.time}
                                </Typography>
                                {rec.employeePosition && (
                                  <Typography variant="caption" color="text.secondary">
                                    {rec.employeePosition}
                                  </Typography>
                                )}
                              </Stack>
                            }
                          />
                        </ListItem>
                        {idx < activityList.length - 1 && <Divider variant="inset" component="li" />}
                      </div>
                    );
                  })}
                </List>
              ) : (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <AssignmentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No attendance activity today.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Recent Notifications
                </Typography>
                <Chip
                  label={notifications.items.length}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              </Stack>
              <Divider sx={{ mb: 1 }} />
              {notifications.items.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No recent notifications.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding sx={{ maxHeight: 420, overflowY: 'auto' }}>
                  {notifications.items.slice(0, 10).map((n, idx) => (
                    <div key={n.id}>
                      <ListItem sx={{ px: 1, py: 1.5, alignItems: 'flex-start' }}>
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor:
                                n.type === 'success'
                                  ? 'success.main'
                                  : n.type === 'error'
                                  ? 'error.main'
                                  : n.type === 'warning'
                                  ? 'warning.main'
                                  : 'info.main',
                              color: 'white',
                            }}
                          >
                            <NotificationsIcon fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {n.title}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.3 }}>
                                {n.message}
                              </Typography>
                              <Typography variant="caption" color="text.disabled">
                                {dayjs(n.timestamp).fromNow()}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      {idx < Math.min(notifications.items.length, 10) - 1 && (
                        <Divider variant="inset" component="li" />
                      )}
                    </div>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
