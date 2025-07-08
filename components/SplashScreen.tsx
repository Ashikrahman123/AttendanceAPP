import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { User, Clock, Calendar } from "lucide-react-native";
import Colors from "@/constants/colors";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Start animations in sequence
    Animated.sequence([
      // Fade in and scale up logo
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),

      // Fade in text
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),

      // Progress animation
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }),

      // Wait a bit before finishing
      Animated.delay(500),
    ]).start(() => {
      // Call onFinish when animations complete
      onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={["#FFFFFF", "#F3F4F6"]}
          style={styles.logoCircle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <User size={60} color={Colors.primary} />
        </LinearGradient>
      </Animated.View>

      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textFadeAnim,
            transform: [
              {
                translateY: textFadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.title}>Face Attendance</Text>
        <Text style={styles.subtitle}>
          Track Time • Manage Breaks • Verify Presence
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.featuresContainer,
          {
            opacity: textFadeAnim,
          },
        ]}
      >
        <View style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <Clock size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.featureText}>Accurate Time Tracking</Text>
        </View>

        <View style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <Calendar size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.featureText}>Break Management</Text>
        </View>

        <View style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <User size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.featureText}>Face Verification</Text>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.loadingContainer,
          {
            opacity: textFadeAnim,
          },
        ]}
      >
        <View style={styles.loadingBar}>
          <Animated.View
            style={[
              styles.loadingProgress,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.loadingText}>Loading...</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 40,
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
  featuresContainer: {
    alignItems: "flex-start",
    marginBottom: 60,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  loadingContainer: {
    position: "absolute",
    bottom: 60,
    width: "80%",
    alignItems: "center",
  },
  loadingBar: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  loadingProgress: {
    height: "100%",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
});
