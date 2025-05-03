
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/theme-store';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const setTheme = useThemeStore(state => state.setTheme);
  
  useEffect(() => {
    setTheme(systemColorScheme === 'dark');
  }, [systemColorScheme]);
  
  return <>{children}</>;
}
