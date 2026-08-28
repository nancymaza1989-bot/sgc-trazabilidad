'use client';

import { useState } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Grid } from '@mui/material';
import DataTable, { ColumnDef } from '@/components/common/DataTable';

interface Incidencia {
  id: string;
  titulo: string;
  estado: string;
  prioridad: string;
  severidad: string;
  categoria: string;
  trabajo: string;
  asignado_a: string;
  fecha: string;
}

const datosIniciales: Incidencia[] = [
  { id: 'INC-001', titulo: 'Error en login de usuarios', estado: 'Abierta', prioridad: 'Crítica', severidad: 'Alta', categoria: 'Funcional', trabajo: 'GLPI-4521', asignado_a: 'Juan Pérez', fecha: '2024/01/15' },
  { id: 'INC-002', titulo: 'Reporte de exportación lento', estado: 'En análisis', prioridad: 'Alta', severidad: 'Media', categoria: 'Rendimiento', trabajo: 'TKT-2103', asignado_a: 'Ana Gómez', fecha: '2024/01/14' },
  { id: 'INC-003', titulo: 'Mejora en interfaz del buscador', estado: 'Cerrada', prioridad: 'Media', severidad: 'Baja', categoria: 'Usabilidad', trabajo: 'TKT-1855', asignado_a: 'Luis Torres', fecha: '2024/01/12' },
  { id: 'INC-004', titulo: 'Bug al generar PDF de incidencia', estado: 'Verificada', prioridad: 'Alta', severidad: 'Alta', categoria: 'Funcional', trabajo: 'GLPI-4521', asignado_a: 'Ana Gómez', fecha: '2024/01/11' },
  { id: 'INC-005', titulo: 'Base de datos sin conexión', estado: 'Resuelta', prioridad: 'Crítica', severidad: 'Crítica', categoria: 'Infraestructura', trabajo: 'GLPI-4489', asignado_a: 'Carlos Ruiz', fecha: '2024/01/10' },
  { id: 'INC-006', titulo: 'Solicitud de nueva pantalla de auditoría', estado: 'Abierta', prioridad: 'Media', severidad: 'Media', categoria: 'Requerimiento', trabajo: 'TKT-1998', asignado_a: 'María López', fecha: '2024/01/09' },
  { id: 'INC-007', titulo: 'Alerta de seguridad: intentos de acceso', estado: 'En desarrollo', prioridad: 'Crítica', severidad: 'Alta', categoria: 'Seguridad', trabajo: 'GLPI-4320', asignado_a: 'Carlos Ruiz', fecha: '2024/01/08' },
  { id: 'INC-008', titulo: 'Formato incorrecto en exportación Excel', estado: 'En pruebas', prioridad: 'Media', severidad: 'Baja', categoria: 'Funcional', trabajo: 'TKT-1998', asignado_a: 'María López', fecha: '2024/01/07' },
  { id: 'INC-009', titulo: 'Notificaciones no llegan por correo', estado: 'Abierta', prioridad: 'Alta', severidad: 'Media', categoria: 'Infraestructura', trabajo: 'TKT-1855', asignado_a: 'Luis Torres', fecha: '2024/01/06' },
  { id: 'INC-010', titulo: 'Validación de campos del formulario', estado: 'Cerrada', prioridad: 'Baja', severidad: 'Baja', categoria: 'Funcional', trabajo: 'TKT-2103', asignado_a: 'Juan Pérez', fecha: '2024/01/05' },
];

const estados = ['Abierta', 'En análisis', 'En desarrollo', 'En pruebas', 'Resuelta', 'Verificada', 'Cerrada'];
const prioridades = ['Crítica', 'Alta', 'Media', 'Baja'];
const severidades = ['Crítica', 'Alta', 'Media', 'Baja'];
const categorias = ['Funcional', 'Rendimiento', 'Usabilidad', 'Infraestructura', 'Seguridad', 'Requerimiento'];
const trabajos = ['GLPI-4521', 'TKT-2103', 'GLPI-4489', 'TKT-1998', 'GLPI-4320', 'TKT-1855'];
const analistas = ['Juan Pérez', 'Ana Gómez', 'Luis Torres', 'Carlos Ruiz', 'María López'];

const estadoColor: Record<string, string> = {
  'Abierta': 'error', 'En análisis': 'warning', 'En desarrollo': 'info',
  'En pruebas': 'secondary', 'Resuelta': 'primary', 'Verificada': 'success', 'Cerrada': 'default',
};
const prioridadColor: Record<string, string> = {
  'Crítica': 'error', 'Alta': 'warning', 'Media': 'info', 'Baja': 'default',
};

export default function IncidenciasPage() {
  const [incidencias, setIncidencias] = useState<Incidencia[]>(datosIniciales);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const columns: ColumnDef<Incidencia>[] = [
    { key: 'id', label: 'ID' },
    { key: 'titulo', label: 'Título' },
    { key: 'estado', label: 'Estado', badge: (v) => estadoColor[v] || 'default' },
    { key: 'prioridad', label: 'Prioridad', badge: (v) => prioridadColor[v] || 'default' },
    { key: 'severidad', label: 'Severidad' },
    { key: 'categoria', label: 'Categoría' },
    { key: 'trabajo', label: 'Trabajo / Ticket' },
    { key: 'asignado_a', label: 'Analista' },
    { key: 'fecha', label: 'Fecha' },
  ];

  const handleCreate = () => {
    const nueva: Incidencia = {
      id: `INC-${(incidencias.length + 1).toString().padStart(3, '0')}`,
      titulo: form.titulo || 'Nueva incidencia',
      estado: 'Abierta',
      prioridad: form.prioridad || 'Media',
      severidad: form.severidad || 'Media',
      categoria: form.categoria || 'Funcional',
      trabajo: form.trabajo || 'GLPI-4521',
      asignado_a: form.asignado_a || 'Sin asignar',
      fecha: new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
    };
    setIncidencias([nueva, ...incidencias]);
    setOpen(false);
    setForm({});
  };

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <DataTable
        title="Incidencias (Evidencias de Evaluación)"
        subtitle="Incidencias encontradas durante la evaluación de los trabajos de calidad"
        columns={columns}
        data={incidencias}
        searchPlaceholder="Buscar incidencia..."
        onNew={() => setOpen(true)}
        newLabel="Registrar Incidencia"
        filters={[
          { key: 'estado', label: 'Estado', values: estados },
          { key: 'prioridad', label: 'Prioridad', values: prioridades },
          { key: 'trabajo', label: 'Trabajo', values: trabajos },
          { key: 'asignado_a', label: 'Analista', values: analistas },
        ]}
      />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Incidencia (evidencia de la evaluación)</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Título *" value={form.titulo || ''} onChange={set('titulo')} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={3} label="Descripción" value={form.descripcion || ''} onChange={set('descripcion')} />
              </Grid>
              <Grid item xs={12}>
                <TextField select fullWidth label="Trabajo / Ticket asociado *" value={form.trabajo || 'GLPI-4521'} onChange={set('trabajo')}>
                  {trabajos.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Prioridad" value={form.prioridad || 'Media'} onChange={set('prioridad')}>
                  {prioridades.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Severidad" value={form.severidad || 'Media'} onChange={set('severidad')}>
                  {severidades.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Categoría" value={form.categoria || 'Funcional'} onChange={set('categoria')}>
                  {categorias.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Asignar a" value={form.asignado_a || ''} onChange={set('asignado_a')}>
                  {analistas.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate}>Registrar Incidencia</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
