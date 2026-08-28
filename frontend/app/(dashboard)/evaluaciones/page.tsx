'use client';

import { useState } from 'react';
import {
  Box, Paper, Typography, Grid, Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Divider, Stack, Switch, FormControlLabel,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import BugReportIcon from '@mui/icons-material/BugReport';
import ScienceIcon from '@mui/icons-material/Science';
import ImageIcon from '@mui/icons-material/Image';

const TIPOS_ERROR = ['Funcional', 'No funcional', 'Base de datos', 'Diseño', 'Documentación', 'Data', 'Tablas maestras', 'Otros'];
const PRIORIDADES = ['Baja', 'Media', 'Alta'];

interface Incidencia {
  id: string;
  correlativo: string;
  codigo: string;
  version: string;
  tipo_error: string;
  descripcion: string;
  prioridad: string;
  es_bloqueante: boolean;
  base_datos: string;
  motor_bd: string;
  evidencias: { id: string; archivo: string; descripcion: string }[];
}

interface CasoPrueba {
  id: string;
  correlativo: string;
  flujo_componente: string;
  resultado: string;
  evidencias: { id: string; archivo: string; descripcion: string }[];
}

interface Evaluacion {
  id: string;
  ticket: string;
  proyecto: string;
  tipo: string;
  prioridad: string;
  instrucciones: string;
  fecha_asignacion: string;
  fecha_programada: string;
  estado: string;
  incidencias: Incidencia[];
  casos: CasoPrueba[];
}

const datosIniciales: Evaluacion[] = [
  {
    id: 'e1', ticket: 'GLPI-4521', proyecto: 'Sistema de Expedientes', tipo: 'Pase de versión',
    prioridad: 'Alta', instrucciones: 'Validar despliegue v1.2.3 en producción',
    fecha_asignacion: '2026-08-22', fecha_programada: '2026-08-28', estado: 'Proceso de evaluación',
    incidencias: [
      {
        id: '1', correlativo: '1', codigo: 'EXP-123', version: '1.2.3', tipo_error: 'Diseño',
        descripcion: 'El botón de guardar no está alineado en la vista de detalle de expediente.',
        prioridad: 'Media', es_bloqueante: false, base_datos: 'PostgreSQL', motor_bd: 'PG 15',
        evidencias: [{ id: 'ev1', archivo: 'captura_1.png', descripcion: 'Captura de pantalla del problema' }],
      },
    ],
    casos: [
      { id: 'c1', correlativo: '1', flujo_componente: 'Acceso con usuario válido', resultado: 'Paso', evidencias: [{ id: 'cev1', archivo: 'evidencia_caso_1.png', descripcion: 'Pantalla de acceso correcta' }] },
      { id: 'c2', correlativo: '2', flujo_componente: 'Guardar expediente con datos completos', resultado: 'Pendiente', evidencias: [] },
    ],
  },
  {
    id: 'e2', ticket: 'TKT-2103', proyecto: 'Portal Web', tipo: 'Requerimiento',
    prioridad: 'Media', instrucciones: 'Nueva pantalla de consulta de estado',
    fecha_asignacion: '2026-08-20', fecha_programada: '2026-08-26', estado: 'Pendiente de entrega',
    incidencias: [],
    casos: [],
  },
];

const estadoColor: Record<string, string> = {
  'Proceso de evaluación': '#7c3aed',
  'Pendiente de entrega': '#f59e0b',
  'Entregado por el Analista': '#0284c7',
  'Cerrado': '#16a34a',
};

export default function EvaluacionesPage() {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>(datosIniciales);
  const [abierta, setAbierta] = useState<Evaluacion | null>(null);
  const [registrandoIncidencia, setRegistrandoIncidencia] = useState(false);
  const [incForm, setIncForm] = useState<Record<string, any>>({});
  const [nuevaEvidencia, setNuevaEvidencia] = useState({ archivo: '', descripcion: '' });
  const [nuevoCaso, setNuevoCaso] = useState({ flujo_componente: '', resultado: 'Pendiente', evidencia_archivo: '', evidencia_descripcion: '' });
  const [registrandoCaso, setRegistrandoCaso] = useState(false);

  const actualizarEvaluacion = (id: string, fn: (e: Evaluacion) => Evaluacion) => {
    setEvaluaciones((prev) => prev.map((e) => (e.id === id ? fn(e) : e)));
    setAbierta((prev) => (prev && prev.id === id ? fn(prev) : prev));
  };

  const abrirRegistrar = () => {
    setIncForm({
      codigo: '', version: '', tipo_error: 'Funcional', descripcion: '',
      prioridad: 'Media', es_bloqueante: false, base_datos: '', motor_bd: '',
    });
    setNuevaEvidencia({ archivo: '', descripcion: '' });
    setRegistrandoIncidencia(true);
  };

  const guardarIncidencia = (evaluacionId: string) => {
    const count = (abierta || evaluaciones.find((x) => x.id === evaluacionId)!)?.incidencias.length || 0;
    const inc: Incidencia = {
      id: String(Date.now()),
      correlativo: String(count + 1),
      codigo: incForm.codigo as string,
      version: incForm.version as string,
      tipo_error: incForm.tipo_error as string,
      descripcion: incForm.descripcion as string,
      prioridad: incForm.prioridad as string,
      es_bloqueante: !!incForm.es_bloqueante,
      base_datos: incForm.base_datos as string,
      motor_bd: incForm.motor_bd as string,
      evidencias: nuevaEvidencia.archivo
        ? [{ id: String(Date.now()), archivo: nuevaEvidencia.archivo, descripcion: nuevaEvidencia.descripcion }]
        : [],
    };
    actualizarEvaluacion(evaluacionId, (e) => ({ ...e, incidencias: [...e.incidencias, inc] }));
    setRegistrandoIncidencia(false);
  };

  const agregarEvidenciaA = (incidenciaId: string, archivo: string, descripcion: string, evaluacionId: string) => {
    if (!archivo) return;
    actualizarEvaluacion(evaluacionId, (e) => ({
      ...e,
      incidencias: e.incidencias.map((i) => i.id === incidenciaId
        ? { ...i, evidencias: [...i.evidencias, { id: String(Date.now()), archivo, descripcion }] }
        : i),
    }));
  };

  const guardarCaso = (evaluacionId: string) => {
    if (!nuevoCaso.flujo_componente) return;
    actualizarEvaluacion(evaluacionId, (e) => ({
      ...e,
      casos: [...e.casos, {
        id: String(Date.now()),
        correlativo: String((abierta || evaluaciones.find((x) => x.id === evaluacionId)!)?.casos.length + 1 || 1),
        flujo_componente: nuevoCaso.flujo_componente,
        resultado: nuevoCaso.resultado,
        evidencias: nuevoCaso.evidencia_archivo
          ? [{ id: String(Date.now()), archivo: nuevoCaso.evidencia_archivo, descripcion: nuevoCaso.evidencia_descripcion }]
          : [],
      }],
    }));
    setNuevoCaso({ flujo_componente: '', resultado: 'Pendiente', evidencia_archivo: '', evidencia_descripcion: '' });
    setRegistrandoCaso(false);
  };

  const setInc = (k: string) => (e: any) => setIncForm({ ...incForm, [k]: e.target.value });
  const estEvEl = incForm.es_bloqueante;

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" fontWeight="bold">Mis Evaluaciones</Typography>
        <Typography variant="body2" color="text.secondary">
          Trabajos asignados a usted por el Coordinador de Calidad, con su contexto precargado
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {evaluaciones.map((ev) => (
          <Grid item xs={12} md={6} lg={4} key={ev.id}>
            <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary">{ev.ticket}</Typography>
                <Chip size="small" label={ev.estado} sx={{ bgcolor: estadoColor[ev.estado], color: '#fff', fontWeight: 'bold' }} />
              </Box>
              <Typography variant="body2" fontWeight="bold">{ev.proyecto}</Typography>
              <Typography variant="caption" color="text.secondary">{ev.tipo} · Prioridad {ev.prioridad}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {ev.instrucciones}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip size="small" label={`Asignado: ${ev.fecha_asignacion}`} variant="outlined" />
                <Chip size="small" label={`Entrega: ${ev.fecha_programada}`} variant="outlined" />
              </Box>
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Chip size="small" label={`${ev.incidencias.length} incidencias`} variant="outlined" />
                <Chip size="small" label={`${ev.casos.length} casos`} variant="outlined" />
              </Box>
              <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={() => setAbierta(ev)} sx={{ mt: 1.5 }} fullWidth>
                Abrir evaluación
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={Boolean(abierta)} onClose={() => setAbierta(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          Evaluación · {abierta?.ticket}
        </DialogTitle>
        <DialogContent dividers>
          {abierta && (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Contexto de la evaluación (asignada por el Coordinador)</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Ticket/GLPI</Typography><Typography variant="body2" fontWeight="bold">{abierta.ticket}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Proyecto</Typography><Typography variant="body2" fontWeight="bold">{abierta.proyecto}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Tipo</Typography><Typography variant="body2" fontWeight="bold">{abierta.tipo}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Prioridad</Typography><Typography variant="body2" fontWeight="bold">{abierta.prioridad}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Fecha asignación</Typography><Typography variant="body2">{abierta.fecha_asignacion}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Fecha programada entrega</Typography><Typography variant="body2">{abierta.fecha_programada}</Typography></Grid>
                  <Grid item xs={12}><Typography variant="caption" color="text.secondary">Instrucciones</Typography><Typography variant="body2">{abierta.instrucciones}</Typography></Grid>
                </Grid>
              </Paper>

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BugReportIcon /> Incidencias / Hallazgos
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={abrirRegistrar}>Registrar Incidencia</Button>
              </Box>

              {abierta.incidencias.length === 0 && (
                <Typography variant="body2" color="text.secondary">Aún no hay incidencias registradas para esta evaluación.</Typography>
              )}

              {abierta.incidencias.map((inc) => (
                <Paper key={inc.id} variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography fontWeight="bold" color="primary">Incidencia {inc.correlativo}{inc.codigo ? ` · ${inc.codigo}` : ''}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Chip size="small" label={inc.tipo_error} color="secondary" variant="outlined" />
                      <Chip size="small" label={`Prioridad ${inc.prioridad}`} color={inc.prioridad === 'Alta' ? 'error' : inc.prioridad === 'Media' ? 'warning' : 'default'} />
                      {inc.es_bloqueante && <Chip size="small" label="Bloqueante" color="error" />}
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ mt: 1 }}>{inc.descripcion}</Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {inc.version && <Chip size="small" label={`Versión: ${inc.version}`} variant="outlined" />}
                    {inc.base_datos && <Chip size="small" label={`BD: ${inc.base_datos}`} variant="outlined" />}
                    {inc.motor_bd && <Chip size="small" label={`Motor: ${inc.motor_bd}`} variant="outlined" />}
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" color="text.secondary">Evidencias ({inc.evidencias.length}):</Typography>
                  {inc.evidencias.map((ev) => (
                    <Box key={ev.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <ImageIcon fontSize="small" color="action" />
                      <Typography variant="body2">{ev.archivo} · {ev.descripcion}</Typography>
                    </Box>
                  ))}
                  {inc.evidencias.length === 0 && <Typography variant="caption" color="text.secondary">Sin evidencias.</Typography>}
                </Paper>
              ))}

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScienceIcon /> Casos de Prueba
                </Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setRegistrandoCaso(true)}>Registrar Caso</Button>
              </Box>

              {abierta.casos.length === 0 && (
                <Typography variant="body2" color="text.secondary">Aún no hay casos de prueba para esta evaluación.</Typography>
              )}
              {abierta.casos.map((c) => (
                <Paper key={c.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2"><strong>Caso {c.correlativo}:</strong> {c.flujo_componente}</Typography>
                    <Chip size="small" label={c.resultado} color={c.resultado === 'Paso' ? 'success' : c.resultado === 'Fallo' ? 'error' : 'default'} />
                  </Box>
                  {c.evidencias.map((ev) => (
                    <Box key={ev.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <ImageIcon fontSize="small" color="action" />
                      <Typography variant="caption">{ev.archivo} · {ev.descripcion}</Typography>
                    </Box>
                  ))}
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbierta(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={registrandoIncidencia} onClose={() => setRegistrandoIncidencia(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Incidencia (hallazgo en la evaluación)</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField fullWidth label="Código (opcional)" value={incForm.codigo || ''} onChange={setInc('codigo')} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Versión" value={incForm.version || ''} onChange={setInc('version')} /></Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Tipo de error *" value={incForm.tipo_error || ''} onChange={setInc('tipo_error')}>
                  {TIPOS_ERROR.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Prioridad" value={incForm.prioridad || ''} onChange={setInc('prioridad')}>
                  {PRIORIDADES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Descripción detallada *" multiline rows={3} value={incForm.descripcion || ''} onChange={setInc('descripcion')} />
              </Grid>
              <Grid item xs={6}><TextField fullWidth label="Base de datos" value={incForm.base_datos || ''} onChange={setInc('base_datos')} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Motor de BD" value={incForm.motor_bd || ''} onChange={setInc('motor_bd')} /></Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={estEvEl} onChange={(e) => setIncForm({ ...incForm, es_bloqueante: e.target.checked })} />}
                  label="¿Es bloqueante?"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Evidencia (opcional)</Typography>
                <Stack spacing={1}>
                  <TextField size="small" fullWidth label="Archivo / imagen" value={nuevaEvidencia.archivo} onChange={(e) => setNuevaEvidencia({ ...nuevaEvidencia, archivo: e.target.value })} />
                  <TextField size="small" fullWidth label="Descripción de la evidencia" value={nuevaEvidencia.descripcion} onChange={(e) => setNuevaEvidencia({ ...nuevaEvidencia, descripcion: e.target.value })} />
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegistrandoIncidencia(false)}>Cancelar</Button>
          <Button variant="contained" disabled={!incForm.descripcion} onClick={() => abierta && guardarIncidencia(abierta.id)}>Registrar Incidencia</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={registrandoCaso} onClose={() => setRegistrandoCaso(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Registrar Caso de Prueba</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth label="Flujo o componente revisado *" value={nuevoCaso.flujo_componente} onChange={(e) => setNuevoCaso({ ...nuevoCaso, flujo_componente: e.target.value })} />
            <TextField select fullWidth label="Resultado de la prueba" value={nuevoCaso.resultado} onChange={(e) => setNuevoCaso({ ...nuevoCaso, resultado: e.target.value })}>
              {['Pendiente', 'Paso', 'Fallo', 'Bloqueado'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <Divider />
            <Typography variant="subtitle2">Evidencia (opcional)</Typography>
            <TextField size="small" fullWidth label="Archivo / imagen" value={nuevoCaso.evidencia_archivo} onChange={(e) => setNuevoCaso({ ...nuevoCaso, evidencia_archivo: e.target.value })} />
            <TextField size="small" fullWidth label="Descripción de la evidencia" value={nuevoCaso.evidencia_descripcion} onChange={(e) => setNuevoCaso({ ...nuevoCaso, evidencia_descripcion: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegistrandoCaso(false)}>Cancelar</Button>
          <Button variant="contained" disabled={!nuevoCaso.flujo_componente} onClick={() => abierta && guardarCaso(abierta.id)}>Registrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
