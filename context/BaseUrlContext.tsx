
import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BaseUrlContextType {
  baseUrl: string | null;
  setBaseUrl: (url: string) => Promise<void>;
  isLoading: boolean;
}

const BASE_URL_KEY = 'baseUrl';
const BaseUrlContext = createContext<BaseUrlContextType>({
  baseUrl: null,
  setBaseUrl: async () => {},
  isLoading: true,
});

export function BaseUrlProvider({ children }: { children: React.ReactNode }) {
  const [baseUrl, setBaseUrlState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBaseUrl();
  }, []);

  const loadBaseUrl = async () => {
    try {
      console.log('Loading base URL from storage');
      const storedUrl = await AsyncStorage.getItem(BASE_URL_KEY);
      console.log('Stored base URL:', storedUrl);
      setBaseUrlState(storedUrl);
    } catch (error) {
      console.error('Failed to load base URL:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateUrl = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const setBaseUrl = async (url: string) => {
    console.log('Setting base URL:', url);
    if (!validateUrl(url)) {
      console.error('Invalid URL format');
      throw new Error('Invalid URL format. URL must start with https://');
    }

    try {
      const formattedUrl = url.endsWith('/') ? url : `${url}/`;
      await AsyncStorage.setItem(BASE_URL_KEY, formattedUrl);
      console.log('Base URL saved successfully');
      setBaseUrlState(formattedUrl);
    } catch (error) {
      console.error('Failed to save base URL:', error);
      throw error;
    }
  };

  return (
    <BaseUrlContext.Provider value={{ baseUrl, setBaseUrl, isLoading }}>
      {children}
    </BaseUrlContext.Provider>
  );
}

export const useBaseUrl = () => useContext(BaseUrlContext);
