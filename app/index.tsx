
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useBaseUrl } from '@/context/BaseUrlContext';

export default function Index() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { baseUrl, isLoading } = useBaseUrl();

  // Show loading while checking base URL
  if (isLoading) {
    return (
      <View style={styles.container}>
        <LoadingOverlay visible={true} message="Loading..." />
      </View>
    );
  }

  // If no base URL, redirect to baseurl screen
  if (!baseUrl) {
    console.log('[Index] No base URL found, redirecting to baseurl screen');
    return <Redirect href="/baseurl" />;
  }

  // If base URL exists but not authenticated, go to login
  if (baseUrl && !isAuthenticated) {
    console.log('[Index] Base URL exists but not authenticated, redirecting to login');
    return <Redirect href="/(auth)/login" />;
  }

  // If both base URL and authentication exist, go to tabs
  if (baseUrl && isAuthenticated) {
    console.log('[Index] Base URL and authentication exist, redirecting to tabs');
    return <Redirect href="/(tabs)" />;
  }

  // Fallback
  return <Redirect href="/baseurl" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
