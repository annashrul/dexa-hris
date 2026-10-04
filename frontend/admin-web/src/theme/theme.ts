import { createTheme, ThemeOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    dexared: Palette['primary'];
  }
  interface PaletteOptions {
    dexared?: PaletteOptions['primary'];
  }
}

const dexaredScale = {
  50: '#FFEBEE',
  100: '#FFCDD2',
  200: '#EF9A9A',
  300: '#E57373',
  400: '#EF5350',
  500: '#F44336',
  600: '#E53935',
  700: '#D32F2F',
  800: '#C62828',
  900: '#B71C1C',
  A100: '#FF8A80',
  A200: '#FF5252',
  A400: '#FF1744',
  A700: '#D50000',
};

const themeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#B71C1C',
      light: dexaredScale[700],
      dark: dexaredScale[900],
      contrastText: '#FFFFFF',
    },
    dexared: {
      main: '#B71C1C',
      light: dexaredScale[700],
      dark: dexaredScale[900],
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#546E7A',
      light: '#78909C',
      dark: '#37474F',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F7F7F8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#263238',
      secondary: '#546E7A',
      disabled: '#B0BEC5',
    },
    divider: '#ECEFF1',
    error: {
      main: '#D32F2F',
    },
    warning: {
      main: '#F57C00',
    },
    info: {
      main: '#1976D2',
    },
    success: {
      main: '#388E3C',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
        },
        containedPrimary: {
          backgroundColor: '#B71C1C',
          '&:hover': {
            backgroundColor: dexaredScale[800],
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#263238',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #ECEFF1',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
  },
};

export const dexaAdminTheme = createTheme(themeOptions);
export default dexaAdminTheme;
