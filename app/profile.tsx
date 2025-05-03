import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '@/store/auth-store';
import { useColors } from '@/hooks/useColors';
import Camera from '@/components/Camera'; // Assuming this import is needed

export default function ProfileScreen() {
  const colors = useColors();
  const { user, logout } = useAuthStore();

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
        <Text style={[styles.userRole, { color: colors.textSecondary }]}>{user.role}</Text>

        {user.role === 'employee' && (
          <View style={styles.faceIdSection}>
            {user.registeredFace && (
              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => {
                  Alert.alert(
                    'Face ID Preview',
                    'Your registered Face ID',
                    [{ text: 'OK' }],
                    { customImage: user.registeredFace }
                  );
                }}
              >
                <View style={styles.settingsLeft}>
                  <View style={[styles.settingsIcon, { backgroundColor: colors.warning + "30" }]}>
                    <Camera size={20} color={colors.warning} />
                  </View>
                  <Text style={[styles.settingsText, { color: colors.text }]}>Preview Registered Face</Text>
                </View>
                <View style={[styles.registeredBadge, { backgroundColor: colors.success + "20" }]}>
                  <Text style={[styles.registeredBadgeText, { color: colors.success }]}>Registered</Text>
                </View>
              </TouchableOpacity>
            )}
            {!user.registeredFace && (
              <Text style={[styles.notRegisteredText, { color: colors.error }]}>Not Registered</Text>
            )}

          </View>
        )}

        {user.role === 'admin' && (
          <View style={styles.adminSection}>
            {/* Admin specific controls */}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  userRole: {
    fontSize: 16,
    marginBottom: 20,
  },
  faceIdSection: {
    marginTop: 20,
  },
  adminSection: {
    marginTop: 20,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  settingsText: {
    fontSize: 16,
  },
  registeredBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
  registeredBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  notRegisteredText: {
    fontSize: 16,
    color: 'red',
    marginLeft: 10,
  },
});