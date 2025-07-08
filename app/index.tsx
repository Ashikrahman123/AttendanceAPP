import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useBaseUrl } from '@/context/BaseUrlContext';

export default function Index() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { baseUrl } = useBaseUrl();

  // If no base URL, redirect to baseurl screen
  if (!baseUrl) {
    return <Redirect href="/baseurl" />;
  }

  // Redirect based on authentication
  return isAuthenticated ? (
    <Redirect href="/(tabs)" />
  ) : (
    <Redirect href="/(auth)" />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});