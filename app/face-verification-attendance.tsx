import React, { useState, useRef, useEffect } from "react";
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
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import {
  Camera,
  X,
  CheckCircle,
  XCircle,
  Coffee,
  Timer,
  RefreshCw,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Button from "@/components/Button";
import { useColors } from "@/hooks/useColors";
import { useAuthStore } from "@/store/auth-store";
import * as FileSystem from "expo-file-system";
import LoadingOverlay from "@/components/LoadingOverlay";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentLocation } from "@/utils/location-service";

const { width, height } = Dimensions.get("window");

type AttendanceAction = "CI" | "CO" | "SB" | "EB";

const getBase64FromImageUri = async (uri: string): Promise<string | null> => {
  try {
    if (Platform.OS === "web") {
      return uri;
    }

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error("[Base64] Error converting image:", error);
    return null;
  }
};

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

  const [facing, setFacing] = useState<CameraType>("front");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }

    if (permission?.granted) {
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

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [permission]);

  useEffect(() => {
    if (permission && !permission.granted && !permission.canAskAgain) {
      Alert.alert(
        "Camera Permission Required",
        "We need camera permission to verify face for attendance. Please enable it in settings.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    }
  }, [permission]);

  useEffect(() => {
    if (verificationComplete) {
      const timer = setTimeout(() => {
        router.back();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [verificationComplete]);

  useEffect(() => {
    return () => {
      fadeAnim.stopAnimation();
      slideAnim.stopAnimation();
      successAnim.stopAnimation();
      pulseAnim.stopAnimation();

      setCameraReady(false);
      setIsCapturing(false);
      setIsProcessing(false);
    };
  }, []);

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "front" ? "back" : "front"));
  };

  const handleCapture = async () => {
    if (!cameraReady || !cameraRef.current) {
      console.log("[Camera] Camera not ready or ref not available");
      Alert.alert(
        "Camera Error",
        "Camera is not ready. Please wait and try again.",
      );
      return;
    }

    setIsCapturing(true);

    try {
      console.log("[Camera] Starting image capture...");

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const capturePromise = cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
        exif: false,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Camera capture timeout")), 15000);
      });

      const photo = await Promise.race([capturePromise, timeoutPromise]);

      if (!photo || !photo.uri) {
        throw new Error("Failed to capture image");
      }

      console.log("[Camera] Photo captured:", photo ? "Success" : "Failed");

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const imageUri = photo.uri;
      setCapturedImage(imageUri);

      setIsCapturing(false);
      setIsProcessing(true);

      let base64Image = photo.base64;

      if (!base64Image && Platform.OS !== "web") {
        try {
          console.log("[Camera] Reading image as base64 from file...");
          base64Image = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          console.log("[Camera] Base64 conversion successful");
        } catch (error) {
          console.error("[Camera] Error reading image as base64:", error);
          Alert.alert("Error", "Failed to process captured image");
          return;
        }
      }

      console.log("[FaceID Attendance] Starting face verification attendance");
      console.log(
        "[FaceID Attendance] Employee:",
        employeeName,
        "ID:",
        employeeId,
      );
      console.log("[FaceID Attendance] Action:", type);
      console.log("[FaceID Attendance] Contact Record ID:", contactRecordId);

      const [orgId, modifyUser, bearerToken] = await Promise.all([
        AsyncStorage.getItem("orgId"),
        AsyncStorage.getItem("userId"),
        AsyncStorage.getItem("bearerToken"),
      ]);

      console.log(
        "[FaceID Attendance] Auth data - OrgId:",
        orgId,
        "ModifyUser:",
        modifyUser,
        "Token:",
        bearerToken ? "Present" : "Missing",
      );

      if (!orgId || !modifyUser || !bearerToken) {
        throw new Error("Required authentication data missing");
      }

      const baseUrl = await AsyncStorage.getItem("baseUrl");
      if (!baseUrl) {
        throw new Error("Base URL not configured");
      }

      const location = await getCurrentLocation();
      const { latitude, longitude } = location.coords;
      const locationCode = `HO01_{${latitude},${longitude}}`;

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
          LocationCode: locationCode,
          LocationName: "HO01 - Head Office 01",
          FaceIDTimestamp: Date.now(),
        },
        BearerTokenValue: bearerToken,
      };

      console.log("[FaceID Attendance] Request body:", requestBody);

      const response = await fetch(
        baseUrl + "MiddleWare/Employee_Attendance_Update",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearerToken}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      const data = await response.json();
      console.log("[FaceID Attendance] API Response:", data);

      setIsVerified(data.success || false);

      if (data.success) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        Animated.timing(successAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();

        setVerificationComplete(true);

        setTimeout(() => {
          router.replace({
            pathname: "/employee-info",
            params: {
              name: employeeName,
              id: employeeId,
              contactRecordId: contactRecordId,
              attendanceSuccess: "true",
              attendanceAction: type,
            },
          });
        }, 2000);
      } else {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        Alert.alert(
          "Attendance Failed",
          data.message || "Face ID attendance failed. Please try again.",
          [
            {
              text: "Try Again",
              onPress: () => {
                setCapturedImage(null);
                setIsProcessing(false);
              },
            },
            {
              text: "Cancel",
              onPress: () => router.back(),
            },
          ],
        );
      }
    } catch (error) {
      console.error("Error in FaceID attendance:", error);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to process Face ID attendance. Please try again.",
        [
          {
            text: "OK",
            onPress: () => {
              setCapturedImage(null);
              setIsCapturing(false);
              setIsProcessing(false);
            },
          },
        ],
      );
    } finally {
      setIsCapturing(false);
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const getActionTitle = (): string => {
    switch (type) {
      case "CI":
        return "Check In";
      case "SB":
        return "Start Break";
      case "EB":
        return "End Break";
      case "CO":
        return "Check Out";
      default:
        return "Face ID Attendance";
    }
  };

  const getActionIcon = () => {
    switch (type) {
      case "CI":
        return <CheckCircle size={32} color="#FFFFFF" />;
      case "SB":
        return <Coffee size={32} color="#FFFFFF" />;
      case "EB":
        return <Timer size={32} color="#FFFFFF" />;
      case "CO":
        return <XCircle size={32} color="#FFFFFF" />;
      default:
        return <Camera size={32} color="#FFFFFF" />;
    }
  };

  const getActionColor = (): [string, string] => {
    switch (type) {
      case "CI":
        return ["#4CAF50", "#45A049"];
      case "SB":
        return ["#FF9800", "#F57C00"];
      case "EB":
        return ["#2196F3", "#1976D2"];
      case "CO":
        return ["#F44336", "#D32F2F"];
      default:
        return ["#4CAF50", "#45A049"];
    }
  };

  if (!permission) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <LoadingOverlay visible={true} message="Loading camera..." />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.permissionContainer}>
          <Camera size={64} color={colors.textSecondary} />
          <Text style={[styles.permissionTitle, { color: colors.text }]}>
            Camera Access Required
          </Text>
          <Text
            style={[styles.permissionText, { color: colors.textSecondary }]}
          >
            We need camera permission to verify face for attendance.
          </Text>
          <Button
            title="Grant Permission"
            onPress={requestPermission}
            style={styles.permissionButton}
          />
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {!capturedImage ? (
        
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          ref={cameraRef}
          onCameraReady={() => setCameraReady(true)}
        />

        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <Animated.View
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCancel}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.headerContent}>
                <Text style={styles.title}>Face Verification</Text>
                <Text style={styles.subtitle}>
                  Position your face in the frame
                </Text>
              </View>

              <TouchableOpacity
                style={styles.flipButton}
                onPress={toggleCameraFacing}
              >
                <RefreshCw size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>

            <Animated.View
              style={[
                styles.footer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: -slideAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={[
                  colors.primaryGradientStart,
                  colors.primaryGradientEnd,
                ]}
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
                    <Camera size={24} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </LinearGradient>

              <Text style={styles.captureText}>
                {isCapturing
                  ? "Capturing..."
                  : cameraReady
                    ? "Tap to capture"
                    : "Preparing camera..."}
              </Text>
            </Animated.View>
          </SafeAreaView>
        </View>
      </View>
        
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
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <Text style={styles.resultTitle}>
                  {isProcessing
                    ? "Processing Face ID..."
                    : isVerified
                      ? "Attendance Successful!"
                      : "Attendance Failed"}
                </Text>
              </Animated.View>

              {isProcessing ? (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.processingText}>
                    Processing your Face ID attendance...
                  </Text>
                </View>
              ) : isVerified ? (
                <Animated.View
                  style={[
                    styles.successContainer,
                    {
                      opacity: successAnim,
                      transform: [
                        {
                          scale: successAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0.8, 1.2, 1],
                          }),
                        },
                      ],
                    },
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
                    {type === "CI"
                      ? "Checked In Successfully!"
                      : type === "SB"
                        ? "Break Started Successfully!"
                        : type === "EB"
                          ? "Break Ended Successfully!"
                          : "Checked Out Successfully!"}
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

      <LoadingOverlay
        visible={isProcessing && !capturedImage}
        message="Processing Face ID..."
        transparent={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
  },
  scanArea: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 250,
    height: 250,
    marginLeft: -125,
    marginTop: -125,
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#FFFFFF",
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  headerContent: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  faceBoundaryOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  faceFrame: {
    width: 300,
    height: 380,
    borderRadius: 150,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.6)",
    borderStyle: "dashed",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  faceGuideCorner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderWidth: 4,
    borderColor: "#4CAF50",
  },
  topLeft: {
    top: 20,
    left: 20,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 20,
    right: 20,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 20,
  },
  instructionText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginTop: 30,
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: "hidden",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomSafeArea: {
    backgroundColor: "transparent",
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  captureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  captureInfo: {
    flex: 1,
    alignItems: "center",
  },
  captureStatusText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  captureHintText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  captureButtonContainer: {
    marginHorizontal: 20,
  },
  captureButtonGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  captureButton: {
    flex: 1,
    borderRadius: 45,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.9)",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  permissionButton: {
    width: "80%",
    marginBottom: 12,
  },
  cancelButton: {
    padding: 12,
  },
  cancelText: {
    fontSize: 16,
    textDecorationLine: "underline",
  },
  resultContainer: {
    flex: 1,
  },
  capturedImage: {
    ...StyleSheet.absoluteFillObject,
  },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  resultContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  resultHeader: {
    alignItems: "center",
    marginBottom: 40,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  processingContainer: {
    alignItems: "center",
  },
  processingText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginTop: 16,
  },
  successContainer: {
    alignItems: "center",
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },
  redirectText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  failureContainer: {
    alignItems: "center",
  },
  failureIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  failureText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 24,
  },
  failureButtons: {
    width: "100%",
    gap: 12,
  },
  tryAgainButton: {
    marginBottom: 8,
  },
  cancelRegisterButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
});