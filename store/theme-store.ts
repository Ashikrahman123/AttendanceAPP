import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ColorSchemeName } from 'react-native';

interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  systemTheme: ColorSchemeName;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSystemTheme: (theme: ColorSchemeName) => void;
  isDarkMode: boolean;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      systemTheme: 'light',
      
      setTheme: (theme) => {
        set({ theme });
      },
      
      setSystemTheme: (systemTheme) => {
        set({ systemTheme });
      },
      
      get isDarkMode() {
        const state = get();
        if (state.theme === 'system') {
          return state.systemTheme === 'dark';
        }
        return state.theme === 'dark';
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);