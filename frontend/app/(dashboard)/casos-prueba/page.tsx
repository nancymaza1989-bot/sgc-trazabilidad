'use client';

import { Box, Paper, Typography } from '@mui/material';
import DataTable, { ColumnDef } from '@/components/common/DataTable';

interface CasoPrueba {
  id: string;
  titulo: string;
  prioridad: string;
  estado: string;
  requerimiento: string;
  ejecutor: string;
}

const casos: CasoPrueba[] = [
  { id: 'CP-001', titulo: 'Verificar login con credenciales válidas', prioridad: 'Alta', estado: 'Aprobado', requerimiento: 'REQ-001', ejecutor: 'María López' },
  { id: 'CP-002', titulo: 'Validar exportación a Excel', prioridad: 'Media', estado: 'Fallido', requerimiento: 'REQ-003', ejecutor: 'Juan Pérez' },
  { id: 'CP-003', titulo: 'Probar recuperación de contraseña', prioridad: 'Alta', estado: 'Pendiente', requerimiento: 'REQ-001', ejecutor: 'Ana Gómez' },
  { id: 'CP-004', titulo: 'Verificar notificación por correo', prioridad: 'Media', estado: 'En ejecución', requerimiento: 'REQ-005', ejecutor: 'Luis Torres' },
  { id: 'CP-005', titulo: 'Validar formato de reporte PDF', prioridad: 'Alta', estado: 'Aprobado', requerimiento: 'REQ-004', ejecutor: 'María López' },
  { id: 'CP-006', titulo: 'Probar integración con firma digital', prioridad: 'Crítica', estado: 'Bloqueado', requerimiento: 'REQ-002', ejecutor: 'Carlos Ruiz' },
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
    { key: 'requerimiento', label: 'Requerimiento' },
    { key: 'ejecutor', label: 'Ejecutor' },
  ];

  return (
    <Box>
      <DataTable
        title="Casos de Prueba"
        subtitle="CRUD de casos de prueba y registro de ejecución"
        columns={columns}
        data={casos}
        searchPlaceholder="Buscar caso de prueba..."
        newLabel="Nuevo Caso"
        filters={[
          { key: 'estado', label: 'Estado', values: Object.keys(estadoColor) },
          { key: 'prioridad', label: 'Prioridad', values: ['Crítica', 'Alta', 'Media', 'Baja'] },
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
