'use client';

import DataTable, { ColumnDef } from '@/components/common/DataTable';

interface Auditoria {
  id: string;
  usuario: string;
  modulo: string;
  accion: string;
  entidad: string;
  fecha: string;
  ip: string;
}

const eventos: Auditoria[] = [
  { id: 'A-001', usuario: 'admin@poderjudicial.gob.pe', modulo: 'Incidencias', accion: 'Creación', entidad: 'INC-006', fecha: '2024/01/15 10:30', ip: '10.0.0.12' },
  { id: 'A-002', usuario: 'ana.gomez', modulo: 'Requerimientos', accion: 'Actualización', entidad: 'REQ-001', fecha: '2024/01/15 09:45', ip: '10.0.0.18' },
  { id: 'A-003', usuario: 'carlos.ruiz', modulo: 'Versiones', accion: 'Despliegue', entidad: 'V-004', fecha: '2024/01/14 18:20', ip: '10.0.0.5' },
  { id: 'A-004', usuario: 'sistema', modulo: 'Seguridad', accion: 'Acceso', entidad: 'Sesión', fecha: '2024/01/14 08:00', ip: '10.0.0.3' },
  { id: 'A-005', usuario: 'maria.lopez', modulo: 'Casos de Prueba', accion: 'Ejecución', entidad: 'CP-005', fecha: '2024/01/14 12:10', ip: '10.0.0.22' },
  { id: 'A-006', usuario: 'juan.perez', modulo: 'Calidad ISO', accion: 'Evaluación', entidad: 'Versión 1.2.3', fecha: '2024/01/13 16:00', ip: '10.0.0.9' },
];

export default function AuditoriaPage() {
  const columns: ColumnDef<Auditoria>[] = [
    { key: 'id', label: 'ID' },
    { key: 'usuario', label: 'Usuario' },
    { key: 'modulo', label: 'Módulo' },
    { key: 'accion', label: 'Acción' },
    { key: 'entidad', label: 'Entidad' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'ip', label: 'IP Origen' },
  ];

  return (
    <DataTable
      title="Auditoría y Trazabilidad"
      subtitle="Registro de todos los eventos del sistema con hash de integridad"
      columns={columns}
      data={eventos}
      searchPlaceholder="Buscar evento..."
      newLabel="Exportar Logs"
      filters={[
        { key: 'modulo', label: 'Módulo', values: ['Incidencias', 'Requerimientos', 'Versiones', 'Casos de Prueba', 'Calidad ISO', 'Seguridad'] },
        { key: 'accion', label: 'Acción', values: ['Creación', 'Actualización', 'Eliminación', 'Despliegue', 'Acceso', 'Ejecución'] },
      ]}
    />
  );
}
