import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getSession } from 'next-auth/react';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://sgc-backend-iguf.onrender.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

function obtenerToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
}

function guardarToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token);
  }
}

apiClient.interceptors.request.use(async (config) => {
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      const session = await getSession();
      token = (session as any)?.user?.access_token || null;
      if (token) guardarToken(token);
    } catch {
      token = obtenerToken();
    }
  }
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (resp) => resp,
  async (error: AxiosError) => {
    const estado = error.response?.status;
    const config = error.config as (InternalAxiosRequestConfig & { _reintentado?: boolean }) | undefined;

    if ((estado === 401 || estado === 403) && config && !config._reintentado) {
      config._reintentado = true;
      try {
        const session = await getSession();
        const tokenNuevo = (session as any)?.user?.access_token;
        if (tokenNuevo) {
          guardarToken(tokenNuevo);
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${tokenNuevo}`;
          return apiClient(config);
        }
      } catch {
        // Sin token recuperable, se devuelve el error original.
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
