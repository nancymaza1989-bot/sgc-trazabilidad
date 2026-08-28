'use client';

import { Box, Grid, Paper, Typography, Button, Chip } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import TableChartIcon from '@mui/icons-material/TableChart';

const reportes = [
  { nombre: 'Reporte diario de incidencias', tipo: 'PDF', icono: 'pdf', descripcion: 'Resumen diario de incidencias y su estado' },
  { nombre: 'Cumplimiento de SLAs', tipo: 'Excel', icono: 'excel', descripcion: 'Porcentaje de cumplimiento de niveles de servicio' },
  { nombre: 'Calidad por equipo', tipo: 'Word', icono: 'word', descripcion: 'Métricas de calidad por área responsable' },
  { nombre: 'Pruebas ejecutadas', tipo: 'Excel', icono: 'excel', descripcion: 'Ejecución de casos de prueba y resultados' },
  { nombre: 'Versiones y estabilidad', tipo: 'PDF', icono: 'pdf', descripcion: 'Historial de versiones y su estabilidad' },
];

const IconoMap: Record<string, any> = {
  pdf: <PictureAsPdfIcon />, word: <InsertDriveFileIcon />, excel: <TableChartIcon />,
};

export default function ReportesPage() {
  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">Reportes Avanzados</Typography>
        <Typography variant="body2" color="text.secondary">Generación de reportes operativos y de gestión</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Reportes disponibles</Typography>
            {reportes.map((r) => (
              <Box key={r.nombre} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, mb: 1, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Box sx={{ color: '#0d47a1', display: 'flex' }}>{IconoMap[r.icono]}</Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">{r.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">{r.descripcion}</Typography>
                </Box>
                <Chip size="small" label={r.tipo} color={r.tipo === 'PDF' ? 'error' : r.tipo === 'Excel' ? 'success' : 'info'} />
                <Button size="small" variant="outlined">Previsualizar</Button>
                <Button size="small" variant="contained">Descargar</Button>
              </Box>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>Reportes programados</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Envío automático por correo (semanal, mensual) de los reportes configurados.
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined">Reporte semanal</Button>
              <Button variant="outlined">Reporte mensual</Button>
            </Box>
          </Paper>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Plantillas</Typography>
            <Typography variant="body2" color="text.secondary">
              Personaliza campos, filtros y agrupaciones para cada reporte.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
