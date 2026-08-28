'use client';

import { useState } from 'react';
import {
  Box, Paper, Typography, Grid, Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';

interface Trabajo {
  id: string;
  numero_ticket: string;
  proyecto: string;
  tipo_atencion: string;
  prioridad: string;
  instrucciones: string;
  documentacion: string;
  fecha_recepcion: string;
  analista: string | null;
  fecha_programada: string;
  fecha_real: string | null;
  estado: string;
}

const TIPOS = ['Pase de versión', 'Pase puntual', 'Requerimiento'];
const PRIORIDADES = ['Crítica', 'Alta', 'Media', 'Baja'];
const ANALISTAS = ['Ana Gómez', 'Juan Pérez', 'Carlos Ruiz', 'María López', 'Luis Torres'];

const ESTADO_COLOR: Record<string, string> = {
  'Pendiente de asignación': '#9e9e9e',
  'Proceso de evaluación': '#7c3aed',
  'Pendiente de entrega': '#f59e0b',
  'Entregado por el Analista': '#0284c7',
  'En validación': '#0284c7',
  'Cerrado': '#16a34a',
};

const iniciales: Trabajo[] = [
  { id: '1', numero_ticket: 'GLPI-4521', proyecto: 'Sistema de Expedientes', tipo_atencion: 'Pase de versión', prioridad: 'Alta', instrucciones: 'Validar despliegue v1.2.3 en producción', documentacion: '', fecha_recepcion: '2026-08-20', analista: 'Ana Gómez', fecha_programada: '2026-08-28', fecha_real: null, estado: 'Proceso de evaluación' },
  { id: '2', numero_ticket: 'TKT-2103', proyecto: 'Portal Web', tipo_atencion: 'Requerimiento', prioridad: 'Media', instrucciones: 'Nueva pantalla de consulta de estado', documentacion: '', fecha_recepcion: '2026-08-18', analista: 'Juan Pérez', fecha_programada: '2026-08-26', fecha_real: null, estado: 'Pendiente de entrega' },
  { id: '3', numero_ticket: 'GLPI-4489', proyecto: 'SIGA', tipo_atencion: 'Pase puntual', prioridad: 'Crítica', instrucciones: 'Parche de seguridad en módulo de pagos', documentacion: '', fecha_recepcion: '2026-08-15', analista: null, fecha_programada: '', fecha_real: null, estado: 'Pendiente de asignación' },
  { id: '4', numero_ticket: 'TKT-1998', proyecto: 'Firma Digital', tipo_atencion: 'Pase de versión', prioridad: 'Baja', instrucciones: 'Verificación de integración con firma digital', documentacion: '', fecha_recepcion: '2026-08-10', analista: 'María López', fecha_programada: '2026-08-22', fecha_real: '2026-08-21', estado: 'En validación' },
  { id: '5', numero_ticket: 'GLPI-4320', proyecto: 'Sistema de Expedientes', tipo_atencion: 'Requerimiento', prioridad: 'Alta', instrucciones: 'Reporte de cumplimiento de SLA', documentacion: '', fecha_recepcion: '2026-08-05', analista: 'Carlos Ruiz', fecha_programada: '2026-08-15', fecha_real: '2026-08-14', estado: 'Cerrado' },
  { id: '6', numero_ticket: 'TKT-1855', proyecto: 'Portal Web', tipo_atencion: 'Pase puntual', prioridad: 'Media', instrucciones: 'Corrección de accesibilidad en login', documentacion: '', fecha_recepcion: '2026-08-12', analista: null, fecha_programada: '', fecha_real: null, estado: 'Pendiente de asignación' },
];

export default function TrabajosPage() {
  const [trabajos, setTrabajos] = useState<Trabajo[]>(iniciales);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Trabajo | null>(null);
  const [asignar, setAsignar] = useState<Trabajo | null>(null);
  const [analistaSel, setAnalistaSel] = useState('');
  const [fechaProgSel, setFechaProgSel] = useState('');
  const [form, setForm] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [fEstado, setFEstado] = useState('todos');
  const [fTipo, setFTipo] = useState('todos');

  const HOY = '2026-08-28';

  const filtered = trabajos.filter((t) => {
    if (search && !`${t.numero_ticket} ${t.proyecto} ${t.instrucciones}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (fEstado !== 'todos' && t.estado !== fEstado) return false;
    if (fTipo !== 'todos' && t.tipo_atencion !== fTipo) return false;
    return true;
  });

  const vencidos = trabajos.filter((t) => t.analista && !t.fecha_real && t.fecha_programada && t.fecha_programada < HOY).length;
  const proximos = trabajos.filter((t) => t.analista && t.estado !== 'Cerrado' && t.fecha_programada && t.fecha_programada >= HOY && t.fecha_programada <= '2026-08-31').length;
  const pendAsig = trabajos.filter((t) => t.estado === 'Pendiente de asignación').length;

  const abrirNuevo = () => { setEditing(null); setForm({}); setOpen(true); };

  const abrirEditar = (t: Trabajo) => {
    setEditing(t);
    setForm({
      numero_ticket: t.numero_ticket, proyecto: t.proyecto, tipo_atencion: t.tipo_atencion,
      prioridad: t.prioridad, instrucciones: t.instrucciones, documentacion: t.documentacion || '',
      fecha_recepcion: t.fecha_recepcion,
    });
    setOpen(true);
  };

  const guardar = () => {
    if (editing) {
      const actualizado = { ...editing, ...form };
      setTrabajos(trabajos.map((t) => (t.id === editing.id ? actualizado : t)));
    } else {
      const nuevo: Trabajo = {
        id: String(Date.now()),
        numero_ticket: form.numero_ticket || 'NUEVO',
        proyecto: form.proyecto || 'Sin proyecto',
        tipo_atencion: form.tipo_atencion || 'Requerimiento',
        prioridad: form.prioridad || 'Media',
        instrucciones: form.instrucciones || '',
        documentacion: form.documentacion || '',
        fecha_recepcion: form.fecha_recepcion || HOY,
        analista: null,
        fecha_programada: '',
        fecha_real: null,
        estado: 'Pendiente de asignación',
      };
      setTrabajos([nuevo, ...trabajos]);
    }
    setOpen(false);
  };

  const confirmarAsignar = () => {
    if (asignar && analistaSel) {
      setTrabajos(trabajos.map((t) => t.id === asignar.id
        ? { ...t, analista: analistaSel, fecha_programada: fechaProgSel || HOY, estado: 'Proceso de evaluación' }
        : t));
    }
    setAsignar(null);
    setAnalistaSel('');
    setFechaProgSel('');
  };

  const cambiarEstado = (id: string, estado: string) => {
    setTrabajos(trabajos.map((t) => {
      if (t.id !== id) return t;
      const esEntrega = estado === 'Entregado por el Analista';
      return { ...t, estado, fecha_real: esEntrega ? (t.fecha_real || HOY) : t.fecha_real };
    }));
  };

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Gestión de Trabajos</Typography>
          <Typography variant="body2" color="text.secondary">
            Registro de pases, requerimientos y tickets · Coordinador de Calidad
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNuevo}>
          Registrar Trabajo
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, borderLeft: '4px solid #0d47a1' }}>
            <Typography variant="subtitle2" color="text.secondary">Total trabajos</Typography>
            <Typography variant="h4" fontWeight="bold">{trabajos.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, borderLeft: '4px solid #9e9e9e' }}>
            <Typography variant="subtitle2" color="text.secondary">Pendientes asignación</Typography>
            <Typography variant="h4" fontWeight="bold" color="#9e9e9e">{pendAsig}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, borderLeft: '4px solid #f59e0b' }}>
            <Typography variant="subtitle2" color="text.secondary">Próximos a vencer</Typography>
            <Typography variant="h4" fontWeight="bold" color="#f59e0b">{proximos}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, borderLeft: '4px solid #ef4444' }}>
            <Typography variant="subtitle2" color="text.secondary">Vencidos</Typography>
            <Typography variant="h4" fontWeight="bold" color="#ef4444">{vencidos}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <TextField size="small" label="Buscar ticket, proyecto..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 220 }} />
          <TextField select size="small" label="Estado" value={fEstado} onChange={(e) => setFEstado(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="todos">Todos</MenuItem>
            {['Pendiente de asignación', 'Proceso de evaluación', 'Pendiente de entrega', 'Entregado por el Analista', 'En validación', 'Cerrado'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Tipo" value={fTipo} onChange={(e) => setFTipo(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="todos">Todos</MenuItem>
            {TIPOS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Box>

        <Grid container spacing={2}>
          {filtered.map((t) => (
            <Grid item xs={12} md={6} lg={4} key={t.id}>
              <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary">{t.numero_ticket}</Typography>
                  <Chip size="small" label={t.estado} sx={{ bgcolor: ESTADO_COLOR[t.estado], color: '#fff', fontWeight: 'bold' }} />
                </Box>
                <Typography variant="body2" fontWeight="bold">{t.proyecto}</Typography>
                <Typography variant="caption" color="text.secondary">{t.tipo_atencion} · Prioridad {t.prioridad}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {t.instrucciones}
                </Typography>
                <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                  <Chip size="small" label={t.analista || 'Sin asignar'} color={t.analista ? 'default' : 'error'} variant={t.analista ? 'outlined' : 'filled'} icon={t.analista ? <AssignmentIndIcon /> : undefined} />
                  {t.fecha_programada && <Chip size="small" label={`Entrega: ${t.fecha_programada}`} color="default" variant="outlined" />}
                </Box>
                <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  <IconButton size="small" onClick={() => abrirEditar(t)}><EditIcon fontSize="small" /></IconButton>
                  {!t.analista && (
                    <Button size="small" variant="outlined" onClick={() => { setAsignar(t); setAnalistaSel(''); setFechaProgSel(''); }}>
                      Asignar
                    </Button>
                  )}
                  {t.analista && t.estado !== 'Cerrado' && t.estado !== 'Entregado por el Analista' && (
                    <Button size="small" variant="outlined" onClick={() => cambiarEstado(t.id, 'Entregado por el Analista')}>
                      Registrar entrega
                    </Button>
                  )}
                  {t.estado === 'Entregado por el Analista' && (
                    <Button size="small" variant="outlined" color="success" onClick={() => cambiarEstado(t.id, 'Cerrado')}>
                      Cerrar
                    </Button>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar Trabajo' : 'Registrar Trabajo (Coordinador)'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField fullWidth label="Ticket / GLPI / ID *" value={form.numero_ticket || ''} onChange={set('numero_ticket')} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Proyecto *" value={form.proyecto || ''} onChange={set('proyecto')} /></Grid>
              <Grid item xs={6}><TextField select fullWidth label="Tipo de atención *" value={form.tipo_atencion || 'Requerimiento'} onChange={set('tipo_atencion')}>
                {TIPOS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField></Grid>
              <Grid item xs={6}><TextField select fullWidth label="Prioridad" value={form.prioridad || 'Media'} onChange={set('prioridad')}>
                {PRIORIDADES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField></Grid>
              <Grid item xs={12}><TextField fullWidth label="Fecha recepción" type="date" value={form.fecha_recepcion || ''} onChange={set('fecha_recepcion')} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Instrucciones / descripción *" multiline rows={3} value={form.instrucciones || ''} onChange={set('instrucciones')} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Documentación (links o referencias)" multiline rows={2} value={form.documentacion || ''} onChange={set('documentacion')} /></Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardar}>{editing ? 'Guardar cambios' : 'Registrar'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(asignar)} onClose={() => setAsignar(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Asignar Analista de Calidad</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>Trabajo: {asignar?.numero_ticket} ({asignar?.proyecto})</Typography>
          <TextField select fullWidth label="Analista de Calidad *" value={analistaSel} onChange={(e) => setAnalistaSel(e.target.value)} sx={{ mt: 1 }}>
            {ANALISTAS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Fecha programada de entrega *" type="date" value={fechaProgSel} onChange={(e) => setFechaProgSel(e.target.value)} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAsignar(null)}>Cancelar</Button>
          <Button variant="contained" disabled={!analistaSel || !fechaProgSel} onClick={confirmarAsignar}>Asignar y crear evaluación</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
