import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Avatar,
  Card,
  CardContent,
  Typography,
  Container,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Skeleton,
  Divider,
  InputAdornment,
  IconButton,
  Chip,
  Grid,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import EditIcon from '@mui/icons-material/Edit';
import LockResetIcon from '@mui/icons-material/LockReset';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import WorkIcon from '@mui/icons-material/Work';
import LogoutIcon from '@mui/icons-material/Logout';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface EmployeeProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  position: string;
  phone: string;
  photo?: string | null;
}

const profileSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
});

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Password confirmation does not match',
    path: ['confirmPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

function saveLocalUser(partial: Partial<EmployeeProfile>) {
  const raw = localStorage.getItem('emp_user');
  if (!raw) return;
  try {
    const u = JSON.parse(raw);
    const updated = { ...u, ...partial };
    localStorage.setItem('emp_user', JSON.stringify(updated));
  } catch {
    // noop
  }
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ open: false, type: 'success', message: '' });

  const { data: profile, isLoading } = useQuery<EmployeeProfile>({
    queryKey: ['employees', 'me'],
    queryFn: async () => {
      const { data } = await api.get('/employees/me');
      const result = data?.data ?? data;
      if (result) saveLocalUser(result);
      return result;
    },
    retry: 1,
  });

  const {
    register: regProfile,
    handleSubmit: handleSubmitProfile,
    setValue: setProfileValue,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: submittingProfile },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { phone: '' },
  });

  const {
    register: regPwd,
    handleSubmit: handleSubmitPwd,
    reset: resetPwd,
    formState: { errors: pwdErrors, isSubmitting: submittingPwd },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  const editMutation = useMutation({
    mutationFn: async (body: { phone?: string; photo?: string | null }) => {
      const payload: Record<string, any> = {};
      if (body.phone !== undefined) payload.phone = body.phone;
      if (body.photo !== undefined) payload.photo = body.photo;
      const { data } = await api.put('/employees/me', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', 'me'] });
      setSnackbar({
        open: true,
        type: 'success',
        message: 'Profile updated successfully. Admin has been notified.',
      });
      setEditOpen(false);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message || err?.message || 'Failed to update profile.';
      setSnackbar({
        open: true,
        type: 'error',
        message: typeof msg === 'string' ? msg : 'Failed to update profile.',
      });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (body: { oldPassword: string; newPassword: string }) => {
      const { data } = await api.put('/employees/me', {
        oldPassword: body.oldPassword,
        newPassword: body.newPassword,
      });
      return data;
    },
    onSuccess: () => {
      resetPwd();
      setSnackbar({
        open: true,
        type: 'success',
        message: 'Password changed successfully. Please use your new password.',
      });
      setPwdOpen(false);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message || err?.message || 'Failed to change password.';
      setSnackbar({
        open: true,
        type: 'error',
        message: typeof msg === 'string' ? msg : 'Failed to change password.',
      });
    },
  });

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingPhoto(file);
    const url = URL.createObjectURL(file);
    setPendingPreview(url);
  };

  const openEditDialog = () => {
    setProfileValue('phone', profile?.phone ?? '');
    setPendingPhoto(null);
    setPendingPreview(null);
    resetProfile({ phone: profile?.phone ?? '' });
    setEditOpen(true);
  };

  const closeEditDialog = () => {
    setEditOpen(false);
    setPendingPhoto(null);
    setPendingPreview(null);
  };

  const onSubmitProfile = async (values: ProfileForm) => {
    const payload: { phone: string; photo?: string | null } = { phone: values.phone };
    if (pendingPhoto) {
      try {
        payload.photo = await fileToBase64(pendingPhoto);
      } catch {
        // skip photo on error
      }
    }
    editMutation.mutate(payload);
  };

  const onSubmitPwd = async (values: PasswordForm) => {
    passwordMutation.mutate({
      oldPassword: values.oldPassword,
      newPassword: values.newPassword,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('emp_token');
    localStorage.removeItem('emp_user');
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  const avatarSrc =
    pendingPreview || profile?.photo || undefined;

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 3, md: 4 }, pb: { xs: 10, sm: 10, md: 4 } }}>
      <Stack spacing={{ xs: 2, sm: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" fontWeight={800} letterSpacing="-0.01em">
              My Profile
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Manage your personal information and account settings.
            </Typography>
          </Box>
        </Box>

        {/* Personal Info Card */}
        <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="action" />
                <Typography variant="subtitle1" fontWeight={800}>
                  Personal Information
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={openEditDialog}
                sx={{ borderRadius: 2, borderColor: '#B71C1C', color: '#B71C1C', textTransform: 'none', fontWeight: 600 }}
              >
                Edit Profile
              </Button>
            </Box>

            <Stack spacing={4}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                <Avatar
                  src={avatarSrc}
                  sx={{ width: 100, height: 100, bgcolor: 'rgba(183,28,28,0.1)', color: 'primary.main', fontSize: 36, border: '1px solid', borderColor: 'divider' }}
                >
                  <PersonIcon sx={{ fontSize: 50 }} />
                </Avatar>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="h6" fontWeight={800}>
                      {profile?.name || '-'}
                    </Typography>
                    <Chip label="Employee" size="small" sx={{ height: 20, bgcolor: '#FDECEC', color: '#B71C1C', fontSize: '0.65rem', fontWeight: 700 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 2 }}>
                    {profile?.position || 'Karyawan'}<br />
                    Human Resources Division<br />
                    Dexa Group
                  </Typography>
                </Box>
              </Box>

              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" fontWeight={500}>{profile?.email || '-'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" fontWeight={500}>{profile?.phone || '-'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.25 }} />
                  <Typography variant="body2" fontWeight={500}>
                    Dexa Tower - Head Office<br />Jakarta, Indonesia
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Employee ID</Typography>
                    <Typography variant="body2" fontWeight={600}>DXA00123</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Join Date</Typography>
                    <Typography variant="body2" fontWeight={600}>12 Jan 2022</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Employment Type</Typography>
                    <Typography variant="body2" fontWeight={600}>Permanent</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Work Location</Typography>
                    <Typography variant="body2" fontWeight={600} textAlign="right">
                      Dexa Tower - Head Office<br />Jakarta, Indonesia
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 3 }}>
              <LockResetIcon color="action" />
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  Change Password
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Keep your account secure by using a strong password.
                </Typography>
              </Box>
            </Box>

            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Current Password</Typography>
                <TextField fullWidth size="small" type="password" placeholder="Enter current password" sx={{ bgcolor: 'background.paper', borderRadius: 2 }} />
              </Box>
              <Box>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>New Password</Typography>
                <TextField fullWidth size="small" type="password" placeholder="Enter new password" sx={{ bgcolor: 'background.paper', borderRadius: 2 }} />
              </Box>
              <Box>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Confirm New Password</Typography>
                <TextField fullWidth size="small" type="password" placeholder="Confirm new password" sx={{ bgcolor: 'background.paper', borderRadius: 2 }} />
              </Box>
            </Stack>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button variant="contained" sx={{ bgcolor: '#B71C1C', color: 'white', px: 4, py: 1, borderRadius: 2, fontWeight: 700, textTransform: 'none', ':hover': { bgcolor: '#8A1414' } }}>
                Update Password
              </Button>
            </Box>
          </CardContent>
        </Card>

      </Stack>

      <Dialog open={editOpen} onClose={closeEditDialog} fullWidth maxWidth="xs">
        <DialogTitle fontWeight={700}>Edit Profil</DialogTitle>
        <Box component="form" onSubmit={handleSubmitProfile(onSubmitProfile)}>
          <DialogContent dividers>
            <Stack spacing={3}>
              <Stack alignItems="center" spacing={1.5}>
                <Avatar
                  src={pendingPreview || profile?.photo || undefined}
                  sx={{ width: 88, height: 88, bgcolor: 'primary.main', fontWeight: 700, fontSize: 32 }}
                >
                  <PersonIcon sx={{ fontSize: 44 }} />
                </Avatar>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  Change Photo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handlePhotoSelect}
                />
              </Stack>
              <TextField
                fullWidth
                label="Phone Number"
                {...regProfile('phone')}
                error={!!profileErrors.phone}
                helperText={profileErrors.phone?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={closeEditDialog} disabled={submittingProfile || editMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submittingProfile || editMutation.isPending}
              sx={{ bgcolor: '#B71C1C', ':hover': { bgcolor: '#861313' } }}
            >
              {submittingProfile || editMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={pwdOpen} onClose={() => setPwdOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle fontWeight={700}>Change Password</DialogTitle>
        <Box component="form" onSubmit={handleSubmitPwd(onSubmitPwd)}>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="Old Password"
                type={showOldPwd ? 'text' : 'password'}
                {...regPwd('oldPassword')}
                error={!!pwdErrors.oldPassword}
                helperText={pwdErrors.oldPassword?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockResetIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowOldPwd((v) => !v)} edge="end" size="small">
                        {showOldPwd ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="New Password"
                type={showNewPwd ? 'text' : 'password'}
                {...regPwd('newPassword')}
                error={!!pwdErrors.newPassword}
                helperText={pwdErrors.newPassword?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPwd((v) => !v)} edge="end" size="small">
                        {showNewPwd ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Confirm New Password"
                type={showConfirmPwd ? 'text' : 'password'}
                {...regPwd('confirmPassword')}
                error={!!pwdErrors.confirmPassword}
                helperText={pwdErrors.confirmPassword?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPwd((v) => !v)} edge="end" size="small">
                        {showConfirmPwd ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setPwdOpen(false)} disabled={submittingPwd || passwordMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submittingPwd || passwordMutation.isPending}
              sx={{ bgcolor: '#B71C1C', ':hover': { bgcolor: '#861313' } }}
            >
              {submittingPwd || passwordMutation.isPending ? 'Processing...' : 'Change Password'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

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
