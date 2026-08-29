'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Box, Paper, Typography, Grid, Chip, Button, TextField, MenuItem, Divider,
  Stack, Alert, CircularProgress, Tooltip, IconButton,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import ScienceIcon from '@mui/icons-material/Science';

import apiClient from '@/lib/api/client';
import { descargarPDF } from '@/lib/api/pdf';
import { leerArchivoComoBase64, extraerError } from '@/lib/api/archivos';
import PageHeader from '@/components/common/PageHeader';
import {
  TIPOS_PASE, RESULTADOS_PRUEBA, type Trabajo, type Evaluacion,
  type EvaluacionDetalle, type CasoPrueba, type CasoPruebaItem,
} from '@/lib/api/tipos';

interface EvidenciaTemporal {
  archivo: string;
  descripcion: string;
}

interface CasoDinamico {
  descripcion: string;
  evidencias: EvidenciaTemporal[];
}

interface FormRA105 {
  numero_ticket: string;
  numero_caso: string;
  numero_acta_pase: string;
  tipo_pase: string;
  fecha_prueba: string;
  campo_componente: string;
  resultado_prueba: string;
  observaciones: string;
  firma_analista: string;
  firma_supervisor: string;
}

const hoyISO = () => new Date().toISOString().slice(0, 10);

function tipoPaseInicial(tipoAtencion: string): string {
  if (tipoAtencion === 'Pase de versión') return 'Versión';
  if (tipoAtencion === 'Pase puntual') return 'Puntual';
  return 'Puntual';
}

function CasosPruebaContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const esAnalista = (session?.user?.role || '').toLowerCase() === 'analista';

  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [seleccion, setSeleccion] = useState<{ trabajoId: string; evaluacionId: string } | null>(null);
  const [detalle, setDetalle] = useState<EvaluacionDetalle | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);

  const [form, setForm] = useState<FormRA105>({
    numero_ticket: '', numero_caso: '1', numero_acta_pase: '', tipo_pase: 'Puntual',
    fecha_prueba: hoyISO(), campo_componente: '', resultado_prueba: 'Pendiente',
    observaciones: '', firma_analista: '', firma_supervisor: '',
  });
  const [casosDinamicos, setCasosDinamicos] = useState<CasoDinamico[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

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

  const cargarDetalle = useCallback(async (trabajoId: string, evaluacionId: string) => {
    setCargandoDetalle(true);
    setErrorDetalle(null);
    try {
      const { data } = await apiClient.get<EvaluacionDetalle>(
        `/trabajos/${trabajoId}/evaluaciones/${evaluacionId}`,
      );
      setDetalle(data);
      setForm({
        numero_ticket: data.numero_ticket,
        numero_caso: String(data.casos_prueba.length + 1),
        numero_acta_pase: '',
        tipo_pase: tipoPaseInicial(data.tipo_atencion),
        fecha_prueba: hoyISO(),
        campo_componente: '',
        resultado_prueba: 'Pendiente',
        observaciones: '',
        firma_analista: '',
        firma_supervisor: '',
      });
      setCasosDinamicos([]);
      setMensajeExito(null);
      setErrorForm(null);
      setSeleccion({ trabajoId, evaluacionId });
    } catch (err) {
      setErrorDetalle(extraerError(err));
    } finally {
      setCargandoDetalle(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      await cargarTrabajos();
      const trabajoId = searchParams.get('trabajoId');
      const evaluacionId = searchParams.get('evaluacionId');
      if (trabajoId && evaluacionId) {
        await cargarDetalle(trabajoId, evaluacionId);
      }
    }
    void init();
  }, [cargarTrabajos, cargarDetalle, searchParams]);

  const evaluaciones: Evaluacion[] = useMemo(() => {
    const todas = trabajos.flatMap((t) => t.evaluaciones);
    // El Analista solo debe ver las evaluaciones que tienen un analista asignado
    return esAnalista ? todas.filter((e) => Boolean(e.analista && e.analista.trim())) : todas;
  }, [trabajos, esAnalista]);

  const seleccionarEvaluacion = (evaluacionId: string) => {
    const ev = evaluaciones.find((e) => e.id === evaluacionId);
    if (ev) void cargarDetalle(ev.trabajo_id, ev.id);
  };

  const agregarCasoDinamico = () => {
    setCasosDinamicos((prev) => [...prev, { descripcion: '', evidencias: [] }]);
  };

  const removerCasoDinamico = (indice: number) => {
    setCasosDinamicos((prev) => prev.filter((_, i) => i !== indice));
  };

  const actualizarDescripcionCaso = (indice: number, valor: string) => {
    setCasosDinamicos((prev) => prev.map((c, i) => (i === indice ? { ...c, descripcion: valor } : c)));
  };

  const agregarEvidenciaCaso = (indice: number) => {
    setCasosDinamicos((prev) => prev.map((c, i) =>
      i === indice ? { ...c, evidencias: [...c.evidencias, { archivo: '', descripcion: '' }] } : c));
  };

  const actualizarEvidenciaCaso = (indice: number, j: number, campo: 'archivo' | 'descripcion', valor: string) => {
    setCasosDinamicos((prev) => prev.map((c, i) =>
      i === indice
        ? { ...c, evidencias: c.evidencias.map((ev, k) => (k === j ? { ...ev, [campo]: valor } : ev)) }
        : c));
  };

  const eliminarEvidenciaCaso = (indice: number, j: number) => {
    setCasosDinamicos((prev) => prev.map((c, i) =>
      i === indice ? { ...c, evidencias: c.evidencias.filter((_, k) => k !== j) } : c));
  };

  const manejarFirma = async (archivo: File | undefined, campo: 'firma_analista' | 'firma_supervisor') => {
    if (!archivo) return;
    try {
      const base64 = await leerArchivoComoBase64(archivo);
      setForm((f) => ({ ...f, [campo]: base64 }));
    } catch (err) {
      setErrorForm(extraerError(err));
    }
  };

  const casoValido = Boolean(form.campo_componente.trim())
    && casosDinamicos.some((c) => c.descripcion.trim());

  const guardarCasoPrueba = async () => {
    if (!detalle || !casoValido) return;
    setGuardando(true);
    setErrorForm(null);
    setMensajeExito(null);
    try {
      const params: Record<string, string> = {
        numero_ticket: form.numero_ticket.trim() || detalle.numero_ticket,
        numero_caso: form.numero_caso.trim() || String(detalle.casos_prueba.length + 1),
        tipo_pase: form.tipo_pase,
        campo_componente: form.campo_componente.trim(),
        resultado_prueba: form.resultado_prueba,
        observaciones: form.observaciones.trim(),
      };
      if (form.numero_acta_pase.trim()) params.numero_acta_pase = form.numero_acta_pase.trim();
      if (form.fecha_prueba) params.fecha_prueba = form.fecha_prueba;
      if (form.firma_analista) params.firma_analista = form.firma_analista;
      if (form.firma_supervisor) params.firma_supervisor = form.firma_supervisor;

      const { data: caso } = await apiClient.post<CasoPrueba>(
        `/trabajos/${detalle.trabajo_id}/evaluaciones/${detalle.id}/casos-prueba`,
        null,
        { params },
      );

      for (const item of casosDinamicos) {
        if (!item.descripcion.trim()) continue;
        const { data: casoItem } = await apiClient.post<CasoPruebaItem>(
          `/trabajos/${detalle.trabajo_id}/evaluaciones/${detalle.id}/casos-prueba/${caso.id}/casos`,
          null,
          { params: { numero: '', descripcion: item.descripcion.trim() } },
        );
        for (const ev of item.evidencias) {
          if (!ev.archivo) continue;
          await apiClient.post(
            `/trabajos/${detalle.trabajo_id}/evaluaciones/${detalle.id}/casos-prueba/${caso.id}/casos/${casoItem.id}/evidencias`,
            null,
            { params: { archivo: ev.archivo, descripcion: ev.descripcion.trim() } },
          );
        }
      }

      await cargarDetalle(detalle.trabajo_id, detalle.id);
      setMensajeExito(`Caso de prueba Nº ${form.numero_caso || caso.numero_caso} registrado correctamente.`);
    } catch (err) {
      setErrorForm(extraerError(err));
    } finally {
      setGuardando(false);
    }
  };

  const descargarFormatoCaso = async (casoId: string) => {
    if (pdfGenerando) return;
    setPdfGenerando(casoId);
    setErrorPdf(null);
    try {
      await descargarPDF(`/documentos/caso-prueba/${casoId}`, `caso-prueba-${casoId}.pdf`);
    } catch (err) {
      setErrorPdf(extraerError(err));
    } finally {
      setPdfGenerando(null);
    }
  };

  const ultimoCasoId = detalle && detalle.casos_prueba.length > 0
    ? detalle.casos_prueba[detalle.casos_prueba.length - 1].id
    : null;

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
        titulo="Casos de Prueba (RA-105)"
        descripcion="Formato de Caso de Prueba del Poder Judicial. Seleccione una evaluación asignada y registre el encabezado, los casos, la conclusión y las firmas."
        breadcrumb={[{ label: 'Calidad' }, { label: 'Casos de Prueba (RA-105)' }]}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Evaluación de trabajo</Typography>
        <TextField
          select
          fullWidth
          size="small"
          label="Seleccione la evaluación"
          value={seleccion?.evaluacionId || ''}
          onChange={(e) => seleccionarEvaluacion(e.target.value)}
        >
          {evaluaciones.length === 0 && <MenuItem value="">No hay evaluaciones disponibles</MenuItem>}
          {evaluaciones.map((ev) => (
            <MenuItem key={ev.id} value={ev.id}>
              {ev.numero_ticket} · {ev.proyecto} · {ev.analista || 'Sin analista'}
            </MenuItem>
          ))}
        </TextField>
      </Paper>

      {errorDetalle && <Alert severity="error" sx={{ mb: 2 }}>{errorDetalle}</Alert>}
      {errorPdf && <Alert severity="warning" sx={{ mb: 2 }}>{errorPdf}</Alert>}

      {detalle && !cargandoDetalle && (
        <Stack spacing={2}>
          {/* Contexto de la evaluación */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Grid container spacing={1}>
              <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Ticket/GLPI</Typography><Typography variant="body2" fontWeight="bold">{detalle.numero_ticket}</Typography></Grid>
              <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Proyecto</Typography><Typography variant="body2" fontWeight="bold">{detalle.proyecto}</Typography></Grid>
              <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Tipo de atención</Typography><Typography variant="body2" fontWeight="bold">{detalle.tipo_atencion}</Typography></Grid>
              <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Analista</Typography><Typography variant="body2" fontWeight="bold">{detalle.analista || '—'}</Typography></Grid>
            </Grid>
          </Paper>

          {mensajeExito && <Alert severity="success">{mensajeExito}</Alert>}

          {/* Encabezado del RA-105 */}
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <ScienceIcon /> Encabezado del Formato de Caso de Prueba
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <TextField fullWidth label="Nº de Ticket *" value={form.numero_ticket} onChange={(e) => setForm({ ...form, numero_ticket: e.target.value })} />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField fullWidth label="Nº de Caso de Prueba (auto, editable)" value={form.numero_caso} onChange={(e) => setForm({ ...form, numero_caso: e.target.value })} />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField fullWidth label="Nº de Acta de Pase" value={form.numero_acta_pase} onChange={(e) => setForm({ ...form, numero_acta_pase: e.target.value })} />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField fullWidth disabled label="Nombre del Analista (auto)" value={detalle.analista || '—'} />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField select fullWidth label="Tipo de Pase *" value={form.tipo_pase} onChange={(e) => setForm({ ...form, tipo_pase: e.target.value })}>
                  {TIPOS_PASE.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField fullWidth label="Fecha de Prueba *" type="date" value={form.fecha_prueba} onChange={(e) => setForm({ ...form, fecha_prueba: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Campo / Componente / Módulo *" value={form.campo_componente} onChange={(e) => setForm({ ...form, campo_componente: e.target.value })} />
              </Grid>
            </Grid>
          </Paper>

          {/* Lista dinámica de casos */}
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight="bold">Casos de prueba ({casosDinamicos.length})</Typography>
              <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={agregarCasoDinamico}>
                Agregar caso
              </Button>
            </Box>
            {casosDinamicos.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Agregue al menos un caso con su descripción.
              </Typography>
            )}
            {casosDinamicos.map((caso, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">Caso #{i + 1}</Typography>
                  <Tooltip title="Eliminar caso">
                    <Button size="small" color="error" onClick={() => removerCasoDinamico(i)}><DeleteIcon fontSize="small" /></Button>
                  </Tooltip>
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Descripción del caso *"
                  value={caso.descripcion}
                  onChange={(e) => actualizarDescripcionCaso(i, e.target.value)}
                />
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary">Evidencias / vestigios del caso</Typography>
                {caso.evidencias.map((ev, j) => (
                  <Box key={j} sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                    <TextField
                      size="small"
                      label="Archivo"
                      value={ev.archivo}
                      onChange={(e) => actualizarEvidenciaCaso(i, j, 'archivo', e.target.value)}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="Descripción"
                      value={ev.descripcion}
                      onChange={(e) => actualizarEvidenciaCaso(i, j, 'descripcion', e.target.value)}
                      sx={{ flex: 1.5 }}
                    />
                    <Tooltip title="Quitar evidencia">
                      <IconButton size="small" color="error" onClick={() => eliminarEvidenciaCaso(i, j)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
                <Button size="small" variant="outlined" startIcon={<UploadFileIcon />} sx={{ mt: 1 }} onClick={() => agregarEvidenciaCaso(i)}>
                  Agregar evidencia
                </Button>
              </Paper>
            ))}
          </Paper>

          {/* Conclusión */}
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Conclusión</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField select fullWidth label="Resultado de la prueba *" value={form.resultado_prueba} onChange={(e) => setForm({ ...form, resultado_prueba: e.target.value })}>
                  {RESULTADOS_PRUEBA.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField fullWidth label="Observaciones" multiline rows={2} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
              </Grid>
            </Grid>
          </Paper>

          {/* Firmas */}
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Firmas</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Stack spacing={1}>
                  <Typography variant="caption" color="text.secondary">Firma del Analista</Typography>
                  <Button variant="outlined" component="label" size="small" startIcon={<UploadFileIcon />}>
                    Subir imagen de firma
                    <input type="file" accept="image/*" hidden onChange={(e) => void manejarFirma(e.target.files?.[0], 'firma_analista')} />
                  </Button>
                  {form.firma_analista && <Box component="img" src={form.firma_analista} alt="Firma analista" sx={{ maxHeight: 64, maxWidth: 200, alignSelf: 'flex-start' }} />}
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack spacing={1}>
                  <Typography variant="caption" color="text.secondary">Firma del Supervisor (Coordinador)</Typography>
                  <Button variant="outlined" component="label" size="small" startIcon={<UploadFileIcon />}>
                    Subir imagen de firma
                    <input type="file" accept="image/*" hidden onChange={(e) => void manejarFirma(e.target.files?.[0], 'firma_supervisor')} />
                  </Button>
                  {form.firma_supervisor && <Box component="img" src={form.firma_supervisor} alt="Firma supervisor" sx={{ maxHeight: 64, maxWidth: 200, alignSelf: 'flex-start' }} />}
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {errorForm && <Alert severity="error">{errorForm}</Alert>}

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              disabled={!casoValido || guardando}
              startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : <AddIcon />}
              onClick={() => void guardarCasoPrueba()}
            >
              Registrar caso de prueba
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={pdfGenerando === (ultimoCasoId || '') ? <CircularProgress size={18} /> : <PictureAsPdfIcon />}
              disabled={!ultimoCasoId || Boolean(pdfGenerando)}
              onClick={() => ultimoCasoId && void descargarFormatoCaso(ultimoCasoId)}
            >
              Generar PDF
            </Button>
          </Box>

          {/* Documentos RA-105 registrados */}
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Documentos RA-105 registrados ({detalle.casos_prueba.length})
            </Typography>
            {detalle.casos_prueba.length === 0 && (
              <Typography variant="body2" color="text.secondary">Aún no hay casos de prueba registrados.</Typography>
            )}
            {detalle.casos_prueba.map((c) => (
              <Paper key={c.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="body2"><strong>Caso Nº {c.numero_caso}</strong> · {c.campo_componente || '—'}</Typography>
                    <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Chip size="small" label={c.tipo_pase || '—'} variant="outlined" />
                      <Chip size="small" label={`Fecha: ${c.fecha_prueba || '—'}`} variant="outlined" />
                      <Chip size="small" label={`Resultado: ${c.resultado_prueba || c.resultado}`} color={c.resultado_prueba === 'Aprobado' ? 'success' : c.resultado_prueba === 'Rechazado' ? 'error' : c.resultado_prueba === 'Observado' ? 'warning' : 'default'} />
                      <Chip size="small" label={`${c.casos.length} casos`} variant="outlined" />
                    </Box>
                  </Box>
                  <Tooltip title="Descargar Formato de Caso de Prueba (RA-105)">
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={pdfGenerando === c.id ? <CircularProgress size={16} /> : <PictureAsPdfIcon />}
                      onClick={() => void descargarFormatoCaso(c.id)}
                      disabled={Boolean(pdfGenerando)}
                    >
                      PDF
                    </Button>
                  </Tooltip>
                </Box>
              </Paper>
            ))}
          </Paper>
        </Stack>
      )}
    </Box>
  );
}

export default function CasosPruebaPage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress /></Box>}>
      <CasosPruebaContent />
    </Suspense>
  );
}