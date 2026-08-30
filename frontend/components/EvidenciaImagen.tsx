'use client';

import React, { useRef } from 'react';
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import DeleteIcon from '@mui/icons-material/Delete';
import { leerArchivoComoBase64 } from '@/lib/api/archivos';

interface Props {
  value: string;
  onChange: (valor: string) => void;
  label?: string;
}

function extraerImagenPortapapeles(clipboard: DataTransfer): Promise<string | null> {
  return new Promise((resolve) => {
    if (!clipboard?.items) return resolve(null);
    for (const item of Array.from(clipboard.items)) {
      if (item.type.startsWith('image/')) {
        const archivo = item.getAsFile();
        if (!archivo) continue;
        leerArchivoComoBase64(archivo).then(resolve).catch(() => resolve(null));
        return;
      }
    }
    resolve(null);
  });
}

export default function EvidenciaImagen({ value, onChange, label = 'Evidencia / imagen' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const manejarArchivo = async (file: File | undefined) => {
    if (!file) return;
    try {
      const base64 = await leerArchivoComoBase64(file);
      onChange(base64);
    } catch {
      /* sin accion */
    }
  };

  const manejarPegar = async (e: React.ClipboardEvent) => {
    const img = await extraerImagenPortapapeles(e.clipboardData);
    if (img) {
      onChange(img);
      e.preventDefault();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
      <Box
        onPaste={manejarPegar}
        tabIndex={0}
        sx={{
          flex: 1,
          border: '1.5px dashed',
          borderColor: 'divider',
          borderRadius: 2,
          p: 1.5,
          minHeight: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 0.5,
          bgcolor: 'action.hover',
          cursor: 'text',
          outline: 'none',
          '&:focus': { borderColor: 'primary.main' },
        }}
      >
        {value ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Box
              component="img"
              src={value}
              alt="Vista previa"
              sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap>Imagen lista</Typography>
              <Typography variant="caption" color="text.secondary">
                Pega otra con Ctrl+V o selecciona archivo.
              </Typography>
            </Box>
            <Tooltip title="Quitar imagen">
              <IconButton size="small" color="error" onClick={() => onChange('')}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
            <ContentPasteIcon fontSize="small" />
            <Typography variant="caption">
              {label} — pega aquí con Ctrl+V (captura/screenshot) o pulsa para subir archivo
            </Typography>
          </Box>
        )}
      </Box>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          manejarArchivo(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <Button
        size="small"
        variant="outlined"
        startIcon={<UploadFileIcon />}
        onClick={() => inputRef.current?.click()}
      >
        Seleccionar archivo
      </Button>
    </Box>
  );
}
