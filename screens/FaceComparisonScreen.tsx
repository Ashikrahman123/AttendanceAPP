
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
  PermissionsAndroid,
} from "react-native";
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { RNCamera } from 'react-native-camera';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Icon from 'react-native-vector-icons/Ionicons';

interface Props {
  navigation: any;
}

function FaceComparisonScreen({ navigation }: Props) {
  const [img1, setImg1] = useState<{ uri: string } | null>(null);
  const [img2, setImg2] = useState<{ uri: string } | null>(null);
  const [similarity, setSimilarity] = useState("Select two images to compare");
  const [isLoading, setIsLoading] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [currentImageSlot, setCurrentImageSlot] = useState<1 | 2>(1);
  const [cameraReady, setCameraReady] = useState(false);

  const cameraRef = useRef<RNCamera>(null);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera permission to take photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      const result = await request(PERMISSIONS.IOS.CAMERA);
      return result === RESULTS.GRANTED;
    }
  };

  const pickImageFromGallery = async (isFirst: boolean) => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        if (imageUri) {
          if (isFirst) {
            setImg1({ uri: imageUri });
          } else {
            setImg2({ uri: imageUri });
          }
        }
      }
    });
  };

  const openCamera = async (isFirst: boolean) => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
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
      const options = { quality: 0.7, base64: false };
      const data = await cameraRef.current.takePictureAsync(options);

      const imageUri = data.uri;
      
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

  if (cameraVisible) {
    return (
      <View style={styles.cameraContainer}>
        <RNCamera
          ref={cameraRef}
          style={styles.camera}
          type={RNCamera.Constants.Type.front}
          flashMode={RNCamera.Constants.FlashMode.off}
          onCameraReady={() => setCameraReady(true)}
          captureAudio={false}
        >
          <SafeAreaView style={styles.cameraOverlay}>
            {/* Camera Header */}
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.cameraCloseButton}
                onPress={() => setCameraVisible(false)}
              >
                <Icon name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <Text style={styles.cameraTitle}>
                Capture Face {currentImageSlot === 1 ? '1' : '2'}
              </Text>
              
              <View style={{ width: 40 }} />
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
                    <Icon name="camera" size={32} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.captureText}>
                {isLoading ? 'Capturing...' : cameraReady ? 'Tap to capture' : 'Preparing camera...'}
              </Text>
            </View>
          </SafeAreaView>
        </RNCamera>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>
          Face Comparison
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Select two face images to compare their similarity
        </Text>

        <View style={styles.imagesContainer}>
          {/* Image 1 */}
          <View style={styles.imageSection}>
            <Text style={styles.imageLabel}>
              First Face
            </Text>
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={() => showImageSourceOptions(true)}
            >
              {img1 ? (
                <Image source={img1} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Icon name="camera" size={32} color="#666" />
                  <Text style={styles.placeholderText}>
                    Tap to add
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* VS Divider */}
          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          {/* Image 2 */}
          <View style={styles.imageSection}>
            <Text style={styles.imageLabel}>
              Second Face
            </Text>
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={() => showImageSourceOptions(false)}
            >
              {img2 ? (
                <Image source={img2} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Icon name="camera" size={32} color="#666" />
                  <Text style={styles.placeholderText}>
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
              backgroundColor: img1 && img2 ? '#007AFF' : '#CCC',
              opacity: isLoading ? 0.7 : 1,
            }
          ]}
          onPress={compareFaces}
          disabled={!img1 || !img2 || isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={[styles.compareButtonText, { marginLeft: 8 }]}>
                Comparing...
              </Text>
            </View>
          ) : (
            <Text style={styles.compareButtonText}>
              Compare Faces
            </Text>
          )}
        </TouchableOpacity>

        {/* Result */}
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>
            Result:
          </Text>
          <Text style={styles.resultText}>
            {similarity}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#6B7280',
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
    color: '#111827',
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
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
    color: '#6B7280',
  },
  vsContainer: {
    paddingHorizontal: 20,
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
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
    color: '#FFFFFF',
  },
  resultContainer: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#6B7280',
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  infoContainer: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginTop: 'auto',
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
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
});

export default FaceComparisonScreen;
