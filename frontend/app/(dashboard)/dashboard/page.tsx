'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Grid, Paper, CircularProgress } from '@mui/material';
import { KPICards } from '@/components/dashboard/KPICards';
import { TrendChart } from '@/components/dashboard/TrendChart';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (status === 'authenticated') {
      setLoading(false);
      // Aquí se cargarían los datos del dashboard desde la API
      setDashboardData({
        kpis: [
          { nombre: 'Incidencias Abiertas', valor: 12, unidad: 'unidades', objetivo: 50, estado: 'excelente' },
          { nombre: 'Tasa de Resolución', valor: 85.5, unidad: '%', objetivo: 80, estado: 'bueno' },
          { nombre: 'MTTR', valor: 3.2, unidad: 'horas', objetivo: 4, estado: 'excelente' },
          { nombre: 'Calidad ISO', valor: 82.5, unidad: '%', objetivo: 80, estado: 'bueno' },
        ],
        tendencias: [
          { fechas: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], valores: [5, 8, 3, 12, 7], etiqueta: 'Incidencias Nuevas' },
          { fechas: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], valores: [4, 6, 2, 10, 5], etiqueta: 'Incidencias Resueltas' },
        ]
      });
    }
  }, [status, router]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard General
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Bienvenido, {session?.user?.name || 'Usuario'}
      </Typography>

      <KPICards kpis={dashboardData?.kpis || []} />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Tendencia de Incidencias
            </Typography>
            <TrendChart data={dashboardData?.tendencias || []} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
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