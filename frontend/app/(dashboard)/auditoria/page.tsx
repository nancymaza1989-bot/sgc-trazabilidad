'use client';

import { useState, useEffect, useCallback } from 'react';
import DataTable, { ColumnDef } from '@/components/common/DataTable';
import apiClient from '@/lib/api/client';

interface Auditoria {
  id: string;
  usuario: string;
  modulo: string;
  accion: string;
  entidad: string;
  fecha: string;
  ip: string;
}

export default function AuditoriaPage() {
  const [data, setData] = useState<Auditoria[]>([]);

  const cargarAuditoria = useCallback(async () => {
    try {
      const resp = await apiClient.get('/auditoria');
      setData(resp.data.items || []);
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    cargarAuditoria();
  }, [cargarAuditoria]);

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
      title="Auditoría y Trazabilidad Automatizada"
      subtitle="Registro persistente e inmutable de todas las acciones de usuarios y eventos del sistema SGC"
      columns={columns}
      data={data}
      searchPlaceholder="Buscar evento de auditoría..."
      newLabel=""
      filters={[
        { key: 'modulo', label: 'Módulo', values: ['Incidencias', 'Requerimientos', 'Versiones', 'Casos de Prueba', 'Calidad ISO', 'Sistema SGC'] },
        { key: 'accion', label: 'Acción', values: ['Creación', 'Actualización', 'Despliegue', 'Acceso', 'Evaluación', 'Inicialización'] },
      ]}
    />
  );
}
