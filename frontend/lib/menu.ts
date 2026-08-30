export interface MenuItem {
  titulo: string;
  ruta: string;
  icono: string;
  descripcion: string;
}

export interface MenuSeccion {
  titulo: string;
  items: MenuItem[];
}

const MODULOS: MenuItem[] = [
  { titulo: 'Dashboard', ruta: '/dashboard', icono: '📊', descripcion: 'Panel de control de la calidad (Coordinador)' },
  { titulo: 'Trabajos', ruta: '/trabajos', icono: '🎫', descripcion: 'Gestión de tickets, pases y requerimientos (Coordinador)' },
  { titulo: 'Incidencias', ruta: '/incidencias', icono: '📋', descripcion: 'Evaluaciones asignadas al Analista: registrar casos de prueba, incidencias/hallazgos y evidencias' },
  { titulo: 'Casos de Prueba', ruta: '/casos-prueba', icono: '🧪', descripcion: 'Casos de prueba como evidencias de la evaluación' },
  { titulo: 'Requerimientos', ruta: '/requerimientos', icono: '📝', descripcion: 'Seguimiento de requerimientos' },
  { titulo: 'Versiones', ruta: '/versiones', icono: '📦', descripcion: 'Gestión de versiones y despliegues' },
  { titulo: 'Monitoreo', ruta: '/monitoreo', icono: '📈', descripcion: 'Cuadro de mando, alertas y métricas' },
  { titulo: 'Calidad ISO', ruta: '/calidad-iso', icono: '⭐', descripcion: 'Evaluación ISO/IEC 25010' },
  { titulo: 'Reportes', ruta: '/reportes', icono: '📄', descripcion: 'Generación de reportes operativos y de gestión' },
  { titulo: 'Auditoría', ruta: '/auditoria', icono: '🔍', descripcion: 'Trazabilidad y auditoría del sistema' },
  { titulo: 'Usuarios', ruta: '/usuarios', icono: '👥', descripcion: 'Gestión de usuarios, roles y permisos' },
  { titulo: 'Configuración', ruta: '/configuracion', icono: '⚙️', descripcion: 'Mantenedores y parámetros del sistema' },
  { titulo: 'Asistente IA', ruta: '/chatbot-config', icono: '🤖', descripcion: 'Configuración de Preguntas Frecuentes y Base RAG' },
];

export const MENU_SECCIONES: MenuSeccion[] = [
  {
    titulo: 'Principal',
    items: MODULOS.filter((m) =>
      ['dashboard', 'trabajos'].includes(m.ruta.replace('/', '')),
    ),
  },
  {
    titulo: 'Calidad',
    items: MODULOS.filter((m) =>
      ['incidencias', 'casos-prueba', 'requerimientos', 'versiones', 'calidad-iso'].includes(m.ruta.replace('/', '')),
    ),
  },
  {
    titulo: 'Gestión',
    items: MODULOS.filter((m) =>
      ['monitoreo', 'reportes', 'auditoria'].includes(m.ruta.replace('/', '')),
    ),
  },
  {
    titulo: 'Administración',
    items: MODULOS.filter((m) =>
      ['usuarios', 'configuracion', 'chatbot-config'].includes(m.ruta.replace('/', '')),
    ),
  },
];

export const MENU_MODULOS: MenuItem[] = MODULOS;
