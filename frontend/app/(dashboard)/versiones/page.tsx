'use client';

import { Box, Paper, Typography } from '@mui/material';
import DataTable, { ColumnDef } from '@/components/common/DataTable';

interface Version {
  id: string;
  version: string;
  ambiente: string;
  responsable: string;
  fecha: string;
  estado: string;
  cambios: string;
}

const versiones: Version[] = [
  { id: 'V-004', version: 'v1.2.3', ambiente: 'Producción', responsable: 'Carlos Ruiz', fecha: '2024/01/14', estado: 'Estable', cambios: 'Fix login, exportación' },
  { id: 'V-003', version: 'v1.2.2', ambiente: 'Pruebas', responsable: 'Luis Torres', fecha: '2024/01/12', estado: 'En validación', cambios: 'Nueva pantalla auditoría' },
  { id: 'V-002', version: 'v1.2.1', ambiente: 'Desarrollo', responsable: 'Ana Gómez', fecha: '2024/01/10', estado: 'Inestable', cambios: 'Integración firma digital' },
  { id: 'V-001', version: 'v1.2.0', ambiente: 'Producción', responsable: 'Juan Pérez', fecha: '2024/01/05', estado: 'Estable', cambios: 'Módulo de requerimientos' },
];

const estadoColor: Record<string, string> = {
  'Estable': 'success', 'En validación': 'info', 'Inestable': 'error', 'En desarrollo': 'default',
};

export default function VersionesPage() {
  const columns: ColumnDef<Version>[] = [
    { key: 'id', label: 'ID' },
    { key: 'version', label: 'Versión' },
    { key: 'ambiente', label: 'Ambiente' },
    { key: 'responsable', label: 'Responsable' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'estado', label: 'Estado', badge: (v) => estadoColor[v] || 'default' },
    { key: 'cambios', label: 'Cambios' },
  ];

  return (
    <Box>
      <DataTable
        title="Versiones y Despliegues"
        subtitle="Registro de versiones de aplicaciones y componentes"
        columns={columns}
        data={versiones}
        searchPlaceholder="Buscar versión..."
        newLabel="Nueva Versión"
        filters={[
          { key: 'ambiente', label: 'Ambiente', values: ['Desarrollo', 'Pruebas', 'Producción'] },
          { key: 'estado', label: 'Estado', values: Object.keys(estadoColor) },
        ]}
      />
      <Paper sx={{ p: 3, borderRadius: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>Estabilidad de Versiones</Typography>
        <Typography variant="body2" color="text.secondary">
          Última versión en producción: v1.2.3 · Índice de estabilidad: 92%
        </Typography>
      </Paper>
    </Box>
  );
}
