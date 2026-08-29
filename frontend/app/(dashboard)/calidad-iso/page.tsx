'use client';

import { useState } from 'react';
import { Box, Grid, Paper, Typography, Slider, Button } from '@mui/material';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';

const caracteristicas = [
  'Adecuación funcional', 'Eficiencia de rendimiento', 'Compatibilidad', 'Usabilidad',
  'Fiabilidad', 'Seguridad', 'Mantenibilidad', 'Portabilidad',
];

const init = {
  'Adecuación funcional': 82,
  'Eficiencia de rendimiento': 78,
  'Compatibilidad': 85,
  'Usabilidad': 74,
  'Fiabilidad': 88,
  'Seguridad': 90,
  'Mantenibilidad': 80,
  'Portabilidad': 70,
};

export default function CalidadIsoPage() {
  const [values, setValues] = useState<Record<string, number>>(init);

  const data = caracteristicas.map((c) => ({ caracteristica: c, valor: values[c] || 0 }));
  const puntajeGlobal = Math.round(caracteristicas.reduce((acc, c) => acc + (values[c] || 0), 0) / caracteristicas.length);

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">Evaluación Calidad ISO/IEC 25010</Typography>
        <Typography variant="body2" color="text.secondary">Métricas de las 8 características de calidad</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Gráfico Radar</Typography>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={data} outerRadius={110}>
                <PolarGrid />
                <PolarAngleAxis dataKey="caracteristica" tick={{ fontSize: 11 }} />
                <Radar dataKey="valor" stroke="#7b1f3a" fill="#7b1f3a" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Typography variant="h3" color="primary" fontWeight="bold">{puntajeGlobal}</Typography>
              <Typography variant="body2" color="text.secondary">Puntaje Global (%)</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Configurar métricas</Typography>
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
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={() => setValues(init)}>Restablecer</Button>
              <Button variant="outlined">Guardar Evaluación</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
