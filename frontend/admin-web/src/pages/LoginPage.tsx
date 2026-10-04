import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  Typography,
  Alert,
  Stack,
  InputAdornment,
  IconButton,
  OutlinedInput,
  Checkbox,
  FormControlLabel,
  Link,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '../store/auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

const DexaLogo = ({ color = '#B71C1C', centered = true }: { color?: string; centered?: boolean }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: centered ? 'center' : 'flex-start' }}>
    <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 15 L88 85 H12 Z" stroke={color} strokeWidth="8" strokeLinejoin="round" />
      <path d="M50 38 C42 38 42 50 50 52 C58 54 58 66 50 66 C42 66 42 54 50 52 C58 50 58 38 50 38 Z" stroke={color} strokeWidth="6" strokeLinejoin="round" />
    </svg>
    <Typography variant="h4" fontWeight={800} sx={{ color: color === 'white' ? 'white' : '#1A1A1A', letterSpacing: '-0.02em', m: 0, lineHeight: 1 }}>
      Dexa <Box component="span" sx={{ color: color === 'white' ? 'white' : '#B71C1C', fontStyle: 'italic', fontWeight: 800 }}>HRIS</Box>
    </Typography>
  </Box>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const auth = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true },
  });

  const onSubmit = async (values: LoginForm) => {
    setError(null);
    try {
      await auth.login(values.email, values.password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Login failed. Check your email and password.';
      setError(typeof msg === 'string' ? msg : 'Login failed. Please try again.');
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', position: 'relative', bgcolor: '#F5F5F5' }}>
      
      {/* BACKGROUND IMAGE (Left on Desktop, Full on Mobile) */}
      <Box
        sx={{
          flex: 1,
          position: { xs: 'absolute', md: 'relative' },
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          '&::before': {
            content: '""',
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: {
              xs: 'linear-gradient(to bottom, rgba(183, 28, 28, 0.9) 0%, rgba(183, 28, 28, 0.98) 100%)',
              md: 'linear-gradient(to right, rgba(183, 28, 28, 0.95) 0%, rgba(183, 28, 28, 0.7) 100%)',
            }
          },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: { xs: 'flex-start', md: 'center' },
          p: { xs: 4, sm: 6, md: 8 },
          color: 'white',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, mt: { xs: 4, md: 0 } }}>
          {/* Mobile Logo */}
          {!isDesktop && (
            <Box sx={{ mb: 6 }}>
              <DexaLogo color="white" centered={false} />
              <Typography variant="body2" sx={{ mt: 1.5, opacity: 0.9, lineHeight: 1.4 }}>
                HRD / Admin Portal<br/>Dexa Group
              </Typography>
            </Box>
          )}

          <Typography variant="h3" fontWeight={800} sx={{ mb: 3, fontSize: { xs: '2.5rem', md: '3.5rem' }, lineHeight: 1.1 }}>
            People Build<br />Healthier<br />Tomorrows
          </Typography>
          <Box sx={{ width: 40, height: 2, bgcolor: 'white', my: 3 }} />
          <Typography variant="body1" sx={{ maxWidth: 400, opacity: 0.9, fontSize: '1.1rem', lineHeight: 1.5 }}>
            Together we empower healthier lives through our people and purpose.
          </Typography>

          <Box sx={{ mt: { xs: 6, md: 12 } }}>
            <Typography variant="subtitle2" fontWeight={700}>Dexa Group</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Better Health for a Brighter Life</Typography>
          </Box>
        </Box>
      </Box>

      {/* FORM CONTAINER (Right on Desktop, Bottom Sheet on Mobile) */}
      <Box
        sx={{
          flex: { xs: 'none', md: '0 0 500px', lg: '0 0 550px' },
          position: { xs: 'absolute', md: 'relative' },
          bottom: { xs: 0, md: 'auto' },
          left: { xs: 0, md: 'auto' },
          right: { xs: 0, md: 'auto' },
          bgcolor: 'background.paper',
          zIndex: 10,
          borderTopLeftRadius: { xs: 32, md: 0 },
          borderTopRightRadius: { xs: 32, md: 0 },
          p: { xs: 4, sm: 6, md: 8 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: { xs: 'auto', md: '100dvh' },
          boxShadow: { xs: '0px -10px 40px rgba(0,0,0,0.2)', md: 'none' },
        }}
      >
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%', maxWidth: 400, mx: 'auto' }}>
          
          {/* Desktop Logo */}
          {isDesktop && (
            <Box sx={{ mb: 6, textAlign: 'center' }}>
              <DexaLogo />
              <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 2 }}>
                HRD / Admin Portal
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.4 }}>
                Manage people, attendance, and administrative processes in one secure platform.
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2.5}>
            <Box>
              <Typography variant="caption" fontWeight={600} sx={{ mb: 1, display: 'block', color: 'text.secondary' }}>Admin Email</Typography>
              <OutlinedInput
                fullWidth
                placeholder="admin@dexa.co.id"
                type="email"
                autoComplete="email"
                {...register('email')}
                error={!!errors.email}
                startAdornment={
                  <InputAdornment position="start">
                    <MailOutlineIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                }
                sx={{ borderRadius: 2, bgcolor: 'transparent' }}
              />
              {errors.email && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1, display: 'block' }}>
                  {errors.email.message}
                </Typography>
              )}
            </Box>

            <Box>
              <Typography variant="caption" fontWeight={600} sx={{ mb: 1, display: 'block', color: 'text.secondary' }}>Password</Typography>
              <OutlinedInput
                fullWidth
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
                error={!!errors.password}
                startAdornment={
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                }
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                      {showPassword ? <VisibilityOffIcon sx={{ fontSize: 20 }} /> : <VisibilityIcon sx={{ fontSize: 20 }} />}
                    </IconButton>
                  </InputAdornment>
                }
                sx={{ borderRadius: 2, bgcolor: 'transparent' }}
              />
              {errors.password && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1, display: 'block' }}>
                  {errors.password.message}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
              <FormControlLabel
                control={<Checkbox {...register('remember')} color="primary" sx={{ '&.Mui-checked': { color: '#B71C1C' } }} />}
                label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Keep me signed in</Typography>}
              />
              <Link href="#" underline="hover" sx={{ color: '#B71C1C', variant: 'body2', fontWeight: 600 }}>
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isSubmitting}
              endIcon={<ArrowForwardIcon />}
              sx={{
                bgcolor: '#B71C1C',
                ':hover': { bgcolor: '#861313' },
                minHeight: 52,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: 16,
                textTransform: 'none',
                mt: 2,
                boxShadow: 0,
              }}
            >
              {isSubmitting ? 'Loading...' : 'Sign In'}
            </Button>

            {/* Footer right */}
            {isDesktop && (
              <Box sx={{ mt: 8, textAlign: 'center', pt: 4, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                  PT Dexa Medica
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Human Resources & General Administration
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}