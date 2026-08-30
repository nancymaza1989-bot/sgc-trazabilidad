'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Paper, Typography, Chip, LinearProgress } from '@mui/material';
import { TrendChart } from '@/components/dashboard/TrendChart';
import apiClient from '@/lib/api/client';

export default function MonitoreoPage() {
  const [monitoreo, setMonitoreo] = useState<any>({ kpis: [], alertas: [], metricas: [] });

  const cargarMonitoreo = useCallback(async () => {
    try {
      const resp = await apiClient.get('/monitoreo');
      setMonitoreo(resp.data);
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    cargarMonitoreo();
  }, [cargarMonitoreo]);

  return (
    <Box sx={{ p: { xs: 1, md: 0 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">Monitoreo y Alertas Automatizadas</Typography>
        <Typography variant="body2" color="text.secondary">Cuadro de mando en tiempo real con KPIs clave, control de SLA y alertas del SGC</Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {(monitoreo.kpis || []).map((k: any, idx: number) => (
          <Grid item xs={6} md={3} key={idx}>
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
            <Typography variant="h6" gutterBottom>Tendencia Operativa de Trabajos y Evaluaciones</Typography>
            <TrendChart data={[
              { fechas: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'], valores: [5, 12, 8, 15], etiqueta: 'Registrados', color: '#1976d2' },
              { fechas: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'], valores: [4, 10, 7, 14], etiqueta: 'Entregados', color: '#22c55e' },
            ]} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>Alertas Recientes</Typography>
            {(monitoreo.alertas || []).map((a: any, i: number) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Chip size="small" label={a.nivel} color={a.nivel === 'Crítica' ? 'error' : a.nivel === 'Media' ? 'warning' : 'info'} />
                <Typography variant="body2">{a.titulo}</Typography>
              </Box>
            ))}
          </Paper>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Indicadores de Calidad</Typography>
            {(monitoreo.metricas || []).map((m: any, i: number) => (
              <Box key={i} sx={{ mb: 1.5 }}>
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
