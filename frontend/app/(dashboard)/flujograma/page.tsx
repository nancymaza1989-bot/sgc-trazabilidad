'use client';

import { useSearchParams } from 'next/navigation';
import { Box } from '@mui/material';
import PageHeader from '@/components/common/PageHeader';
import FlujogramaMacro from '@/components/FlujogramaMacro';

export default function FlujogramaPage() {
  const searchParams = useSearchParams();
  const proceso = searchParams.get('proceso') || undefined;

  return (
    <Box>
      <PageHeader
        titulo="Flujograma Interactivo Macro & Procesos SGC"
        descripcion="Visualice el flujo macro de calidad del Poder Judicial. Cada pantalla y módulo cuenta con referencia directa a estos procesos."
        breadcrumb={[{ label: 'Sistema' }, { label: 'Flujograma Interactivo' }]}
      />
      <FlujogramaMacro procesoInicialId={proceso} />
    </Box>
  );
}
