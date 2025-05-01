
import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BaseUrlContextType {
  baseUrl: string | null;
  setBaseUrl: (url: string) => Promise<void>;
  isLoading: boolean;
}

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
      const storedUrl = await AsyncStorage.getItem('baseUrl');
      setBaseUrlState(storedUrl);
    } catch (error) {
      console.error('Failed to load base URL:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setBaseUrl = async (url: string) => {
    try {
      await AsyncStorage.setItem('baseUrl', url);
      setBaseUrlState(url);
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
