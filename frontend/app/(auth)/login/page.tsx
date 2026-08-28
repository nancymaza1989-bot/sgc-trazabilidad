'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Box, Container, Paper, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';

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

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h4" align="center" fontWeight="bold" color="primary" gutterBottom>
            SGC-Trazabilidad
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
            Sistema de Gestión de Calidad
          </Typography>
          <Typography variant="caption" align="center" display="block" color="text.secondary" gutterBottom>
            Poder Judicial del Perú
          </Typography>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Correo Electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mt: 3 }}
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
              sx={{ mt: 3, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
            </Button>
          </form>

          <Typography variant="body2" align="center" sx={{ mt: 2, color: 'text.secondary' }}>
            Usuario: admin@poderjudicial.gob.pe | Contraseña: Admin2024#Secure
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}