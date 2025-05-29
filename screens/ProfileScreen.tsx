
import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useAuthStore } from '../store/auth-store';
import { useColors } from '../hooks/useColors';

export default function ProfileScreen() {
  const colors = useColors();
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Profile
        </Text>
        
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
          <Text style={[styles.value, { color: colors.text }]}>{user?.name}</Text>
          
          <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
          <Text style={[styles.value, { color: colors.text }]}>{user?.email}</Text>
          
          <Text style={[styles.label, { color: colors.textSecondary }]}>Role</Text>
          <Text style={[styles.value, { color: colors.text }]}>{user?.role}</Text>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error || '#ef4444' }]}
          onPress={logout}
        >
          <Text style={styles.logoutButtonText}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
