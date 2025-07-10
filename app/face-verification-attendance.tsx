
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
import { useColors } from '@/hooks/useColors';
import { useAuthStore } from '@/store/auth-store';
import { getBase64FromUri } from '@/utils/face-recognition';
import * as FileSystem from 'expo-file-system';
import { useThemeStore } from '@/store/theme-store';
import LoadingOverlay from '@/components/LoadingOverlay';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

type AttendanceAction = "CI" | "CO" | "SB" | "EB";

export default function FaceVerificationAttendanceScreen() {
  const params = useLocalSearchParams<{ 
    type: AttendanceAction;
    employeeName: string;
    employeeId: string;
    contactRecordId: string;
  }>();
  
  const { type, employeeName, employeeId, contactRecordId } = params;
  
  const { user } = useAuthStore();
  const colors = useColors();
  const isDarkMode = useThemeStore(state => state.isDarkMode);
  
  const [facing, setFacing] = useState<CameraType>('front');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  
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
  }, []);
  
  useEffect(() => {
    // If permission is denied, show alert and go back
    if (permission && !permission.granted && !permission.canAskAgain) {
      Alert.alert(
        'Camera Permission Required',
        'We need camera permission to verify face for attendance.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [permission]);

  useEffect(() => {
    // If verification is complete, redirect back after a delay
    if (verificationComplete) {
      const timer = setTimeout(() => {
        router.back();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [verificationComplete]);
  
  const toggleCameraFacing = () => {
    setFacing(current => (current === 'front' ? 'back' : 'front'));
  };
  
  const handleCapture = async () => {
    if (!cameraReady || !cameraRef.current) {
      console.log('[Camera] Camera not ready or ref not available');
      return;
    }
    
    setIsCapturing(true);
    
    try {
      console.log('[Camera] Starting image capture...');
      
      // Provide haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      // Capture the image with different options for web vs native
      const captureOptions = Platform.OS === 'web' 
        ? { quality: 0.7 }
        : { quality: 0.7, base64: true, exif: false };
        
      const photo = await cameraRef.current.takePictureAsync(captureOptions);
      
      console.log('[Camera] Photo captured:', photo ? 'Success' : 'Failed');
      
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
          console.log('[Camera] Reading image as base64 from file...');
          base64Image = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          console.log('[Camera] Base64 conversion successful');
        } catch (error) {
          console.error('[Camera] Error reading image as base64:', error);
          Alert.alert('Error', 'Failed to process captured image');
          return;
        }
      }
      
      // Prepare the image data for API
      const imageData = base64Image ? `data:image/jpeg;base64,${base64Image}` : '';
      console.log('[Camera] Image data prepared, length:', imageData.length);
      
      console.log('[FaceID Attendance] Starting face verification attendance');
      console.log('[FaceID Attendance] Employee:', employeeName, 'ID:', employeeId);
      console.log('[FaceID Attendance] Action:', type);
      console.log('[FaceID Attendance] Contact Record ID:', contactRecordId);
      
      // Get required data from storage
      const [orgId, modifyUser, bearerToken] = await Promise.all([
        AsyncStorage.getItem('orgId'), 
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('bearerToken')
      ]);

      console.log('[FaceID Attendance] Auth data - OrgId:', orgId, 'ModifyUser:', modifyUser, 'Token:', bearerToken ? 'Present' : 'Missing');

      if (!orgId || !modifyUser || !bearerToken) {
        throw new Error('Required authentication data missing');
      }

      // Get base URL from storage
      const baseUrl = await AsyncStorage.getItem('baseUrl');
      if (!baseUrl) {
        throw new Error('Base URL not configured');
      }

      // Prepare request body for FaceID attendance
      const requestBody = {
        DetailData: {
          OrgId: parseInt(orgId),
          Module: type,
          ModifyUser: parseInt(modifyUser),
          CreateUser: parseInt(modifyUser),
          Time: new Date().toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          ContactRecordId: parseInt(contactRecordId),
          AttendanceMode: "FACEID",
          Image: imageData, // Hardcoded image for now as requested
          FaceIDTimestamp: Date.now(),
        },
        BearerTokenValue: bearerToken,
      };

      console.log('[FaceID Attendance] Request body:', requestBody);

      const response = await fetch(
        baseUrl + 'MiddleWare/Employee_Attendance_Update',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearerToken}`
          },
          body: JSON.stringify(requestBody)
        }
      );

      const data = await response.json();
      console.log('[FaceID Attendance] API Response:', data);

      // Update state based on API response
      setIsVerified(data.success || false);
      
      if (data.success) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
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
          'Attendance Failed',
          data.message || 'Face ID attendance failed. Please try again.',
          [
            { 
              text: 'Try Again', 
              onPress: () => {
                setCapturedImage(null);
                setIsProcessing(false);
              } 
            },
            { 
              text: 'Cancel', 
              onPress: () => router.back()
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error in FaceID attendance:', error);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      Alert.alert(
        'Error',
        'Failed to process Face ID attendance. Please try again.',
        [{ 
          text: 'OK', 
          onPress: () => {
            setCapturedImage(null);
            setIsCapturing(false);
            setIsProcessing(false);
          } 
        }]
      );
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleCancel = () => {
    router.back();
  };
  
  const getActionTitle = (): string => {
    switch (type) {
      case 'CI':
        return 'Check In';
      case 'SB':
        return 'Start Break';
      case 'EB':
        return 'End Break';
      case 'CO':
        return 'Check Out';
      default:
        return 'Face ID Attendance';
    }
  };
  
  const getActionIcon = () => {
    switch (type) {
      case 'CI':
        return <CheckCircle size={24} color="#FFFFFF" />;
      case 'SB':
        return <Coffee size={24} color="#FFFFFF" />;
      case 'EB':
        return <Timer size={24} color="#FFFFFF" />;
      case 'CO':
        return <XCircle size={24} color="#FFFFFF" />;
      default:
        return <Camera size={24} color="#FFFFFF" />;
    }
  };
  
  const getActionColor = (): [string, string] => {
    switch (type) {
      case 'CI':
        return [colors.primaryGradientStart, colors.primaryGradientEnd];
      case 'SB':
        return [colors.warning, colors.warning];
      case 'EB':
        return [colors.secondary, colors.secondaryLight];
      case 'CO':
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
            We need camera permission to verify face for attendance.
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
          />
          
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
                <Text style={styles.subtitle}>{employeeName}</Text>
                <Text style={styles.subtitle}>Position your face in the frame</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.flipButton}
                onPress={toggleCameraFacing}
              >
                <RefreshCw size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
            
            <View style={styles.faceBoundary}>
              <View style={styles.faceFrame} />
            </View>
            
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
                  {isProcessing ? 'Processing Face ID...' : 
                   isVerified ? 'Attendance Successful!' : 'Attendance Failed'}
                </Text>
              </Animated.View>
              
              {isProcessing ? (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.processingText}>Processing your Face ID attendance...</Text>
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
                    {type === 'CI' ? 'Checked In Successfully!' :
                     type === 'SB' ? 'Break Started Successfully!' :
                     type === 'EB' ? 'Break Ended Successfully!' :
                     'Checked Out Successfully!'}
                  </Text>
                  <Text style={styles.redirectText}>
                    Going back to employee info...
                  </Text>
                </Animated.View>
              ) : (
                <View style={styles.failureContainer}>
                  <View style={styles.failureIconContainer}>
                    <XCircle size={64} color={colors.error} />
                  </View>
                  <Text style={styles.failureText}>
                    Face ID attendance failed
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
                      title="Cancel"
                      variant="outline"
                      onPress={handleCancel}
                      style={styles.cancelRegisterButton}
                    />
                  </View>
                </View>
              )}
            </SafeAreaView>
          </View>
        </View>
      )}
      
      <LoadingOverlay visible={isProcessing && !capturedImage} message="Processing Face ID..." transparent={true} />
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
  faceBoundary: {
    position: 'absolute',
    top: '35%',
    left: '50%',
    marginLeft: -125,
    width: 250,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  faceFrame: {
    width: 200,
    height: 250,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderStyle: 'dashed',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
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
    paddingBottom: 50,
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
  cancelRegisterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
