'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Grid, Paper, CircularProgress, Chip, LinearProgress } from '@mui/material';
import { KPICards } from '@/components/dashboard/KPICards';
import { TrendChart } from '@/components/dashboard/TrendChart';

const kpisCoordinador = [
  { nombre: 'Trabajos Recibidos', valor: 18, unidad: 'total', objetivo: 25, estado: 'regular' },
  { nombre: 'Pendientes Asignación', valor: 3, unidad: 'trabajos', objetivo: 0, estado: 'critico' },
  { nombre: 'Trabajos Vencidos', valor: 1, unidad: 'trabajos', objetivo: 0, estado: 'critico' },
  { nombre: 'Entregados (mes)', valor: 14, unidad: 'trabajos', objetivo: 20, estado: 'bueno' },
];

const tendencias = [
  { fechas: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], valores: [3, 5, 2, 4, 6], etiqueta: 'Recibidos' },
  { fechas: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], valores: [2, 3, 4, 2, 5], etiqueta: 'Entregados' },
];

const alertas = [
  { nivel: 'Crítica', titulo: 'Trabajo GLPI-4489 vencido (Pase puntual)' },
  { nivel: 'Media', titulo: 'Trabajo TKT-2103 próximo a vencer mañana' },
  { nivel: 'Info', titulo: 'GLPI-4521 en proceso de evaluación por Ana Gómez' },
];

const cargaAnalistas = [
  { nombre: 'Ana Gómez', carga: 5 },
  { nombre: 'Juan Pérez', carga: 4 },
  { nombre: 'Carlos Ruiz', carga: 3 },
  { nombre: 'María López', carga: 3 },
  { nombre: 'Luis Torres', carga: 2 },
];

const estadoProyecto = [
  { proyecto: 'Sistema de Expedientes', estado: '4 en proceso · 2 cerrados' },
  { proyecto: 'Portal Web', estado: '2 en proceso · 1 cerrado' },
  { proyecto: 'SIGA', estado: '1 sin asignar' },
  { proyecto: 'Firma Digital', estado: '1 en validación' },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status, router]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const maxCarga = Math.max(...cargaAnalistas.map((c) => c.carga));

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Dashboard del Coordinador</Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Bienvenido, {session?.user?.name || 'Coordinador'} · Monitoreo del ciclo de vida de los trabajos de calidad
        </Typography>
      </Box>

      <KPICards kpis={kpisCoordinador} />

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Trabajos recibidos vs. entregados</Typography>
            <TrendChart data={tendencias} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>Alertas</Typography>
            {alertas.map((a, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip size="small" label={a.nivel} color={a.nivel === 'Crítica' ? 'error' : a.nivel === 'Media' ? 'warning' : 'info'} />
                <Typography variant="body2">{a.titulo}</Typography>
              </Box>
            ))}
          </Paper>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Resumen de calidad</Typography>
            <Typography variant="body2" color="text.secondary">Incidencias encontradas: 12</Typography>
            <Typography variant="body2" color="text.secondary">Casos de prueba ejecutados: 45</Typography>
            <Typography variant="body2" color="text.secondary">Tasa de éxito: 88%</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Distribución de carga por Analista</Typography>
            {cargaAnalistas.map((a) => (
              <Box key={a.nombre} sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{a.nombre}</Typography>
                  <Typography variant="body2" fontWeight="bold">{a.carga} trabajos</Typography>
                </Box>
                <LinearProgress variant="determinate" value={(a.carga / maxCarga) * 100} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Estado de los trabajos por proyecto</Typography>
            {estadoProyecto.map((p) => (
              <Box key={p.proyecto} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e2e8f0' }}>
                <Typography variant="body2" fontWeight="bold">{p.proyecto}</Typography>
                <Typography variant="body2" color="text.secondary">{p.estado}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
