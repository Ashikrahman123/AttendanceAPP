
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { useColors } from '@/hooks/useColors';

export default function EmployeeInfoScreen() {
  const params = useLocalSearchParams();
  const colors = useColors();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Hardcoded employee data for demo
  const employeeData = {
    name: params.name as string,
    id: params.id as string,
    department: "Engineering",
    position: "Software Developer",
    email: "employee@company.com",
    phone: "+1234567890",
    joinDate: "01/01/2023"
  };

  const handleRegisterFace = () => {
    router.push({
      pathname: '/register-face',
      params: {
        employeeId: employeeData.id,
        employeeName: employeeData.name,
        contactRecordId: params.contactRecordId as string
      }
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.headerGradient}
        >
          <View style={styles.profileImageContainer}>
            {previewImage ? (
              <Image 
                source={{ uri: previewImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.cardAlt }]}>
                <Text style={[styles.profileImageText, { color: colors.text }]}>
                  {employeeData.name.charAt(0)}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{employeeData.name}</Text>
          <Text style={styles.position}>{employeeData.position}</Text>
        </LinearGradient>
      </View>

      <View style={styles.content}>
        <Button
          title="Register Face ID"
          onPress={handleRegisterFace}
          icon={<Camera size={20} color="#FFFFFF" />}
          style={styles.registerButton}
        />

        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Employee ID</Text>
            <Text style={[styles.value, { color: colors.text }]}>{employeeData.id}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Department</Text>
            <Text style={[styles.value, { color: colors.text }]}>{employeeData.department}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <Text style={[styles.value, { color: colors.text }]}>{employeeData.email}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Phone</Text>
            <Text style={[styles.value, { color: colors.text }]}>{employeeData.phone}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Join Date</Text>
            <Text style={[styles.value, { color: colors.text }]}>{employeeData.joinDate}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 280,
  },
  headerGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  position: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    padding: 20,
    marginTop: -40,
  },
  registerButton: {
    marginBottom: 20,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    width: '100%',
  },
});
