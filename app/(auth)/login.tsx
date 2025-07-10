import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Mail, Lock, User, CheckCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Input from "@/components/Input";
import Button from "@/components/Button";
import Colors from "@/constants/colors";
import { useAuthStore } from "@/store/auth-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [userNameError, setUserNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState<"manual" | "qr" | "faceid">("manual");

  const { login, isLoading, error, isAuthenticated } = useAuthStore();

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const logoScale = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Check if user is authenticated and redirect if needed
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated]);

  const validateForm = () => {
    let isValid = true;

    // Email validation
    if (!userName) {
      setUserNameError("Username is required");
      isValid = false;
    } else if (userName.length < 3) {
      setUserNameError("Username must be at least 3 characters");
      isValid = false;
    } else {
      setUserNameError("");
    }

    // Password validation
    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 5) {
      setPasswordError("Password must be at least 5 characters");
      isValid = false;
    } else {
      setPasswordError("");
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      // Store attendance mode before login
      await AsyncStorage.setItem("attendanceMode", attendanceMode);
      await login(userName, password);
      setLoginSuccess(true);

      // Provide haptic feedback on success
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Router navigation is handled by the useEffect above
    } catch (error) {
      console.error("Login error:", error);

      // Provide haptic feedback on error
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleDemoLogin = async (demoUserName: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      // Use demo credentials
      await login("demoUserName", "password"); // not ashik@example.com
      // Router navigation is handled by the useEffect above
    } catch (error) {
      console.error("Demo login error:", error);
      Alert.alert(
        "Login Error",
        "Failed to login with demo account. Please try again.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: logoScale }],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[Colors.secondary, Colors.primary]}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <User size={40} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Face Attendance</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.attendanceModeContainer}>
              <Text style={styles.attendanceModeLabel}>Choose Attendance Mode</Text>
              <View style={styles.modeCardContainer}>
                <TouchableOpacity
                  style={[
                    styles.modeCard,
                    attendanceMode === "manual" && styles.modeCardSelected,
                  ]}
                  onPress={() => setAttendanceMode("manual")}
                >
                  <LinearGradient
                    colors={attendanceMode === "manual" ? [Colors.primary, Colors.primaryLight] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={styles.modeCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.modeIconContainer}>
                      <User size={24} color={attendanceMode === "manual" ? "#FFFFFF" : Colors.textSecondary} />
                    </View>
                    <Text style={[
                      styles.modeCardTitle,
                      { color: attendanceMode === "manual" ? "#FFFFFF" : Colors.text }
                    ]}>
                      Manual
                    </Text>
                    <Text style={[
                      styles.modeCardDescription,
                      { color: attendanceMode === "manual" ? "rgba(255,255,255,0.8)" : Colors.textSecondary }
                    ]}>
                      Traditional check-in
                    </Text>
                    {attendanceMode === "manual" && (
                      <View style={styles.selectedIndicator}>
                        <CheckCircle size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeCard,
                    attendanceMode === "qr" && styles.modeCardSelected,
                  ]}
                  onPress={() => setAttendanceMode("qr")}
                >
                  <LinearGradient
                    colors={attendanceMode === "qr" ? [Colors.secondary, Colors.secondaryLight] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={styles.modeCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.modeIconContainer}>
                      <Mail size={24} color={attendanceMode === "qr" ? "#FFFFFF" : Colors.textSecondary} />
                    </View>
                    <Text style={[
                      styles.modeCardTitle,
                      { color: attendanceMode === "qr" ? "#FFFFFF" : Colors.text }
                    ]}>
                      QR Code
                    </Text>
                    <Text style={[
                      styles.modeCardDescription,
                      { color: attendanceMode === "qr" ? "rgba(255,255,255,0.8)" : Colors.textSecondary }
                    ]}>
                      Scan QR codes
                    </Text>
                    {attendanceMode === "qr" && (
                      <View style={styles.selectedIndicator}>
                        <CheckCircle size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeCard,
                    attendanceMode === "faceid" && styles.modeCardSelected,
                  ]}
                  onPress={() => setAttendanceMode("faceid")}
                >
                  <LinearGradient
                    colors={attendanceMode === "faceid" ? ['#6366F1', '#8B5CF6'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={styles.modeCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.modeIconContainer}>
                      <User size={24} color={attendanceMode === "faceid" ? "#FFFFFF" : Colors.textSecondary} />
                    </View>
                    <Text style={[
                      styles.modeCardTitle,
                      { color: attendanceMode === "faceid" ? "#FFFFFF" : Colors.text }
                    ]}>
                      Face ID
                    </Text>
                    <Text style={[
                      styles.modeCardDescription,
                      { color: attendanceMode === "faceid" ? "rgba(255,255,255,0.8)" : Colors.textSecondary }
                    ]}>
                      Facial recognition
                    </Text>
                    {attendanceMode === "faceid" && (
                      <View style={styles.selectedIndicator}>
                        <CheckCircle size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            <Input
              label="Username"
              placeholder="Enter your username"
              value={userName}
              onChangeText={setUserName}
              autoCapitalize="none"
              error={userNameError}
              leftIcon={<User size={20} color={Colors.textSecondary} />}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              error={passwordError}
              isPassword
              leftIcon={<Lock size={20} color={Colors.textSecondary} />}
            />

            <Button
              title={loginSuccess ? "Signed In!" : "Sign In"}
              onPress={handleLogin}
              isLoading={isLoading}
              style={styles.button}
              icon={
                loginSuccess ? (
                  <CheckCircle size={20} color="#FFFFFF" />
                ) : undefined
              }
              iconPosition={loginSuccess ? "left" : undefined}
            />

            {/* <View style={styles.demoContainer}>
              <Text style={styles.demoText}>Quick Access:</Text>
              <View style={styles.demoButtons}>
                <TouchableOpacity
                  style={styles.demoButton}
                  onPress={() => handleDemoLogin("ashik")}
                >
                  <LinearGradient
                    colors={[Colors.primaryLight, Colors.primary]}
                    style={styles.demoButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.demoButtonText}>Admin</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoButton}
                  onPress={() => handleDemoLogin("shankar")}
                >
                  <LinearGradient
                    colors={[Colors.secondaryLight, Colors.secondary]}
                    style={styles.demoButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.demoButtonText}>Employee</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoButton}
                  onPress={() => router.replace("/baseurl")}
                >
                  <LinearGradient
                    colors={[Colors.secondaryLight, Colors.secondary]}
                    style={styles.demoButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.demoButtonText}>Base URL</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View> */}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  errorContainer: {
    backgroundColor: Colors.error + "20", // 20% opacity
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
  },
  button: {
    marginTop: 16,
  },
  demoContainer: {
    marginTop: 32,
    alignItems: "center",
  },
  demoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  demoButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    width: "100%",
    maxWidth: 360, // Optional: limits container width for better look on wide screens
  },
  demoButton: {
    flexBasis: "30%", // Each button takes ~1/3rd of space
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  demoButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  demoButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  attendanceModeContainer: {
    marginBottom: 24,
  },
  attendanceModeLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  modeCardContainer: {
    gap: 12,
  },
  modeCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modeCardSelected: {
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modeCardGradient: {
    padding: 20,
    position: "relative",
  },
  modeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modeCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  modeCardDescription: {
    fontSize: 14,
    fontWeight: "500",
  },
  selectedIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
});