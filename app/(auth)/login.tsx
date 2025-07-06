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

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [userNameError, setUserNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);

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
});
