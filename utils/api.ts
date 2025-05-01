import { useBaseUrl } from '@/context/BaseUrlContext';

export const useApi = () => {
  const { baseUrl } = useBaseUrl();

  const fetchApi = async (endpoint: string, options?: RequestInit) => {
    if (!baseUrl) throw new Error('Base URL not set');
    const res = await fetch(`${baseUrl}${endpoint}`, options);
    return res.json();
  };

  return { fetchApi };
};