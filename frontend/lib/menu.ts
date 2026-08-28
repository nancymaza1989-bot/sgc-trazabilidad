export interface MenuItem {
  titulo: string;
  ruta: string;
  icono: string;
  descripcion: string;
}

export const MENU_MODULOS: MenuItem[] = [
  { titulo: 'Dashboard', ruta: '/dashboard', icono: '📊', descripcion: 'Panel de control con KPIs y métricas' },
  { titulo: 'Incidencias', ruta: '/incidencias', icono: '📋', descripcion: 'Gestión de incidencias y tickets' },
  { titulo: 'Requerimientos', ruta: '/requerimientos', icono: '📝', descripcion: 'Levantamiento y seguimiento de requerimientos' },
  { titulo: 'Casos de Prueba', ruta: '/casos-prueba', icono: '🧪', descripcion: 'Casos y ejecución de pruebas' },
  { titulo: 'Versiones', ruta: '/versiones', icono: '📦', descripcion: 'Gestión de versiones y despliegues' },
  { titulo: 'Monitoreo', ruta: '/monitoreo', icono: '📈', descripcion: 'Cuadro de mando, alertas y métricas' },
  { titulo: 'Calidad ISO', ruta: '/calidad-iso', icono: '⭐', descripcion: 'Evaluación ISO/IEC 25010' },
  { titulo: 'Reportes', ruta: '/reportes', icono: '📄', descripcion: 'Generación de reportes operativos y de gestión' },
  { titulo: 'Auditoría', ruta: '/auditoria', icono: '🔍', descripcion: 'Trazabilidad y auditoría del sistema' },
  { titulo: 'Usuarios', ruta: '/usuarios', icono: '👥', descripcion: 'Gestión de usuarios, roles y permisos' },
  { titulo: 'Configuración', ruta: '/configuracion', icono: '⚙️', descripcion: 'Mantenedores y parámetros del sistema' },
];
