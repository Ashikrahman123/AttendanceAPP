import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ErrorBoundary } from "./error-boundary";
import { useAuthStore } from "@/store/auth-store";
import CustomSplashScreen from "@/components/SplashScreen";
import ThemeProvider from "@/components/ThemeProvider";
import { StatusBar } from "expo-status-bar";
import { useThemeStore } from "@/store/theme-store";
import { useBaseUrl } from '@/context/BaseUrlContext';
import LoadingOverlay from '@/components/LoadingOverlay';

export const unstable_settings = {
  initialRouteName: "index", // Start with index page
};

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });
  const [showSplash, setShowSplash] = useState(true);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // Hide native splash screen
      SplashScreen.hideAsync();
      // Hide custom splash after a delay
      setTimeout(() => setShowSplash(false), 500);
    }
  }, [loaded]);

  if (!loaded || showSplash) {
    return <CustomSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <RootLayoutNav />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  const { baseUrl, isLoading } = useBaseUrl();
  const [loadingMessage, setLoadingMessage] = useState('Loading configuration...');
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  if (isLoading) {
    return <LoadingOverlay visible={true} message="Loading configuration..." />;
  }

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        contentStyle: {
          backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
        }
      }}
    >
      {!baseUrl ? (
        <Stack.Screen name="baseurl" />
      ) : (
        <>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen 
            name="face-verification" 
            options={{ presentation: 'fullScreenModal' }} 
          />
          <Stack.Screen 
            name="attendance-details" 
            options={{ presentation: 'modal' }} 
          />
        </>
      )}
    </Stack>
  );
}