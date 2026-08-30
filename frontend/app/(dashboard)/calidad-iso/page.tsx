'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Paper, Typography, Slider, Button, Alert } from '@mui/material';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import apiClient from '@/lib/api/client';
import { PJ_COLORS } from '@/lib/theme';

const caracteristicas = [
  'Adecuación funcional', 'Eficiencia de rendimiento', 'Compatibilidad', 'Usabilidad',
  'Fiabilidad', 'Seguridad', 'Mantenibilidad', 'Portabilidad',
];

export default function CalidadIsoPage() {
  const [values, setValues] = useState<Record<string, number>>({
    'Adecuación funcional': 82,
    'Eficiencia de rendimiento': 78,
    'Compatibilidad': 85,
    'Usabilidad': 74,
    'Fiabilidad': 88,
    'Seguridad': 90,
    'Mantenibilidad': 80,
    'Portabilidad': 70,
  });
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargarIso = useCallback(async () => {
    try {
      const resp = await apiClient.get('/calidad-iso');
      if (resp.data && resp.data.detalles) {
        const parsed = typeof resp.data.detalles === 'string' ? JSON.parse(resp.data.detalles) : resp.data.detalles;
        setValues(parsed);
      }
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    cargarIso();
  }, [cargarIso]);

  const guardarIso = async () => {
    try {
      await apiClient.post('/calidad-iso', {
        version_ref: 'v1.2.3',
        puntaje_global: puntajeGlobal,
        detalles: values,
        evaluador: 'Coordinador de Calidad'
      });
      setMensaje('Evaluación ISO/IEC 25010 guardada exitosamente.');
    } catch {
      setMensaje('Error al guardar evaluación ISO.');
    }
  };

  const data = caracteristicas.map((c) => ({ caracteristica: c, valor: values[c] || 0 }));
  const puntajeGlobal = Math.round(caracteristicas.reduce((acc, c) => acc + (values[c] || 0), 0) / caracteristicas.length);

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">Evaluación Calidad ISO/IEC 25010</Typography>
        <Typography variant="body2" color="text.secondary">Métricas automáticas de las 8 características de calidad de producto software</Typography>
      </Box>

      {mensaje && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMensaje(null)}>{mensaje}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Gráfico Radar</Typography>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={data} outerRadius={110}>
                <PolarGrid />
                <PolarAngleAxis dataKey="caracteristica" tick={{ fontSize: 11 }} />
                <Radar dataKey="valor" stroke={PJ_COLORS.primary} fill={PJ_COLORS.primary} fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="h3" color="primary" fontWeight="bold">{puntajeGlobal}%</Typography>
              <Typography variant="body2" color="text.secondary">Puntaje Global de Calidad ISO</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Configurar y Evaluar Características</Typography>
            {caracteristicas.map((c) => (
              <Box key={c} sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{c}</Typography>
                  <Typography variant="body2" fontWeight="bold">{values[c]}%</Typography>
                </Box>
                <Slider
                  value={values[c] || 0}
                  onChange={(_, v) => setValues({ ...values, [c]: v as number })}
                  min={0} max={100}
                  valueLabelDisplay="auto"
                  size="small"
                />
              </Box>
            ))}
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button variant="contained" onClick={guardarIso} sx={{ bgcolor: PJ_COLORS.primaryDark, '&:hover': { bgcolor: PJ_COLORS.primary } }}>
                Guardar Evaluación ISO
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
