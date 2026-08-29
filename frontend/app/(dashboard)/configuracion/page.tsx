'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Alert, CircularProgress,
  List, ListItem, ListItemText, IconButton, Chip, Stack, Dialog,
  DialogTitle, DialogContent, DialogActions, Checkbox, FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '@/components/common/PageHeader';
import apiClient from '@/lib/api/client';
import { extraerError } from '@/lib/api/archivos';
import { PJ_COLORS } from '@/lib/theme';

interface Proyecto {
  id: string;
  nombre: string;
  activo: boolean;
}

export default function ConfiguracionPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogo, setDialogo] = useState(false);
  const [editando, setEditando] = useState<Proyecto | null>(null);
  const [nombre, setNombre] = useState('');
  const [activo, setActivo] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { data } = await apiClient.get<{ items: Proyecto[] }>('/configuracion/proyectos');
      setProyectos(data.items || []);
    } catch (err) {
      setError(extraerError(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const abrirNuevo = () => { setEditando(null); setNombre(''); setActivo(true); setErrorForm(null); setDialogo(true); };
  const abrirEditar = (p: Proyecto) => { setEditando(p); setNombre(p.nombre); setActivo(p.activo); setErrorForm(null); setDialogo(true); };

  const guardar = async () => {
    setGuardando(true);
    setErrorForm(null);
    try {
      if (editando) {
        await apiClient.patch(`/configuracion/proyectos/${editando.id}`, null, { params: { nombre, activo } });
      } else {
        await apiClient.post('/configuracion/proyectos', null, { params: { nombre } });
      }
      await cargar();
      setDialogo(false);
    } catch (err) {
      setErrorForm(extraerError(err));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (p: Proyecto) => {
    if (!window.confirm(`¿Eliminar el proyecto "${p.nombre}"?`)) return;
    try {
      await apiClient.delete(`/configuracion/proyectos/${p.id}`);
      await cargar();
    } catch (err) {
      setError(extraerError(err));
    }
  };

  const atajos = ['Sistema de Justicia', 'Expediente Judicial Electrónico (EJE)', 'Consultas en Línea', 'CEJ', 'Reportes', 'Integraciones'];

  return (
    <Box>
      <PageHeader
        titulo="Configuración del Sistema"
        descripcion="Mantenedores y parámetros: aquí se administra el catálogo de proyectos usado en el registro de trabajos."
        breadcrumb={[{ label: 'Administración' }, { label: 'Configuración' }]}
        actions={[
          <Button key="nuevo" variant="contained" startIcon={<AddIcon />} onClick={abrirNuevo}>Nuevo Proyecto</Button>,
        ]}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: PJ_COLORS.primary, fontWeight: 700 }}>
          Catálogo de Proyectos
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Estos proyectos aparecen como opciones desplegables (editable) en el formulario de Registro de Trabajo del Coordinador.
        </Typography>

        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          <List>
            {proyectos.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                Aún no hay proyectos. Agregue el primero o use los sugeridos de abajo.
              </Typography>
            )}
            {proyectos.map((p) => (
              <ListItem key={p.id} sx={{ px: 0 }} secondaryAction={
                <Stack direction="row" spacing={0.5}>
                  <IconButton size="small" onClick={() => abrirEditar(p)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => void eliminar(p)}><DeleteIcon fontSize="small" /></IconButton>
                </Stack>
              }>
                <ListItemText
                  primary={<Stack direction="row" spacing={1} alignItems="center">{p.nombre}
                    {!p.activo && <Chip size="small" label="Inactivo" />}</Stack>}
                />
              </ListItem>
            ))}
          </List>
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Sugeridos (clic para agregar rápidamente)</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {atajos.map((a) => (
              <Chip key={a} label={a} variant="outlined" clickable
                onClick={async () => {
                  try {
                    await apiClient.post('/configuracion/proyectos', null, { params: { nombre: a } });
                    await cargar();
                  } catch { /* ya existe */ }
                }} />
            ))}
          </Stack>
        </Box>
      </Paper>

      <Dialog open={dialogo} onClose={() => setDialogo(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editando ? 'Editar Proyecto' : 'Nuevo Proyecto'}</DialogTitle>
        <DialogContent>
          {errorForm && <Alert severity="error" sx={{ mt: 1, mb: 1 }}>{errorForm}</Alert>}
          <TextField fullWidth label="Nombre del proyecto *" value={nombre}
            onChange={(e) => setNombre(e.target.value)} sx={{ mt: 2 }} autoFocus />
          {editando && (
            <FormControlLabel sx={{ mt: 1 }}
              control={<Checkbox checked={activo} onChange={(e) => setActivo(e.target.checked)} />}
              label="Activo" />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogo(false)}>Cancelar</Button>
          <Button variant="contained" disabled={!nombre.trim() || guardando}
            startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : undefined}
            onClick={() => void guardar()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
