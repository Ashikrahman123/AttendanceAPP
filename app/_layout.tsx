
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useBaseUrl } from '@/context/BaseUrlContext';
import { BaseUrlProvider } from '@/context/BaseUrlContext';
import ThemeProvider from "@/components/ThemeProvider";
import CustomSplashScreen from "@/components/SplashScreen";
import { useThemeStore } from "@/store/theme-store";

function RootLayoutNav() {
  const { baseUrl, isLoading } = useBaseUrl();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const [showSplash, setShowSplash] = useState(true);

  console.log('Navigation state:', { baseUrl, isLoading, showSplash });

  if (showSplash) {
    return <CustomSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (isLoading) {
    console.log('Loading base URL configuration...');
    return null;
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
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="face-verification" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="attendance-details" options={{ presentation: 'modal' }} />
        </>
      )}
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

  return (
    <BaseUrlProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </BaseUrlProvider>
  );
}
