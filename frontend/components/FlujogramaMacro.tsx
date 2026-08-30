'use client';

import { useState } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, Chip, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, Stack, Stepper, Step, StepLabel, StepContent
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useRouter } from 'next/navigation';
import { PJ_COLORS } from '@/lib/theme';

interface ProcesoMacro {
  id: string;
  titulo: string;
  modulo: string;
  ruta: string;
  descripcion: string;
  rol: string;
  pasos: string[];
  color: string;
}

const PROCESOS_MACRO: ProcesoMacro[] = [
  {
    id: 'trabajos',
    titulo: '1. Gestión de Trabajos y Pases',
    modulo: 'Trabajos / Tickets',
    ruta: '/trabajos',
    descripcion: 'Recepción de tickets, registro de proyectos, tipos de atención (Incidencia, Requerimiento, Mejora) y asignación al analista de calidad con plazos y entregables.',
    rol: 'Coordinador de Calidad',
    pasos: [
      'Registrar nuevo ticket GLPI o pase de versión',
      'Definir proyecto, prioridad y fecha de recepción',
      'Asignar analista(s) de calidad responsable(s)',
      'Establecer fecha programada de entrega'
    ],
    color: '#1a3a6b'
  },
  {
    id: 'casos',
    titulo: '2. Casos de Prueba & RA-105',
    modulo: 'Casos de Prueba',
    ruta: '/casos-prueba',
    descripcion: 'Estructuración de casos de prueba según formato RA-105, precondiciones, datos de prueba, resultados esperados y evidencias.',
    rol: 'Analista de Calidad',
    pasos: [
      'Seleccionar trabajo y evaluación asignada',
      'Registrar ítems del caso de prueba con severidad',
      'Adjuntar o pegar capturas de pantalla (Ctrl+V)',
      'Registrar firmas de analista y supervisor'
    ],
    color: '#0284c7'
  },
  {
    id: 'incidencias',
    titulo: '3. Registro de Incidencias & IA v2',
    modulo: 'Incidencias / Hallazgos',
    ruta: '/incidencias',
    descripcion: 'Detección y registro de hallazgos durante las pruebas. El motor IA v2 analiza descripciones en tiempo real para alertar de incidencias duplicadas.',
    rol: 'Analista de Calidad',
    pasos: [
      'Crear nueva incidencia con tipo de error, prioridad y versión',
      'Adjuntar evidencia visual con pegado directo (Ctrl+V)',
      'Análisis automático de IA v2 (detección de duplicados)',
      'Generación de Informe PDF oficial con imágenes incrustadas'
    ],
    color: '#0d9488'
  },
  {
    id: 'pruebas-ia',
    titulo: '4. Pruebas Automatizadas con IA & Scripts',
    modulo: 'Pruebas Automatizadas IA',
    ruta: '/pruebas-ia',
    descripcion: 'Ejecución y validación de scripts de desarrollo (Regresión, Funcional, No Funcional, Seguridad, Flexibilidad) vinculados a GLPI y calificación por niveles.',
    rol: 'Analista de Calidad / Desarrollador',
    pasos: [
      'Vincular número de ticket GLPI o requerimiento',
      'Seleccionar tipo de prueba (Regresión, Seguridad, etc.)',
      'Ingresar script del desarrollador y resultado esperado vs obtenido',
      'Evaluación IA de concordancia y asignación de Nivel (Óptimo, Aceptable, Deficiente)'
    ],
    color: '#7c3aed'
  },
  {
    id: 'chatbot',
    titulo: '5. Asistente IA / RAG Normativo PJ',
    modulo: 'Chatbot & Configuración',
    ruta: '/chatbot-config',
    descripcion: 'Consulta inteligente de normativa interna del SGC y del Poder Judicial con RAG sobre documentos indexados y derivación exacta a pj.gob.pe.',
    rol: 'Todo el personal SGC',
    pasos: [
      'Abrir esfera flotante del Asistente IA en cualquier pantalla',
      'Consultar dudas sobre procedimientos o guías SGC',
      'Obtener enlaces directos a normativas o rutas del sistema',
      'Derivación oficial a Google acotada a site:pj.gob.pe si no hay match'
    ],
    color: '#d97706'
  },
  {
    id: 'reportes',
    titulo: '6. Reportes y Exportación RA-105',
    modulo: 'Reportes Operativos',
    ruta: '/reportes',
    descripcion: 'Generación de cuadros de mando, métricas de cumplimiento y exportación en Excel RA-105 (diario, semanal, mensual) con 13 columnas normadas.',
    rol: 'Coordinador / Administrador',
    pasos: [
      'Seleccionar periodo (Diario, Semanal, Mensual)',
      'Consolidación automática de incidencias y trabajos',
      'Exportación en formato Excel (.xlsx) con estilos institucionales y freeze panes',
      'Auditoría y trazabilidad completa del SGC'
    ],
    color: '#475569'
  }
];

export default function FlujogramaMacro({ procesoInicialId }: { procesoInicialId?: string }) {
  const router = useRouter();
  const [procesoSeleccionado, setProcesoSeleccionado] = useState<ProcesoMacro>(
    PROCESOS_MACRO.find(p => p.id === procesoInicialId) || PROCESOS_MACRO[0]
  );
  const [dialogoAbierto, setDialogoAbierto] = useState(false);

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: '#ffffff', border: `1px solid ${PJ_COLORS.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <AccountTreeIcon color="primary" sx={{ fontSize: 36 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold" color="text.primary">
              Flujograma Interactivo Macro - SGC Trazabilidad
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mapa integral de procesos del Sistema de Gestión de Calidad del Poder Judicial. Haga clic en cualquier proceso para ver su detalle, pasos y navegar directamente al módulo correspondiente.
            </Typography>
          </Box>
        </Box>

        {/* Diagrama de flujo visual en tarjetas conectadas */}
        <Grid container spacing={2} sx={{ mt: 1, position: 'relative' }}>
          {PROCESOS_MACRO.map((proc, index) => {
            const activo = procesoSeleccionado.id === proc.id;
            return (
              <Grid item xs={12} md={4} key={proc.id}>
                <Card
                  elevation={activo ? 4 : 1}
                  onClick={() => setProcesoSeleccionado(proc)}
                  sx={{
                    borderRadius: 2.5,
                    cursor: 'pointer',
                    border: `2px solid ${activo ? proc.color : '#e2e8f0'}`,
                    bgcolor: activo ? '#f0f9ff' : '#ffffff',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': { transform: 'translateY(-3px)', boxShadow: 3 }
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip
                        label={`Paso ${index + 1}`}
                        size="small"
                        sx={{ bgcolor: proc.color, color: '#fff', fontWeight: 'bold' }}
                      />
                      <Chip label={proc.rol} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: proc.color, mb: 0.5 }}>
                      {proc.titulo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, mb: 2, minHeight: 40 }}>
                      {proc.descripcion}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: `1px dashed ${PJ_COLORS.divider}` }}>
                      <Typography variant="caption" fontWeight="bold" color="primary">
                        Módulo: {proc.modulo}
                      </Typography>
                      <Button
                        size="small"
                        endIcon={<OpenInNewIcon fontSize="small" />}
                        onClick={(e) => { e.stopPropagation(); router.push(proc.ruta); }}
                        sx={{ textTransform: 'none', fontSize: 12 }}
                      >
                        Ir al módulo
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Detalle ampliado del proceso seleccionado */}
      <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#f8fafc', border: `1px solid ${PJ_COLORS.divider}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Chip label={`Proceso Activo · ${procesoSeleccionado.rol}`} sx={{ bgcolor: procesoSeleccionado.color, color: '#fff', mb: 1, fontWeight: 'bold' }} />
            <Typography variant="h6" fontWeight="bold">
              {procesoSeleccionado.titulo}
            </Typography>
          </Box>
          <Button
            variant="contained"
            endIcon={<OpenInNewIcon />}
            onClick={() => router.push(procesoSeleccionado.ruta)}
            sx={{ bgcolor: procesoSeleccionado.color, '&:hover': { opacity: 0.9 } }}
          >
            Abrir {procesoSeleccionado.modulo}
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {procesoSeleccionado.descripcion}
        </Typography>

        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, color: '#1e293b' }}>
          Flujo detallado de actividades en este proceso:
        </Typography>
        <Stack spacing={1.5}>
          {procesoSeleccionado.pasos.map((paso, idx) => (
            <Paper key={idx} elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: '#ffffff', border: `1px solid #e2e8f0`, display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircleIcon sx={{ color: procesoSeleccionado.color, fontSize: 20 }} />
              <Typography variant="body2" fontWeight="500">
                Paso {idx + 1}: {paso}
              </Typography>
            </Paper>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}
