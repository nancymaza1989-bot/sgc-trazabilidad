export interface Evidencia {
  id: string;
  correlativo?: string | null;
  archivo: string;
  descripcion?: string | null;
}

export interface HistorialItem {
  detalle: string;
  fecha: string;
}

export interface Evaluacion {
  id: string;
  trabajo_id: string;
  numero_ticket: string;
  proyecto: string;
  tipo_atencion: string;
  prioridad: string;
  instrucciones: string | null;
  documentacion: string | null;
  fecha_recepcion: string | null;
  analista: string | null;
  analista_id: string | null;
  fecha_asignacion: string | null;
  fecha_programada_entrega: string | null;
  fecha_real_entrega: string | null;
  estado: string;
  resultado: string | null;
  vencido: boolean;
  proximo_a_vencer: boolean;
  historial: HistorialItem[];
}

export interface Trabajo {
  id: string;
  numero_ticket: string;
  proyecto: string;
  tipo_atencion: string;
  prioridad: string;
  instrucciones: string | null;
  documentacion: string | null;
  fecha_recepcion: string | null;
  coordinador: string | null;
  pendiente_asignacion: boolean;
  evaluaciones: Evaluacion[];
}

export interface Incidencia {
  id: string;
  correlativo: string;
  evaluacion_id: string;
  numero_ticket: string;
  proyecto: string;
  tipo_atencion: string;
  analista: string | null;
  fecha_asignacion: string | null;
  fecha_programada_entrega: string | null;
  codigo: string | null;
  version: string | null;
  tipo_error: string;
  descripcion: string | null;
  prioridad: string;
  es_bloqueante: boolean;
  base_datos: string | null;
  motor_bd: string | null;
  firma_analista: string | null;
  evidencias: Evidencia[];
}

export interface CasoPruebaItem {
  id: string;
  numero: string;
  descripcion: string | null;
  evidencias: Evidencia[];
}

export interface CasoPrueba {
  id: string;
  correlativo: string;
  numero_caso: string;
  numero_ticket: string | null;
  numero_acta_pase: string | null;
  nombre_analista: string | null;
  tipo_pase: string | null;
  fecha_prueba: string | null;
  flujo_componente: string | null;
  campo_componente: string | null;
  resultado: string;
  resultado_prueba: string | null;
  observaciones: string | null;
  firma_analista: string | null;
  firma_supervisor: string | null;
  evidencias: Evidencia[];
  casos: CasoPruebaItem[];
}

export interface EvaluacionDetalle extends Evaluacion {
  incidencias: Incidencia[];
  casos_prueba: CasoPrueba[];
}

export interface TrabajosResponse {
  items: Trabajo[];
  total: number;
}

export const TIPOS_ATENCION = ['Pase de versión', 'Pase puntual', 'Requerimiento'] as const;
export const PRIORIDADES_TRABAJO = ['Crítica', 'Alta', 'Media', 'Baja'] as const;
export const TIPOS_ERROR = [
  'Funcional', 'No funcional', 'Base de datos', 'Diseño', 'Documentación', 'Data', 'Tablas maestras', 'Otros',
] as const;
export const PRIORIDADES_INCIDENCIA = ['Bajo', 'Medio', 'Alto'] as const;
export const MOTORES_BD = ['PostgreSQL', 'MySQL', 'SQL Server', 'Oracle', 'Otros'] as const;
export const TIPOS_PASE = ['Versión', 'Puntual', 'Pruebas Unitarias'] as const;
export const RESULTADOS_PRUEBA = ['Aprobado', 'Rechazado', 'Observado', 'Pendiente'] as const;
export const ESTADOS_TRABAJO = [
  'Pendiente de asignación', 'Proceso de evaluación', 'Pendiente de entrega',
  'Entregado por el Analista', 'En validación', 'Cerrado',
] as const;

export const ESTADO_COLOR: Record<string, string> = {
  'Pendiente de asignación': '#9e9e9e',
  'Proceso de evaluación': '#7c3aed',
  'Pendiente de entrega': '#f59e0b',
  'Entregado por el Analista': '#0284c7',
  'En validación': '#0284c7',
  'Cerrado': '#16a34a',
};

export function estadoDeTrabajo(t: Trabajo): string {
  if (t.pendiente_asignacion || t.evaluaciones.length === 0) return 'Pendiente de asignación';
  return t.evaluaciones[0].estado || 'Proceso de evaluación';
}