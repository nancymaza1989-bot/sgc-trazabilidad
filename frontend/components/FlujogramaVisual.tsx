'use client';

import { useState } from 'react';
import { Box, Paper, Typography, Button, Chip, Stack } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useRouter } from 'next/navigation';
import { PJ_COLORS } from '@/lib/theme';

interface NodoFlujo {
  id: string;
  titulo: string;
  subtitulo: string;
  modulo: string;
  ruta: string;
  rol: string;
  descripcion: string;
  x: number;
  y: number;
  color: string;
}

const NODOS: NodoFlujo[] = [
  {
    id: 'trabajos',
    titulo: '1. Recepción y Asignación',
    subtitulo: 'Gestión de Trabajos y Tickets GLPI',
    modulo: 'Trabajos',
    ruta: '/trabajos',
    rol: 'Coordinador de Calidad',
    descripcion: 'Ingreso del ticket, definición del proyecto, tipo de atención (Incidencia, Requerimiento) y asignación al analista con plazos y entregables.',
    x: 100,
    y: 40,
    color: '#1a3a6b'
  },
  {
    id: 'requerimientos',
    titulo: '2. Requerimientos & Alcance',
    subtitulo: 'Levantamiento Funcional/Técnico',
    modulo: 'Requerimientos',
    ruta: '/requerimientos',
    rol: 'Equipo de Desarrollo / Calidad',
    descripcion: 'Seguimiento de requerimientos previos y análisis de impacto sobre el sistema.',
    x: 480,
    y: 40,
    color: '#0284c7'
  },
  {
    id: 'casos',
    titulo: '3. Casos de Prueba & RA-105',
    subtitulo: 'Estructuración de Pruebas',
    modulo: 'Casos de Prueba',
    ruta: '/casos-prueba',
    rol: 'Analista de Calidad',
    descripcion: 'Diseño de casos de prueba normados, precondiciones, resultados esperados y evidencias visuales (Ctrl+V).',
    x: 100,
    y: 200,
    color: '#0d9488'
  },
  {
    id: 'pruebas-ia',
    titulo: '4. Pruebas Automáticas & IA',
    subtitulo: 'Validación de Scripts y Regresión',
    modulo: 'Pruebas Automatizadas IA',
    ruta: '/pruebas-ia',
    rol: 'Analista de Calidad',
    descripcion: 'Ejecución de pruebas automatizadas (Regresión, Seguridad, Rendimiento) con comparativa de scripts y calificación por niveles.',
    x: 480,
    y: 200,
    color: '#7c3aed'
  },
  {
    id: 'incidencias',
    titulo: '5. Registro de Incidencias & IA v2',
    subtitulo: 'Hallazgos y Alertas de Duplicados',
    modulo: 'Incidencias',
    ruta: '/incidencias',
    rol: 'Analista de Calidad',
    descripcion: 'Reporte de errores encontrados. El motor IA v2 detecta incidencias duplicadas en tiempo real y genera PDF oficial con evidencias.',
    x: 100,
    y: 360,
    color: '#e11d48'
  },
  {
    id: 'versiones',
    titulo: '6. Versiones y Despliegues',
    subtitulo: 'Pases a Producción y Estabilidad',
    modulo: 'Versiones',
    ruta: '/versiones',
    rol: 'Coordinador / DevOps',
    descripcion: 'Control de versiones, ambientes (Desarrollo, Pruebas, Producción) y verificación de estabilidad.',
    x: 480,
    y: 360,
    color: '#d97706'
  },
  {
    id: 'reportes',
    titulo: '7. Reportes, ISO & Auditoría',
    subtitulo: 'Excel RA-105, ISO 25010 y Logs',
    modulo: 'Reportes y Auditoría',
    ruta: '/reportes',
    rol: 'Alta Dirección / Coordinador',
    descripcion: 'Exportación de reportes operativos en Excel RA-105, evaluación ISO 25010 y trazabilidad inmutable.',
    x: 290,
    y: 520,
    color: '#475569'
  }
];

export default function FlujogramaVisual() {
  const router = useRouter();
  const [nodoSeleccionado, setNodoSeleccionado] = useState<NodoFlujo>(NODOS[0]);

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: '#ffffff', border: `1px solid ${PJ_COLORS.divider}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold" color="text.primary">
              Flujograma Macro Interactivo de Procesos - SGC Poder Judicial
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Diagrama de flujo relacional end-to-end. Haga clic en cualquier bloque para inspeccionar el proceso y navegar de inmediato a su pantalla correspondiente.
            </Typography>
          </Box>
          <Chip label="Flujo Oficial SGC v1.0" color="primary" variant="outlined" />
        </Box>

        {/* Contenedor Gráfico del Flujograma */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            minHeight: 620,
            bgcolor: '#f8fafc',
            borderRadius: 3,
            p: 4,
            border: '1px dashed #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {/* Fila 1 */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={6} alignItems="center" justifyContent="center">
            {/* Nodo 1 */}
            <Paper
              elevation={nodoSeleccionado.id === 'trabajos' ? 6 : 2}
              onClick={() => setNodoSeleccionado(NODOS[0])}
              sx={{
                width: 280, p: 2.5, borderRadius: 2.5, cursor: 'pointer',
                border: `3px solid ${nodoSeleccionado.id === 'trabajos' ? NODOS[0].color : '#cbd5e1'}`,
                bgcolor: nodoSeleccionado.id === 'trabajos' ? '#eff6ff' : '#ffffff',
                transition: 'all 0.2s',
                '&:hover': { transform: 'scale(1.03)', borderColor: NODOS[0].color }
              }}
            >
              <Chip label={NODOS[0].rol} size="small" sx={{ bgcolor: NODOS[0].color, color: '#fff', mb: 1, fontSize: 10 }} />
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: NODOS[0].color }}>
                {NODOS[0].titulo}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {NODOS[0].subtitulo}
              </Typography>
            </Paper>

            <ArrowForwardIcon sx={{ color: '#94a3b8', display: { xs: 'none', md: 'block' }, fontSize: 32 }} />

            {/* Nodo 2 */}
            <Paper
              elevation={nodoSeleccionado.id === 'requerimientos' ? 6 : 2}
              onClick={() => setNodoSeleccionado(NODOS[1])}
              sx={{
                width: 280, p: 2.5, borderRadius: 2.5, cursor: 'pointer',
                border: `3px solid ${nodoSeleccionado.id === 'requerimientos' ? NODOS[1].color : '#cbd5e1'}`,
                bgcolor: nodoSeleccionado.id === 'requerimientos' ? '#f0f9ff' : '#ffffff',
                transition: 'all 0.2s',
                '&:hover': { transform: 'scale(1.03)', borderColor: NODOS[1].color }
              }}
            >
              <Chip label={NODOS[1].rol} size="small" sx={{ bgcolor: NODOS[1].color, color: '#fff', mb: 1, fontSize: 10 }} />
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: NODOS[1].color }}>
                {NODOS[1].titulo}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {NODOS[1].subtitulo}
              </Typography>
            </Paper>
          </Stack>

          <ArrowDownwardIcon sx={{ color: '#94a3b8', fontSize: 32 }} />

          {/* Fila 2 */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={6} alignItems="center" justifyContent="center">
            {/* Nodo 3 */}
            <Paper
              elevation={nodoSeleccionado.id === 'casos' ? 6 : 2}
              onClick={() => setNodoSeleccionado(NODOS[2])}
              sx={{
                width: 280, p: 2.5, borderRadius: 2.5, cursor: 'pointer',
                border: `3px solid ${nodoSeleccionado.id === 'casos' ? NODOS[2].color : '#cbd5e1'}`,
                bgcolor: nodoSeleccionado.id === 'casos' ? '#f0fdf4' : '#ffffff',
                transition: 'all 0.2s',
                '&:hover': { transform: 'scale(1.03)', borderColor: NODOS[2].color }
              }}
            >
              <Chip label={NODOS[2].rol} size="small" sx={{ bgcolor: NODOS[2].color, color: '#fff', mb: 1, fontSize: 10 }} />
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: NODOS[2].color }}>
                {NODOS[2].titulo}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {NODOS[2].subtitulo}
              </Typography>
            </Paper>

            <ArrowForwardIcon sx={{ color: '#94a3b8', display: { xs: 'none', md: 'block' }, fontSize: 32 }} />

            {/* Nodo 4 */}
            <Paper
              elevation={nodoSeleccionado.id === 'pruebas-ia' ? 6 : 2}
              onClick={() => setNodoSeleccionado(NODOS[3])}
              sx={{
                width: 280, p: 2.5, borderRadius: 2.5, cursor: 'pointer',
                border: `3px solid ${nodoSeleccionado.id === 'pruebas-ia' ? NODOS[3].color : '#cbd5e1'}`,
                bgcolor: nodoSeleccionado.id === 'pruebas-ia' ? '#faf5ff' : '#ffffff',
                transition: 'all 0.2s',
                '&:hover': { transform: 'scale(1.03)', borderColor: NODOS[3].color }
              }}
            >
              <Chip label={NODOS[3].rol} size="small" sx={{ bgcolor: NODOS[3].color, color: '#fff', mb: 1, fontSize: 10 }} />
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: NODOS[3].color }}>
                {NODOS[3].titulo}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {NODOS[3].subtitulo}
              </Typography>
            </Paper>
          </Stack>

          <ArrowDownwardIcon sx={{ color: '#94a3b8', fontSize: 32 }} />

          {/* Fila 3 */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={6} alignItems="center" justifyContent="center">
            {/* Nodo 5 */}
            <Paper
              elevation={nodoSeleccionado.id === 'incidencias' ? 6 : 2}
              onClick={() => setNodoSeleccionado(NODOS[4])}
              sx={{
                width: 280, p: 2.5, borderRadius: 2.5, cursor: 'pointer',
                border: `3px solid ${nodoSeleccionado.id === 'incidencias' ? NODOS[4].color : '#cbd5e1'}`,
                bgcolor: nodoSeleccionado.id === 'incidencias' ? '#fff1f2' : '#ffffff',
                transition: 'all 0.2s',
                '&:hover': { transform: 'scale(1.03)', borderColor: NODOS[4].color }
              }}
            >
              <Chip label={NODOS[4].rol} size="small" sx={{ bgcolor: NODOS[4].color, color: '#fff', mb: 1, fontSize: 10 }} />
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: NODOS[4].color }}>
                {NODOS[4].titulo}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {NODOS[4].subtitulo}
              </Typography>
            </Paper>

            <ArrowForwardIcon sx={{ color: '#94a3b8', display: { xs: 'none', md: 'block' }, fontSize: 32 }} />

            {/* Nodo 6 */}
            <Paper
              elevation={nodoSeleccionado.id === 'versiones' ? 6 : 2}
              onClick={() => setNodoSeleccionado(NODOS[5])}
              sx={{
                width: 280, p: 2.5, borderRadius: 2.5, cursor: 'pointer',
                border: `3px solid ${nodoSeleccionado.id === 'versiones' ? NODOS[5].color : '#cbd5e1'}`,
                bgcolor: nodoSeleccionado.id === 'versiones' ? '#fffbeb' : '#ffffff',
                transition: 'all 0.2s',
                '&:hover': { transform: 'scale(1.03)', borderColor: NODOS[5].color }
              }}
            >
              <Chip label={NODOS[5].rol} size="small" sx={{ bgcolor: NODOS[5].color, color: '#fff', mb: 1, fontSize: 10 }} />
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: NODOS[5].color }}>
                {NODOS[5].titulo}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {NODOS[5].subtitulo}
              </Typography>
            </Paper>
          </Stack>

          <ArrowDownwardIcon sx={{ color: '#94a3b8', fontSize: 32 }} />

          {/* Fila 4 (Salida / Cierre) */}
          <Paper
            elevation={nodoSeleccionado.id === 'reportes' ? 6 : 2}
            onClick={() => setNodoSeleccionado(NODOS[6])}
            sx={{
              width: 340, p: 2.5, borderRadius: 2.5, cursor: 'pointer',
              border: `3px solid ${nodoSeleccionado.id === 'reportes' ? NODOS[6].color : '#cbd5e1'}`,
              bgcolor: nodoSeleccionado.id === 'reportes' ? '#f1f5f9' : '#ffffff',
              transition: 'all 0.2s',
              '&:hover': { transform: 'scale(1.03)', borderColor: NODOS[6].color }
            }}
          >
            <Chip label={NODOS[6].rol} size="small" sx={{ bgcolor: NODOS[6].color, color: '#fff', mb: 1, fontSize: 10 }} />
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: NODOS[6].color }}>
              {NODOS[6].titulo}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {NODOS[6].subtitulo}
            </Typography>
          </Paper>
        </Box>
      </Paper>

      {/* Panel de Inspección del Nodo Seleccionado */}
      <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#f8fafc', border: `1px solid ${PJ_COLORS.divider}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Chip label={`Proceso Activo · ${nodoSeleccionado.rol}`} sx={{ bgcolor: nodoSeleccionado.color, color: '#fff', mb: 1, fontWeight: 'bold' }} />
            <Typography variant="h6" fontWeight="bold">
              {nodoSeleccionado.titulo} — {nodoSeleccionado.subtitulo}
            </Typography>
          </Box>
          <Button
            variant="contained"
            endIcon={<OpenInNewIcon />}
            onClick={() => router.push(nodoSeleccionado.ruta)}
            sx={{ bgcolor: nodoSeleccionado.color, '&:hover': { opacity: 0.9 } }}
          >
            Abrir {nodoSeleccionado.modulo}
          </Button>
        </Box>
        <Typography variant="body1" color="text.primary" sx={{ mb: 2, lineHeight: 1.6 }}>
          {nodoSeleccionado.descripcion}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', pt: 2, borderTop: `1px solid ${PJ_COLORS.divider}` }}>
          <CheckCircleIcon sx={{ color: nodoSeleccionado.color }} />
          <Typography variant="body2" color="text.secondary">
            Este proceso se encuentra integrado y automatizado en el sistema. Al hacer clic en el botón superior, accederá directamente a la pantalla operativa correspondiente.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
