'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Stack, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import apiClient from '@/lib/api/client';
import { PJ_COLORS } from '@/lib/theme';

export default function ChatbotConfigPage() {
  const [tab, setTab] = useState(0);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Dialog FAQ
  const [openFaq, setOpenFaq] = useState(false);
  const [faqEditId, setFaqEditId] = useState<string | null>(null);
  const [faqPregunta, setFaqPregunta] = useState('');
  const [faqRespuesta, setFaqRespuesta] = useState('');
  const [faqCategoria, setFaqCategoria] = useState('General');

  // Dialog Doc
  const [openDoc, setOpenDoc] = useState(false);
  const [docEditId, setDocEditId] = useState<string | null>(null);
  const [docTitulo, setDocTitulo] = useState('');
  const [docDescripcion, setDocDescripcion] = useState('');
  const [docContenido, setDocContenido] = useState('');
  const [docCategoria, setDocCategoria] = useState('Normativa SGC');

  const cargarDatos = async () => {
    try {
      const [resFaq, resDoc] = await Promise.all([
        apiClient.get('/chatbot/faq'),
        apiClient.get('/chatbot/documentos')
      ]);
      setFaqs(resFaq.data);
      setDocumentos(resDoc.data);
    } catch {
      // silencioso
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const guardarFaq = async () => {
    try {
      if (faqEditId) {
        await apiClient.put(`/chatbot/faq/${faqEditId}`, { pregunta: faqPregunta, respuesta: faqRespuesta, categoria: faqCategoria });
        setMensaje('FAQ actualizada correctamente.');
      } else {
        await apiClient.post('/chatbot/faq', { pregunta: faqPregunta, respuesta: faqRespuesta, categoria: faqCategoria });
        setMensaje('FAQ creada correctamente.');
      }
      setOpenFaq(false);
      limpiarFaq();
      cargarDatos();
    } catch {
      setMensaje('Error al guardar la FAQ.');
    }
  };

  const eliminarFaq = async (id: string) => {
    if (!confirm('¿Eliminar esta FAQ?')) return;
    try {
      await apiClient.delete(`/chatbot/faq/${id}`);
      setMensaje('FAQ eliminada.');
      cargarDatos();
    } catch {
      setMensaje('Error al eliminar FAQ.');
    }
  };

  const limpiarFaq = () => {
    setFaqEditId(null);
    setFaqPregunta('');
    setFaqRespuesta('');
    setFaqCategoria('General');
  };

  const guardarDoc = async () => {
    try {
      if (docEditId) {
        await apiClient.put(`/chatbot/documentos/${docEditId}`, { titulo: docTitulo, descripcion: docDescripcion, contenido: docContenido, categoria: docCategoria });
        setMensaje('Documento normativo actualizado.');
      } else {
        await apiClient.post('/chatbot/documentos', { titulo: docTitulo, descripcion: docDescripcion, contenido: docContenido, categoria: docCategoria });
        setMensaje('Documento indexado correctamente.');
      }
      setOpenDoc(false);
      limpiarDoc();
      cargarDatos();
    } catch {
      setMensaje('Error al guardar documento.');
    }
  };

  const eliminarDoc = async (id: string) => {
    if (!confirm('¿Eliminar este documento del RAG?')) return;
    try {
      await apiClient.delete(`/chatbot/documentos/${id}`);
      setMensaje('Documento eliminado.');
      cargarDatos();
    } catch {
      setMensaje('Error al eliminar documento.');
    }
  };

  const limpiarDoc = () => {
    setDocEditId(null);
    setDocTitulo('');
    setDocDescripcion('');
    setDocContenido('');
    setDocCategoria('Normativa SGC');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SmartToyIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold" color="text.primary">
              Gestión del Chatbot y Base RAG
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Administra las preguntas frecuentes (FAQ) y los documentos normativos que alimentan al Asistente IA.
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            if (tab === 0) { limpiarFaq(); setOpenFaq(true); }
            else { limpiarDoc(); setOpenDoc(true); }
          }}
          sx={{ bgcolor: PJ_COLORS.primaryDark, '&:hover': { bgcolor: PJ_COLORS.primary } }}
        >
          {tab === 0 ? 'Nueva Pregunta FAQ' : 'Indexar Documento RAG'}
        </Button>
      </Box>

      {mensaje && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMensaje(null)}>
          {mensaje}
        </Alert>
      )}

      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: `1px solid ${PJ_COLORS.divider}`, px: 2 }}>
          <Tab label="Preguntas Frecuentes (FAQ)" />
          <Tab label="Documentos Normativos (RAG)" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <TableContainer component={Paper} sx={{ borderRadius: 2, border: `1px solid ${PJ_COLORS.divider}` }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Categoría</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Pregunta</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Respuesta</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {faqs.map((f) => (
                <TableRow key={f.id} hover>
                  <TableCell>{f.categoria}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{f.pregunta}</TableCell>
                  <TableCell sx={{ maxWidth: 400, color: 'text.secondary' }}>{f.respuesta}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setFaqEditId(f.id);
                        setFaqPregunta(f.pregunta);
                        setFaqRespuesta(f.respuesta);
                        setFaqCategoria(f.categoria);
                        setOpenFaq(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => eliminarFaq(f.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {faqs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No hay FAQs registradas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 1 && (
        <TableContainer component={Paper} sx={{ borderRadius: 2, border: `1px solid ${PJ_COLORS.divider}` }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Categoría</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Título del Documento</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Descripción</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documentos.map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell>{d.categoria}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{d.titulo}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{d.descripcion || 'Sin descripción'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setDocEditId(d.id);
                        setDocTitulo(d.titulo);
                        setDocDescripcion(d.descripcion || '');
                        setDocContenido(d.contenido || '');
                        setDocCategoria(d.categoria);
                        setOpenDoc(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => eliminarDoc(d.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {documentos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No hay documentos normativos indexados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal FAQ */}
      <Dialog open={openFaq} onClose={() => setOpenFaq(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{faqEditId ? 'Editar Pregunta FAQ' : 'Nueva Pregunta FAQ'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Categoría"
              fullWidth
              size="small"
              value={faqCategoria}
              onChange={(e) => setFaqCategoria(e.target.value)}
            />
            <TextField
              label="Pregunta"
              fullWidth
              size="small"
              value={faqPregunta}
              onChange={(e) => setFaqPregunta(e.target.value)}
            />
            <TextField
              label="Respuesta detallada"
              fullWidth
              multiline
              rows={4}
              value={faqRespuesta}
              onChange={(e) => setFaqRespuesta(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFaq(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarFaq}>Guardar FAQ</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Documento RAG */}
      <Dialog open={openDoc} onClose={() => setOpenDoc(false)} maxWidth="md" fullWidth>
        <DialogTitle>{docEditId ? 'Editar Documento Normativo' : 'Indexar Documento Normativo (RAG)'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Título del Documento o Normativa"
              fullWidth
              size="small"
              value={docTitulo}
              onChange={(e) => setDocTitulo(e.target.value)}
            />
            <TextField
              label="Categoría"
              fullWidth
              size="small"
              value={docCategoria}
              onChange={(e) => setDocCategoria(e.target.value)}
            />
            <TextField
              label="Descripción breve"
              fullWidth
              size="small"
              value={docDescripcion}
              onChange={(e) => setDocDescripcion(e.target.value)}
            />
            <TextField
              label="Contenido completo (para indexación RAG de búsqueda semántica/por palabras clave)"
              fullWidth
              multiline
              rows={8}
              value={docContenido}
              onChange={(e) => setDocContenido(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDoc(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarDoc}>Indexar Documento</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
