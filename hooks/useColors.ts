import { useThemeStore } from '@/store/theme-store';
import Colors from '@/constants/colors';

export function useColors() {
  const isDarkMode = useThemeStore(state => state.isDarkMode);
  return isDarkMode ? Colors.dark : Colors.light;
}