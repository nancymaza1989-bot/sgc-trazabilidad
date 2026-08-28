'use client';

import { Box, Paper, Typography } from '@mui/material';
import DataTable, { ColumnDef } from '@/components/common/DataTable';

interface CasoPrueba {
  id: string;
  titulo: string;
  prioridad: string;
  estado: string;
  trabajo: string;
  ejecutor: string;
}

const casos: CasoPrueba[] = [
  { id: 'CP-001', titulo: 'Verificar login con credenciales válidas', prioridad: 'Alta', estado: 'Aprobado', trabajo: 'GLPI-4521', ejecutor: 'María López' },
  { id: 'CP-002', titulo: 'Validar exportación a Excel', prioridad: 'Media', estado: 'Fallido', trabajo: 'TKT-2103', ejecutor: 'Juan Pérez' },
  { id: 'CP-003', titulo: 'Probar recuperación de contraseña', prioridad: 'Alta', estado: 'Pendiente', trabajo: 'TKT-1855', ejecutor: 'Ana Gómez' },
  { id: 'CP-004', titulo: 'Verificar notificación por correo', prioridad: 'Media', estado: 'En ejecución', trabajo: 'GLPI-4320', ejecutor: 'Luis Torres' },
  { id: 'CP-005', titulo: 'Validar formato de reporte PDF', prioridad: 'Alta', estado: 'Aprobado', trabajo: 'TKT-1998', ejecutor: 'María López' },
  { id: 'CP-006', titulo: 'Probar integración con firma digital', prioridad: 'Crítica', estado: 'Bloqueado', trabajo: 'GLPI-4489', ejecutor: 'Carlos Ruiz' },
];

const estadoColor: Record<string, string> = {
  'Pendiente': 'default', 'En ejecución': 'info', 'Aprobado': 'success', 'Fallido': 'error', 'Bloqueado': 'warning',
};

export default function CasosPruebaPage() {
  const columns: ColumnDef<CasoPrueba>[] = [
    { key: 'id', label: 'ID' },
    { key: 'titulo', label: 'Título' },
    { key: 'prioridad', label: 'Prioridad' },
    { key: 'estado', label: 'Estado', badge: (v) => estadoColor[v] || 'default' },
    { key: 'trabajo', label: 'Trabajo / Ticket' },
    { key: 'ejecutor', label: 'Ejecutor' },
  ];

  return (
    <Box>
      <DataTable
        title="Casos de Prueba (Evidencias de Evaluación)"
        subtitle="Casos de prueba ejecutados durante la evaluación de los trabajos de calidad"
        columns={columns}
        data={casos}
        searchPlaceholder="Buscar caso de prueba..."
        newLabel="Nuevo Caso"
        filters={[
          { key: 'estado', label: 'Estado', values: Object.keys(estadoColor) },
          { key: 'prioridad', label: 'Prioridad', values: ['Crítica', 'Alta', 'Media', 'Baja'] },
          { key: 'trabajo', label: 'Trabajo', values: ['GLPI-4521', 'TKT-2103', 'GLPI-4489', 'TKT-1998', 'GLPI-4320', 'TKT-1855'] },
        ]}
      />
      <Paper sx={{ p: 3, borderRadius: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>Métricas de Ejecución</Typography>
        <Typography variant="body2" color="text.secondary">
          Total de pruebas: 6 · Aprobadas: 2 · Fallidas: 1 · Pendientes: 1 · En ejecución: 1 · Bloqueadas: 1
        </Typography>
      </Paper>
    </Box>
  );
}
