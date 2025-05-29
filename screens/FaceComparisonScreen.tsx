
import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Image,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import { RNCamera } from 'react-native-camera';
import Icon from 'react-native-vector-icons/Ionicons';
import { useColors } from '../hooks/useColors';

export default function FaceComparisonScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const [img1, setImg1] = useState<{ uri: string } | null>(null);
  const [img2, setImg2] = useState<{ uri: string } | null>(null);
  const [similarity, setSimilarity] = useState('Select two images to compare');
  const [isLoading, setIsLoading] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [currentImageSlot, setCurrentImageSlot] = useState<1 | 2>(1);

  const cameraRef = useRef<RNCamera>(null);

  const pickImageFromGallery = async (isFirst: boolean) => {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
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
    setCurrentImageSlot(isFirst ? 1 : 2);
    setCameraVisible(true);
  };

  const captureImage = async () => {
    if (!cameraRef.current) return;

    try {
      setIsLoading(true);
      const options = { quality: 0.7, base64: false };
      const data = await cameraRef.current.takePictureAsync(options);

      if (currentImageSlot === 1) {
        setImg1({ uri: data.uri });
      } else {
        setImg2({ uri: data.uri });
      }

      setCameraVisible(false);
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const compareFaces = async () => {
    if (!img1 || !img2) {
      Alert.alert('Missing Images', 'Please select two images to compare');
      return;
    }

    setIsLoading(true);
    setSimilarity('Processing...');

    try {
      // Simulate face comparison processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate a random similarity score for demo purposes
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
      setSimilarity('Error occurred during comparison');
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
          androidCameraPermissionOptions={{
            title: 'Permission to use camera',
            message: 'We need your permission to use your camera',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
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
              <TouchableOpacity
                style={styles.captureButton}
                onPress={captureImage}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="large" />
                ) : (
                  <Icon name="camera" size={32} color="#FFFFFF" />
                )}
              </TouchableOpacity>
              <Text style={styles.captureText}>
                {isLoading ? 'Capturing...' : 'Tap to capture'}
              </Text>
            </View>
          </SafeAreaView>
        </RNCamera>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.cardAlt }]}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={24} color={colors.text} />
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
                  <Icon name="camera" size={32} color={colors.textSecondary} />
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
                  <Icon name="camera" size={32} color={colors.textSecondary} />
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
  cameraFooter: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
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
    marginBottom: 12,
  },
  captureText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
