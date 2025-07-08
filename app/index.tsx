
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { useBaseUrl } from "@/context/BaseUrlContext";
import { useAuthStore } from "@/store/auth-store";
import CustomSplashScreen from "@/components/SplashScreen";

export default function IndexScreen() {
  const { baseUrl, isLoading } = useBaseUrl();
  const [showSplash, setShowSplash] = useState(true);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showSplash && !isLoading) {
      if (!baseUrl) {
        router.replace("/baseurl");
      } else if (!isAuthenticated) {
        router.replace("/(auth)/login");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [showSplash, isLoading, baseUrl, isAuthenticated]);

  // Show splash screen while loading
  if (showSplash || isLoading) {
    return <CustomSplashScreen onFinish={() => {}} />;
  }

  // This should never render as we redirect above
  return null;
}
