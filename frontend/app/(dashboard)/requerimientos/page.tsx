'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Paper, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DataTable, { ColumnDef } from '@/components/common/DataTable';
import apiClient from '@/lib/api/client';
import { PJ_COLORS } from '@/lib/theme';

interface Requerimiento {
  id: string;
  titulo: string;
  tipo: string;
  prioridad: string;
  estado: string;
  responsable: string;
  fecha: string;
}

const estadoColor: Record<string, string> = {
  'Registrado': 'default', 'En análisis': 'warning', 'Aprobado': 'info',
  'En desarrollo': 'secondary', 'En pruebas': 'primary', 'Implementado': 'success', 'Cerrado': 'default',
};

export default function RequerimientosPage() {
  const [data, setData] = useState<Requerimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('Funcional');
  const [prioridad, setPrioridad] = useState('Alta');
  const [responsable, setResponsable] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargarRequerimientos = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await apiClient.get('/requerimientos');
      setData(resp.data.items || []);
    } catch {
      // fallback
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarRequerimientos();
  }, [cargarRequerimientos]);

  const guardarReq = async () => {
    if (!titulo.trim() || !responsable.trim()) return;
    try {
      await apiClient.post('/requerimientos', {
        titulo,
        tipo,
        prioridad,
        estado: 'En análisis',
        responsable,
        fecha: new Date().toISOString().slice(0, 10).replace(/-/g, '/')
      });
      setMensaje('Requerimiento registrado con éxito.');
      setOpenDialog(false);
      setTitulo('');
      setResponsable('');
      cargarRequerimientos();
    } catch {
      setMensaje('Error al registrar requerimiento.');
    }
  };

  const columns: ColumnDef<Requerimiento>[] = [
    { key: 'id', label: 'ID' },
    { key: 'titulo', label: 'Título' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'prioridad', label: 'Prioridad' },
    { key: 'estado', label: 'Estado', badge: (v) => estadoColor[v] || 'default' },
    { key: 'responsable', label: 'Responsable' },
    { key: 'fecha', label: 'Fecha' },
  ];

  return (
    <Box>
      {mensaje && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMensaje(null)}>{mensaje}</Alert>
      )}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ bgcolor: PJ_COLORS.primaryDark, '&:hover': { bgcolor: PJ_COLORS.primary } }}
        >
          Nuevo Requerimiento
        </Button>
      </Box>

      <DataTable
        title="Gestión de Requerimientos y Trazabilidad"
        subtitle="Levantamiento, seguimiento de requerimientos funcionales y técnicos integrados al SGC"
        columns={columns}
        data={data}
        searchPlaceholder="Buscar requerimiento..."
        newLabel=""
        filters={[
          { key: 'estado', label: 'Estado', values: Object.keys(estadoColor) },
          { key: 'prioridad', label: 'Prioridad', values: ['Crítica', 'Alta', 'Media', 'Baja'] },
          { key: 'tipo', label: 'Tipo', values: ['Funcional', 'Técnico'] },
        ]}
      />

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Nuevo Requerimiento</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Título del Requerimiento" fullWidth size="small" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            <TextField select label="Tipo" fullWidth size="small" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <MenuItem value="Funcional">Funcional</MenuItem>
              <MenuItem value="Técnico">Técnico</MenuItem>
            </TextField>
            <TextField select label="Prioridad" fullWidth size="small" value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
              <MenuItem value="Crítica">Crítica</MenuItem>
              <MenuItem value="Alta">Alta</MenuItem>
              <MenuItem value="Media">Media</MenuItem>
              <MenuItem value="Baja">Baja</MenuItem>
            </TextField>
            <TextField label="Responsable" fullWidth size="small" value={responsable} onChange={(e) => setResponsable(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarReq}>Guardar Requerimiento</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
