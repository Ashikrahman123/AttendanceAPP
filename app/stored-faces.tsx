
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import Button from '@/components/Button';
import { X } from 'lucide-react-native';

export default function StoredFacesScreen() {
  const [faceData, setFaceData] = useState<{ [key: string]: string[] }>({});
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      Alert.alert('Unauthorized', 'Only administrators can access this screen');
      router.back();
      return;
    }
    loadStoredFaces();
  }, []);

  const loadStoredFaces = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const faceKeys = keys.filter(key => key.includes('face_data_contact_'));
      const faces: { [key: string]: string[] } = {};

      for (const key of faceKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          faces[key] = JSON.parse(data);
        }
      }

      setFaceData(faces);
    } catch (error) {
      console.error('Error loading faces:', error);
      Alert.alert('Error', 'Failed to load stored faces');
    }
  };

  const deleteFace = async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
      await loadStoredFaces();
      Alert.alert('Success', 'Face data deleted successfully');
    } catch (error) {
      console.error('Error deleting face:', error);
      Alert.alert('Error', 'Failed to delete face data');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Stored Face Data</Text>
      </View>

      <ScrollView style={styles.content}>
        {Object.entries(faceData).map(([key, faces]) => (
          <View key={key} style={styles.faceCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.employeeId}>
                Employee ID: {key.split('_')[3]}
              </Text>
              <Button
                title="Delete"
                variant="danger"
                size="small"
                onPress={() => deleteFace(key)}
                icon={<X size={16} color="#FFFFFF" />}
              />
            </View>
            <View style={styles.faceGrid}>
              {faces.map((face, index) => (
                <Image
                  key={index}
                  source={{ uri: face }}
                  style={styles.faceImage}
                  resizeMode="cover"
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  faceCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  employeeId: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  faceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  faceImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
});
