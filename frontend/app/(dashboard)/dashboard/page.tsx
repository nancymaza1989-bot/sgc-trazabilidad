'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Grid, Paper, CircularProgress, Chip } from '@mui/material';
import { KPICards } from '@/components/dashboard/KPICards';
import { TrendChart } from '@/components/dashboard/TrendChart';

const mockData = {
  kpis: [
    { nombre: 'Incidencias Abiertas', valor: 12, unidad: 'unidades', objetivo: 50, estado: 'excelente' },
    { nombre: 'Tasa de Resolución', valor: 85.5, unidad: '%', objetivo: 80, estado: 'bueno' },
    { nombre: 'MTTR', valor: 3.2, unidad: 'horas', objetivo: 4, estado: 'excelente' },
    { nombre: 'Calidad ISO', valor: 82.5, unidad: '%', objetivo: 80, estado: 'bueno' },
  ],
  tendencias: [
    { fechas: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'], valores: [5, 8, 3, 12, 7, 9], etiqueta: 'Nuevas' },
    { fechas: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'], valores: [4, 6, 2, 10, 5, 8], etiqueta: 'Resueltas' },
  ],
  alertas: [
    { nivel: 'Crítica', titulo: 'Servidor de producción con latencia alta' },
    { nivel: 'Media', titulo: 'Tiempo de respuesta SLA excedido' },
    { nivel: 'Info', titulo: 'Nueva versión v1.2.3 desplegada' },
  ],
  distribuciones: { estado: { Abiertas: 45, 'En curso': 30, Resueltas: 25 }, prioridad: { Crítica: 15, Alta: 25, Media: 40, Baja: 20 } },
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      fetch(`${apiUrl}/dashboard/general`, { cache: 'no-store' })
        .then((res) => {
          if (!res.ok) throw new Error('No disponible');
          return res.json();
        })
        .then((data) => {
          const kpis = (data.kpis || []).map((k: any) => ({
            nombre: k.nombre, valor: k.valor, unidad: k.unidad,
            objetivo: k.objetivo, estado: k.estado || 'bueno',
          }));
          const tendencias = (data.tendencias || []).map((t: any) => ({
            fechas: t.fechas, valores: t.valores, etiqueta: t.etiqueta,
          }));
          setDashboardData({
            kpis: kpis.length ? kpis : mockData.kpis,
            tendencias: tendencias.length ? tendencias : mockData.tendencias,
            alertas: data.alertas || mockData.alertas,
          });
        })
        .catch(() => setDashboardData(mockData))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Dashboard General
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Bienvenido, {session?.user?.name || 'Usuario'} · {session?.user?.role || 'administrador'}
        </Typography>
      </Box>

      <KPICards kpis={dashboardData?.kpis || []} />

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Tendencia de Incidencias
            </Typography>
            <TrendChart data={dashboardData?.tendencias || []} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Alertas Recientes
            </Typography>
            {(dashboardData?.alertas || []).map((a: any, i: number) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip size="small" label={a.nivel} color={a.nivel === 'Crítica' ? 'error' : a.nivel === 'Media' ? 'warning' : 'info'} />
                <Typography variant="body2">{a.titulo}</Typography>
              </Box>
            ))}
          </Paper>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Resumen Rápido
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total de incidencias: 45
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Abiertas: 12
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Resueltas este mes: 32
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
