'use client';

import DataTable, { ColumnDef } from '@/components/common/DataTable';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  area: string;
  estado: string;
}

const usuarios: Usuario[] = [
  { id: 'U-001', nombre: 'Administrador SGC', email: 'admin@poderjudicial.gob.pe', rol: 'Administrador', area: 'Calidad', estado: 'Activo' },
  { id: 'U-002', nombre: 'Ana Gómez', email: 'ana.gomez@poderjudicial.gob.pe', rol: 'Analista de Calidad', area: 'Calidad', estado: 'Activo' },
  { id: 'U-003', nombre: 'Juan Pérez', email: 'juan.perez@poderjudicial.gob.pe', rol: 'Desarrollador', area: 'Desarrollo', estado: 'Activo' },
  { id: 'U-004', nombre: 'Carlos Ruiz', email: 'carlos.ruiz@poderjudicial.gob.pe', rol: 'Líder Técnico', area: 'Desarrollo', estado: 'Activo' },
  { id: 'U-005', nombre: 'María López', email: 'maria.lopez@poderjudicial.gob.pe', rol: 'Auditor Interno', area: 'Auditoría', estado: 'Activo' },
  { id: 'U-006', nombre: 'Luis Torres', email: 'luis.torres@poderjudicial.gob.pe', rol: 'Responsable de Producción', area: 'Producción', estado: 'Inactivo' },
];

const rolColor: Record<string, string> = {
  'Administrador': 'error', 'Líder Técnico': 'warning', 'Analista de Calidad': 'info',
  'Desarrollador': 'secondary', 'Auditor Interno': 'success', 'Responsable de Producción': 'default',
};

export default function UsuariosPage() {
  const columns: ColumnDef<Usuario>[] = [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'email', label: 'Email' },
    { key: 'rol', label: 'Rol', badge: (v) => rolColor[v] || 'default' },
    { key: 'area', label: 'Área' },
    { key: 'estado', label: 'Estado' },
  ];

  return (
    <DataTable
      title="Usuarios, Roles y Permisos"
      subtitle="Gestión de acceso con RBAC (Control de acceso basado en roles)"
      columns={columns}
      data={usuarios}
      searchPlaceholder="Buscar usuario..."
      newLabel="Nuevo Usuario"
      filters={[
        { key: 'rol', label: 'Rol', values: Object.keys(rolColor) },
        { key: 'estado', label: 'Estado', values: ['Activo', 'Inactivo'] },
      ]}
    />
  );
}
