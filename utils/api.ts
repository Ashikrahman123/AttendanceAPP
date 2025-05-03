
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBaseUrl } from '@/context/BaseUrlContext';

export const useApi = () => {
  const { baseUrl } = useBaseUrl();

  const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
    if (!baseUrl) throw new Error('Base URL not configured');

    const token = await AsyncStorage.getItem('bearerToken');
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const data = await response.json();
    return data;
  };

  return { fetchApi };
};

export const isAdmin = async () => {
  const role = await AsyncStorage.getItem('userRole');
  return role === 'admin';
};
