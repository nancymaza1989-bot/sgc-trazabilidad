'use client';

import { useSearchParams } from 'next/navigation';
import { Box } from '@mui/material';
import PageHeader from '@/components/common/PageHeader';
import FlujogramaVisual from '@/components/FlujogramaVisual';

export default function FlujogramaPage() {
  const searchParams = useSearchParams();
  const proceso = searchParams.get('proceso') || undefined;

  return (
    <Box>
      <PageHeader
        titulo="Flujograma Gráfico Interactivo de Procesos SGC"
        descripcion="Diagrama de flujo relacional corporativo del Poder Judicial. Visualice la secuencia lógica de cada módulo y acceda de inmediato a la pantalla respectiva."
        breadcrumb={[{ label: 'Sistema' }, { label: 'Flujograma Gráfico' }]}
      />
      <FlujogramaVisual />
    </Box>
  );
}
