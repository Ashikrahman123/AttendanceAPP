import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useColors } from "@/hooks/useColors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatTime } from "@/utils/date-formatter";

function EmployeeInfoScreen() {
  const params = useLocalSearchParams();
  const colors = useColors();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Employee data
  const [employeeData, setEmployeeData] = useState({
    name: params.name as string,
    id: params.id as string,
    contactRecordId: params.contactRecordId as string,
  });
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  const handleAttendanceAction = async (action: "CI" | "CO" | "SB" | "EB") => {
    console.log("[AttendanceAction] Starting attendance action:", action);
    try {
      setLoading(true);

      // Get required data from storage
      console.log("[AttendanceAction] Fetching auth data from storage");
      const [orgId, modifyUser, bearerToken] = await Promise.all([
        AsyncStorage.getItem("orgId"),
        AsyncStorage.getItem("userId"),
        AsyncStorage.getItem("bearerToken"),
      ]);

      console.log("[AttendanceAction] Auth data retrieved:", {
        orgId: orgId ? "Present" : "Missing",
        modifyUser: modifyUser ? "Present" : "Missing",
        bearerToken: bearerToken ? "Present" : "Missing",
      });

      // Validate required data
      if (!orgId || !modifyUser || !bearerToken) {
        console.error("[AttendanceAction] Missing required data:", {
          orgId: !orgId,
          modifyUser: !modifyUser,
          bearerToken: !bearerToken,
        });
        Alert.alert("Error", "Missing required authentication data");
        return;
      }

      // Get and validate base URL
      console.log("[AttendanceAction] Fetching base URL");
      const baseUrl = await AsyncStorage.getItem("baseUrl");
      if (!baseUrl) {
        console.error("[AttendanceAction] Base URL not configured");
        Alert.alert("Error", "Base URL not configured");
        return;
      }
      console.log("[AttendanceAction] Base URL:", baseUrl);

      const currentTime = new Date();
      const timeString = currentTime.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const requestBody = {
        DetailData: {
          OrgId: parseInt(orgId),
          Module: action,
          ModifyUser: parseInt(modifyUser),
          CreateUser: parseInt(modifyUser),
          Time: timeString,
          ContactRecordId: parseInt(employeeData.contactRecordId),
        },
        BearerTokenValue: bearerToken,
      };

      console.log("[AttendanceAction] Request payload:", {
        url: baseUrl + "MiddleWare/Employee_Attendance_Update",
        method: "POST",
        DetailData: {
          ...requestBody.DetailData,
          bearerToken: "HIDDEN",
        },
      });

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

      console.log("[AttendanceAction] Response status:", response.status);
      const data = await response.json();
      console.log("[AttendanceAction] API Response:", data);

      if (data.success) {
        if (action === "CI") {
          setIsCheckedIn(true);
          setClockInTime(new Date());
        }
        if (action === "CO") setIsCheckedIn(false);
        if (action === "SB") {
          setIsOnBreak(true);
          setBreakStartTime(new Date());
        }
        if (action === "EB") setIsOnBreak(false);

        Alert.alert("Success", data.message);
      } else {
        Alert.alert("Error", data.message || "Failed to update attendance");
      }
    } catch (error) {
      console.error("[AttendanceAction] Error:", {
        message: error instanceof Error ? error.message : "Unknown error",
        error,
      });
      Alert.alert("Error", "Failed to update attendance");
    } finally {
      console.log("[AttendanceAction] Completed attendance action:", action);
      setLoading(false);

      // Show welcome message when checking out and reset all times
      if (action === "CO") {
        setShowWelcomeMessage(true);
        setClockInTime(null);
        setBreakStartTime(null);
        setIsCheckedIn(false);
        setIsOnBreak(false);

        // Clear all displayed times on buttons
      }
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style="light" />
      <View style={styles.header}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.headerGradient}
        >
          <View style={styles.profileImageContainer}>
            {previewImage ? (
              <Image
                source={{ uri: previewImage }}
                style={styles.profileImage}
              />
            ) : (
              <View
                style={[
                  styles.profileImagePlaceholder,
                  { backgroundColor: colors.cardAlt },
                ]}
              >
                <Text style={[styles.profileImageText, { color: colors.text }]}>
                  {employeeData.name.charAt(0)}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{employeeData.name}</Text>
          <Text style={styles.position}>
            ({employeeData.contactRecordId})
          </Text>
        </LinearGradient>
      </View>

      <View style={styles.content}>
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.clockContainer}>
            <Text style={[styles.timeText, { color: colors.text }]}>
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </Text>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
        </View>

        {showWelcomeMessage && (
          <View style={[styles.welcomeContainer, { backgroundColor: colors.card }]}>
            <Icon name="star" size={32} color={colors.primary} style={styles.welcomeIcon} />
            <Text style={[styles.welcomeMessage, { color: colors.text }]}>
              Thank you for your hard work today!
            </Text>
            <Text style={[styles.welcomeSubtext, { color: colors.textSecondary }]}>
              Have a wonderful evening and see you tomorrow!
            </Text>
          </View>
        )}

        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: colors.text }]}>
            {currentTime.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </Text>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>

        <View style={styles.attendanceGrid}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.attendanceButton,
                { backgroundColor: colors.card },
              ]}
              onPress={() => handleAttendanceAction("CI")}
              disabled={loading || isCheckedIn}
            >
              <View
                style={[styles.iconContainer, { backgroundColor: "#007AFF20" }]}
              >
                <Icon name="log-in-outline" size={24} color="#007AFF" />
              </View>
              <Text style={[styles.buttonTitle, { color: colors.text }]}>
                Clock In
              </Text>
              <Text
                style={[styles.buttonSubtitle, { color: colors.textSecondary }]}
              >
                {clockInTime
                  ? formatTime(clockInTime)
                  : "--:--"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.attendanceButton,
                { backgroundColor: colors.card },
              ]}
              onPress={() => handleAttendanceAction("CO")}
              disabled={loading || !isCheckedIn}
            >
              <View
                style={[styles.iconContainer, { backgroundColor: "#FF3B3020" }]}
              >
                <Icon name="log-out-outline" size={24} color="#FF3B30" />
              </View>
              <Text style={[styles.buttonTitle, { color: colors.text }]}>
                Clock Out
              </Text>
              <Text
                style={[styles.buttonSubtitle, { color: colors.textSecondary }]}
              >
                {isCheckedIn && !isOnBreak ? "--:--" : "--:--"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.attendanceButton,
                { backgroundColor: colors.card },
              ]}
              onPress={() => handleAttendanceAction("SB")}
              disabled={loading || !isCheckedIn || isOnBreak}
            >
              <View
                style={[styles.iconContainer, { backgroundColor: "#FF950020" }]}
              >
                <Icon name="play-outline" size={24} color="#FF9500" />
              </View>
              <Text style={[styles.buttonTitle, { color: colors.text }]}>
                Start Break
              </Text>
              <Text
                style={[styles.buttonSubtitle, { color: colors.textSecondary }]}
              >
                {breakStartTime
                  ? formatTime(breakStartTime)
                  : "--:--"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.attendanceButton,
                { backgroundColor: colors.card },
              ]}
              onPress={() => handleAttendanceAction("EB")}
              disabled={loading || !isOnBreak}
            >
              <View
                style={[styles.iconContainer, { backgroundColor: "#34C75920" }]}
              >
                <Icon name="stop-outline" size={24} color="#34C759" />
              </View>
              <Text style={[styles.buttonTitle, { color: colors.text }]}>
                End Break
              </Text>
              <Text
                style={[styles.buttonSubtitle, { color: colors.textSecondary }]}
              >
                {isOnBreak ? "--:--" : "--:--"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 280,
  },
  headerGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  profileImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageText: {
    fontSize: 48,
    fontWeight: "bold",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  position: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  content: {
    flex: 1,
    padding: 20,
    marginTop: -40,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    width: "100%",
  },
  timeContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  timeText: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
  },
  attendanceGrid: {
    gap: 16,
    marginTop: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  attendanceButton: {
    flex: 1,
    height: 110,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  buttonTitle: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 12,
    textAlign: "center",
  },
  welcomeContainer: {
    marginTop: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  welcomeMessage: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  welcomeSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 5,
  },
  welcomeIcon: {
    marginBottom: 10,
  },
  clockContainer: {
    alignItems: "center",
    padding: 10,
  },
});

export default EmployeeInfoScreen;