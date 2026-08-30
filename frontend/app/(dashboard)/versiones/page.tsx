'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DataTable, { ColumnDef } from '@/components/common/DataTable';
import apiClient from '@/lib/api/client';
import { PJ_COLORS } from '@/lib/theme';

interface Version {
  id: string;
  version: string;
  ambiente: string;
  responsable: string;
  fecha: string;
  estado: string;
  cambios: string;
}

const estadoColor: Record<string, string> = {
  'Estable': 'success', 'En validación': 'info', 'Inestable': 'error', 'En desarrollo': 'default',
};

export default function VersionesPage() {
  const [data, setData] = useState<Version[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [version, setVersion] = useState('');
  const [ambiente, setAmbiente] = useState('Pruebas');
  const [responsable, setResponsable] = useState('');
  const [cambios, setCambios] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargarVersiones = useCallback(async () => {
    try {
      const resp = await apiClient.get('/versiones');
      setData(resp.data.items || []);
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    cargarVersiones();
  }, [cargarVersiones]);

  const guardarVersion = async () => {
    if (!version.trim() || !responsable.trim()) return;
    try {
      await apiClient.post('/versiones', {
        version,
        ambiente,
        responsable,
        estado: 'En validación',
        cambios,
        fecha: new Date().toISOString().slice(0, 10).replace(/-/g, '/')
      });
      setMensaje('Versión registrada con éxito.');
      setOpenDialog(false);
      setVersion('');
      setResponsable('');
      setCambios('');
      cargarVersiones();
    } catch {
      setMensaje('Error al registrar versión.');
    }
  };

  const columns: ColumnDef<Version>[] = [
    { key: 'id', label: 'ID' },
    { key: 'version', label: 'Versión' },
    { key: 'ambiente', label: 'Ambiente' },
    { key: 'responsable', label: 'Responsable' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'estado', label: 'Estado', badge: (v) => estadoColor[v] || 'default' },
    { key: 'cambios', label: 'Cambios' },
  ];

  return (
    <Box>
      {mensaje && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMensaje(null)}>{mensaje}</Alert>}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ bgcolor: PJ_COLORS.primaryDark, '&:hover': { bgcolor: PJ_COLORS.primary } }}
        >
          Nueva Versión
        </Button>
      </Box>

      <DataTable
        title="Versiones y Despliegues Automatizados"
        subtitle="Registro de versiones de aplicaciones, pases a producción y control de estabilidad"
        columns={columns}
        data={data}
        searchPlaceholder="Buscar versión..."
        newLabel=""
        filters={[
          { key: 'ambiente', label: 'Ambiente', values: ['Desarrollo', 'Pruebas', 'Producción'] },
          { key: 'estado', label: 'Estado', values: Object.keys(estadoColor) },
        ]}
      />

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Nueva Versión o Despliegue</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Número de Versión (ej. v1.2.4)" fullWidth size="small" value={version} onChange={(e) => setVersion(e.target.value)} />
            <TextField select label="Ambiente" fullWidth size="small" value={ambiente} onChange={(e) => setAmbiente(e.target.value)}>
              <MenuItem value="Desarrollo">Desarrollo</MenuItem>
              <MenuItem value="Pruebas">Pruebas</MenuItem>
              <MenuItem value="Producción">Producción</MenuItem>
            </TextField>
            <TextField label="Responsable del Despliegue" fullWidth size="small" value={responsable} onChange={(e) => setResponsable(e.target.value)} />
            <TextField label="Descripción de Cambios" fullWidth multiline rows={3} value={cambios} onChange={(e) => setCambios(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarVersion}>Guardar Versión</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
