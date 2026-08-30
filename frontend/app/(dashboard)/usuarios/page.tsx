'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Button, Alert, CircularProgress, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Stack, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '@/components/common/PageHeader';
import apiClient from '@/lib/api/client';
import { extraerError } from '@/lib/api/archivos';
import { PJ_COLORS } from '@/lib/theme';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  area: string;
  estado: string;
  password?: string;
}

const ROLES = ['administrador', 'coordinador', 'analista'];
const rolColor: Record<string, string> = {
  administrador: 'error', coordinador: 'warning', analista: 'info',
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogo, setDialogo] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { data } = await apiClient.get<Usuario[]>('/usuarios');
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(extraerError(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ nombre: '', email: '', password: '', rol: 'analista', area: 'Calidad', estado: 'Activo' });
    setErrorForm(null);
    setDialogo(true);
  };
  const abrirEditar = (u: Usuario) => {
    setEditando(u);
    setForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol, area: u.area || '', estado: u.estado });
    setErrorForm(null);
    setDialogo(true);
  };

  const guardar = async () => {
    setGuardando(true);
    setErrorForm(null);
    try {
      if (editando) {
        const payload: Record<string, unknown> = {
          nombre: form.nombre, email: form.email, rol: form.rol, area: form.area, estado: form.estado,
        };
        if (form.password) payload.password = form.password;
        await apiClient.put(`/usuarios/${editando.id}`, payload);
      } else {
        await apiClient.post('/usuarios', {
          nombre: form.nombre, email: form.email, password: form.password,
          rol: form.rol, area: form.area, estado: form.estado,
        });
      }
      await cargar();
      setDialogo(false);
    } catch (err) {
      setErrorForm(extraerError(err));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (u: Usuario) => {
    if (!window.confirm(`¿Eliminar el usuario "${u.nombre}"?`)) return;
    try {
      await apiClient.delete(`/usuarios/${u.id}`);
      await cargar();
    } catch (err) {
      setError(extraerError(err));
    }
  };

  return (
    <Box>
      <PageHeader
        titulo="Usuarios, Roles y Permisos"
        descripcion="Gestión de acceso con RBAC: registre, edite o desactive usuarios y asigne sus roles. Solo el administrador tiene acceso aquí."
        breadcrumb={[{ label: 'Administración' }, { label: 'Usuarios' }]}
        actions={[
          <Button key="nuevo" variant="contained" startIcon={<AddIcon />} onClick={abrirNuevo}>Nuevo Usuario</Button>,
        ]}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: PJ_COLORS.primary, fontWeight: 700 }}>
          Lista de Usuarios
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          El administrador ve y gestiona a todo el equipo. Coordinadores y analistas solo inician sesión.
        </Typography>

        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Nombre', 'Correo', 'Rol', 'Área', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: 8, borderBottom: `2px solid ${PJ_COLORS.primary}`, color: PJ_COLORS.primary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center' }}>Aún no hay usuarios.</td></tr>
              )}
              {usuarios.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: 8 }}>{u.nombre}</td>
                  <td style={{ padding: 8 }}>{u.email}</td>
                  <td style={{ padding: 8 }}><Chip size="small" label={u.rol} color={(rolColor[u.rol] || 'default') as any} /></td>
                  <td style={{ padding: 8 }}>{u.area}</td>
                  <td style={{ padding: 8 }}>{u.estado}</td>
                  <td style={{ padding: 8 }}>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" onClick={() => abrirEditar(u)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => void eliminar(u)}><DeleteIcon fontSize="small" /></IconButton>
                    </Stack>
                  </td>
                </tr>
              ))}
            </tbody>
          </Box>
        )}
      </Paper>

      <Dialog open={dialogo} onClose={() => setDialogo(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editando ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        <DialogContent>
          {errorForm && <Alert severity="error" sx={{ mt: 1, mb: 1 }}>{errorForm}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nombre completo *" value={form.nombre || ''}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} fullWidth />
            <TextField label="Correo electrónico *" value={form.email || ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth />
            <TextField label={editando ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
              type="password" value={form.password || ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })} fullWidth />
            <TextField select label="Rol *" value={form.rol || 'analista'}
              onChange={(e) => setForm({ ...form, rol: e.target.value })} fullWidth>
              {ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </TextField>
            <TextField label="Área" value={form.area || ''}
              onChange={(e) => setForm({ ...form, area: e.target.value })} fullWidth />
            <TextField select label="Estado" value={form.estado || 'Activo'}
              onChange={(e) => setForm({ ...form, estado: e.target.value })} fullWidth>
              <MenuItem value="Activo">Activo</MenuItem>
              <MenuItem value="Inactivo">Inactivo</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogo(false)}>Cancelar</Button>
          <Button variant="contained"
            disabled={!form.nombre?.trim() || !form.email?.trim() || guardando || (!editando && !form.password?.trim())}
            startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : undefined}
            onClick={() => void guardar()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
