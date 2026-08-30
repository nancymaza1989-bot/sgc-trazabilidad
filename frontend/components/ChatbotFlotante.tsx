'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box, Fab, Paper, Typography, IconButton, TextField, InputAdornment,
  Tooltip, Chip, CircularProgress, Divider, Stack
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import apiClient from '@/lib/api/client';
import { PJ_COLORS } from '@/lib/theme';

interface Mensaje {
  remitente: 'bot' | 'usuario';
  texto: string;
  fuentes?: Array<{ tipo: string; titulo: string }>;
}

const PREGUNTAS_SUGERIDAS = [
  "¿Cómo registro una incidencia?",
  "¿Cómo genero el reporte Excel RA-105?",
  "¿Cómo adjunto imágenes de evidencia?",
  "¿Qué roles existen en el SGC?"
];

export default function ChatbotFlotante() {
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      remitente: 'bot',
      texto: '¡Hola! Soy el Asistente IA del SGC - Poder Judicial. ¿En qué puedo ayudarte hoy con las incidencias, reportes o normativa?'
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (abierto) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [abierto, mensajes, cargando]);

  const enviarPregunta = async (textoPregunta?: string) => {
    const texto = textoPregunta || mensaje;
    if (!texto.trim() || cargando) return;

    const nuevoMensaje: Mensaje = { remitente: 'usuario', texto };
    setMensajes((prev) => [...prev, nuevoMensaje]);
    if (!textoPregunta) setMensaje('');
    setCargando(true);

    try {
      const resp = await apiClient.post('/chatbot/preguntar', { pregunta: texto });
      const data = resp.data;
      setMensajes((prev) => [
        ...prev,
        {
          remitente: 'bot',
          texto: data.respuesta,
          fuentes: data.fuentes
        }
      ]);
    } catch {
      setMensajes((prev) => [
        ...prev,
        {
          remitente: 'bot',
          texto: 'Lo siento, ha ocurrido un error al conectar con el asistente. Inténtalo de nuevo más tarde.'
        }
      ]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300 }}>
      {!abierto && (
        <Tooltip title="Asistente SGC (Chatbot IA & RAG)" placement="left">
          <Fab
            color="primary"
            onClick={() => setAbierto(true)}
            sx={{
              bgcolor: PJ_COLORS.primaryDark,
              '&:hover': { bgcolor: PJ_COLORS.primary },
              boxShadow: 4,
            }}
          >
            <ChatIcon />
          </Fab>
        </Tooltip>
      )}

      {abierto && (
        <Paper
          elevation={6}
          sx={{
            width: { xs: '90vw', sm: 380 },
            height: 520,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
            border: `1px solid ${PJ_COLORS.divider}`,
          }}
        >
          {/* Cabecera */}
          <Box
            sx={{
              bgcolor: PJ_COLORS.primaryDark,
              color: '#ffffff',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <SmartToyIcon sx={{ color: PJ_COLORS.secondary }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.1 }}>
                  Asistente SGC - IA
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>
                  RAG & FAQ Oficial
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setAbierto(false)} sx={{ color: '#ffffff' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Cuerpo de mensajes */}
          <Box
            sx={{
              flexGrow: 1,
              p: 2,
              overflowY: 'auto',
              bgcolor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            {mensajes.map((m, idx) => (
              <Box
                key={idx}
                sx={{
                  alignSelf: m.remitente === 'usuario' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: m.remitente === 'usuario' ? PJ_COLORS.primaryLight : '#ffffff',
                    color: m.remitente === 'usuario' ? PJ_COLORS.primaryDark : 'text.primary',
                    border: `1px solid ${m.remitente === 'usuario' ? 'transparent' : PJ_COLORS.divider}`,
                    fontSize: 13.5,
                    lineHeight: 1.4,
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: 13.5 }}>
                    {m.texto}
                  </Typography>

                  {m.fuentes && m.fuentes.length > 0 && (
                    <Box sx={{ mt: 1, pt: 1, borderTop: `1px dashed ${PJ_COLORS.divider}` }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600 }}>
                        Fuentes y Enlaces Oficiales:
                      </Typography>
                      {m.fuentes.map((f: any, fi) => (
                        <Chip
                          key={fi}
                          label={`${f.tipo}: ${f.titulo}`}
                          size="small"
                          component={f.url ? 'a' : 'div'}
                          {...(f.url ? { href: f.url, target: '_blank', rel: 'noopener noreferrer' } : {})}
                          clickable={Boolean(f.url)}
                          sx={{
                            mt: 0.5, mr: 0.5, fontSize: 11, height: 24,
                            bgcolor: f.url ? '#e0f2fe' : '#e2e8f0',
                            color: f.url ? '#0369a1' : 'inherit',
                            '&:hover': { bgcolor: f.url ? '#bae6fd' : '#cbd5e1' }
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Paper>
              </Box>
            ))}

            {cargando && (
              <Box sx={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">Pensando respuesta...</Typography>
              </Box>
            )}
            <div ref={chatEndRef} />
          </Box>

          {/* Sugerencias rápidas */}
          {mensajes.length <= 2 && (
            <Box sx={{ px: 2, py: 1, bgcolor: '#ffffff', borderTop: `1px solid ${PJ_COLORS.divider}` }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" sx={{ mb: 0.5 }}>
                Preguntas frecuentes:
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ overflowX: 'auto', pb: 0.5 }}>
                {PREGUNTAS_SUGERIDAS.map((p, i) => (
                  <Chip
                    key={i}
                    label={p}
                    size="small"
                    onClick={() => enviarPregunta(p)}
                    sx={{ fontSize: 11, cursor: 'pointer', '&:hover': { bgcolor: PJ_COLORS.primaryLight } }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Input de texto */}
          <Box
            component="form"
            onSubmit={(e) => { e.preventDefault(); enviarPregunta(); }}
            sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: `1px solid ${PJ_COLORS.divider}`, display: 'flex', gap: 1 }}
          >
            <TextField
              size="small"
              fullWidth
              placeholder="Escribe tu consulta sobre el SGC..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              disabled={cargando}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13.5 } }}
            />
            <IconButton
              color="primary"
              type="submit"
              disabled={!mensaje.trim() || cargando}
              sx={{ bgcolor: PJ_COLORS.primaryLight, borderRadius: 2 }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
