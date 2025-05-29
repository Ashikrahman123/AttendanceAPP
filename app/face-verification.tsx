import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Camera, X, CheckCircle, XCircle, Coffee, Timer, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '@/components/Button';
import FaceDetectionOverlay from '@/components/FaceDetectionOverlay';
import { useColors } from '@/hooks/useColors';
import { useAuthStore } from '@/store/auth-store';
import { useAttendanceStore } from '@/store/attendance-store';
import { verifyFace, getRegisteredFace } from '@/utils/face-recognition';
import { AttendanceType } from '@/types/user';
import * as FileSystem from 'expo-file-system';
import { useThemeStore } from '@/store/theme-store';
import LoadingOverlay from '@/components/LoadingOverlay';
import { initializeFaceSDK, captureFaceImage, isSDKReady } from '@/utils/faceSDK';

const { width, height } = Dimensions.get('window');

export default function FaceVerificationScreen() {
  const params = useLocalSearchParams<{ type: AttendanceType }>();
  const type = params.type as AttendanceType || 'check-in';

  const { user } = useAuthStore();
  const { addAttendanceRecord } = useAttendanceStore();
  const colors = useColors();
  const isDarkMode = useThemeStore(state => state.isDarkMode);

  const [facing, setFacing] = useState<CameraType>('front');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [registeredFace, setRegisteredFace] = useState<string | null>(null);

  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  const cameraRef = useRef<any>(null);

  useEffect(() => {
    // Request camera permission if needed
    if (!permission?.granted) {
      requestPermission();
    }

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Load registered face if user exists
    if (user) {
      loadRegisteredFace();
    }
  }, []);

  const loadRegisteredFace = async () => {
    if (!user) return;

    try {
      const faceData = await getRegisteredFace(user.id);
      setRegisteredFace(faceData);
    } catch (error) {
      console.error('Error loading registered face:', error);
    }
  };

  useEffect(() => {
    // If permission is denied, show alert and go back
    if (permission && !permission.granted && !permission.canAskAgain) {
      Alert.alert(
        'Camera Permission Required',
        'We need camera permission to verify your face for attendance.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [permission]);

  useEffect(() => {
    // If verification is complete, redirect to home after a delay
    if (verificationComplete) {
      const timer = setTimeout(() => {
        router.replace('/(tabs)');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [verificationComplete]);

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'front' ? 'back' : 'front'));
  };

  const handleCapture = async () => {
    if (!user || !cameraReady || !cameraRef.current) return;

    setIsCapturing(true);

    try {
      // Provide haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Capture the image
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
        exif: false,
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Set the captured image
      const imageUri = photo.uri;
      setCapturedImage(imageUri);

      // Move to processing state
      setIsCapturing(false);
      setIsProcessing(true);

      // Get base64 data
      let base64Image = photo.base64;

      // If base64 wasn't included in the photo, read it from the file
      if (!base64Image && Platform.OS !== 'web') {
        try {
          base64Image = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (error) {
          console.error('Error reading image as base64:', error);
        }
      }

      // Prepare the image data for storage
      const imageData = base64Image ? `data:image/jpeg;base64,${base64Image}` : undefined;

      // Verify face against registered face or user's face data
      const faceToCompare = registeredFace || user.faceData;
      const isVerificationSuccessful = await verifyFace(imageUri, faceToCompare);

      // Update state based on verification result
      setIsVerified(isVerificationSuccessful);

      if (isVerificationSuccessful) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Record attendance with the image data
        await addAttendanceRecord({
          userId: user.id,
          userName: user.name,
          type: type,
          verified: true,
          imageData: imageData,
        });

        // Animate success
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();

        // Set verification complete to trigger redirect
        setVerificationComplete(true);
      } else {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        Alert.alert(
          'Verification Failed',
          'Face verification failed. Please try again or use manual check-in.',
          [
            { 
              text: 'Try Again', 
              onPress: () => {
                setCapturedImage(null);
                setIsProcessing(false);
              } 
            },
            { 
              text: 'Manual Check-in', 
              onPress: async () => {
                await addAttendanceRecord({
                  userId: user.id,
                  userName: user.name,
                  type: type,
                  verified: false,
                  imageData: imageData,
                });
                router.replace('/(tabs)');
              } 
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error capturing image:', error);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      Alert.alert(
        'Error',
        'Failed to capture image. Please try again.',
        [{ 
          text: 'OK', 
          onPress: () => {
            setCapturedImage(null);
            setIsCapturing(false);
            setIsProcessing(false);
          } 
        }]
      );
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const getActionTitle = (): string => {
    switch (type) {
      case 'check-in':
        return 'Check In';
      case 'break-start':
        return 'Start Break';
      case 'break-end':
        return 'End Break';
      case 'check-out':
        return 'Check Out';
      default:
        return 'Verify Face';
    }
  };

  const getActionIcon = () => {
    switch (type) {
      case 'check-in':
        return <CheckCircle size={24} color="#FFFFFF" />;
      case 'break-start':
        return <Coffee size={24} color="#FFFFFF" />;
      case 'break-end':
        return <Timer size={24} color="#FFFFFF" />;
      case 'check-out':
        return <XCircle size={24} color="#FFFFFF" />;
      default:
        return <Camera size={24} color="#FFFFFF" />;
    }
  };

  const getActionColor = (): [string, string] => {
    switch (type) {
      case 'check-in':
        return [colors.primaryGradientStart, colors.primaryGradientEnd];
      case 'break-start':
        return [colors.warning, colors.warning];
      case 'break-end':
        return [colors.secondary, colors.secondaryLight];
      case 'check-out':
        return [colors.success, colors.success];
      default:
        return [colors.primaryGradientStart, colors.primaryGradientEnd];
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingOverlay visible={true} message="Loading camera..." />
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
            We need camera permission to verify your face for attendance.
          </Text>
          <Button 
            title="Grant Permission" 
            onPress={requestPermission} 
            style={styles.permissionButton}
          />
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {!capturedImage ? (
        <>
          <CameraView 
            style={styles.camera} 
            facing={facing}
            ref={cameraRef}
            onCameraReady={() => setCameraReady(true)}
          >
            <FaceDetectionOverlay isDetecting={isCapturing} />

            <SafeAreaView style={styles.overlay}>
              <Animated.View 
                style={[
                  styles.header,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={handleCancel}
                >
                  <X size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.headerContent}>
                  <Text style={styles.title}>{getActionTitle()}</Text>
                  <Text style={styles.subtitle}>Position your face in the frame</Text>
                </View>

                <TouchableOpacity 
                  style={styles.flipButton}
                  onPress={toggleCameraFacing}
                >
                  <RefreshCw size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </Animated.View>

              <Animated.View 
                style={[
                  styles.footer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: -slideAnim }]
                  }
                ]}
              >
                <LinearGradient
                  colors={getActionColor()}
                  style={styles.captureButtonContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <TouchableOpacity 
                    style={styles.captureButton}
                    onPress={handleCapture}
                    disabled={isCapturing || !cameraReady}
                  >
                    {isCapturing ? (
                      <ActivityIndicator color="#FFFFFF" size="large" />
                    ) : (
                      getActionIcon()
                    )}
                  </TouchableOpacity>
                </LinearGradient>

                <Text style={styles.captureText}>
                  {isCapturing ? 'Capturing...' : cameraReady ? 'Tap to capture' : 'Preparing camera...'}
                </Text>
              </Animated.View>
            </SafeAreaView>
          </CameraView>
        </>
      ) : (
        <View style={styles.resultContainer}>
          <Image 
            source={{ uri: capturedImage }} 
            style={styles.capturedImage} 
            resizeMode="cover"
          />

          <View style={styles.resultOverlay}>
            <SafeAreaView style={styles.resultContent}>
              <Animated.View 
                style={[
                  styles.resultHeader,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <Text style={styles.resultTitle}>
                  {isProcessing ? 'Verifying Face...' : 
                   isVerified ? 'Verification Successful!' : 'Verification Failed'}
                </Text>
              </Animated.View>

              {isProcessing ? (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.processingText}>Processing your image...</Text>
                </View>
              ) : isVerified ? (
                <Animated.View 
                  style={[
                    styles.successContainer,
                    {
                      opacity: successAnim,
                      transform: [
                        { scale: successAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.8, 1.2, 1]
                        })}
                      ]
                    }
                  ]}
                >
                  <LinearGradient
                    colors={[colors.success, colors.success]}
                    style={styles.successIconContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <CheckCircle size={64} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.successText}>
                    {type === 'check-in' ? 'Checked In Successfully!' :
                     type === 'break-start' ? 'Break Started Successfully!' :
                     type === 'break-end' ? 'Break Ended Successfully!' :
                     'Checked Out Successfully!'}
                  </Text>
                  <Text style={styles.redirectText}>
                    Redirecting to dashboard...
                  </Text>
                </Animated.View>
              ) : (
                <View style={styles.failureContainer}>
                  <View style={styles.failureIconContainer}>
                    <XCircle size={64} color={colors.error} />
                  </View>
                  <Text style={styles.failureText}>
                    Unable to verify your face
                  </Text>
                  <View style={styles.failureButtons}>
                    <Button
                      title="Try Again"
                      onPress={() => {
                        setCapturedImage(null);
                        setIsProcessing(false);
                      }}
                      style={styles.tryAgainButton}
                    />
                    <Button
                      title="Manual Check-in"
                      variant="outline"
                      onPress={async () => {
                        if (!user) return;

                        await addAttendanceRecord({
                          userId: user.id,
                          userName: user.name,
                          type: type,
                          verified: false,
                        });

                        router.replace('/(tabs)');
                      }}
                      style={styles.manualButton}
                    />
                  </View>
                </View>
              )}
            </SafeAreaView>
          </View>
        </View>
      )}

      <LoadingOverlay visible={isProcessing && !capturedImage} message="Processing..." transparent={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  captureButtonContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    marginBottom: 12,
  },
  captureButton: {
    flex: 1,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureText: {
    fontSize: 14,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
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
    width: '80%',
    marginBottom: 12,
  },
  cancelButton: {
    padding: 12,
  },
  cancelText: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  resultContainer: {
    flex: 1,
  },
  capturedImage: {
    ...StyleSheet.absoluteFillObject,
  },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  resultContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  processingContainer: {
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
  },
  successContainer: {
    alignItems: 'center',
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  redirectText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  failureContainer: {
    alignItems: 'center',
  },
  failureIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  failureText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  failureButtons: {
    width: '100%',
    gap: 12,
  },
  tryAgainButton: {
    marginBottom: 8,
  },
  manualButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});