import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";
import { useBaseUrl } from '@/context/BaseUrlContext';
import { BaseUrlProvider } from '@/context/BaseUrlContext';
import ThemeProvider from "@/components/ThemeProvider";
import LoadingOverlay from "@/components/LoadingOverlay";
import { StatusBar } from "expo-status-bar";
import { useThemeStore } from "@/store/theme-store";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { baseUrl, isLoading } = useBaseUrl();
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
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded) {
    return <View />;
  }

  return (
    <BaseUrlProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </BaseUrlProvider>
  );
}