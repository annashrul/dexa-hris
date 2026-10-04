import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      light: '#C62828',
      main: '#B71C1C',
      dark: '#861313',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F7F7F8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#252525',
      secondary: '#666666',
    },
    divider: '#ECECEE',
    success: {
      main: '#2E7D32',
      light: '#EAF6EC',
    },
    warning: {
      main: '#ED6C02',
      light: '#FFF4E5',
    },
    error: {
      main: '#D32F2F',
      light: '#FDECEC',
    },
    info: {
      main: '#1976D2',
      light: '#EAF3FE',
    },
  },

  shape: {
    borderRadius: 12,
  },

  typography: {
    fontFamily: [
      'Inter',
      'Roboto',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '28px',
      lineHeight: '36px',
      fontWeight: 700,
    },
    h2: {
      fontSize: '24px',
      lineHeight: '32px',
      fontWeight: 700,
    },
    h3: {
      fontSize: '20px',
      lineHeight: '28px',
      fontWeight: 600,
    },
    body1: {
      fontSize: '16px',
      lineHeight: '24px',
    },
    body2: {
      fontSize: '14px',
      lineHeight: '20px',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },

  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 48,
          borderRadius: 12,
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        fullWidth: true,
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #ECECEE',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 16,
        },
      },
    },

    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #ECECEE',
        },
      },
    },

    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: '#8A8A8A',
          '&.Mui-selected': {
            color: '#B71C1C',
          },
        },
      },
    },
  },
});
