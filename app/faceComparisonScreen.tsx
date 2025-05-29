
import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Image,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/useColors";
import { StatusBar } from "expo-status-bar";
import { X, Camera, Upload } from "lucide-react-native";
import { FaceSDK, Enum, FaceCaptureResponse } from '@regulaforensics/react-native-face-api';

function FaceComparisonScreen() {
  const colors = useColors();
  const [img1, setImg1] = React.useState<{ uri: string } | null>(null);
  const [img2, setImg2] = React.useState<{ uri: string } | null>(null);
  const [similarity, setSimilarity] = React.useState("Select two images to compare");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    initializeFaceSDK();
  }, []);

  const initializeFaceSDK = async () => {
    try {
      // Initialize the Face SDK
      const config = {
        license: "", // Add your license key here if you have one
        licenseUpdate: false,
      };
      
      await FaceSDK.init(config, (response) => {
        if (response.success) {
          console.log("Face SDK initialized successfully");
          setIsInitialized(true);
        } else {
          console.error("Face SDK initialization failed:", response.error);
          Alert.alert("Error", "Failed to initialize Face SDK");
        }
      }, (error) => {
        console.error("Face SDK initialization error:", error);
        Alert.alert("Error", "Face SDK initialization failed");
      });
    } catch (error) {
      console.error("Error initializing Face SDK:", error);
    }
  };

  const pickImageFromGallery = async (isFirst: boolean) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera roll permissions to select images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
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

  const captureImageFromCamera = async (isFirst: boolean) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera permissions to take photos.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Use Face SDK's face capture for better face detection
      FaceSDK.presentFaceCaptureActivity({
        cameraPosition: Enum.CameraPosition.FRONT,
        timeout: 10000,
      }, (response: FaceCaptureResponse) => {
        setIsLoading(false);
        if (response.image) {
          const imageUri = `data:image/jpeg;base64,${response.image}`;
          if (isFirst) {
            setImg1({ uri: imageUri });
          } else {
            setImg2({ uri: imageUri });
          }
        }
      }, (error) => {
        setIsLoading(false);
        console.error("Face capture error:", error);
        Alert.alert("Error", "Failed to capture face image");
      });
    } catch (error) {
      setIsLoading(false);
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to access camera");
    }
  };

  const compareFaces = async () => {
    if (!img1 || !img2) {
      Alert.alert('Missing Images', 'Please select two images to compare');
      return;
    }

    if (!isInitialized) {
      Alert.alert('SDK Not Ready', 'Face SDK is still initializing. Please wait.');
      return;
    }

    setIsLoading(true);
    setSimilarity("Processing...");

    try {
      // Convert images to base64 if they aren't already
      const getBase64FromUri = (uri: string) => {
        if (uri.startsWith('data:image')) {
          return uri.split(',')[1];
        }
        return uri;
      };

      const image1Base64 = getBase64FromUri(img1.uri);
      const image2Base64 = getBase64FromUri(img2.uri);

      // Use Face SDK to compare faces
      const matchRequest = {
        images: [
          {
            imageType: Enum.ImageType.PRINTED,
            image: image1Base64,
          },
          {
            imageType: Enum.ImageType.PRINTED, 
            image: image2Base64,
          }
        ]
      };

      FaceSDK.matchFaces(JSON.stringify(matchRequest), (response) => {
        setIsLoading(false);
        
        if (response.results && response.results.length > 0) {
          const matchResult = response.results[0];
          const similarityScore = Math.round(matchResult.similarity * 100);
          const isMatch = matchResult.similarity > 0.75; // 75% threshold
          
          setSimilarity(`${similarityScore}% similarity`);
          
          Alert.alert(
            'Comparison Complete',
            `The faces show ${similarityScore}% similarity.\n${isMatch ? 'MATCH' : 'NO MATCH'} (threshold: 75%)`,
            [{ text: 'OK' }]
          );
        } else {
          setSimilarity("No faces detected for comparison");
          Alert.alert('Error', 'No faces were detected in one or both images. Please try with clearer face photos.');
        }
      }, (error) => {
        setIsLoading(false);
        console.error('Face comparison error:', error);
        setSimilarity("Error occurred during comparison");
        Alert.alert('Error', 'Failed to compare faces. Please try again.');
      });

    } catch (error) {
      setIsLoading(false);
      console.error('Error comparing faces:', error);
      setSimilarity("Error occurred during comparison");
      Alert.alert('Error', 'Failed to compare faces. Please try again.');
    }
  };

  const showImageSourceOptions = (isFirst: boolean) => {
    Alert.alert(
      'Select Image Source',
      'Choose how you want to add the image',
      [
        {
          text: 'Camera',
          onPress: () => captureImageFromCamera(isFirst),
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
                    Tap to capture or select
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
                    Tap to capture or select
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
              backgroundColor: img1 && img2 && isInitialized ? colors.primary : colors.border,
              opacity: isLoading ? 0.7 : 1,
            }
          ]}
          onPress={compareFaces}
          disabled={!img1 || !img2 || isLoading || !isInitialized}
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

        {/* SDK Status */}
        <View style={[styles.statusContainer, { backgroundColor: isInitialized ? colors.success + "20" : colors.warning + "20" }]}>
          <Text style={[styles.statusText, { color: isInitialized ? colors.success : colors.warning }]}>
            Face SDK: {isInitialized ? 'Ready' : 'Initializing...'}
          </Text>
        </View>

        {/* Info */}
        <View style={[styles.infoContainer, { backgroundColor: colors.cardAlt }]}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Use clear, well-lit face photos for best results{'\n'}
            • Faces should be looking directly at the camera{'\n'}
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
  statusContainer: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
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
});

export default FaceComparisonScreen;
