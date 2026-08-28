'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box, Paper, Typography, Grid, Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Divider, Stack, Switch, FormControlLabel,
  Alert, CircularProgress, Tooltip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import BugReportIcon from '@mui/icons-material/BugReport';
import ScienceIcon from '@mui/icons-material/Science';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import UploadFileIcon from '@mui/icons-material/UploadFile';

import apiClient from '@/lib/api/client';
import { descargarPDF } from '@/lib/api/pdf';
import { leerArchivoComoBase64, extraerError } from '@/lib/api/archivos';
import {
  TIPOS_ERROR, PRIORIDADES_INCIDENCIA, MOTORES_BD, ESTADO_COLOR,
  type Trabajo, type Evaluacion, type EvaluacionDetalle, type Incidencia,
} from '@/lib/api/tipos';

interface FormIncidencia {
  numero_ticket: string;
  codigo: string;
  version: string;
  tipo_error: string;
  descripcion: string;
  prioridad: string;
  es_bloqueante: boolean;
  base_datos: string;
  motor_bd: string;
  firma: string;
}

const FORM_VACIO: FormIncidencia = {
  numero_ticket: '',
  codigo: '',
  version: '',
  tipo_error: 'Funcional',
  descripcion: '',
  prioridad: 'Medio',
  es_bloqueante: false,
  base_datos: '',
  motor_bd: '',
  firma: '',
};

export default function IncidenciasPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detalle, setDetalle] = useState<EvaluacionDetalle | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);

  const [dialogoIncidencia, setDialogoIncidencia] = useState(false);
  const [guardandoIncidencia, setGuardandoIncidencia] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [form, setForm] = useState<FormIncidencia>(FORM_VACIO);
  const [evidenciaArchivo, setEvidenciaArchivo] = useState('');
  const [evidenciaDescripcion, setEvidenciaDescripcion] = useState('');

  const [pdfGenerando, setPdfGenerando] = useState<string | null>(null);
  const [errorPdf, setErrorPdf] = useState<string | null>(null);

  const cargarTrabajos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { data } = await apiClient.get<{ items: Trabajo[]; total: number }>('/trabajos/');
      setTrabajos(data.items || []);
    } catch (err) {
      setError(extraerError(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarTrabajos();
  }, [cargarTrabajos]);

  const cargarDetalle = useCallback(async (trabajoId: string, evaluacionId: string) => {
    setCargandoDetalle(true);
    setErrorDetalle(null);
    try {
      const { data } = await apiClient.get<EvaluacionDetalle>(
        `/trabajos/${trabajoId}/evaluaciones/${evaluacionId}`,
      );
      setDetalle(data);
    } catch (err) {
      setErrorDetalle(extraerError(err));
    } finally {
      setCargandoDetalle(false);
    }
  }, []);

  const evaluaciones: Evaluacion[] = useMemo(
    () => trabajos.flatMap((t) => t.evaluaciones),
    [trabajos],
  );

  const analistaActual = session?.user?.name?.trim() || '';
  const emparejadas = analistaActual
    ? evaluaciones.filter((e) =>
        e.analista && (e.analista === analistaActual
          || e.analista.toLowerCase().includes(analistaActual.toLowerCase())),
      )
    : [];
  const conEmparejadas = analistaActual && emparejadas.length > 0;
  const evaluacionesVisibles = conEmparejadas ? emparejadas : evaluaciones;

  const abrirEvaluacion = async (e: Evaluacion) => {
    await cargarDetalle(e.trabajo_id, e.id);
  };

  const cerrarEvaluacion = () => {
    setDetalle(null);
    setErrorDetalle(null);
  };

  const abrirDialogoIncidencia = () => {
    setErrorForm(null);
    setEvidenciaArchivo('');
    setEvidenciaDescripcion('');
    setForm({
      ...FORM_VACIO,
      numero_ticket: detalle?.numero_ticket || '',
    });
    setDialogoIncidencia(true);
  };

  const manejarFirma = async (archivo: File | undefined) => {
    if (!archivo) return;
    try {
      const base64 = await leerArchivoComoBase64(archivo);
      setForm((f) => ({ ...f, firma: base64 }));
    } catch (err) {
      setErrorForm(extraerError(err));
    }
  };

  const guardarIncidencia = async () => {
    if (!detalle) return;
    setGuardandoIncidencia(true);
    setErrorForm(null);
    try {
      const params: Record<string, string | boolean> = {
        numero_ticket: form.numero_ticket.trim() || detalle.numero_ticket,
        tipo_error: form.tipo_error,
        descripcion: form.descripcion.trim(),
        prioridad: form.prioridad,
        es_bloqueante: form.es_bloqueante,
        motor_bd: form.motor_bd,
      };
      if (form.codigo.trim()) params.codigo = form.codigo.trim();
      if (form.version.trim()) params.version = form.version.trim();
      if (form.base_datos.trim()) params.base_datos = form.base_datos.trim();
      if (form.firma) params.firma_analista = form.firma;

      const { data: incidencia } = await apiClient.post<Incidencia>(
        `/trabajos/${detalle.trabajo_id}/evaluaciones/${detalle.id}/incidencias`,
        null,
        { params },
      );

      if (evidenciaArchivo) {
        await apiClient.post(
          `/trabajos/${detalle.trabajo_id}/evaluaciones/${detalle.id}/incidencias/${incidencia.id}/evidencias`,
          null,
          { params: { archivo: evidenciaArchivo, descripcion: evidenciaDescripcion.trim() } },
        );
      }

      await cargarDetalle(detalle.trabajo_id, detalle.id);
      setDialogoIncidencia(false);
    } catch (err) {
      setErrorForm(extraerError(err));
    } finally {
      setGuardandoIncidencia(false);
    }
  };

  const descargarFormatoIncidencia = async (incidenciaId: string) => {
    if (pdfGenerando) return;
    setPdfGenerando(incidenciaId);
    setErrorPdf(null);
    try {
      await descargarPDF(`/documentos/incidencia/${incidenciaId}`, `incidencia-${incidenciaId}.pdf`);
    } catch (err) {
      setErrorPdf(extraerError(err));
    } finally {
      setPdfGenerando(null);
    }
  };

  const irACasosPrueba = () => {
    if (!detalle) return;
    router.push(`/casos-prueba?trabajoId=${detalle.trabajo_id}&evaluacionId=${detalle.id}`);
  };

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" fontWeight="bold">Incidencias y Evaluaciones</Typography>
        <Typography variant="body2" color="text.secondary">
          Evaluaciones asignadas al Analista de Calidad. Abra una evaluación para registrar
          incidencias/hallazgos, evidencias y descargar el Formato de Incidencia (PDF).
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => void cargarTrabajos()}>Reintentar</Button>}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Chip
          size="small"
          label={conEmparejadas ? `Mostrando evaluaciones de ${analistaActual}` : 'Mostrando todas las evaluaciones'}
          variant="outlined"
        />
      </Box>

      <Grid container spacing={2}>
        {evaluacionesVisibles.length === 0 && !error && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No hay evaluaciones asignadas. El Coordinador debe registrar un trabajo y asignarlo a un analista.
              </Typography>
            </Paper>
          </Grid>
        )}
        {evaluacionesVisibles.map((ev) => (
          <Grid item xs={12} md={6} lg={4} key={ev.id}>
            <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary">{ev.numero_ticket}</Typography>
                <Chip size="small" label={ev.estado} sx={{ bgcolor: ESTADO_COLOR[ev.estado] || '#64748b', color: '#fff', fontWeight: 'bold' }} />
              </Box>
              <Typography variant="body2" fontWeight="bold">{ev.proyecto}</Typography>
              <Typography variant="caption" color="text.secondary">{ev.tipo_atencion} · Prioridad {ev.prioridad}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {ev.instrucciones || 'Sin instrucciones.'}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip size="small" label={`Asignación: ${ev.fecha_asignacion || '—'}`} variant="outlined" />
                <Chip size="small" label={`Entrega: ${ev.fecha_programada_entrega || '—'}`} variant="outlined" />
                {ev.vencido && <Chip size="small" label="Vencido" color="error" />}
                {ev.proximo_a_vencer && <Chip size="small" label="Próximo a vencer" color="warning" />}
              </Box>
              <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={() => void abrirEvaluacion(ev)} sx={{ mt: 1.5 }} fullWidth>
                Abrir evaluación
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={Boolean(detalle)} onClose={cerrarEvaluacion} maxWidth="md" fullWidth>
        <DialogTitle>
          Evaluación · {detalle?.numero_ticket}
        </DialogTitle>
        <DialogContent dividers>
          {cargandoDetalle && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
          {errorDetalle && <Alert severity="error">{errorDetalle}</Alert>}
          {errorPdf && <Alert severity="warning" sx={{ mb: 2 }}>{errorPdf}</Alert>}
          {detalle && !cargandoDetalle && (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">Contexto de la evaluación (asignada por el Coordinador)</Typography>
                  <Button size="small" variant="outlined" startIcon={<ScienceIcon />} onClick={irACasosPrueba}>
                    Casos de Prueba (RA-105)
                  </Button>
                </Box>
                <Grid container spacing={1}>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Ticket/GLPI</Typography><Typography variant="body2" fontWeight="bold">{detalle.numero_ticket}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Proyecto</Typography><Typography variant="body2" fontWeight="bold">{detalle.proyecto}</Typography></Grid>
                  <Grid item xs={4}><Typography variant="caption" color="text.secondary">Tipo</Typography><Typography variant="body2" fontWeight="bold">{detalle.tipo_atencion}</Typography></Grid>
                  <Grid item xs={4}><Typography variant="caption" color="text.secondary">Prioridad</Typography><Typography variant="body2" fontWeight="bold">{detalle.prioridad}</Typography></Grid>
                  <Grid item xs={4}><Typography variant="caption" color="text.secondary">Analista</Typography><Typography variant="body2" fontWeight="bold">{detalle.analista || '—'}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Fecha asignación</Typography><Typography variant="body2">{detalle.fecha_asignacion || '—'}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Fecha programada entrega</Typography><Typography variant="body2">{detalle.fecha_programada_entrega || '—'}</Typography></Grid>
                  <Grid item xs={12}><Typography variant="caption" color="text.secondary">Instrucciones</Typography><Typography variant="body2">{detalle.instrucciones || '—'}</Typography></Grid>
                  {detalle.documentacion && (
                    <Grid item xs={12}><Typography variant="caption" color="text.secondary">Documentación</Typography><Typography variant="body2">{detalle.documentacion}</Typography></Grid>
                  )}
                </Grid>
              </Paper>

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BugReportIcon /> Incidencias / Hallazgos ({detalle.incidencias.length})
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={abrirDialogoIncidencia}>
                  Registrar Incidencia
                </Button>
              </Box>

              {detalle.incidencias.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Aún no hay incidencias registradas para esta evaluación.
                </Typography>
              )}

              {detalle.incidencias.map((inc) => (
                <Paper key={inc.id} variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Typography fontWeight="bold" color="primary">
                      Incidencia {inc.correlativo}{inc.codigo ? ` · ${inc.codigo}` : ''}
                    </Typography>
                    <Tooltip title="Descargar Formato de Incidencia (PDF)">
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={pdfGenerando === inc.id ? <CircularProgress size={16} /> : <PictureAsPdfIcon />}
                        onClick={() => void descargarFormatoIncidencia(inc.id)}
                        disabled={Boolean(pdfGenerando)}
                      >
                        PDF
                      </Button>
                    </Tooltip>
                  </Box>
                  <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Chip size="small" label={inc.tipo_error} color="secondary" variant="outlined" />
                    <Chip
                      size="small"
                      label={`Prioridad ${inc.prioridad}`}
                      color={inc.prioridad === 'Alto' ? 'error' : inc.prioridad === 'Medio' ? 'warning' : 'default'}
                    />
                    {inc.es_bloqueante && <Chip size="small" label="Bloqueante" color="error" />}
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
                      <Typography variant="body2">{ev.descripcion}{ev.archivo ? ` · ${ev.archivo}` : ''}</Typography>
                    </Box>
                  ))}
                  {inc.evidencias.length === 0 && <Typography variant="caption" color="text.secondary">Sin evidencias.</Typography>}
                  {inc.firma_analista && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">Firma del analista:</Typography>
                      <Box component="img" src={inc.firma_analista} alt="Firma del analista" sx={{ maxHeight: 48, display: 'block', mt: 0.5 }} />
                    </Box>
                  )}
                </Paper>
              ))}

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScienceIcon /> Casos de Prueba (RA-105) ({detalle.casos_prueba.length})
                </Typography>
                <Button variant="outlined" startIcon={<ScienceIcon />} onClick={irACasosPrueba}>
                  Gestionar casos de prueba
                </Button>
              </Box>
              {detalle.casos_prueba.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Aún no hay casos de prueba para esta evaluación.
                </Typography>
              )}
              {detalle.casos_prueba.map((c) => (
                <Paper key={c.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Typography variant="body2"><strong>Caso {c.numero_caso}:</strong> {c.campo_componente || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.tipo_pase || '—'} · Fecha: {c.fecha_prueba || '—'} · {c.casos.length} casos</Typography>
                    </Box>
                    <Tooltip title="Descargar Formato de Caso de Prueba (RA-105)">
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={pdfGenerando === c.id ? <CircularProgress size={16} /> : <PictureAsPdfIcon />}
                        onClick={() => {
                          setPdfGenerando(c.id);
                          setErrorPdf(null);
                          Promise.resolve(descargarPDF(`/documentos/caso-prueba/${c.id}`, `caso-prueba-${c.id}.pdf`))
                            .catch((err) => setErrorPdf(extraerError(err)))
                            .finally(() => setPdfGenerando(null));
                        }}
                        disabled={Boolean(pdfGenerando)}
                      >
                        PDF
                      </Button>
                    </Tooltip>
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarEvaluacion}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogoIncidencia} onClose={() => setDialogoIncidencia(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Incidencia (hallazgo en la evaluación)</DialogTitle>
        <DialogContent>
          {errorForm && <Alert severity="error" sx={{ mb: 2 }}>{errorForm}</Alert>}
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth disabled label="Nº de Incidencia (auto)" value={(detalle?.incidencias.length ?? 0) + 1} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Nº de Ticket *" value={form.numero_ticket} onChange={(e) => setForm({ ...form, numero_ticket: e.target.value })} />
              </Grid>
              <Grid item xs={6}><TextField fullWidth label="Código (opcional)" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Versión" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} /></Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Tipo de error *" value={form.tipo_error} onChange={(e) => setForm({ ...form, tipo_error: e.target.value })}>
                  {TIPOS_ERROR.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Prioridad *" value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })}>
                  {PRIORIDADES_INCIDENCIA.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth required label="Descripción detallada *" multiline rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </Grid>
              <Grid item xs={6}><TextField fullWidth label="Base de datos" value={form.base_datos} onChange={(e) => setForm({ ...form, base_datos: e.target.value })} /></Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Motor de BD" value={form.motor_bd} onChange={(e) => setForm({ ...form, motor_bd: e.target.value })}>
                  {MOTORES_BD.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={form.es_bloqueante} onChange={(e) => setForm({ ...form, es_bloqueante: e.target.checked })} />}
                  label="¿Es bloqueante?"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Evidencia (opcional)</Typography>
                <Stack spacing={1}>
                  <Box>
                    <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} size="small">
                      Seleccionar archivo
                      <input
                        type="file"
                        hidden
                        onChange={(e) => {
                          const archivo = e.target.files?.[0];
                          setEvidenciaArchivo(archivo?.name || '');
                        }}
                      />
                    </Button>
                    {evidenciaArchivo && <Typography variant="caption" sx={{ ml: 1 }}>{evidenciaArchivo}</Typography>}
                  </Box>
                  <TextField size="small" fullWidth label="Descripción de la evidencia" value={evidenciaDescripcion} onChange={(e) => setEvidenciaDescripcion(e.target.value)} />
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Firma del analista (imagen)</Typography>
                <Stack spacing={1}>
                  <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} size="small">
                    Subir imagen de firma
                    <input type="file" accept="image/*" hidden onChange={(e) => void manejarFirma(e.target.files?.[0])} />
                  </Button>
                  {form.firma && <Box component="img" src={form.firma} alt="Firma del analista" sx={{ maxHeight: 64, maxWidth: 200, alignSelf: 'flex-start' }} />}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoIncidencia(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!form.descripcion.trim() || guardandoIncidencia}
            startIcon={guardandoIncidencia ? <CircularProgress size={18} color="inherit" /> : undefined}
            onClick={() => void guardarIncidencia()}
          >
            Registrar Incidencia
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}