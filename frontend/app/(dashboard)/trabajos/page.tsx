'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Paper, Typography, Grid, Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, CircularProgress, Autocomplete,
  Stack, IconButton, Tooltip, InputLabel, List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import LockIcon from '@mui/icons-material/Lock';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupsIcon from '@mui/icons-material/Groups';

import apiClient from '@/lib/api/client';
import { extraerError, leerArchivoComoBase64 } from '@/lib/api/archivos';
import PageHeader from '@/components/common/PageHeader';
import { PJ_COLORS } from '@/lib/theme';
import {
  TIPOS_ATENCION, PRIORIDADES_TRABAJO, ESTADOS_TRABAJO, ESTADO_COLOR,
  estadoDeTrabajo, type Trabajo, type Evaluacion,
} from '@/lib/api/tipos';

const ANALISTAS_SUGERIDOS = ['Ana Gómez', 'Juan Pérez', 'Carlos Ruiz', 'María López', 'Luis Torres'];

interface FormTrabajo {
  numero_ticket: string;
  proyecto: string;
  tipo_atencion: string;
  prioridad: string;
  fecha_recepcion: string;
  instrucciones: string;
  documentacion: string;
}

interface AdjuntoUI {
  file: File;
  name: string;
  mime: string;
  dataUri: string;
  size: number;
}

const hoyISO = () => new Date().toISOString().slice(0, 10);

const FORM_VACIO: FormTrabajo = {
  numero_ticket: '',
  proyecto: '',
  tipo_atencion: 'Requerimiento',
  prioridad: 'Media',
  fecha_recepcion: hoyISO(),
  instrucciones: '',
  documentacion: '',
};

const EXTENSIONES_PERMITIDAS = [
  'pdf', 'xls', 'xlsx', 'csv', 'doc', 'docx', 'txt', 'rtf',
  'js', 'ts', 'py', 'sql', 'sh', 'ps1', 'java', 'c', 'cpp', 'cs', 'json', 'xml',
];
const TAMANO_MAXIMO_MB = 10;

const inputRefStyle = { display: 'none' };

function IconoAdjunto(mime: string) {
  if (/pdf/i.test(mime)) return <PictureAsPdfIcon fontSize="small" />;
  if (/image\//i.test(mime)) return <ImageIcon fontSize="small" />;
  return <DescriptionIcon fontSize="small" />;
}

export default function TrabajosPage() {
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogoRegistro, setDialogoRegistro] = useState(false);
  const [form, setForm] = useState<FormTrabajo>(FORM_VACIO);
  const [guardandoTrabajo, setGuardandoTrabajo] = useState(false);
  const [errorTrabajo, setErrorTrabajo] = useState<string | null>(null);
  const [adjuntosTemp, setAdjuntosTemp] = useState<AdjuntoUI[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [dialogoAsignacion, setDialogoAsignacion] = useState<Trabajo | null>(null);
  const [dialogoAsignacionGrupo, setDialogoAsignacionGrupo] = useState(false);
  const [analistaSel, setAnalistaSel] = useState('');
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [guardandoAsignacion, setGuardandoAsignacion] = useState(false);
  const [errorAsignacion, setErrorAsignacion] = useState<string | null>(null);

  // Asignación de pase de versión (grupo)
  const [encargadoSel, setEncargadoSel] = useState('');
  const [grupoAnalistas, setGrupoAnalistas] = useState<string[]>([]);
  const [ticketInput, setTicketInput] = useState('');
  const [ticketsSeleccionados, setTicketsSeleccionados] = useState<Set<string>>(new Set());
  const [fechaAsignacionGrupo, setFechaAsignacionGrupo] = useState(hoyISO());
  const [fechaEntregaGrupo, setFechaEntregaGrupo] = useState('');
  const [obsGrupo, setObsGrupo] = useState('');

  const [proyectos, setProyectos] = useState<string[]>([]);
  const [analistas, setAnalistas] = useState<string[]>([]);
  const [accionPorEvaluacion, setAccionPorEvaluacion] = useState<Record<string, string>>({});

  const [search, setSearch] = useState('');
  const [fEstado, setFEstado] = useState('todos');
  const [fTipo, setFTipo] = useState('todos');

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

  const cargarProyectos = useCallback(async () => {
    try {
      const { data } = await apiClient.get<{ items: { nombre: string }[] }>('/configuracion/proyectos');
      setProyectos((data.items || []).filter((p) => p.nombre).map((p) => p.nombre));
    } catch { /* sin catálogo aún */ }
  }, []);

  const cargarAnalistas = useCallback(async () => {
    try {
      const { data } = await apiClient.get<{ items: { nombre: string }[] }>('/usuarios/analistas');
      const nombres = (data.items || []).map((u) => u.nombre).filter(Boolean);
      setAnalistas(nombres);
    } catch { /* se deja la lista sugerida */ }
  }, []);

  const opcionesAnalistas = useMemo(
    () => Array.from(new Set([...ANALISTAS_SUGERIDOS, ...analistas])),
    [analistas],
  );

  useEffect(() => {
    void cargarTrabajos();
    void cargarProyectos();
    void cargarAnalistas();
  }, [cargarTrabajos, cargarProyectos, cargarAnalistas]);

  const kpis = useMemo(() => {
    const evaluaciones: Evaluacion[] = trabajos.flatMap((t) => t.evaluaciones);
    return {
      total: trabajos.length,
      pendientes: trabajos.filter((t) => estadoDeTrabajo(t) === 'Pendiente de asignación').length,
      proximos: evaluaciones.filter((e) => e.proximo_a_vencer).length,
      vencidos: evaluaciones.filter((e) => e.vencido).length,
    };
  }, [trabajos]);

  const trabajosSinEvaluacion = useMemo(
    () => trabajos.filter((t) => t.evaluaciones.length === 0),
    [trabajos],
  );

  const filtrados = trabajos.filter((t) => {
    const estado = estadoDeTrabajo(t);
    if (search && !`${t.numero_ticket} ${t.proyecto} ${t.instrucciones || ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (fEstado !== 'todos' && estado !== fEstado) return false;
    if (fTipo !== 'todos' && t.tipo_atencion !== fTipo) return false;
    return true;
  });

  const agregarArchivos = async (files: FileList | null) => {
    if (!files) return;
    const nuevos: AdjuntoUI[] = [];
    for (const f of Array.from(files)) {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if (!EXTENSIONES_PERMITIDAS.includes(ext)) {
        setErrorTrabajo(`Tipo de archivo no permitido: ${f.name}. Formatos admitidos: PDF, Excel, Word, CSV, texto y scripts (js, py, sql, sh, ps1, java...).`);
        continue;
      }
      if (f.size / (1024 * 1024) > TAMANO_MAXIMO_MB) {
        setErrorTrabajo(`El archivo "${f.name}" supera el límite de ${TAMANO_MAXIMO_MB} MB.`);
        continue;
      }
      const dataUri = await leerArchivoComoBase64(f);
      nuevos.push({ file: f, name: f.name, mime: f.type, dataUri, size: f.size });
    }
    setAdjuntosTemp((prev) => [...prev, ...nuevos]);
  };

  const registrarTrabajo = async () => {
    setGuardandoTrabajo(true);
    setErrorTrabajo(null);
    try {
      const params: Record<string, string> = {
        numero_ticket: form.numero_ticket.trim(),
        proyecto: form.proyecto.trim(),
        tipo_atencion: form.tipo_atencion,
        prioridad: form.prioridad,
        instrucciones: form.instrucciones.trim(),
        fecha_recepcion: form.fecha_recepcion,
      };
      if (form.documentacion.trim()) params.documentacion = form.documentacion.trim();

      const { data } = await apiClient.post<{ id: string }>('/trabajos/', params);
      const trabajoId = data.id;

      // Subir adjuntos después de crear el trabajo
      for (const adj of adjuntosTemp) {
        await apiClient.post(`/trabajos/${trabajoId}/adjuntos`, {
          nombre: adj.name,
          archivo: adj.dataUri,
          tipo_mime: adj.mime,
        });
      }

      await cargarTrabajos();
      setDialogoRegistro(false);
      setForm(FORM_VACIO);
      setAdjuntosTemp([]);
    } catch (err) {
      setErrorTrabajo(extraerError(err));
    } finally {
      setGuardandoTrabajo(false);
    }
  };

  const asignarAnalista = async () => {
    if (!dialogoAsignacion || !analistaSel.trim() || !fechaProgramada) return;
    setGuardandoAsignacion(true);
    setErrorAsignacion(null);
    try {
      await apiClient.post(
        `/trabajos/${dialogoAsignacion.id}/evaluaciones`,
        {
          analista: analistaSel.trim(),
          fecha_asignacion: hoyISO(),
          fecha_programada_entrega: fechaProgramada,
        },
      );
      await cargarTrabajos();
      setDialogoAsignacion(null);
      setAnalistaSel('');
      setFechaProgramada('');
    } catch (err) {
      setErrorAsignacion(extraerError(err));
    } finally {
      setGuardandoAsignacion(false);
    }
  };

  const crearAsignacionGrupo = async () => {
    if (!encargadoSel.trim() || ticketsSeleccionados.size === 0) return;
    setGuardandoAsignacion(true);
    setErrorAsignacion(null);
    try {
      const ids = Array.from(ticketsSeleccionados).join(',');
      await apiClient.post('/trabajos/asignaciones', {
        analista_encargado: encargadoSel.trim(),
        fecha_asignacion: fechaAsignacionGrupo,
        fecha_programada_entrega: fechaEntregaGrupo || undefined,
        trabajos_ids: ids,
        analistas_grupo: grupoAnalistas.join(','),
        observaciones: obsGrupo || undefined,
      });
      await cargarTrabajos();
      setDialogoAsignacionGrupo(false);
      setEncargadoSel(''); setGrupoAnalistas([]); setTicketsSeleccionados(new Set());
      setTicketInput(''); setFechaAsignacionGrupo(hoyISO()); setFechaEntregaGrupo(''); setObsGrupo('');
    } catch (err) {
      setErrorAsignacion(extraerError(err));
    } finally {
      setGuardandoAsignacion(false);
    }
  };

  const toggleTicket = (id: string) => {
    setTicketsSeleccionados((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const entregarEvaluacion = async (t: Trabajo, ev: Evaluacion) => {
    if (accionPorEvaluacion[ev.id]) return;
    setAccionPorEvaluacion((p) => ({ ...p, [ev.id]: 'entrega' }));
    try {
      await apiClient.post(
        `/trabajos/${t.id}/evaluaciones/${ev.id}/entregar`,
        { fecha_entrega: hoyISO() },
      );
      await cargarTrabajos();
    } catch (err) {
      setError(extraerError(err));
    } finally {
      setAccionPorEvaluacion((p) => {
        const copia = { ...p };
        delete copia[ev.id];
        return copia;
      });
    }
  };

  const cerrarEvaluacion = async (t: Trabajo, ev: Evaluacion) => {
    if (accionPorEvaluacion[ev.id]) return;
    setAccionPorEvaluacion((p) => ({ ...p, [ev.id]: 'cierre' }));
    try {
      await apiClient.post(
        `/trabajos/${t.id}/evaluaciones/${ev.id}/cambiar-estado`,
        { estado: 'Cerrado' },
      );
      await cargarTrabajos();
    } catch (err) {
      setError(extraerError(err));
    } finally {
      setAccionPorEvaluacion((p) => {
        const copia = { ...p };
        delete copia[ev.id];
        return copia;
      });
    }
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
      <PageHeader
        titulo="Gestión de Trabajos"
        descripcion="Registro de pases, requerimientos y tickets · Coordinador de Calidad"
        breadcrumb={[{ label: 'Principal' }, { label: 'Trabajos' }]}
        actions={[
          <Button key="grupo" variant="outlined" color="secondary" startIcon={<GroupsIcon />} onClick={() => {
            setDialogoAsignacionGrupo(true); setEncargadoSel(''); setGrupoAnalistas([]);
            setTicketsSeleccionados(new Set()); setTicketInput(''); setErrorAsignacion(null);
          }}>
            Asignación de Pase de Versión
          </Button>,
          <Button key="nuevo" variant="contained" startIcon={<AddIcon />} onClick={() => { setForm(FORM_VACIO); setErrorTrabajo(null); setAdjuntosTemp([]); setDialogoRegistro(true); }}>
            Registrar Trabajo
          </Button>,
        ]}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => void cargarTrabajos()}>Reintentar</Button>}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, borderLeft: `4px solid ${PJ_COLORS.primary}` }}>
            <Typography variant="subtitle2" color="text.secondary">Total trabajos</Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ color: PJ_COLORS.primaryDark }}>{kpis.total}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, borderLeft: '4px solid #9e9e9e' }}>
            <Typography variant="subtitle2" color="text.secondary">Pendientes asignación</Typography>
            <Typography variant="h4" fontWeight="bold" color="#9e9e9e">{kpis.pendientes}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, borderLeft: '4px solid #f59e0b' }}>
            <Typography variant="subtitle2" color="text.secondary">Próximos a vencer</Typography>
            <Typography variant="h4" fontWeight="bold" color="#f59e0b">{kpis.proximos}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, borderLeft: '4px solid #ef4444' }}>
            <Typography variant="subtitle2" color="text.secondary">Vencidos</Typography>
            <Typography variant="h4" fontWeight="bold" color="#ef4444">{kpis.vencidos}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <TextField size="small" label="Buscar ticket, proyecto..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 220 }} />
          <TextField select size="small" label="Estado" value={fEstado} onChange={(e) => setFEstado(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="todos">Todos</MenuItem>
            {ESTADOS_TRABAJO.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Tipo" value={fTipo} onChange={(e) => setFTipo(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="todos">Todos</MenuItem>
            {TIPOS_ATENCION.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Box>

        <Grid container spacing={2}>
          {filtrados.length === 0 && !error && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                Sin trabajos para los filtros seleccionados.
              </Typography>
            </Grid>
          )}
          {filtrados.map((t) => {
            const estado = estadoDeTrabajo(t);
            const ev = t.evaluaciones[0];
            return (
              <Grid item xs={12} md={6} lg={4} key={t.id}>
                <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary">{t.numero_ticket}</Typography>
                    <Chip size="small" label={estado} sx={{ bgcolor: ESTADO_COLOR[estado] || '#64748b', color: '#fff', fontWeight: 'bold' }} />
                  </Box>
                  <Typography variant="body2" fontWeight="bold">{t.proyecto}</Typography>
                  <Typography variant="caption" color="text.secondary">{t.tipo_atencion} · Prioridad {t.prioridad}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {t.instrucciones || 'Sin instrucciones.'}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Chip size="small" label={`Recibido: ${t.fecha_recepcion || '—'}`} variant="outlined" />
                    <Chip size="small" label={`${t.evaluaciones.length} evaluación(es)`} variant="outlined" />
                  </Box>

                  {/* Adjuntos de documentación */}
                  {(t.adjuntos && t.adjuntos.length > 0) && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Documentación adjunta</Typography>
                      {t.adjuntos.map((a) => (
                        <Stack key={a.id} direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                          {IconoAdjunto(a.tipo_mime || '')}
                          <Tooltip title={a.nombre}>
                            <Typography variant="caption" noWrap sx={{ flex: 1 }}>{a.nombre}</Typography>
                          </Tooltip>
                          {a.archivo && (
                            <IconButton size="small" component="a" href={a.archivo} target="_blank" rel="noopener noreferrer">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>
                      ))}
                    </Box>
                  )}

                  {ev && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Chip size="small" icon={<AssignmentIndIcon />} label={ev.analista || 'Sin analista'} color={ev.analista ? 'default' : 'error'} variant={ev.analista ? 'outlined' : 'filled'} />
                      {ev.fecha_programada_entrega && <Chip size="small" label={`Entrega: ${ev.fecha_programada_entrega}`} variant="outlined" />}
                      {ev.vencido && <Chip size="small" label="Vencido" color="error" />}
                      {ev.proximo_a_vencer && <Chip size="small" label="Próximo" color="warning" />}
                    </Box>
                  )}
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    {!ev && (
                      <Button size="small" variant="outlined" startIcon={<AssignmentIndIcon />}
                        onClick={() => { setDialogoAsignacion(t); setAnalistaSel(''); setFechaProgramada(''); setErrorAsignacion(null); }}>
                        Asignar
                      </Button>
                    )}
                    {ev && estado !== 'Cerrado' && estado !== 'Entregado por el Analista' && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={accionPorEvaluacion[ev.id] === 'entrega' ? <CircularProgress size={16} /> : <AssignmentTurnedInIcon />}
                        disabled={Boolean(accionPorEvaluacion[ev.id])}
                        onClick={() => void entregarEvaluacion(t, ev)}
                      >
                        Registrar entrega
                      </Button>
                    )}
                    {ev && estado === 'Entregado por el Analista' && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        startIcon={accionPorEvaluacion[ev.id] === 'cierre' ? <CircularProgress size={16} /> : <LockIcon />}
                        disabled={Boolean(accionPorEvaluacion[ev.id])}
                        onClick={() => void cerrarEvaluacion(t, ev)}
                      >
                        Cerrar
                      </Button>
                    )}
                    <Tooltip title={ev ? `Analista: ${ev.analista || '—'}` : 'Sin asignar'}>
                      <Chip size="small" label={ev ? (ev.analista || 'Sin asignar') : 'Sin asignar'} variant="outlined" />
                    </Tooltip>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Diálogo: Registrar Trabajo (Coordinador) */}
      <Dialog open={dialogoRegistro} onClose={() => setDialogoRegistro(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Trabajo (Coordinador)</DialogTitle>
        <DialogContent>
          {errorTrabajo && <Alert severity="error" sx={{ mb: 2 }}>{errorTrabajo}</Alert>}
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField fullWidth label="Ticket / GLPI / ID *" value={form.numero_ticket} onChange={(e) => setForm({ ...form, numero_ticket: e.target.value })} /></Grid>
              <Grid item xs={6}>
                <Autocomplete
                  freeSolo
                  options={proyectos}
                  inputValue={form.proyecto}
                  onInputChange={(_, valor) => setForm({ ...form, proyecto: valor })}
                  renderInput={(params) => <TextField {...params} fullWidth label="Proyecto * (editable / desplegable)" />}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Tipo de atención *" value={form.tipo_atencion} onChange={(e) => setForm({ ...form, tipo_atencion: e.target.value })}>
                  {TIPOS_ATENCION.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Prioridad" value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })}>
                  {PRIORIDADES_TRABAJO.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}><TextField fullWidth label="Fecha recepción" type="date" value={form.fecha_recepcion} onChange={(e) => setForm({ ...form, fecha_recepcion: e.target.value })} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Instrucciones / descripción *" multiline rows={3} value={form.instrucciones} onChange={(e) => setForm({ ...form, instrucciones: e.target.value })} /></Grid>
            </Grid>

            {/* Documentación adjunta */}
            <Box sx={{ mt: 2 }}>
              <InputLabel>Documentación (adjuntar archivos de su PC)</InputLabel>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.xls,.xlsx,.csv,.doc,.docx,.txt,.rtf,.js,.ts,.py,.sql,.sh,.ps1,.java,.c,.cpp,.cs,.json,.xml,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv"
                style={inputRefStyle}
                onChange={(e) => { void agregarArchivos(e.target.files); e.target.value = ''; }}
              />
              <Button size="small" variant="outlined" startIcon={<AttachFileIcon />}
                onClick={() => fileInputRef.current?.click()}>
                Adjuntar documentos
              </Button>
              {adjuntosTemp.length > 0 && (
                <List dense sx={{ mt: 1 }}>
                  {adjuntosTemp.map((adj, idx) => (
                    <ListItem key={idx} dense disableGutters secondaryAction={
                      <IconButton size="small" onClick={() => setAdjuntosTemp((prev) => prev.filter((_, i) => i !== idx))}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }>
                      <ListItemIcon>{IconoAdjunto(adj.mime)}</ListItemIcon>
                      <Stack sx={{ flex: 1, minWidth: 0 }}>
                        <ListItemText primary={adj.name} sx={{ m: 0 }} />
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary">{(adj.size / 1024).toFixed(0)} KB</Typography>
                          <IconButton size="small" component="a" href={adj.dataUri} target="_blank" rel="noopener noreferrer">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoRegistro(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!form.numero_ticket.trim() || !form.proyecto.trim() || !form.instrucciones.trim() || guardandoTrabajo}
            startIcon={guardandoTrabajo ? <CircularProgress size={18} color="inherit" /> : undefined}
            onClick={() => void registrarTrabajo()}
          >
            Registrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo: asignar analista (un solo ticket) */}
      <Dialog open={Boolean(dialogoAsignacion)} onClose={() => setDialogoAsignacion(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Asignar Analista de Calidad</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Trabajo: {dialogoAsignacion?.numero_ticket} ({dialogoAsignacion?.proyecto})
          </Typography>
          {errorAsignacion && <Alert severity="error" sx={{ mt: 1, mb: 1 }}>{errorAsignacion}</Alert>}
          <Autocomplete
            freeSolo
            options={opcionesAnalistas}
            inputValue={analistaSel}
            onInputChange={(_, valor) => setAnalistaSel(valor)}
            renderInput={(params) => <TextField {...params} label="Analista de Calidad *" sx={{ mt: 1 }} />}
          />
          <TextField fullWidth label="Fecha programada de entrega *" type="date" value={fechaProgramada} onChange={(e) => setFechaProgramada(e.target.value)} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoAsignacion(null)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!analistaSel.trim() || !fechaProgramada || guardandoAsignacion}
            startIcon={guardandoAsignacion ? <CircularProgress size={18} color="inherit" /> : undefined}
            onClick={() => void asignarAnalista()}
          >
            Asignar y crear evaluación
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo: Asignación de Pase de Versión (multi-ticket + grupo) */}
      <Dialog open={dialogoAsignacionGrupo} onClose={() => setDialogoAsignacionGrupo(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Asignación de Pase de Versión</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Designe al analista encargado, seleccione uno o varios tickets y el grupo de analistas que los atenderá.
          </Typography>
          {errorAsignacion && <Alert severity="error" sx={{ mt: 1, mb: 1 }}>{errorAsignacion}</Alert>}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                freeSolo
                options={opcionesAnalistas}
                inputValue={encargadoSel}
                onInputChange={(_, valor) => setEncargadoSel(valor)}
                renderInput={(params) => <TextField {...params} fullWidth label="Analista encargado *" />}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Fecha de asignación" type="date" value={fechaAsignacionGrupo}
                onChange={(e) => setFechaAsignacionGrupo(e.target.value)} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Fecha programada de entrega" type="date" value={fechaEntregaGrupo}
                onChange={(e) => setFechaEntregaGrupo(e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={opcionesAnalistas}
                value={grupoAnalistas}
                onChange={(_, valor) => setGrupoAnalistas(valor)}
                renderInput={(params) => <TextField {...params} fullWidth label="Grupo de analistas (los que atenderán los tickets)" />}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Tickets/trabajos a asignar ({ticketsSeleccionados.size} seleccionado(s))
            </Typography>
            <Autocomplete
              freeSolo
              options={trabajosSinEvaluacion.map((t) => `${t.numero_ticket} · ${t.proyecto}`)}
              inputValue={ticketInput}
              onInputChange={(_, valor) => setTicketInput(valor)}
              onChange={(_, valor) => {
                const t = trabajosSinEvaluacion.find((x) => `${x.numero_ticket} · ${x.proyecto}` === valor);
                if (t) toggleTicket(t.id);
                setTicketInput('');
              }}
              renderInput={(params) => <TextField {...params} size="small" fullWidth label="Buscar y seleccionar ticket..." />}
            />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              {trabajosSinEvaluacion
                .filter((t) => ticketsSeleccionados.has(t.id))
                .map((t) => (
                  <Chip key={t.id} label={`${t.numero_ticket} · ${t.proyecto}`} color="secondary" onDelete={() => toggleTicket(t.id)} />
                ))}
            </Stack>
            {ticketsSeleccionados.size === 0 && (
              <Button size="small" sx={{ mt: 1 }}
                onClick={() => setTicketsSeleccionados(new Set(trabajosSinEvaluacion.map((t) => t.id)))}>
                Seleccionar todos los pendientes
              </Button>
            )}
          </Box>

          <TextField fullWidth label="Observaciones" multiline rows={2} value={obsGrupo}
            onChange={(e) => setObsGrupo(e.target.value)} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoAsignacionGrupo(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="secondary"
            disabled={!encargadoSel.trim() || ticketsSeleccionados.size === 0 || guardandoAsignacion}
            startIcon={guardandoAsignacion ? <CircularProgress size={18} color="inherit" /> : undefined}
            onClick={() => void crearAsignacionGrupo()}
          >
            Asignar pase de versión
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
