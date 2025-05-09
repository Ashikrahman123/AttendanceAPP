
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Camera, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { useColors } from '@/hooks/useColors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EmployeeInfoScreen() {
  const params = useLocalSearchParams();
  const colors = useColors();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [loading, setLoading] = useState(false);

  // Employee data
  const employeeData = {
    name: params.name as string,
    id: params.id as string,
    contactRecordId: params.contactRecordId as string,
    department: "Engineering",
    position: "Software Developer",
    email: "employee@company.com",
    phone: "+1234567890",
    joinDate: "01/01/2023"
  };

  const handleAttendanceAction = async (action: 'CI' | 'CO' | 'SB' | 'EB') => {
    try {
      setLoading(true);
      const [orgId, modifyUser, bearerToken] = await Promise.all([
        AsyncStorage.getItem('orgId'),
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('bearerToken')
      ]);

      if (!orgId || !modifyUser || !bearerToken) {
        Alert.alert('Error', 'Missing required authentication data');
        return;
      }

      const baseUrl = await AsyncStorage.getItem('baseUrl');
      if (!baseUrl) {
        Alert.alert('Error', 'Base URL not configured');
        return;
      }

      const currentTime = new Date();
      const timeString = currentTime.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const requestBody = {
        DetailData: {
          OrgId: parseInt(orgId),
          Module: action,
          ModifyUser: parseInt(modifyUser),
          CreateUser: parseInt(modifyUser),
          Time: timeString,
          ContactRecordId: parseInt(employeeData.contactRecordId)
        },
        BearerTokenValue: bearerToken
      };

      const response = await fetch(baseUrl + 'MiddleWare/Employee_Attendance_Update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearerToken}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        if (action === 'CI') setIsCheckedIn(true);
        if (action === 'CO') setIsCheckedIn(false);
        if (action === 'SB') setIsOnBreak(true);
        if (action === 'EB') setIsOnBreak(false);
        
        Alert.alert('Success', data.message);
      } else {
        Alert.alert('Error', data.message || 'Failed to update attendance');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      Alert.alert('Error', 'Failed to update attendance');
    } finally {
      setLoading(false);
    }
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

        <View style={styles.attendanceActions}>
          <Button
            title={isCheckedIn ? "Check Out" : "Check In"}
            onPress={() => handleAttendanceAction(isCheckedIn ? 'CO' : 'CI')}
            icon={<Clock size={20} color="#FFFFFF" />}
            style={styles.actionButton}
            loading={loading}
          />
          
          <Button
            title={isOnBreak ? "End Break" : "Start Break"}
            onPress={() => handleAttendanceAction(isOnBreak ? 'EB' : 'SB')}
            variant="secondary"
            icon={<Clock size={20} color="#FFFFFF" />}
            style={styles.actionButton}
            loading={loading}
          />
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
  attendanceActions: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
});
