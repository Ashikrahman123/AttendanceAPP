import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function Index() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  // This is a redirect page
  // It will check authentication and redirect accordingly
  
  return (
    <View style={styles.container}>
      <LoadingOverlay visible={true} message="Loading..." />
      {isAuthenticated ? (
        <Redirect href="/(tabs)" />
      ) : (
        <Redirect href="/(auth)" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});