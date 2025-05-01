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

export const BaseUrlProvider = ({ children }: { children: React.ReactNode }) => {
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBaseUrl = async () => {
      try {
        const storedUrl = await AsyncStorage.getItem('baseUrl');
        setBaseUrl(storedUrl); // This can be null, which is fine
      } catch (error) {
        console.error('Failed to load base URL', error);
        setBaseUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadBaseUrl();
  }, []);

  const handleSetBaseUrl = async (url: string) => {
    try {
      await AsyncStorage.setItem('baseUrl', url);
      setBaseUrl(url);
    } catch (error) {
      console.error('Failed to save base URL', error);
      throw error;
    }
  };

  return (
    <BaseUrlContext.Provider value={{ baseUrl, setBaseUrl: handleSetBaseUrl, isLoading }}>
      {children}
    </BaseUrlContext.Provider>
  );
};

export const useBaseUrl = () => useContext(BaseUrlContext);