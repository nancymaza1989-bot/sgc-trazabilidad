'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Typography, Grid, Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, CircularProgress, Autocomplete, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import LockIcon from '@mui/icons-material/Lock';

import apiClient from '@/lib/api/client';
import { extraerError } from '@/lib/api/archivos';
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

export default function TrabajosPage() {
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogoRegistro, setDialogoRegistro] = useState(false);
  const [form, setForm] = useState<FormTrabajo>(FORM_VACIO);
  const [guardandoTrabajo, setGuardandoTrabajo] = useState(false);
  const [errorTrabajo, setErrorTrabajo] = useState<string | null>(null);

  const [dialogoAsignacion, setDialogoAsignacion] = useState<Trabajo | null>(null);
  const [analistaSel, setAnalistaSel] = useState('');
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [guardandoAsignacion, setGuardandoAsignacion] = useState(false);
  const [errorAsignacion, setErrorAsignacion] = useState<string | null>(null);

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

  useEffect(() => {
    void cargarTrabajos();
  }, [cargarTrabajos]);

  const kpis = useMemo(() => {
    const evaluaciones: Evaluacion[] = trabajos.flatMap((t) => t.evaluaciones);
    return {
      total: trabajos.length,
      pendientes: trabajos.filter((t) => estadoDeTrabajo(t) === 'Pendiente de asignación').length,
      proximos: evaluaciones.filter((e) => e.proximo_a_vencer).length,
      vencidos: evaluaciones.filter((e) => e.vencido).length,
    };
  }, [trabajos]);

  const filtrados = trabajos.filter((t) => {
    const estado = estadoDeTrabajo(t);
    if (search && !`${t.numero_ticket} ${t.proyecto} ${t.instrucciones || ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (fEstado !== 'todos' && estado !== fEstado) return false;
    if (fTipo !== 'todos' && t.tipo_atencion !== fTipo) return false;
    return true;
  });

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

      await apiClient.post('/trabajos/', null, { params });
      await cargarTrabajos();
      setDialogoRegistro(false);
      setForm(FORM_VACIO);
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
        null,
        {
          params: {
            analista: analistaSel.trim(),
            fecha_asignacion: hoyISO(),
            fecha_programada_entrega: fechaProgramada,
          },
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

  const entregarEvaluacion = async (t: Trabajo, ev: Evaluacion) => {
    if (accionPorEvaluacion[ev.id]) return;
    setAccionPorEvaluacion((p) => ({ ...p, [ev.id]: 'entrega' }));
    try {
      await apiClient.post(
        `/trabajos/${t.id}/evaluaciones/${ev.id}/entregar`,
        null,
        { params: { fecha_entrega: hoyISO() } },
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
        null,
        { params: { estado: 'Cerrado' } },
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Gestión de Trabajos</Typography>
          <Typography variant="body2" color="text.secondary">
            Registro de pases, requerimientos y tickets · Coordinador de Calidad
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm(FORM_VACIO); setErrorTrabajo(null); setDialogoRegistro(true); }}>
          Registrar Trabajo
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => void cargarTrabajos()}>Reintentar</Button>}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, borderLeft: '4px solid #0d47a1' }}>
            <Typography variant="subtitle2" color="text.secondary">Total trabajos</Typography>
            <Typography variant="h4" fontWeight="bold">{kpis.total}</Typography>
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

      <Dialog open={dialogoRegistro} onClose={() => setDialogoRegistro(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Trabajo (Coordinador)</DialogTitle>
        <DialogContent>
          {errorTrabajo && <Alert severity="error" sx={{ mb: 2 }}>{errorTrabajo}</Alert>}
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField fullWidth label="Ticket / GLPI / ID *" value={form.numero_ticket} onChange={(e) => setForm({ ...form, numero_ticket: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Proyecto *" value={form.proyecto} onChange={(e) => setForm({ ...form, proyecto: e.target.value })} /></Grid>
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
              <Grid item xs={12}><TextField fullWidth label="Documentación (links o referencias)" multiline rows={2} value={form.documentacion} onChange={(e) => setForm({ ...form, documentacion: e.target.value })} /></Grid>
            </Grid>
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

      <Dialog open={Boolean(dialogoAsignacion)} onClose={() => setDialogoAsignacion(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Asignar Analista de Calidad</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Trabajo: {dialogoAsignacion?.numero_ticket} ({dialogoAsignacion?.proyecto})
          </Typography>
          {errorAsignacion && <Alert severity="error" sx={{ mt: 1, mb: 1 }}>{errorAsignacion}</Alert>}
          <Autocomplete
            freeSolo
            options={ANALISTAS_SUGERIDOS}
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
    </Box>
  );
}