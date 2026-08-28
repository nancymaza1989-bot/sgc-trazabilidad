'use client';

import { Box, Grid, Paper, Typography, Chip, LinearProgress } from '@mui/material';
import { TrendChart } from '@/components/dashboard/TrendChart';

const kpis = [
  { nombre: 'Incidencias Abiertas', valor: 45, unidad: 'unidades', color: '#1976d2', objetivo: 50 },
  { nombre: 'Resueltas (mes)', valor: 32, unidad: 'unidades', color: '#22c55e', objetivo: 40 },
  { nombre: 'MTTR', valor: '2.5h', unidad: 'promedio', color: '#f59e0b', objetivo: 4 },
  { nombre: 'Críticas Pendientes', valor: 8, unidad: 'unidades', color: '#ef4444', objetivo: 0 },
];

const alertas = [
  { nivel: 'Crítica', titulo: 'Servidor de producción con latencia alta', estado: 'Activa' },
  { nivel: 'Media', titulo: 'Tiempo de respuesta SLA excedido', estado: 'Activa' },
  { nivel: 'Info', titulo: 'Nueva versión v1.2.3 desplegada', estado: 'Informativa' },
];

const metricas = [
  { nombre: 'MTTA', valor: 82, objetivo: 95 },
  { nombre: 'Cumplimiento SLA', valor: 91, objetivo: 95 },
  { nombre: 'Cobertura Pruebas', valor: 76, objetivo: 80 },
  { nombre: 'Estabilidad Versiones', valor: 92, objetivo: 90 },
];

export default function MonitoreoPage() {
  return (
    <Box sx={{ p: { xs: 1, md: 0 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">Monitoreo y Alertas</Typography>
        <Typography variant="body2" color="text.secondary">Cuadro de mando con KPIs clave y alertas inteligentes</Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {kpis.map((k) => (
          <Grid item xs={6} md={3} key={k.nombre}>
            <Paper sx={{ p: 2, borderRadius: 2, bgcolor: `${k.color}14`, borderLeft: `4px solid ${k.color}` }}>
              <Typography variant="subtitle2" color="text.secondary">{k.nombre}</Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: k.color }}>{k.valor}</Typography>
              <Typography variant="caption" color="text.secondary">{k.unidad} · Objetivo {k.objetivo}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Tendencia de Incidencias</Typography>
            <TrendChart data={[
              { fechas: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'], valores: [5, 8, 3, 12, 7, 9], etiqueta: 'Nuevas', color: '#1976d2' },
              { fechas: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'], valores: [4, 6, 2, 10, 5, 8], etiqueta: 'Resueltas', color: '#22c55e' },
            ]} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>Alertas Recientes</Typography>
            {alertas.map((a, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip size="small" label={a.nivel} color={a.nivel === 'Crítica' ? 'error' : a.nivel === 'Media' ? 'warning' : 'info'} />
                <Typography variant="body2">{a.titulo}</Typography>
              </Box>
            ))}
          </Paper>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Indicadores</Typography>
            {metricas.map((m) => (
              <Box key={m.nombre} sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{m.nombre}</Typography>
                  <Typography variant="body2" fontWeight="bold">{m.valor}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={m.valor} color={m.valor >= m.objetivo ? 'success' : 'warning'} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
