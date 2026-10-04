import { useMemo, useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Skeleton,
  Chip,
  Avatar,
  MenuItem,
  InputAdornment,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckInIcon from '@mui/icons-material/Login';
import CheckOutIcon from '@mui/icons-material/Logout';
import AssignmentIcon from '@mui/icons-material/Assignment';
import dayjs, { Dayjs } from 'dayjs';
import api from '../lib/api';
import {
  Employee,
  AttendanceFlatRecord,
  AttendanceSummaryResponse,
  unwrapEmployees,
  unwrapAttendanceSummary,
  flattenAttendance,
} from '../lib/api-types';

function MiniStat({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
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
              {label}
            </Typography>
          </Stack>
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary' }}>
            {value}
          </Typography>
        </Box>
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

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState<T>(value);
  const tRef = useRef<number | null>(null);
  useEffect(() => {
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => setDebounced(value), delay);
    return () => {
      if (tRef.current) clearTimeout(tRef.current);
    };
  }, [value, delay]);
  return debounced;
}

interface PaginatedAttendanceResponse {
  rows: AttendanceFlatRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: AttendanceSummaryResponse;
}

const toAttendanceFlatFromRaw = (r: any): AttendanceFlatRecord => ({
  id: r.id,
  employeeId: r.employeeId,
  date: r.date,
  time: r.time,
  status: r.status,
  createdAt: r.createdAt,
  employeeName: r.employee?.name,
  employeeEmail: r.employee?.email,
  employeePosition: r.employee?.position,
  employee: r.employee,
});

export default function AttendanceMonitoringPage() {
  const [from, setFrom] = useState<Dayjs | null>(dayjs().subtract(7, 'day'));
  const [to, setTo] = useState<Dayjs | null>(dayjs());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fromStr = from ? from.format('YYYY-MM-DD') : '';
  const toStr = to ? to.format('YYYY-MM-DD') : '';
  const debouncedSearch = useDebounce(search, 400);

  const { data: employees, isLoading: empLoading } = useQuery<Employee[]>({
    queryKey: ['admin', 'employees'],
    queryFn: async () => {
      const { data } = await api.get('/admin/employees');
      return unwrapEmployees(data);
    },
  });

  const {
    data: summaryOnly,
    isLoading: summaryLoading,
  } = useQuery<AttendanceSummaryResponse>({
    queryKey: ['admin', 'attendance', 'summary', { from: fromStr, to: toStr }],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (fromStr) params.from = fromStr;
      if (toStr) params.to = toStr;
      const { data } = await api.get('/admin/attendance', { params });
      return unwrapAttendanceSummary(data);
    },
  });

  const {
    data: pageData,
    isLoading: recordsLoading,
    isError: attError,
  } = useQuery<PaginatedAttendanceResponse>({
    queryKey: ['admin', 'attendance', 'records', { from: fromStr, to: toStr, search: debouncedSearch, page, limit: rowsPerPage }],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        mode: 'records',
        page,
        limit: rowsPerPage,
      };
      if (fromStr) params.from = fromStr;
      if (toStr) params.to = toStr;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const { data } = await api.get('/admin/attendance', { params });
      if (data && typeof data === 'object' && Array.isArray(data.rows)) {
        const normalized: AttendanceFlatRecord[] = data.rows.map(toAttendanceFlatFromRaw);
        return { ...data, rows: normalized } as PaginatedAttendanceResponse;
      }
      // Fallback: client-side flatten
      const summary = unwrapAttendanceSummary(data);
      const flat = flattenAttendance(summary);
      const total = flat.length;
      const skip = (page - 1) * rowsPerPage;
      return {
        rows: flat.slice(skip, skip + rowsPerPage),
        total,
        page,
        limit: rowsPerPage,
        totalPages: Math.max(1, Math.ceil(total / rowsPerPage)),
        summary,
      };
    },
  });

  const attLoading = summaryLoading || recordsLoading;

  const summary = pageData?.summary ?? summaryOnly;

  const filtered = pageData?.rows ?? [];
  const totalRecordsCount = pageData?.total ?? 0;
  const paginated = filtered;

  const handleChangePage = (_e: unknown, newPage: number) => setPage(newPage + 1);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  };

  const totalRecords = (summary?.masukCount ?? 0) + (summary?.pulangCount ?? 0);
  const totalMasuk = summary?.masukCount ?? 0;
  const totalPulang = summary?.pulangCount ?? 0;
  const uniqueEmployees = summary?.uniqueEmployees ?? 0;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Attendance Monitoring
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor employee attendance data (read-only)
        </Typography>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={6} md={4}>
              <DatePicker
                label="From Date"
                value={from}
                onChange={setFrom}
                slotProps={{
                  textField: { fullWidth: true, size: 'small' },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DatePicker
                label="To Date"
                value={to}
                onChange={setTo}
                slotProps={{
                  textField: { fullWidth: true, size: 'small' },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={4}>
              <TextField
                placeholder="Search name / email..."
                fullWidth
                size="small"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2.5}>
        <Grid item xs={6} sm={3}>
          {attLoading ? (
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 4 }} />
          ) : (
            <MiniStat
              label="Total Records"
              value={totalRecords}
              color="#FFF0F2"
              icon={<AssignmentIcon />}
            />
          )}
        </Grid>
        <Grid item xs={6} sm={3}>
          {attLoading ? (
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 4 }} />
          ) : (
            <MiniStat
              label="Active Employees"
              value={uniqueEmployees}
              color="#F3E5F5"
              icon={<CalendarTodayIcon />}
            />
          )}
        </Grid>
        <Grid item xs={6} sm={3}>
          {attLoading ? (
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 4 }} />
          ) : (
            <MiniStat
              label="Check-in"
              value={totalMasuk}
              color="#E3F2FD"
              icon={<CheckInIcon />}
            />
          )}
        </Grid>
        <Grid item xs={6} sm={3}>
          {attLoading ? (
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 4 }} />
          ) : (
            <MiniStat
              label="Check-out"
              value={totalPulang}
              color="#FFF8E1"
              icon={<CheckOutIcon />}
            />
          )}
        </Grid>
      </Grid>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Attendance Records
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {fromStr || '…'} — {toStr || '…'}
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2 }} />

          {attLoading || empLoading ? (
            <Stack spacing={1}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} variant="rounded" height={56} />
              ))}
            </Stack>
          ) : attError ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Failed to load attendance data
              </Typography>
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                No attendance records found for this period
              </Typography>
              <Typography variant="caption" color="text.disabled">
                Adjust date or employee filter
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 'none', borderRadius: 0 }}>
              <Table size="medium">
                <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Position</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((rec, idx) => {
                    const statusUpper = String(rec.status).toUpperCase();
                    const isMasuk = statusUpper === 'MASUK' || statusUpper === 'CHECK-IN';
                    const initial = (rec.employeeName || rec.employee?.name || 'E').charAt(0).toUpperCase();
                    return (
                      <TableRow hover key={`${rec.id}-${idx}`}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {rec.date}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{rec.time}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={isMasuk ? 'CHECK-IN' : 'CHECK-OUT'}
                            color={isMasuk ? 'success' : 'warning'}
                            size="small"
                            sx={{ fontWeight: 700, minWidth: 80, justifyContent: 'center', borderRadius: 1.5 }}
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              src={rec.employee?.photo || undefined}
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: 'primary.main',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: 12,
                              }}
                            >
                              {initial}
                            </Avatar>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {rec.employeeName || rec.employee?.name || `#${rec.employeeId}`}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {rec.employeeEmail || rec.employee?.email || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{rec.employeePosition || rec.employee?.position || '-'}</Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {!attLoading && !empLoading && !attError && totalRecordsCount > 0 && (
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={totalRecordsCount}
              rowsPerPage={rowsPerPage}
              page={page - 1}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 1 }}
            />
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
