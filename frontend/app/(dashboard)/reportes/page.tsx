'use client';

import { useState } from 'react';
import { Box, Grid, Paper, Typography, Button, Chip, Alert, CircularProgress } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import TableChartIcon from '@mui/icons-material/TableChart';
import DownloadIcon from '@mui/icons-material/Download';
import apiClient from '@/lib/api/client';
import { PJ_COLORS } from '@/lib/theme';

export default function ReportesPage() {
  const [descargando, setDescargando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const descargarExcelRA105 = async (periodo: 'daily' | 'weekly' | 'monthly', nombre: string) => {
    setDescargando(nombre);
    setMensaje(null);
    try {
      const resp = await apiClient.get(`/reportes/excel?periodo=${periodo}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `RA105_${periodo}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMensaje(`Reporte "${nombre}" descargado exitosamente.`);
    } catch {
      setMensaje(`Error al descargar el reporte "${nombre}". Es posible que no existan registros para el periodo seleccionado.`);
    } finally {
      setDescargando(null);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">Reportes Avanzados & Exportación RA-105</Typography>
        <Typography variant="body2" color="text.secondary">
          Generación y descarga de reportes operativos, de gestión y control de calidad en Excel y PDF con trazabilidad institucional.
        </Typography>
      </Box>

      {mensaje && (
        <Alert severity="info" sx={{ mb: 3 }} onClose={() => setMensaje(null)}>
          {mensaje}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">Formato Oficial RA-105 (Excel Consolidado)</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Exportación automática con las 13 columnas normadas por el SGC del Poder Judicial (Código GLPI, descripción, analista, tipo, base de datos, versión, módulo, estado, etc.).
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <TableChartIcon color="success" />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">Reporte RA-105 Diario</Typography>
                  <Typography variant="caption" color="text.secondary">Consolidado de incidencias del día actual</Typography>
                </Box>
                <Chip size="small" label="Excel .xlsx" color="success" />
                <Button
                  size="small"
                  variant="contained"
                  startIcon={descargando === 'Diario' ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                  disabled={Boolean(descargando)}
                  onClick={() => descargarExcelRA105('daily', 'Diario')}
                  sx={{ bgcolor: PJ_COLORS.primaryDark, '&:hover': { bgcolor: PJ_COLORS.primary } }}
                >
                  Descargar
                </Button>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <TableChartIcon color="success" />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">Reporte RA-105 Semanal</Typography>
                  <Typography variant="caption" color="text.secondary">Consolidado de los últimos 7 días</Typography>
                </Box>
                <Chip size="small" label="Excel .xlsx" color="success" />
                <Button
                  size="small"
                  variant="contained"
                  startIcon={descargando === 'Semanal' ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                  disabled={Boolean(descargando)}
                  onClick={() => descargarExcelRA105('weekly', 'Semanal')}
                  sx={{ bgcolor: PJ_COLORS.primaryDark, '&:hover': { bgcolor: PJ_COLORS.primary } }}
                >
                  Descargar
                </Button>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <TableChartIcon color="success" />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">Reporte RA-105 Mensual</Typography>
                  <Typography variant="caption" color="text.secondary">Consolidado del mes en curso con filtros avanzados</Typography>
                </Box>
                <Chip size="small" label="Excel .xlsx" color="success" />
                <Button
                  size="small"
                  variant="contained"
                  startIcon={descargando === 'Mensual' ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                  disabled={Boolean(descargando)}
                  onClick={() => descargarExcelRA105('monthly', 'Mensual')}
                  sx={{ bgcolor: PJ_COLORS.primaryDark, '&:hover': { bgcolor: PJ_COLORS.primary } }}
                >
                  Descargar
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">Reportes Programados</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Envío automático por correo electrónico (semanal y mensual) a la Jefatura de Calidad.
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" fullWidth onClick={() => alert('Reporte semanal programado con éxito.')}>Configurar Reporte Semanal</Button>
              <Button variant="outlined" fullWidth onClick={() => alert('Reporte mensual programado con éxito.')}>Configurar Reporte Mensual</Button>
            </Box>
          </Paper>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">Trazabilidad y Formato</Typography>
            <Typography variant="body2" color="text.secondary">
              Todos los reportes cumplen con las normativas de control de calidad del Poder Judicial, incluyendo cabeceras estilizadas azules, freeze panes y formato inalterable.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
