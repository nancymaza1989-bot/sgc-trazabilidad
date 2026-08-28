export function leerArchivoComoBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result || ''));
    lector.onerror = () => reject(lector.error || new Error('No se pudo leer el archivo'));
    lector.readAsDataURL(file);
  });
}

export function extraerError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: unknown } }).response?.data;
    if (data && typeof data === 'object' && data !== null && 'detail' in data) {
      const detalle = (data as { detail: unknown }).detail;
      return typeof detalle === 'string' ? detalle : JSON.stringify(detalle);
    }
    if (typeof data === 'string' && data) return data;
  }
  return err instanceof Error ? err.message : 'Error inesperado del servidor';
}