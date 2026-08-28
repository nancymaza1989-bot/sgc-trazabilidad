import apiClient from '@/lib/api/client';

export async function descargarPDF(url: string, nombreArchivo: string): Promise<void> {
  const respuesta = await apiClient.get<Blob>(url, { responseType: 'blob' });
  const blob = respuesta.data;

  if (!blob || blob.type !== 'application/pdf') {
    let detalle = 'El servidor no devolvió un PDF válido.';
    try {
      const texto = await blob?.text?.();
      if (texto) {
        const parsed = JSON.parse(texto);
        detalle = parsed?.detail || detalle;
      }
    } catch {
      // el contenido no es JSON, se deja el mensaje genérico
    }
    throw new Error(detalle);
  }

  const urlObjecto = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = urlObjecto;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(urlObjecto);
}