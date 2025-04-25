import { useThemeStore } from '@/store/theme-store';

const lightColors = {
  primary: '#4F46E5', // Indigo
  primaryLight: '#818CF8',
  primaryGradientStart: '#4338CA',
  primaryGradientEnd: '#6366F1',
  
  secondary: '#10B981', // Emerald
  secondaryLight: '#34D399',
  secondaryGradientStart: '#059669',
  secondaryGradientEnd: '#10B981',
  
  background: '#F9FAFB',
  card: '#FFFFFF',
  cardAlt: '#F3F4F6',
  
  text: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  shadow: 'rgba(0, 0, 0, 0.1)',
};

const darkColors = {
  primary: '#6366F1', // Indigo
  primaryLight: '#818CF8',
  primaryGradientStart: '#4338CA',
  primaryGradientEnd: '#6366F1',
  
  secondary: '#10B981', // Emerald
  secondaryLight: '#34D399',
  secondaryGradientStart: '#059669',
  secondaryGradientEnd: '#10B981',
  
  background: '#111827',
  card: '#1F2937',
  cardAlt: '#374151',
  
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textLight: '#9CA3AF',
  
  border: '#374151',
  borderLight: '#4B5563',
  
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  shadow: 'rgba(0, 0, 0, 0.3)',
};

export const getColors = () => {
  const isDarkMode = useThemeStore.getState().isDarkMode;
  return isDarkMode ? darkColors : lightColors;
};

// For non-component files that can't use hooks
export const getColorsSync = () => {
  const isDarkMode = useThemeStore.getState().isDarkMode;
  return isDarkMode ? darkColors : lightColors;
};

export default lightColors; // For backward compatibility