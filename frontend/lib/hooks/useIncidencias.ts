'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';

export function useIncidencias(page = 1, size = 10, estado?: string) {
  return useQuery({
    queryKey: ['incidencias', page, size, estado],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), size: String(size) });
      if (estado) params.append('estado', estado);
      const { data } = await apiClient.get(`/incidencias?${params}`);
      return data;
    },
  });
}
