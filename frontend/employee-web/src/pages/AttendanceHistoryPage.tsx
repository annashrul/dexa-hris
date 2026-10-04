import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/id';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  Chip,
  IconButton,
  Button,
  Divider,
  Fade,
  Skeleton,
  useTheme,
  useMediaQuery,
  SwipeableDrawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  TextField,
  MenuItem,
  Avatar,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InboxIcon from '@mui/icons-material/Inbox';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import WorkIcon from '@mui/icons-material/Work';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import api from '../lib/api';

dayjs.locale('id');

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  durationMinutes: number;
}

const PRESETS: { label: string; range: () => [Dayjs, Dayjs] }[] = [
  { label: '7 Days', range: () => [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')] },
  { label: '30 Days', range: () => [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')] },
  { label: 'This Month', range: () => [dayjs().startOf('month').startOf('day'), dayjs().endOf('day')] },
];

function toStr(d: Dayjs | null): string | undefined {
  return d && d.isValid() ? d.format('YYYY-MM-DD') : undefined;
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

function normalizeRows(payload: any): AttendanceRecord[] {
  let raw: any[] = [];
  if (Array.isArray(payload)) raw = payload;
  else if (payload && typeof payload === 'object') {
    const candidate =
      payload.rows ??
      payload?.data?.rows ??
      payload.records ??
      payload?.data?.records ??
      payload.items ??
      payload?.data;
    if (Array.isArray(candidate)) raw = candidate;
  }
  const out: AttendanceRecord[] = [];
  for (let i = 0; i < raw.length; i++) {
    const r = raw[i];
    if (!r) continue;
    const dateVal = r.date ?? r.tanggal ?? dayjs().format('YYYY-MM-DD');
    let ci: Dayjs | null = null;
    let co: Dayjs | null = null;
    if (typeof r.checkIn === 'string' || typeof r.checkOut === 'string') {
      ci = r.checkIn ? dayjs(r.checkIn) : null;
      co = r.checkOut ? dayjs(r.checkOut) : null;
      if (ci && !ci.isValid()) ci = null;
      if (co && !co.isValid()) co = null;
    } else {
      ci = combineDateTime(dateVal, r.masuk?.time, r.masuk?.createdAt);
      co = combineDateTime(dateVal, r.pulang?.time, r.pulang?.createdAt);
    }
    const ciStr = ci ? ci.toISOString() : null;
    const coStr = co ? co.toISOString() : null;
    let duration = 0;
    if (ci && co) {
      const m = co.diff(ci, 'minute');
      if (m > 0 && m < 24 * 60) duration = Math.round(m);
    }
    out.push({
      id: r.id ?? `${dateVal}-${i}-pair`,
      date: dateVal,
      checkIn: ciStr,
      checkOut: coStr,
      status: ci ? (co ? 'Hadir Lengkap' : 'Belum Check-Out') : 'Tidak Hadir',
      durationMinutes: duration,
    });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

function fmtClock(iso: string | null): string {
  if (!iso) return '--:--';
  const d = dayjs(iso);
  if (!d.isValid()) return '--:--';
  return d.format('HH:mm');
}

function fmtDateLong(dateStr: string): string {
  const d = dayjs(dateStr);
  return d.isValid() ? d.format('dddd, DD MMM YYYY') : dateStr;
}

function fmtDateShort(dateStr: string): string {
  const d = dayjs(dateStr);
  return d.isValid() ? d.format('DD MMM YYYY') : dateStr;
}

function fmtMonthHeader(dateStr: string): string {
  const d = dayjs(dateStr);
  return d.isValid() ? d.format('MMMM YYYY') : dateStr;
}

function fmtDuration(minutes: number): string {
  if (!minutes) return '-';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}j ${m}m` : `${h} jam`;
}

function pickBarColor(status: string, hasCheckOut: boolean): string {
  if (status === 'Hadir Lengkap') return '#2E7D32';
  if (status === 'Belum Check-Out') return '#EF6C00';
  return '#9E9E9E';
}

interface Grouped {
  monthKey: string;
  header: string;
  items: AttendanceRecord[];
  hadirLengkap: number;
  belumPulang: number;
  totalDurasi: number;
}

function groupByMonth(records: AttendanceRecord[]): Grouped[] {
  const map = new Map<string, Grouped>();
  for (const r of records) {
    const key = dayjs(r.date).format('YYYY-MM');
    let g = map.get(key);
    if (!g) {
      g = { monthKey: key, header: fmtMonthHeader(r.date), items: [], hadirLengkap: 0, belumPulang: 0, totalDurasi: 0 };
      map.set(key, g);
    }
    g.items.push(r);
    if (r.status === 'Hadir Lengkap') g.hadirLengkap += 1;
    else if (r.status === 'Belum Check-Out') g.belumPulang += 1;
    g.totalDurasi += r.durationMinutes || 0;
  }
  return Array.from(map.values()).sort((a, b) => (a.monthKey < b.monthKey ? 1 : -1));
}

export default function AttendanceHistoryPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
  const [searchParams, setSearchParams] = useSearchParams();
  const today = dayjs();
  
  const savedFrom = localStorage.getItem('hris_history_from');
  const savedTo = localStorage.getItem('hris_history_to');

  const initialFrom = searchParams.get('from') 
    ? dayjs(searchParams.get('from')) 
    : savedFrom ? dayjs(savedFrom) : today.startOf('month').startOf('day');
    
  const initialTo = searchParams.get('to') 
    ? dayjs(searchParams.get('to')) 
    : savedTo ? dayjs(savedTo) : today.endOf('day');
  
  const [from, setFrom] = useState<Dayjs | null>(initialFrom);
  const [to, setTo] = useState<Dayjs | null>(initialTo);
  const [tempFrom, setTempFrom] = useState<Dayjs | null>(from);
  const [tempTo, setTempTo] = useState<Dayjs | null>(to);
  const [filterOpen, setFilterOpen] = useState(false);
  
  useEffect(() => {
    // If URL has no params but we have local state, sync URL once on mount
    if (!searchParams.has('from') || !searchParams.has('to')) {
      const p = new URLSearchParams(searchParams);
      if (from) p.set('from', from.format('YYYY-MM-DD'));
      if (to) p.set('to', to.format('YYYY-MM-DD'));
      setSearchParams(p, { replace: true });
    }
  }, [from, to, searchParams, setSearchParams]);

  // Date states for the desktop inline filter panel
  const [fromDate, setFromDate] = useState<Dayjs | null>(from);
  const [toDate, setToDate] = useState<Dayjs | null>(to);

  const handleApplyFilter = () => {
    const p = new URLSearchParams(searchParams);
    if (fromDate) {
      p.set('from', fromDate.format('YYYY-MM-DD'));
      localStorage.setItem('hris_history_from', fromDate.format('YYYY-MM-DD'));
    }
    if (toDate) {
      p.set('to', toDate.format('YYYY-MM-DD'));
      localStorage.setItem('hris_history_to', toDate.format('YYYY-MM-DD'));
    }
    setSearchParams(p);
  };

  const fStr = toStr(from);
  const tStr = toStr(to);

  const { data, isFetching, isInitialLoading, refetch } = useQuery({
    queryKey: ['attendance', 'history', fStr, tStr],
    queryFn: async () => {
      const { data: resp } = await api.get('/attendance/me', {
        params: { from: fStr, to: tStr },
      });
      return normalizeRows(resp);
    },
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 1,
  });

  const records: AttendanceRecord[] = Array.isArray(data) ? data : [];
  const groups = useMemo(() => groupByMonth(records), [records]);

  const stats = useMemo(() => {
    let hadir = 0;
    let ciCount = 0;
    let coCount = 0;
    let total = 0;
    for (const r of records) {
      total += r.durationMinutes || 0;
      if (r.status === 'Hadir Lengkap') hadir += 1;
      if (r.checkIn) ciCount += 1;
      if (r.checkOut) coCount += 1;
    }
    const fromD = from && from.isValid() ? from : dayjs().startOf('month');
    const toD = to && to.isValid() ? to : dayjs();
    const workdays = Math.max(1, Math.min(31, toD.diff(fromD, 'day') + 1));
    const pct = Math.min(100, Math.round((hadir / workdays) * 100));
    return { hadir, ciCount, coCount, total, pct, workdays };
  }, [records, from, to]);

  const applyTempPreset = (idx: number) => {
    const [f, t] = PRESETS[idx].range();
    setTempFrom(f);
    setTempTo(t);
  };

  const commitFilter = () => {
    setFrom(tempFrom);
    setTo(tempTo);
    
    if (tempFrom) localStorage.setItem('hris_history_from', tempFrom.format('YYYY-MM-DD'));
    if (tempTo) localStorage.setItem('hris_history_to', tempTo.format('YYYY-MM-DD'));
    
    // Sync to URL so reloading page keeps the filter
    const p = new URLSearchParams(searchParams);
    if (tempFrom) p.set('from', tempFrom.format('YYYY-MM-DD'));
    if (tempTo) p.set('to', tempTo.format('YYYY-MM-DD'));
    setSearchParams(p);

    setFilterOpen(false);
  };

  const handleOpenFilter = () => {
    setTempFrom(from);
    setTempTo(to);
    setFilterOpen(true);
  };

  const filterContent = (
    <Stack spacing={3} sx={{ p: 1 }}>
      <Box>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Select Date Range
        </Typography>
        <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
          <DatePicker
            label="From Date"
            value={tempFrom}
            onChange={(v) => setTempFrom(v)}
            format="DD/MM/YYYY"
            slotProps={{ textField: { fullWidth: true } }}
          />
          <DatePicker
            label="To Date"
            value={tempTo}
            onChange={(v) => setTempTo(v)}
            format="DD/MM/YYYY"
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Stack>
      </Box>

      <Box>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Quick Select
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {PRESETS.map((p, i) => (
            <Chip
              key={p.label}
              label={p.label}
              onClick={() => applyTempPreset(i)}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Box>
      </Box>
    </Stack>
  );

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 3, md: 4 }, pb: { xs: 10, sm: 10, md: 4 } }}>
      <Stack spacing={{ xs: 2, sm: 3 }}>
        
        {/* Header - Always same as Mobile */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" fontWeight={800} letterSpacing="-0.01em">
              Attendance Records
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Showing {records.length} records
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={() => refetch()} color={isFetching ? 'warning' : 'primary'} size="small" disabled={isFetching}>
              <RefreshIcon />
            </IconButton>
            <Button
              variant="contained"
              size="small"
              startIcon={<FilterListIcon />}
              onClick={handleOpenFilter}
              sx={{ borderRadius: 8, fontWeight: 700, textTransform: 'none', px: 2, boxShadow: 0 }}
            >
              Filter
            </Button>
          </Box>
        </Box>

        {/* MODAL FILTER BOTTOM SHEET (MOBILE) OR DIALOG (DESKTOP) */}
        {isDesktop ? (
          <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={700}>Filter History</Typography>
              <IconButton onClick={() => setFilterOpen(false)} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent>
              {filterContent}
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setFilterOpen(false)} color="inherit">Cancel</Button>
              <Button variant="contained" onClick={commitFilter} sx={{ borderRadius: 2, px: 3 }}>
                Apply Filter
              </Button>
            </DialogActions>
          </Dialog>
        ) : (
          <SwipeableDrawer
            anchor="bottom"
            open={filterOpen}
            onClose={() => setFilterOpen(false)}
            onOpen={() => setFilterOpen(true)}
            disableSwipeToOpen
            PaperProps={{
              sx: {
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                pb: 'env(safe-area-inset-bottom)',
              }
            }}
          >
            <Box sx={{ px: 3, pt: 1.5, pb: 2 }}>
              <Box sx={{ width: 40, height: 5, bgcolor: 'grey.300', borderRadius: 2, mx: 'auto', mb: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>Filter History</Typography>
                <IconButton onClick={() => setFilterOpen(false)} size="small" sx={{ mr: -1 }}><CloseIcon /></IconButton>
              </Box>
              {filterContent}
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={commitFilter}
                sx={{ mt: 4, borderRadius: 3, fontWeight: 700, fontSize: 16 }}
              >
                Apply Filter
              </Button>
            </Box>
          </SwipeableDrawer>
        )}

        {/* STATS ROW NATIVE GRID 2x2 ON MOBILE */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1.5,
          }}
        >
          <StatsCard flat label="Present" value={String(stats.hadir)} icon={<CheckCircleIcon sx={{ fontSize: 18 }} />} color="success" />
          <StatsCard flat label="Work Hours" value={fmtDuration(stats.total)} icon={<WorkIcon sx={{ fontSize: 18 }} />} color="warning" />
          <StatsCard flat label="Check-In" value={String(stats.ciCount)} icon={<LoginIcon sx={{ fontSize: 18 }} />} color="primary" />
          <StatsCard flat label="Check-Out" value={String(stats.coCount)} icon={<LogoutIcon sx={{ fontSize: 18 }} />} color="info" />
        </Box>

        {/* PROGRESS ATTENDANCE BAR FLAT */}
        <Box sx={{ bgcolor: 'background.paper', p: { xs: 2, sm: 2.5 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={1.25}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeFilledIcon color="primary" sx={{ fontSize: 18 }} />
                <Typography variant="subtitle2" fontWeight={700}>Attendance Percentage</Typography>
              </Box>
              <Typography variant="subtitle2" fontWeight={800} color="primary">{stats.pct}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={stats.pct}
              sx={{
                height: 8,
                borderRadius: 99,
                bgcolor: 'rgba(183,28,28,0.12)',
                '& .MuiLinearProgress-bar': { borderRadius: 99, background: `linear-gradient(90deg, ${theme.palette.primary.main}, #FF6F00 90%)` },
              }}
            />
          </Stack>
        </Box>

        {/* LOADING / EMPTY / DATA */}
        {isInitialLoading ? (
          <Fade in timeout={220}>
            <Box>
              <Stack spacing={1.5}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={96} sx={{ borderRadius: 3 }} />
                ))}
              </Stack>
            </Box>
          </Fade>
        ) : records.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'rgba(183,28,28,0.06)', mx: 'auto', mb: 2 }}>
              <InboxIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            </Avatar>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>No attendance records</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Attendance data not found for this date range.
            </Typography>
            <Button variant="outlined" size="small" sx={{ borderRadius: 8 }} onClick={() => setFilterOpen(true)}>
              Change Filter
            </Button>
          </Box>
        ) : (
          <Stack spacing={3} sx={{ mt: 1 }}>
            {groups.map((g) => (
              <Box key={g.monthKey}>
                <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, pl: 0.5 }}>
                  {g.header}
                </Typography>
                <Stack spacing={0}>
                  {g.items.map((r, idx) => (
                    <NativeAttendanceCard key={r.id} record={r} last={idx === g.items.length - 1} />
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

/* ============ SUB COMPONENTS ============ */

function StatsCard({ label, value, icon, color, sub, flat }: { label: string; value: string; icon: React.ReactNode; color: string; sub?: string; flat?: boolean }) {
  const theme = useTheme();
  const paletteMap: Record<string, { main: string; soft: string }> = {
    success: { main: '#2E7D32', soft: 'rgba(46,125,50,0.10)' },
    primary: { main: theme.palette.primary.main, soft: 'rgba(183,28,28,0.10)' },
    info: { main: '#0277BD', soft: 'rgba(2,119,189,0.10)' },
    warning: { main: '#EF6C00', soft: 'rgba(239,108,0,0.10)' },
  };
  const c = paletteMap[color] || paletteMap.primary;

  return (
    <Box
      sx={{
        minWidth: 0,
        bgcolor: flat ? 'background.paper' : 'transparent',
        p: flat ? 1.5 : 2,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box sx={{ width: flat ? 28 : 32, height: flat ? 28 : 32, borderRadius: 2, bgcolor: c.soft, color: c.main, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: flat ? '0.7rem' : undefined }}>{label}</Typography>
      </Box>
      <Typography variant={flat ? 'h6' : 'h5'} fontWeight={800} sx={{ lineHeight: 1.1, color: 'text.primary', fontSize: flat ? '1.1rem' : undefined }}>{value}</Typography>
      {sub && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontSize: flat ? '0.65rem' : undefined }}>{sub}</Typography>}
    </Box>
  );
}

function NativeAttendanceCard({ record, last }: { record: AttendanceRecord; last: boolean }) {
  const barColor = pickBarColor(record.status, !!record.checkOut);
  
  return (
    <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', gap: 1.5, py: 1.5 }}>
        {/* Left Indicator */}
        <Box sx={{ width: 4, borderRadius: 2, bgcolor: barColor, flexShrink: 0, mt: 0.5, mb: 0.5 }} />
        
        {/* Main Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {fmtDateShort(record.date)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {fmtDateLong(record.date).split(', ')[0]}
              </Typography>
            </Box>
            <Chip
              label={record.status}
              size="small"
              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: `${barColor}15`, color: barColor }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', mb: 0.25 }}>CHECK IN</Typography>
              <Typography variant="body2" fontWeight={700} color={record.checkIn ? 'text.primary' : 'text.disabled'}>
                {fmtClock(record.checkIn)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', mb: 0.25 }}>CHECK OUT</Typography>
              <Typography variant="body2" fontWeight={700} color={record.checkOut ? 'text.primary' : 'text.disabled'}>
                {fmtClock(record.checkOut)}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto', textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', mb: 0.25 }}>DURATION</Typography>
              <Typography variant="body2" fontWeight={700} color="#0277BD">
                {fmtDuration(record.durationMinutes)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      {!last && <Divider sx={{ ml: 2.5 }} />}
    </Box>
  );
}


