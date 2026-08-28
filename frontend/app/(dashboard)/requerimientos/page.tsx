'use client';

import { Box, Grid, Paper, Typography } from '@mui/material';
import DataTable, { ColumnDef } from '@/components/common/DataTable';

interface Requerimiento {
  id: string;
  titulo: string;
  tipo: string;
  prioridad: string;
  estado: string;
  responsable: string;
  fecha: string;
}

const requerimientos: Requerimiento[] = [
  { id: 'REQ-001', titulo: 'Nueva pantalla de consulta de expedientes', tipo: 'Funcional', prioridad: 'Alta', estado: 'En análisis', responsable: 'Ana Gómez', fecha: '2024/01/14' },
  { id: 'REQ-002', titulo: 'Integración con firma digital (Ley 30035)', tipo: 'Técnico', prioridad: 'Crítica', estado: 'Aprobado', responsable: 'Carlos Ruiz', fecha: '2024/01/13' },
  { id: 'REQ-003', titulo: 'Optimización del motor de búsqueda', tipo: 'Técnico', prioridad: 'Media', estado: 'En desarrollo', responsable: 'Luis Torres', fecha: '2024/01/12' },
  { id: 'REQ-004', titulo: 'Reporte de cumplimiento de SLA', tipo: 'Funcional', prioridad: 'Alta', estado: 'Registrado', responsable: 'María López', fecha: '2024/01/11' },
  { id: 'REQ-005', titulo: 'Mejora de accesibilidad WCAG 2.1', tipo: 'Funcional', prioridad: 'Media', estado: 'En pruebas', responsable: 'Juan Pérez', fecha: '2024/01/10' },
  { id: 'REQ-006', titulo: 'Backup automático de base de datos', tipo: 'Técnico', prioridad: 'Alta', estado: 'Implementado', responsable: 'Carlos Ruiz', fecha: '2024/01/08' },
];

const estadoColor: Record<string, string> = {
  'Registrado': 'default', 'En análisis': 'warning', 'Aprobado': 'info',
  'En desarrollo': 'secondary', 'En pruebas': 'primary', 'Implementado': 'success', 'Cerrado': 'default',
};

export default function RequerimientosPage() {
  const columns: ColumnDef<Requerimiento>[] = [
    { key: 'id', label: 'ID' },
    { key: 'titulo', label: 'Título' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'prioridad', label: 'Prioridad' },
    { key: 'estado', label: 'Estado', badge: (v) => estadoColor[v] || 'default' },
    { key: 'responsable', label: 'Responsable' },
    { key: 'fecha', label: 'Fecha' },
  ];

  return (
    <Box>
      <DataTable
        title="Requerimientos"
        subtitle="Levantamiento y seguimiento de requerimientos funcionales y técnicos"
        columns={columns}
        data={requerimientos}
        searchPlaceholder="Buscar requerimiento..."
        newLabel="Nuevo Requerimiento"
        filters={[
          { key: 'estado', label: 'Estado', values: Object.keys(estadoColor) },
          { key: 'prioridad', label: 'Prioridad', values: ['Crítica', 'Alta', 'Media', 'Baja'] },
          { key: 'tipo', label: 'Tipo', values: ['Funcional', 'Técnico'] },
        ]}
      />
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6">En desarrollo</Typography>
            <Typography variant="h3" color="primary" fontWeight="bold">3</Typography>
            <Typography variant="body2" color="text.secondary">Requerimientos en curso</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6">Aprobados pendientes</Typography>
            <Typography variant="h3" color="warning.main" fontWeight="bold">1</Typography>
            <Typography variant="body2" color="text.secondary">Esperando aprobación</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6">Implementados</Typography>
            <Typography variant="h3" color="success.main" fontWeight="bold">1</Typography>
            <Typography variant="body2" color="text.secondary">Finalizados este mes</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
