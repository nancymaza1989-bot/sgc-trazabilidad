'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PJ_COLORS } from '@/lib/theme';

const theme = createTheme({
  palette: {
    primary: { main: PJ_COLORS.primary, dark: PJ_COLORS.primaryDark, light: PJ_COLORS.primaryLight },
    secondary: { main: PJ_COLORS.secondary },
    background: { default: PJ_COLORS.background, paper: PJ_COLORS.surface },
    divider: PJ_COLORS.divider,
    error: { main: PJ_COLORS.danger },
    warning: { main: PJ_COLORS.warning },
    success: { main: PJ_COLORS.success },
  },
  typography: {
    fontFamily: '"Segoe UI", Arial, Helvetica, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderColor: PJ_COLORS.divider },
      },
    },
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 5 * 60 * 1000 },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
          <ToastContainer position="top-right" autoClose={5000} />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}