import { useMemo, useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Skeleton,
  Snackbar,
  Alert,
  Divider,
  MenuItem,
  InputAdornment,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupsIcon from '@mui/icons-material/Groups';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import api from '../lib/api';
import {
  Employee,
  unwrapEmployees,
} from '../lib/api-types';

const employeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  position: z.string().optional(),
  phone: z.string().optional(),
  photo: z.string().optional(),
  role: z.enum(['EMPLOYEE', 'HRD']),
  password: z.string().optional(),
});

type FormValues = z.infer<typeof employeeSchema>;

interface FormDialogProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSubmit: (values: FormValues) => Promise<void>;
  submitting: boolean;
}

function EmployeeFormDialog({ open, onClose, employee, onSubmit, submitting }: FormDialogProps) {
  const isEdit = !!employee;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: employee?.name ?? '',
      email: employee?.email ?? '',
      position: employee?.position ?? '',
      phone: employee?.phone ?? '',
      photo: employee?.photo ?? '',
      role: (employee?.role as 'EMPLOYEE' | 'HRD') ?? 'EMPLOYEE',
      password: '',
    },
  });

  useMemo(() => {
    if (open) {
      reset({
        name: employee?.name ?? '',
        email: employee?.email ?? '',
        position: employee?.position ?? '',
        phone: employee?.phone ?? '',
        photo: employee?.photo ?? '',
        role: (employee?.role as 'EMPLOYEE' | 'HRD') ?? 'EMPLOYEE',
        password: '',
      });
    }
  }, [open, employee, reset]);

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, pb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          {isEdit ? 'Edit Employee' : 'Add New Employee'}
          <IconButton onClick={onClose} disabled={submitting} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <Divider />
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                label="Full Name"
                fullWidth
                autoFocus={!isEdit}
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Position"
                fullWidth
                {...register('position')}
                error={!!errors.position}
                helperText={errors.position?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                fullWidth
                {...register('phone')}
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Photo URL"
                fullWidth
                {...register('photo')}
                error={!!errors.photo}
                helperText={errors.photo?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Role"
                fullWidth
                defaultValue={isEdit ? (employee?.role ?? 'EMPLOYEE') : 'EMPLOYEE'}
                {...register('role')}
                error={!!errors.role}
                helperText={errors.role?.message}
              >
                <MenuItem value="EMPLOYEE">EMPLOYEE</MenuItem>
                <MenuItem value="HRD">HRD</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                type="password"
                label={isEdit ? 'Password (leave blank to keep)' : 'Password'}
                fullWidth
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={submitting} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
          >
            {submitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
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

interface PaginatedEmployeesResponse {
  rows: Employee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isError } = useQuery<PaginatedEmployeesResponse>({
    queryKey: ['admin', 'employees', { search: debouncedSearch, page, limit: rowsPerPage }],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        page,
        limit: rowsPerPage,
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const { data } = await api.get('/admin/employees', { params });
      if (data && typeof data === 'object' && Array.isArray(data.rows)) {
        return data as PaginatedEmployeesResponse;
      }
      const rows = unwrapEmployees(data);
      return {
        rows,
        total: rows.length,
        page,
        limit: rowsPerPage,
        totalPages: 1,
      };
    },
  });

  const totalCount = data?.total ?? 0;
  const paginated = data?.rows ?? [];

  const handleCloseSnack = () => setSnack((s) => ({ ...s, open: false }));

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const createMut = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload: Record<string, unknown> = { ...values };
      if (!values.password) delete payload.password;
      const { data } = await api.post('/admin/employees', payload);
      return data;
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, values }: { id: number | string; values: FormValues }) => {
      const payload: Record<string, unknown> = { ...values };
      if (!values.password) delete payload.password;
      const { data } = await api.put(`/admin/employees/${id}`, payload);
      return data;
    },
  });

  const onSubmitForm = async (values: FormValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, values });
        setSnack({ open: true, message: 'Employee updated successfully', severity: 'success' });
      } else {
        await createMut.mutateAsync(values);
        setSnack({ open: true, message: 'Employee created successfully', severity: 'success' });
      }
      await queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] });
      handleDialogClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save data';
      setSnack({ open: true, message: msg, severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePage = (_e: unknown, newPage: number) => setPage(newPage + 1);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+e.target.value);
    setPage(1);
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Employee Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage employee data, positions, departments, and employment status.
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', lg: 'center' }}
            justifyContent="space-between"
            mb={3}
          >
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flex: 1 }}>
              <TextField
                placeholder="Search by name, email, or employee ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                size="small"
                sx={{borderRadius: 2, minWidth: { xs: '100%', sm: 300 }, bgcolor: '#F9FAFB', '& fieldset': { border: 'none' } , }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={openCreate}
              sx={{
                bgcolor: '#B71C1C',
                '&:hover': { bgcolor: '#8B0000' },
                alignSelf: { xs: 'flex-start', lg: 'center' },
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: 0,
                borderRadius: 2,
              
              }}
            >
              Add Employee
            </Button>
          </Stack>

          {isLoading ? (
            <Stack spacing={1}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} variant="rounded" height={56} />
              ))}
            </Stack>
          ) : isError ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Alert severity="error" sx={{ display: 'inline-block' }}>
                Failed to load employees data
              </Alert>
            </Box>
          ) : paginated.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <GroupsIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                {debouncedSearch ? 'No employees match your search' : 'No employees data yet'}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                Click Add Employee to add the first record
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ boxShadow: 0, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <Table size="medium">
                  <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>EMPLOYEE</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>EMAIL</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>POSITION</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>DEPARTMENT</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>STATUS</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>
                        ACTIONS
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.map((emp) => (
                      <TableRow hover key={emp.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar
                              src={emp.photo || undefined}
                              sx={{
                                bgcolor: 'primary.main',
                                color: 'white',
                                fontWeight: 700,
                                width: 36,
                                height: 36
                              }}
                            >
                              {emp.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                {emp.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                EMP00{emp.id}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{emp.email}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{emp.position || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {emp.role === 'HRD' ? 'Human Resources' : 'General'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label="Active"
                            color="success"
                            size="small"
                            sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22, bgcolor: '#E8F5E9', color: '#2E7D32' }}
                            icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#2E7D32', ml: 1 }} />}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton color="default" size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton color="default" onClick={() => openEdit(emp)} size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton color="default" size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                              <MoreHorizIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={totalCount}
                page={page - 1}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 25, 50]}
                sx={{ mt: 1, borderTop: 1, borderColor: 'divider' }}
              />
            </>
          )}
        </CardContent>
      </Card>

      <EmployeeFormDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        employee={editing}
        onSubmit={onSubmitForm}
        submitting={submitting || createMut.isPending || updateMut.isPending}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={handleCloseSnack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snack.severity} onClose={handleCloseSnack} sx={{ borderRadius: 2, fontWeight: 600 }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
