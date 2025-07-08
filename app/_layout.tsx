import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { BaseUrlProvider } from "@/context/BaseUrlContext";
import ThemeProvider from "@/components/ThemeProvider";
import CustomSplashScreen from "@/components/SplashScreen";

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="baseurl" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="index" />
      <Stack.Screen name="employee-info" />
      <Stack.Screen name="face-verification" />
      <Stack.Screen name="register-face" />
      <Stack.Screen name="stored-faces" />
      <Stack.Screen name="attendance-details" />
      <Stack.Screen name="hidden-tab/history" />
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

  // Initialize React DevTools
  if (__DEV__ && typeof window !== 'undefined') {
    try {
      import('react-devtools-core').then(({ connectToDevTools }) => {
        connectToDevTools({
          host: 'localhost',
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