'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import {
  Box, Paper, Typography, TextField, Button, Alert, CircularProgress,
  Divider, Stack,
} from '@mui/material';
import { LOGO_BALANZA, PJ_COLORS } from '@/lib/theme';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Credenciales inválidas');
        return;
      }

      const session = await getSession();
      const token = (session as any)?.user?.access_token;
      if (token) {
        localStorage.setItem('access_token', token);
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Franja superior institucional */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          bgcolor: PJ_COLORS.primaryDark,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 18,
          fontWeight: 600,
          gap: 1,
          zIndex: 1,
        }}
      >
        <span>{LOGO_BALANZA}</span> Poder Judicial del Perú
      </Box>

      {/* Fondo con gradiente institucional */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: PJ_COLORS.background,
          background:
            'linear-gradient(160deg, #7b1f3a 0%, #5c1629 28%, #e4f3fb 28%, #f2f4f7 60%)',
          opacity: 0.14,
        }}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 420,
          px: 2,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 3,
            borderTop: `6px solid ${PJ_COLORS.primary}`,
          }}
        >
          {/* Logo / escudo */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2.5 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: PJ_COLORS.primaryLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 38,
                mb: 1.5,
              }}
            >
              {LOGO_BALANZA}
            </Box>
            <Typography variant="h5" align="center" fontWeight="bold" color="primary" letterSpacing={0.5}>
              SGC - Trazabilidad
            </Typography>
            <Typography variant="subtitle1" align="center" color="text.secondary">
              Sistema de Gestión de Calidad
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mt: 2.5 }}
              required
            />
            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mt: 2 }}
              required
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, py: 1.4 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
            </Button>
          </form>

          <Divider sx={{ my: 2.5 }} />

          <Typography variant="body2" align="center" sx={{ color: 'text.secondary' }}>
            Acceso al personal autorizado de la Gerencia de Calidad
          </Typography>
        </Paper>

        {/* Pie institucional */}
        <Stack alignItems="center" spacing={0.5} sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Gerencia de Gestión de Calidad · Poder Judicial del Perú
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Av. Paseo de la República S/N · Palacio de Justicia · Lima
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
