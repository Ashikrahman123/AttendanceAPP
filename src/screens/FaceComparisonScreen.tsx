
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function FaceComparisonScreen() {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = () => {
    setIsCapturing(true);
    
    // Simulate capture process
    setTimeout(() => {
      setIsCapturing(false);
      Alert.alert('Success', 'Face captured successfully!');
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Face Recognition</Text>
        
        <View style={styles.cameraContainer}>
          <Icon name="camera" size={100} color="#4F46E5" />
          <Text style={styles.cameraText}>
            {isCapturing ? 'Capturing...' : 'Tap to capture face'}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.captureButton, isCapturing && styles.capturingButton]}
          onPress={handleCapture}
          disabled={isCapturing}
        >
          <Text style={styles.captureButtonText}>
            {isCapturing ? 'Processing...' : 'Capture Face'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 40,
  },
  cameraContainer: {
    width: 300,
    height: 300,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  cameraText: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  captureButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  capturingButton: {
    backgroundColor: '#999',
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
