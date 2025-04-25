import { useMemo } from 'react';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/constants/colors';

export function useColors() {
  const isDarkMode = useThemeStore(state => state.isDarkMode);
  
  return useMemo(() => getColors(), [isDarkMode]);
}