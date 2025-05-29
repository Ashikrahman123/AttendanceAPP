
import React, { useState, useRef, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Image,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useColors } from "@/hooks/useColors";
import { StatusBar } from "expo-status-bar";
import { X, Camera, Upload, RotateCcw } from "lucide-react-native";
import * as FileSystem from "expo-file-system";

function FaceComparisonScreen() {
  const colors = useColors();
  const [img1, setImg1] = useState<{ uri: string } | null>(null);
  const [img2, setImg2] = useState<{ uri: string } | null>(null);
  const [similarity, setSimilarity] = useState("Select two images to compare");
  const [isLoading, setIsLoading] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [currentImageSlot, setCurrentImageSlot] = useState<1 | 2>(1);
  const [facing, setFacing] = useState<CameraType>('front');
  const [cameraReady, setCameraReady] = useState(false);

  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const pickImageFromGallery = async (isFirst: boolean) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera roll permissions to select images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      if (isFirst) {
        setImg1({ uri: imageUri });
      } else {
        setImg2({ uri: imageUri });
      }
    }
  };

  const openCamera = async (isFirst: boolean) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera permissions to take photos.');
      return;
    }

    setCurrentImageSlot(isFirst ? 1 : 2);
    setCameraVisible(true);
  };

  const captureImage = async () => {
    if (!cameraRef.current || !cameraReady) return;

    try {
      setIsLoading(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });

      const imageUri = photo.uri;
      
      if (currentImageSlot === 1) {
        setImg1({ uri: imageUri });
      } else {
        setImg2({ uri: imageUri });
      }

      setCameraVisible(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
      setIsLoading(false);
    }
  };

  const compareFaces = async () => {
    if (!img1 || !img2) {
      Alert.alert('Missing Images', 'Please select two images to compare');
      return;
    }

    setIsLoading(true);
    setSimilarity("Processing...");

    try {
      // Simulate face comparison processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate a random similarity score for demo purposes
      // In a real implementation, you would use actual face recognition
      const randomSimilarity = Math.floor(Math.random() * 100);
      const isMatch = randomSimilarity > 75;
      
      setSimilarity(`${randomSimilarity}% similarity`);
      
      Alert.alert(
        'Comparison Complete',
        `The faces show ${randomSimilarity}% similarity.\n${isMatch ? 'MATCH' : 'NO MATCH'} (threshold: 75%)`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error comparing faces:', error);
      setSimilarity("Error occurred during comparison");
      Alert.alert('Error', 'Failed to compare faces. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showImageSourceOptions = (isFirst: boolean) => {
    Alert.alert(
      'Select Image Source',
      'Choose how you want to add the image',
      [
        {
          text: 'Camera',
          onPress: () => openCamera(isFirst),
        },
        {
          text: 'Gallery',
          onPress: () => pickImageFromGallery(isFirst),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'front' ? 'back' : 'front'));
  };

  if (cameraVisible) {
    if (!permission) {
      return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </SafeAreaView>
      );
    }

    if (!permission.granted) {
      return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.permissionContainer}>
            <Camera size={64} color={colors.textSecondary} />
            <Text style={[styles.permissionTitle, { color: colors.text }]}>Camera Access Required</Text>
            <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
              We need camera permission to take photos for face comparison.
            </Text>
            <TouchableOpacity
              style={[styles.permissionButton, { backgroundColor: colors.primary }]}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <StatusBar style="light" />
        <CameraView
          style={styles.camera}
          facing={facing}
          ref={cameraRef}
          onCameraReady={() => setCameraReady(true)}
        >
          <SafeAreaView style={styles.cameraOverlay}>
            {/* Camera Header */}
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.cameraCloseButton}
                onPress={() => setCameraVisible(false)}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <Text style={styles.cameraTitle}>
                Capture Face {currentImageSlot === 1 ? '1' : '2'}
              </Text>
              
              <TouchableOpacity
                style={styles.cameraFlipButton}
                onPress={toggleCameraFacing}
              >
                <RotateCcw size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Camera Footer */}
            <View style={styles.cameraFooter}>
              <View style={styles.captureButtonContainer}>
                <TouchableOpacity
                  style={[styles.captureButton, { opacity: cameraReady && !isLoading ? 1 : 0.5 }]}
                  onPress={captureImage}
                  disabled={!cameraReady || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="large" />
                  ) : (
                    <Camera size={32} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.captureText}>
                {isLoading ? 'Capturing...' : cameraReady ? 'Tap to capture' : 'Preparing camera...'}
              </Text>
            </View>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.cardAlt }]}
          onPress={() => router.back()}
        >
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Face Comparison
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Select two face images to compare their similarity
        </Text>

        <View style={styles.imagesContainer}>
          {/* Image 1 */}
          <View style={styles.imageSection}>
            <Text style={[styles.imageLabel, { color: colors.text }]}>
              First Face
            </Text>
            <TouchableOpacity
              style={[styles.imageContainer, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => showImageSourceOptions(true)}
            >
              {img1 ? (
                <Image source={img1} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Camera size={32} color={colors.textSecondary} />
                  <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                    Tap to add
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* VS Divider */}
          <View style={styles.vsContainer}>
            <Text style={[styles.vsText, { color: colors.primary }]}>VS</Text>
          </View>

          {/* Image 2 */}
          <View style={styles.imageSection}>
            <Text style={[styles.imageLabel, { color: colors.text }]}>
              Second Face
            </Text>
            <TouchableOpacity
              style={[styles.imageContainer, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => showImageSourceOptions(false)}
            >
              {img2 ? (
                <Image source={img2} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Camera size={32} color={colors.textSecondary} />
                  <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                    Tap to add
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Compare Button */}
        <TouchableOpacity
          style={[
            styles.compareButton,
            {
              backgroundColor: img1 && img2 ? colors.primary : colors.border,
              opacity: isLoading ? 0.7 : 1,
            }
          ]}
          onPress={compareFaces}
          disabled={!img1 || !img2 || isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={[styles.compareButtonText, { color: '#FFFFFF', marginLeft: 8 }]}>
                Comparing...
              </Text>
            </View>
          ) : (
            <Text style={[styles.compareButtonText, { color: '#FFFFFF' }]}>
              Compare Faces
            </Text>
          )}
        </TouchableOpacity>

        {/* Result */}
        <View style={[styles.resultContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
            Result:
          </Text>
          <Text style={[styles.resultText, { color: colors.text }]}>
            {similarity}
          </Text>
        </View>

        {/* Info */}
        <View style={[styles.infoContainer, { backgroundColor: colors.cardAlt }]}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Use clear, well-lit face photos for best results{'\n'}
            • Faces should be looking directly at the camera{'\n'}
            • This is a demo implementation with simulated results{'\n'}
            • Similarity threshold for match: 75%
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  imagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  imageSection: {
    flex: 1,
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    padding: 10,
  },
  placeholderText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
  vsContainer: {
    paddingHorizontal: 20,
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  compareButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compareButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  resultLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 16,
    borderRadius: 8,
    marginTop: 'auto',
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
  },
  // Camera styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  cameraCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cameraFlipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFooter: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  captureButtonContainer: {
    marginBottom: 12,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FaceComparisonScreen;
