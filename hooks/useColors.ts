
import { useThemeStore } from '@/store/theme-store';
import Colors from '@/constants/colors';

export function useColors() {
  const isDark = useThemeStore(state => state.isDark);
  return isDark ? Colors.dark : Colors.light;
}
