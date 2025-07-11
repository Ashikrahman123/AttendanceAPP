import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  Animated,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { 
  CheckCircle, 
  XCircle, 
  Coffee, 
  Timer, 
  MapPin, 
  Calendar,
  Clock,
  BarChart3,
  User,
  Scan
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import UserAvatar from '@/components/UserAvatar';
import { useAuthStore } from '@/store/auth-store';
import { formatTime, formatHours, formatDate } from '@/utils/date-formatter';
import { getCurrentLocation, getAddressFromCoordinates } from '@/utils/location-service';
import { AttendanceType } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  

  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState<"manual" | "qr" | "faceid">("manual");

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  

  useEffect(() => {
    // Start animations
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
    ]).start();

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Get current location on mount
    fetchCurrentLocation();

    return () => clearInterval(timer);
  }, []);

  const fetchCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation();
      const { latitude, longitude } = location.coords;
      const address = await getAddressFromCoordinates(latitude, longitude);
      setCurrentAddress(address);
    } catch (error) {
      console.error("Error fetching location:", error);
    }
  };

  const handleAttendance = async () => {
    if (!user) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Navigate to face verification screen
    router.push({
      pathname: "/face-verification",
      params: {
        
      },
    });
  };

  const handleManualAttendance = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Get current location for location code
      const location = await getCurrentLocation();
      const { latitude, longitude } = location.coords;

      

      Alert.alert(
        'Success',
        ` recorded successfully!`,
        [{ text: 'OK' }]
      );

      
    } catch (error) {
      console.error('Failed to record attendance:', error);
      Alert.alert(
        'Error',
        'Failed to record attendance. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getActionSuccessMessage = (action: AttendanceType): string => {
    switch (action) {
      case "check-in":
        return "You have successfully checked in.";
      case "break-start":
        return "Your break has started.";
      case "break-end":
        return "Your break has ended.";
      case "check-out":
        return "You have successfully checked out.";
      default:
        return "Action recorded successfully.";
    }
  };

  const getActionButtonText = (action: AttendanceType | null): string => {
    switch (action) {
      case "check-in":
        return "Check In with Face ID";
      case "break-start":
        return "Start Break with Face ID";
      case "break-end":
        return "End Break with Face ID";
      case "check-out":
        return "Check Out with Face ID";
      default:
        return "Day Complete";
    }
  };

  const getManualActionButtonText = (action: AttendanceType | null): string => {
    switch (action) {
      case "check-in":
        return "Manual Check In";
      case "break-start":
        return "Manual Break Start";
      case "break-end":
        return "Manual Break End";
      case "check-out":
        return "Manual Check Out";
      default:
        return "Day Complete";
    }
  };

  const getStatusText = (): string => {
    return "Not checked in";
  };

  const getStatusColor = (): string => {
    return Colors.textSecondary;
  };

  const getStatusIcon = () => {
    return <Clock size={16} color={Colors.textSecondary} />;
  };

  useEffect(() => {
    const loadAttendanceMode = async () => {
      try {
        const mode = await AsyncStorage.getItem("attendanceMode");
        if (mode === "qr" || mode === "manual" || mode === "faceid") {
          setAttendanceMode(mode);
        }
      } catch (error) {
        console.error("Error loading attendance mode:", error);
      }
    };
    loadAttendanceMode();
  }, []);

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.userInfo}>
            <UserAvatar
              name={user.name}
              imageUrl={user.profileImage}
              size={50}
              showBorder
            />
            <View style={styles.userDetails}>
              <Text style={styles.greeting}>
                Hello, {user?.name ? user.name.split(" ")[0] : "User"}
              </Text>
              <Text style={styles.role}>
                {user.role === "admin" ? "Administrator" : "Employee"}
              </Text>
              <Text style={styles.attendanceModeText}>
                Attendance Mode: {attendanceMode === "qr" ? "QR Code" : attendanceMode === "manual" ? "Manual" : "Face ID"}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.timeCardContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            style={styles.timeCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.timeInfo}>
              <Text style={styles.date}>
                {formatDate(currentTime.getTime())}
              </Text>
              <Text style={styles.time}>
                {formatTime(currentTime.getTime())}
              </Text>
            </View>

            <View style={styles.locationContainer}>
              <MapPin size={16} color="#FFFFFF" />
              <Text style={styles.location} numberOfLines={2}>
                {currentAddress || "Fetching location..."}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userDetails: {
    marginLeft: 12,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  role: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timeCardContainer: {
    margin: 20,
    marginBottom: 15,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  timeCard: {
    padding: 20,
    borderRadius: 16,
  },
  timeInfo: {
    alignItems: "center",
    marginBottom: 16,
  },
  date: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  time: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  location: {
    fontSize: 14,
    color: "#FFFFFF",
    flex: 1,
  },
  statusCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 15,
    padding: 20,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  lastRecordContainer: {
    backgroundColor: Colors.cardAlt,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  lastRecordInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  lastRecordText: {
    fontSize: 14,
    color: Colors.text,
  },
  verificationStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: "500",
  },
  noRecordContainer: {
    alignItems: "center",
    padding: 24,
    marginBottom: 16,
  },
  noRecordText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
  summaryContainer: {
    backgroundColor: Colors.cardAlt,
    padding: 16,
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  totalHours: {
    color: Colors.primary,
  },
  timelineContainer: {
    margin: 20,
    marginTop: 0,
    marginBottom: 15,
    padding: 20,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
    position: "relative",
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cardAlt,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    zIndex: 2,
  },
  timelineConnector: {
    position: "absolute",
    left: 15,
    top: 32,
    bottom: -16,
    width: 2,
    backgroundColor: Colors.border,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineTime: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  timelineAction: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  noTimelineContainer: {
    alignItems: "center",
    padding: 24,
  },
  noTimelineText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  actionContainer: {
    padding: 20,
    marginTop: "auto",
  },
  actionButton: {
    width: "100%",
  },
  manualButton: {
    marginTop: 12,
    alignItems: "center",
    padding: 12,
  },
  manualButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textDecorationLine: "underline",
  },
  dayCompleteContainer: {
    alignItems: "center",
    padding: 24,
    backgroundColor: Colors.success + "10", // 10% opacity
    borderRadius: 16,
  },
  dayCompleteText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.success,
    marginTop: 12,
    marginBottom: 4,
  },
  dayCompleteSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  storedFacesButton: {
    marginTop: 20,
  },
   attendanceModeText: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 5,
  },
});