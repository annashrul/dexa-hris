import { useEffect, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/id';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Container,
  Snackbar,
  Alert,
  Skeleton,
  Chip,
  Grid,
} from '@mui/material';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../lib/api';

dayjs.locale('id');

interface TodayRawEntry {
  id?: string;
  date?: string;
  time?: string;
  status?: string;
  createdAt?: string;
}

interface TodayAttendance {
  date?: string;
  checkInRaw: string | Dayjs | TodayRawEntry | null;
  checkOutRaw: string | Dayjs | TodayRawEntry | null;
}

interface UserFromStorage {
  name: string;
}

function getUser(): UserFromStorage | null {
  const raw = localStorage.getItem('emp_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserFromStorage;
  } catch {
    return null;
  }
}

function combineDateTime(dateStr: string | undefined | null, timeStr: string | undefined | null, fallbackIso?: string | null): Dayjs | null {
  if (fallbackIso) {
    const d = dayjs(fallbackIso);
    if (d.isValid()) return d;
  }
  if (dateStr && timeStr) {
    const combined = `${dateStr} ${timeStr}`;
    const d = dayjs(combined);
    if (d.isValid()) return d;
  }
  if (timeStr) {
    const d = dayjs(timeStr);
    if (d.isValid()) return d;
  }
  if (dateStr) {
    const d = dayjs(dateStr);
    if (d.isValid()) return d;
  }
  return null;
}

function toDayjs(value: any, todayDate?: string): Dayjs | null {
  if (value == null) return null;
  if (dayjs.isDayjs(value)) return value.isValid() ? value : null;
  if (typeof value === 'object') {
    return combineDateTime(
      value.date ?? todayDate,
      value.time,
      value.createdAt
    );
  }
  if (typeof value === 'string') {
    const iso = dayjs(value);
    if (iso.isValid() && iso.year() > 2000) return iso;
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(value) && todayDate) {
      const d = dayjs(`${todayDate} ${value}`);
      if (d.isValid()) return d;
    }
    return null;
  }
  return null;
}

function fmtClock(val: Dayjs | null): string {
  if (!val || !val.isValid()) return '--:--';
  return val.format('HH:mm');
}

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const user = getUser();
  const [now, setNow] = useState<Dayjs>(dayjs());
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ open: false, type: 'success', message: '' });

  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data, isLoading } = useQuery<TodayAttendance>({
    queryKey: ['attendance', 'today'],
    queryFn: async () => {
      const { data: resp } = await api.get('/attendance/me/today');
      const payload = (resp?.data ?? resp ?? {}) as any;
      const dateStr: string | undefined = payload.date ?? payload.tanggal;
      return {
        date: dateStr,
        checkInRaw: payload.checkIn ?? payload.checkin ?? payload.masuk ?? null,
        checkOutRaw: payload.checkOut ?? payload.checkout ?? payload.pulang ?? null,
      };
    },
    retry: 1,
  });

  const checkIn = toDayjs(data?.checkInRaw, data?.date);
  const checkOut = toDayjs(data?.checkOutRaw, data?.date);
  const hasCheckedIn = !!checkIn;
  const hasCheckedOut = !!checkOut;

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/attendance/me/check-in');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'], exact: false, refetchType: 'all' });
      setSnackbar({ open: true, type: 'success', message: 'Check-in successful!' });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message || err?.message || 'Check-in failed.';
      setSnackbar({
        open: true,
        type: 'error',
        message: typeof msg === 'string' ? msg : 'Check-in failed.',
      });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/attendance/me/check-out');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'], exact: false, refetchType: 'all' });
      setSnackbar({ open: true, type: 'success', message: 'Check-out successful!' });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message || err?.message || 'Check-out failed.';
      setSnackbar({
        open: true,
        type: 'error',
        message: typeof msg === 'string' ? msg : 'Check-out failed.',
      });
    },
  });

  const greeting = (() => {
    const h = now.hour();
    if (h < 11) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  })();

  const currentHour = now.hour();
  let greetingEng = 'Good morning';
  if (currentHour >= 12 && currentHour < 17) greetingEng = 'Good afternoon';
  else if (currentHour >= 17) greetingEng = 'Good evening';

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 3, md: 4 }, pb: { xs: 10, sm: 10, md: 4 } }}>
      <Stack spacing={{ xs: 2, sm: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={800} letterSpacing="-0.01em" sx={{ lineHeight: 1.2 }}>
            {greetingEng},<br />{user?.name || 'Andi Pratama'}!
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            Let's keep making a healthier tomorrow together.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {now.format('dddd, DD MMM YYYY')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
              {now.format('HH:mm')}
            </Typography>
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
              WIB
            </Typography>
          </Box>
        </Box>

        <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Stack spacing={2.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" fontWeight={800}>
                  Today's Attendance
                </Typography>
                <Chip
                  size="small"
                  label="Within Office Hours"
                  sx={{ bgcolor: '#EAF6EC', color: '#2E7D32', fontWeight: 700, fontSize: '0.7rem' }}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box sx={{ mt: 0.5, color: 'text.secondary' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    Dexa Tower - Head Office
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Jakarta, Indonesia
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => checkInMutation.mutate()}
                  disabled={hasCheckedIn || checkInMutation.isPending || checkOutMutation.isPending}
                  sx={{
                    minHeight: 56,
                    borderRadius: 3,
                    bgcolor: '#B71C1C',
                    boxShadow: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.25,
                    ':hover': { bgcolor: '#861313', boxShadow: 'none' },
                    ':disabled': { bgcolor: '#F5F5F5', color: 'text.disabled' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LoginIcon sx={{ fontSize: 18 }} />
                    <Typography variant="subtitle2" fontWeight={700}>Check In</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 500 }}>
                    06:30 - 12:00
                  </Typography>
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => checkOutMutation.mutate()}
                  disabled={!hasCheckedIn || hasCheckedOut || checkInMutation.isPending || checkOutMutation.isPending}
                  sx={{
                    minHeight: 56,
                    borderRadius: 3,
                    borderWidth: 1.5,
                    borderColor: '#B71C1C',
                    color: '#B71C1C',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.25,
                    ':hover': { borderColor: '#861313', borderWidth: 1.5, bgcolor: 'rgba(183,28,28,0.04)' },
                    ':disabled': { borderColor: 'divider', color: 'text.disabled', borderWidth: 1.5 },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LogoutIcon sx={{ fontSize: 18 }} />
                    <Typography variant="subtitle2" fontWeight={700}>Check Out</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 500 }}>
                    13:00 - 18:00
                  </Typography>
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{  border: 'none', bgcolor: 'transparent', boxShadow: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, px: 1 }}>
            <Typography variant="subtitle1" fontWeight={800}>
              Today's Summary
            </Typography>
            <Typography variant="caption" fontWeight={700} color="primary" sx={{ cursor: 'pointer' }}>
              View History →
            </Typography>
          </Box>

          {isLoading ? (
            <Stack spacing={2}>
              <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 3 }} />
              <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 3 }} />
            </Stack>
          ) : (
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <LoginIcon sx={{ fontSize: 20, color: 'text.secondary', mt: 0.5 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>Check In</Typography>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {hasCheckedIn ? fmtClock(checkIn) : '--:--'} <Box component="span" sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 500 }}>WIB</Box>
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <LogoutIcon sx={{ fontSize: 20, color: 'text.secondary', mt: 0.5 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>Check Out</Typography>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {hasCheckedOut ? fmtClock(checkOut) : '--:--'} <Box component="span" sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 500 }}>WIB</Box>
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <AccessTimeFilledIcon sx={{ fontSize: 20, color: 'text.secondary', mt: 0.5 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>Working Hours</Typography>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {hasCheckedIn && hasCheckedOut && checkIn && checkOut ? (() => {
                        const m = checkOut.diff(checkIn, 'minute');
                        const h = Math.floor(m / 60);
                        const mins = m % 60;
                        return `${h}h ${mins}m`;
                      })() : '--'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <CheckCircleIcon sx={{ fontSize: 20, color: hasCheckedIn ? 'success.main' : 'error.main', mt: 0.5 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>Status</Typography>
                    <Typography variant="subtitle2" fontWeight={700} color={hasCheckedIn ? 'success.main' : 'error.main'}>
                      {hasCheckedIn ? 'Present' : 'Absent'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}
        </Card>
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.type}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
