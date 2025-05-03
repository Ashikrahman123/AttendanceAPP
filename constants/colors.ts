const Colors = {
  light: {
    primary: '#4F46E5',
    primaryLight: '#818CF8',
    secondary: '#10B981',
    secondaryLight: '#34D399',
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    error: '#EF4444',
    success: '#10B981'
  },
  dark: {
    primary: '#6366F1',
    primaryLight: '#818CF8',
    secondary: '#10B981',
    secondaryLight: '#34D399',
    background: '#111827',
    card: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: '#374151',
    error: '#EF4444',
    success: '#10B981'
  }
};

export const getColors = () => {
  const isDarkMode = useThemeStore.getState().isDarkMode;
  return isDarkMode ? Colors.dark : Colors.light;
};

// For non-component files that can't use hooks
export const getColorsSync = () => {
  const isDarkMode = useThemeStore.getState().isDarkMode;
  return isDarkMode ? Colors.dark : Colors.light;
};

export default Colors; // For backward compatibility