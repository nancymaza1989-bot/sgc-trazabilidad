'use client';

import { Box, Grid, Paper, Typography, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import CategoryIcon from '@mui/icons-material/Category';
import LinkIcon from '@mui/icons-material/Link';
import SettingsIcon from '@mui/icons-material/Settings';

const secciones = [
  { titulo: 'Mantenedores', descripcion: 'Categorías, prioridades, severidades, estados personalizados', icono: <CategoryIcon /> },
  { titulo: 'Parámetros', descripcion: 'Umbrales de SLA, notificaciones, tiempos de escalación', icono: <TuneIcon /> },
  { titulo: 'Integraciones', descripcion: 'Jira, GitHub/GitLab, Jenkins, sistemas del Poder Judicial', icono: <LinkIcon /> },
  { titulo: 'General', descripcion: 'Nombre de la app, marco legal, apariencia', icono: <SettingsIcon /> },
];

const parametros = [
  { nombre: 'SLA Respuesta (horas)', valor: '1' },
  { nombre: 'SLA Resolución (horas)', valor: '4' },
  { nombre: 'Umbral críticas pendientes', valor: '0' },
  { nombre: 'Notificaciones por correo', valor: 'Activado' },
];

export default function ConfiguracionPage() {
  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">Configuración del Sistema</Typography>
        <Typography variant="body2" color="text.secondary">Mantenedores, parámetros e integraciones</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            {secciones.map((s) => (
              <Box key={s.titulo}>
                <ListItem>
                  <ListItemIcon sx={{ color: '#0d47a1' }}>{s.icono}</ListItemIcon>
                  <ListItemText primary={s.titulo} secondary={s.descripcion} />
                </ListItem>
                <Divider component="li" />
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Parámetros de Calidad</Typography>
            <List>
              {parametros.map((p) => (
                <ListItem key={p.nombre} sx={{ px: 0 }}>
                  <ListItemText primary={p.nombre} />
                  <Typography variant="body2" color="primary" fontWeight="bold">{p.valor}</Typography>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
