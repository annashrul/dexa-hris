import { createTheme, ThemeOptions } from '@mui/material/styles';
import { idID } from '@mui/material/locale';

const dexaRedTheme: ThemeOptions = {
  palette: {
    primary: {
      main: '#B71C1C',
      light: '#C62828',
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
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: [
      'Inter',
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'sans-serif',
    ].join(','),
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          height: '100%',
        },
        body: {
          height: '100%',
          margin: 0,
          backgroundColor: '#F7F7F8',
          color: '#252525',
        },
        '#root': {
          minHeight: '100dvh',
        },
      },
    },
  },
};

const theme = createTheme(dexaRedTheme, idID);

export default theme;
