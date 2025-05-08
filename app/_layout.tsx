import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useBaseUrl } from "@/context/BaseUrlContext";
import { BaseUrlProvider } from "@/context/BaseUrlContext";
import ThemeProvider from "@/components/ThemeProvider";
import { useAuthStore } from "@/store/auth-store";
import CustomSplashScreen from "@/components/SplashScreen";
import { useThemeStore } from "@/store/theme-store";
import { router } from "expo-router";

function RootLayoutNav() {
  const { baseUrl, isLoading } = useBaseUrl();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const [showSplash, setShowSplash] = useState(true);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showSplash && baseUrl && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [showSplash, baseUrl, isAuthenticated]);

  // 🔐 Render ONLY the splash screen if splash is active or baseUrl is loading
  if (showSplash || isLoading) {
    return <CustomSplashScreen onFinish={() => {}} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDarkMode ? "#111827" : "#F9FAFB",
        },
      }}
    >
      <Stack.Screen name="baseurl" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    return null;
  }

  // Initialize DevTools
  if (__DEV__ && typeof window !== 'undefined') {
    // Initialize Eruda for web debugging
    if (Platform.OS === 'web') {
      import('eruda').then(({ default: eruda }) => {
        eruda.init();
      });
    }
    
    // Initialize React DevTools
    try {
      import('react-devtools-core').then(({ connectToDevTools }) => {
        connectToDevTools({
          host: '0.0.0.0',
          port: 8097,
        });
      });
    } catch (err) {
      console.warn('React DevTools connection failed:', err);
    }
  }

  return (
    <BaseUrlProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </BaseUrlProvider>
  );
}