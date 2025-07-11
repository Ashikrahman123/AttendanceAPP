import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  Switch,
  TextInput,
  Platform,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { 
  User, 
  Mail, 
  Shield, 
  Settings, 
  ChevronRight, 
  LogOut, 
  X, 
  Save,
  Moon,
  Bell,
  Camera,
  MapPin,
  Calendar1,
  FileCheck
} from "lucide-react-native";
import UserAvatar from "@/components/UserAvatar";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { useColors } from "@/hooks/useColors";
import { useAuthStore } from "@/store/auth-store";
import { useAttendanceStore } from "@/store/attendance-store";
import { useLeaveStore } from "@/store/leave-store";
import { formatHours } from "@/utils/date-formatter";
import { AppSettings, WorkingHoursSettings, LeaveRequest } from "@/types/user";
import { useThemeStore } from "@/store/theme-store";
import LoadingOverlay from "@/components/LoadingOverlay";
import { registerFace, getRegisteredFace } from "@/utils/face-recognition";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import QRGenerator from '@/components/QRGenerator';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const colors = useColors();
  const { user, logout, updateUser } = useAuthStore();
  const { records, summaries } = useAttendanceStore();
  const { fetchLeaveBalance, fetchLeaveRequests, submitLeaveRequest } =
    useLeaveStore();
  const { theme, setTheme, isDarkMode, toggleTheme } = useThemeStore();

  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [showLeaveManagementModal, setShowLeaveManagementModal] =
    useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFaceRegistrationModal, setShowFaceRegistrationModal] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState({
    annual: 0,
    sick: 0,
    personal: 0,
  });
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [registeredFace, setRegisteredFace] = useState<string | null>(null);

  // Camera state
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraType>("front");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Camera ref
  const cameraRef = React.useRef<any>(null);

  // Working hours settings
  const [workingHours, setWorkingHours] = useState<WorkingHoursSettings>({
    regularHours: user?.regularHours || 8,
    startTime: "09:00",
    endTime: "17:00",
    breakDuration: 60,
  });

  // App settings
  const [appSettings, setAppSettings] = useState<AppSettings>({
    theme: theme,
    notifications: true,
    faceVerificationRequired: true,
    locationTracking: true,
  });

  // Leave request form
  const [leaveRequest, setLeaveRequest] = useState({
    startDate: new Date(),
    endDate: new Date(),
    reason: "",
    type: "vacation" as "vacation" | "sick" | "personal" | "other",
  });

  const [isCheckingFace, setIsCheckingFace] = useState(true);
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [showQRGenerator, setShowQRGenerator] = useState(false);

  useEffect(() => {
    if (user) {
      loadLeaveData();
      checkRegisteredFace();
      loadBaseUrl();
    }
  }, [user]);

  useEffect(() => {
    // Update app settings when theme changes
    setAppSettings((prev) => ({
      ...prev,
      theme: theme,
    }));
  }, [theme]);

  const loadLeaveData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const balance = await fetchLeaveBalance(user.id);
      if (balance) {
        setLeaveBalance({
          annual: balance.annual,
          sick: balance.sick,
          personal: balance.personal,
        });
      }

      const requests = await fetchLeaveRequests(user.id);
      setLeaveRequests(requests);
    } catch (error) {
      console.error("Error loading leave data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkRegisteredFace = async () => {
    if (!user) return;

    try {
      const faceData = await getRegisteredFace(user.contactRecordId.toString());
      setRegisteredFace(faceData);
    } catch (error) {
      console.error("Error checking registered face:", error);
    } finally {
      setIsCheckingFace(false);
    }
  };

  const loadBaseUrl = async () => {
    try {
      const url = await AsyncStorage.getItem('baseUrl');
      if (url) {
        setBaseUrl(url);
      }
    } catch (error) {
      console.error('Error loading base URL:', error);
    }
  };

  if (!user) return null;

  const userRecords = records.filter((record) => record.userId === user.id);
  const checkIns = userRecords.filter(
    (record) => record.type === "check-in",
  ).length;
  const checkOuts = userRecords.filter(
    (record) => record.type === "check-out",
  ).length;

  // Calculate total hours worked
  const userSummaries = summaries.filter(
    (summary) => summary.userId === user.id,
  );
  const totalHoursWorked = userSummaries.reduce(
    (total, summary) => total + summary.totalHours,
    0,
  );
  const totalOvertimeHours = userSummaries.reduce(
    (total, summary) => total + summary.overtimeHours,
    0,
  );

  const handleLogout = async () => {
    Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setIsLoading(true);
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          try {
            await logout();
            // Router will handle navigation in the auth store
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to log out. Please try again.");
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const handleSaveWorkingHours = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Update user with new regular hours
    updateUser({ regularHours: workingHours.regularHours });

    Alert.alert(
      "Settings Saved",
      "Your working hours settings have been updated.",
      [{ text: "OK" }],
    );

    setShowWorkingHoursModal(false);
  };

  const handleSaveAppSettings = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Apply theme change
    setTheme(appSettings.theme);

    Alert.alert("Settings Saved", "Your app settings have been updated.", [
      { text: "OK" },
    ]);

    setShowSettingsModal(false);
  };

  const handleSubmitLeaveRequest = async () => {
    if (!user) return;

    if (!leaveRequest.reason.trim()) {
      Alert.alert("Error", "Please provide a reason for your leave request.");
      return;
    }

    setIsLoading(true);

    try {
      await submitLeaveRequest({
        userId: user.id,
        userName: user.name,
        startDate: leaveRequest.startDate.getTime(),
        endDate: leaveRequest.endDate.getTime(),
        reason: leaveRequest.reason,
        type: leaveRequest.type,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        "Request Submitted",
        "Your leave request has been submitted successfully.",
        [{ text: "OK" }],
      );

      // Reset form and reload data
      setLeaveRequest({
        startDate: new Date(),
        endDate: new Date(),
        reason: "",
        type: "vacation",
      });

      await loadLeaveData();
      setShowLeaveManagementModal(false);
    } catch (error) {
      console.error("Error submitting leave request:", error);
      Alert.alert("Error", "Failed to submit leave request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptureFace = async () => {
    if (!cameraRef.current || !cameraReady) {
      Alert.alert("Error", "Camera is not ready. Please try again.");
      return;
    }

    setIsLoading(true);

    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      setCapturedImage(photo.uri);

      // Register the face
      const success = await registerFace(
        photo.uri,
        user.contactRecordId.toString(),
      );

      if (success) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        Alert.alert(
          "Face Registered",
          "Your face has been successfully registered for verification.",
          [
            {
              text: "OK",
              onPress: () => {
                setShowFaceRegistrationModal(false);
                checkRegisteredFace();
              },
            },
          ],
        );
      } else {
        throw new Error("Failed to register face");
      }
    } catch (error) {
      console.error("Error capturing face:", error);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      Alert.alert(
        "Registration Failed",
        "Failed to register your face. Please try again.",
        [
          {
            text: "OK",
            onPress: () => setCapturedImage(null),
          },
        ],
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetakeFace = () => {
    setCapturedImage(null);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      <ScrollView>
        {/* <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        </View> */}

        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <UserAvatar
            name={user.name}
            imageUrl={user.profileImage}
            size={80}
            showBorder
          />

          <Text style={[styles.userName, { color: colors.text }]}>
            {user.name}
          </Text>
          <Text style={[styles.userRole, { color: colors.textSecondary }]}>
            {user.role === "admin" ? "Administrator" : "Employee"}
          </Text>

          {/* <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {formatHours(totalHoursWorked)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Total Hours
              </Text>
            </View>

            <View
              style={[styles.statDivider, { backgroundColor: colors.border }]}
            />

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {formatHours(totalOvertimeHours)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Overtime
              </Text>
            </View>

            <View
              style={[styles.statDivider, { backgroundColor: colors.border }]}
            />

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {checkIns}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Days Worked
              </Text>
            </View>
          </View> */}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Account Information
          </Text>

          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <View style={styles.infoItem}>
              <View
                style={[
                  styles.infoIcon,
                  { backgroundColor: colors.primaryLight + "40" },
                ]}
              >
                <User size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Full Name
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {user.name}
                </Text>
              </View>
            </View>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            <View style={styles.infoItem}>
              <View
                style={[
                  styles.infoIcon,
                  { backgroundColor: colors.primaryLight + "40" },
                ]}
              >
                <Mail size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Email
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {user.email}
                </Text>
              </View>
            </View>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            <View style={styles.infoItem}>
              <View
                style={[
                  styles.infoIcon,
                  { backgroundColor: colors.primaryLight + "40" },
                ]}
              >
                <Shield size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Role
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {user.role === "admin" ? "Administrator" : "Employee"}
                </Text>
              </View>
            </View>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            {/* <View style={styles.infoItem}>
              <View
                style={[
                  styles.infoIcon,
                  { backgroundColor: colors.primaryLight + "40" },
                ]}
              >
                <Clock8 size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Regular Hours
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {user.regularHours || 8} hours per day
                </Text>
              </View>
            </View> */}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Settings
          </Text>

          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            {/* <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => setShowWorkingHoursModal(true)}
            >
              <View style={styles.settingsLeft}>
                <View
                  style={[
                    styles.settingsIcon,
                    { backgroundColor: colors.primaryLight + "30" },
                  ]}
                >
                  <Clock size={20} color={colors.primary} />
                </View>
                <Text style={[styles.settingsText, { color: colors.text }]}>
                  Working Hours
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => setShowLeaveManagementModal(true)}
            >
              <View style={styles.settingsLeft}>
                <View
                  style={[
                    styles.settingsIcon,
                    { backgroundColor: colors.secondaryLight + "30" },
                  ]}
                >
                  <Calendar size={20} color={colors.secondary} />
                </View>
                <Text style={[styles.settingsText, { color: colors.text }]}>
                  Leave Management
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => setShowReportsModal(true)}
            >
              <View style={styles.settingsLeft}>
                <View
                  style={[
                    styles.settingsIcon,
                    { backgroundColor: colors.info + "30" },
                  ]}
                >
                  <FileText size={20} color={colors.info} />
                </View>
                <Text style={[styles.settingsText, { color: colors.text }]}>
                  Attendance Reports
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            <View>
              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => setShowFaceRegistrationModal(true)}
              >
                <View style={styles.settingsLeft}>
                  <View
                    style={[
                      styles.settingsIcon,
                      { backgroundColor: colors.warning + "30" },
                    ]}
                  >
                    <Camera size={20} color={colors.warning} />
                  </View>
                  <Text style={[styles.settingsText, { color: colors.text }]}>
                    {registeredFace ? "Update Face ID" : "Register Face ID"}
                  </Text>
                </View>
                {registeredFace ? (
                  <View
                    style={[
                      styles.registeredBadge,
                      { backgroundColor: colors.success + "20" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.registeredBadgeText,
                        { color: colors.success },
                      ]}
                    >
                      Registered
                    </Text>
                  </View>
                ) : (
                  <ChevronRight size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            /> */}

            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => setShowSettingsModal(true)}
            >
              <View style={styles.settingsLeft}>
                <View
                  style={[
                    styles.settingsIcon,
                    { backgroundColor: colors.cardAlt },
                  ]}
                >
                  <Settings size={20} color={colors.textSecondary} />
                </View>
                <Text style={[styles.settingsText, { color: colors.text }]}>
                  App Settings
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.logoutContainer}>
          <Button
            title="Log Out"
            onPress={handleLogout}
            variant="outline"
            icon={<LogOut size={20} color={colors.primary} />}
          />
        </View>

        <View style={styles.actionButtons}>
            <Button
              title={registeredFace ? "Update Face ID" : "Register Face ID"}
              onPress={() => router.push("/register-face")}
              style={styles.actionButton}
            />

            <Button
              title="View Stored Faces"
              variant="outline"
              onPress={() => router.push("/stored-faces")}
              style={styles.actionButton}
            />

            {user.role === 'admin' && (
              <Button
                title={showQRGenerator ? "Hide QR Codes" : "Show QR Codes"}
                variant="outline"
                onPress={() => setShowQRGenerator(!showQRGenerator)}
                style={styles.actionButton}
              />
            )}
          </View>

          {user.role === 'admin' && showQRGenerator && baseUrl && (
            <QRGenerator baseUrl={baseUrl} branchCode="HO01" />
          )}
      </ScrollView>

      {/* Working Hours Modal */}
      {/* <Modal
        visible={showWorkingHoursModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWorkingHoursModal(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: "rgba(0, 0, 0, 0.5)" },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Working Hours
              </Text>
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.cardAlt },
                ]}
                onPress={() => setShowWorkingHoursModal(false)}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Regular Hours Per Day
                </Text>
                <View
                  style={[
                    styles.hoursInputContainer,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.hoursInput, { color: colors.text }]}
                    value={workingHours.regularHours.toString()}
                    onChangeText={(text) => {
                      const hours = parseInt(text) || 8;
                      setWorkingHours({ ...workingHours, regularHours: hours });
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text
                    style={[styles.hoursUnit, { color: colors.textSecondary }]}
                  >
                    hours
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Start Time
                </Text>
                <TextInput
                  style={[
                    styles.timeInput,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                      color: colors.text,
                    },
                  ]}
                  value={workingHours.startTime}
                  onChangeText={(text) =>
                    setWorkingHours({ ...workingHours, startTime: text })
                  }
                  placeholder="09:00"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  End Time
                </Text>
                <TextInput
                  style={[
                    styles.timeInput,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                      color: colors.text,
                    },
                  ]}
                  value={workingHours.endTime}
                  onChangeText={(text) =>
                    setWorkingHours({ ...workingHours, endTime: text })
                  }
                  placeholder="17:00"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Break Duration
                </Text>
                <View
                  style={[
                    styles.hoursInputContainer,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.hoursInput, { color: colors.text }]}
                    value={workingHours.breakDuration.toString()}
                    onChangeText={(text) => {
                      const duration = parseInt(text) || 60;
                      setWorkingHours({
                        ...workingHours,
                        breakDuration: duration,
                      });
                    }}
                    keyboardType="numeric"
                    maxLength={3}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text
                    style={[styles.hoursUnit, { color: colors.textSecondary }]}
                  >
                    minutes
                  </Text>
                </View>
              </View>

              <View
                style={[styles.modalNote, { backgroundColor: colors.cardAlt }]}
              >
                <Text
                  style={[styles.noteText, { color: colors.textSecondary }]}
                >
                  Note: These settings will be used to calculate your working
                  hours and overtime.
                </Text>
              </View>
            </ScrollView>

            <View
              style={[styles.modalFooter, { borderTopColor: colors.border }]}
            >
              <Button
                title="Save Changes"
                onPress={handleSaveWorkingHours}
                icon={<Save size={20} color="#FFFFFF" />}
              />
            </View>
          </View>
        </View>
      </Modal> */}

      {/* Leave Management Modal */}
      {/* <Modal
        visible={showLeaveManagementModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLeaveManagementModal(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: "rgba(0, 0, 0, 0.5)" },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Leave Management
              </Text>
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.cardAlt },
                ]}
                onPress={() => setShowLeaveManagementModal(false)}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View
                style={[
                  styles.leaveBalanceContainer,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.leaveBalanceTitle, { color: colors.text }]}
                >
                  Leave Balance
                </Text>

                <View style={styles.leaveBalanceRow}>
                  <View style={styles.leaveBalanceItem}>
                    <Text
                      style={[
                        styles.leaveBalanceValue,
                        { color: colors.primary },
                      ]}
                    >
                      {leaveBalance.annual}
                    </Text>
                    <Text
                      style={[
                        styles.leaveBalanceLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Annual
                    </Text>
                  </View>

                  <View style={styles.leaveBalanceItem}>
                    <Text
                      style={[
                        styles.leaveBalanceValue,
                        { color: colors.primary },
                      ]}
                    >
                      {leaveBalance.sick}
                    </Text>
                    <Text
                      style={[
                        styles.leaveBalanceLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Sick
                    </Text>
                  </View>

                  <View style={styles.leaveBalanceItem}>
                    <Text
                      style={[
                        styles.leaveBalanceValue,
                        { color: colors.primary },
                      ]}
                    >
                      {leaveBalance.personal}
                    </Text>
                    <Text
                      style={[
                        styles.leaveBalanceLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Personal
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.leaveRequestsContainer,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    marginTop: 20,
                    marginBottom: 20,
                  },
                ]}
              >
                <Text
                  style={[styles.leaveRequestsTitle, { color: colors.text }]}
                >
                  Recent Leave Requests
                </Text>

                {leaveRequests.length > 0 ? (
                  leaveRequests.map((request) => (
                    <View
                      key={request.id}
                      style={[
                        styles.leaveRequestItem,
                        {
                          borderBottomColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.leaveRequestHeader}>
                        <View
                          style={[
                            styles.leaveRequestBadge,
                            {
                              backgroundColor:
                                request.status === "approved"
                                  ? colors.success + "20"
                                  : request.status === "rejected"
                                    ? colors.error + "20"
                                    : colors.warning + "20",
                              borderColor:
                                request.status === "approved"
                                  ? colors.success
                                  : request.status === "rejected"
                                    ? colors.error
                                    : colors.warning,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.leaveRequestBadgeText,
                              {
                                color:
                                  request.status === "approved"
                                    ? colors.success
                                    : request.status === "rejected"
                                      ? colors.error
                                      : colors.warning,
                              },
                            ]}
                          >
                            {request.status.charAt(0).toUpperCase() +
                              request.status.slice(1)}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.leaveRequestDate,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {formatDate(new Date(request.startDate))} -{" "}
                          {formatDate(new Date(request.endDate))}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.leaveRequestType,
                          { color: colors.text },
                        ]}
                      >
                        {request.type.charAt(0).toUpperCase() +
                          request.type.slice(1)}{" "}
                        Leave
                      </Text>
                      <Text
                        style={[
                          styles.leaveRequestReason,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {request.reason}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyLeaveRequests}>
                    <Calendar size={48} color={colors.textLight} />
                    <Text
                      style={[
                        styles.emptyLeaveRequestsText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      You have no recent leave requests
                    </Text>
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.newLeaveRequestContainer```text
,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.newLeaveRequestTitle, { color: colors.text }]}
                >
                  New Leave Request
                </Text>

                <View style={styles.leaveFormGroup}>
                  <Text style={[styles.leaveFormLabel, { color: colors.text }]}>
                    Leave Type
                  </Text>
                  <View style={styles.leaveTypeButtons}>
                    {["vacation", "sick", "personal", "other"].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.leaveTypeButton,
                          leaveRequest.type === type && [
                            styles.leaveTypeButtonActive,
                            {
                              backgroundColor: colors.primary + "20",
                              borderColor: colors.primary,
                            },
                          ],
                          { borderColor: colors.border },
                        ]}
                        onPress={() =>
                          setLeaveRequest({
                            ...leaveRequest,
                            type: type as any,
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.leaveTypeButtonText,
                            { color: colors.textSecondary },
                            leaveRequest.type === type && {
                              color: colors.primary,
                            },
                          ]}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.leaveFormGroup}>
                  <Text style={[styles.leaveFormLabel, { color: colors.text }]}>
                    Start Date
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.datePickerButton,
                      {
                        backgroundColor: colors.cardAlt,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => {
                      Alert.alert(
                        "Date Selection",
                        "Date picker will be implemented in the next update.",
                        [{ text: "OK" }],
                      );
                    }}
                  >
                    <Calendar1 size={20} color={colors.primary} />
                    <Text
                      style={[styles.datePickerText, { color: colors.text }]}
                    >
                      {formatDate(leaveRequest.startDate)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.leaveFormGroup}>
                  <Text style={[styles.leaveFormLabel, { color: colors.text }]}>
                    End Date
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.datePickerButton,
                      {
                        backgroundColor: colors.cardAlt,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => {
                      Alert.alert(
                        "Date Selection",
                        "Date picker will be implemented in the next update.",
                        [{ text: "OK" }],
                      );
                    }}
                  >
                    <Calendar1 size={20} color={colors.primary} />
                    <Text
                      style={[styles.datePickerText, { color: colors.text }]}
                    >
                      {formatDate(leaveRequest.endDate)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.leaveFormGroup}>
                  <Text style={[styles.leaveFormLabel, { color: colors.text }]}>
                    Reason
                  </Text>
                  <TextInput
                    style={[
                      styles.leaveReasonInput,
                      {
                        backgroundColor: colors.cardAlt,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    value={leaveRequest.reason}
                    onChangeText={(text) =>
                      setLeaveRequest({ ...leaveRequest, reason: text })
                    }
                    placeholder="Enter reason for leave"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </ScrollView>

            <View
              style={[styles.modalFooter, { borderTopColor: colors.border }]}
            >
              <Button
                title="Submit Request"
                onPress={handleSubmitLeaveRequest}
                variant="gradient"
              />
            </View>
          </View>
        </View>
      </Modal> */}

      {/* Reports Modal */}
      {/* <Modal
        visible={showReportsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReportsModal(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: "rgba(0, 0, 0, 0.5)" },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Attendance Reports
              </Text>
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.cardAlt },
                ]}
                onPress={() => setShowReportsModal(false)}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View
                style={[
                  styles.reportTypesContainer,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.reportTypeItem}
                  onPress={() => {
                    Alert.alert(
                      "Monthly Report",
                      "Your monthly attendance report is being generated. It will be available for download shortly.",
                      [{ text: "OK" }],
                    );
                  }}
                >
                  <View
                    style={[
                      styles.reportTypeIcon,
                      { backgroundColor: colors.primaryLight + "30" },
                    ]}
                  >
                    <CalendarRange size={24} color={colors.primary} />
                  </View>
                  <View style={styles.reportTypeContent}>
                    <Text
                      style={[styles.reportTypeName, { color: colors.text }]}
                    >
                      Monthly Report
                    </Text>
                    <Text
                      style={[
                        styles.reportTypeDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Summary of your attendance for the current month
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />

                <TouchableOpacity
                  style={styles.reportTypeItem}
                  onPress={() => {
                    Alert.alert(
                      "Overtime Report",
                      "Your overtime report is being generated. It will be available for download shortly.",
                      [{ text: "OK" }],
                    );
                  }}
                >
                  <View
                    style={[
                      styles.reportTypeIcon,
                      { backgroundColor: colors.secondaryLight + "30" },
                    ]}
                  >
                    <Clock size={24} color={colors.secondary} />
                  </View>
                  <View style={styles.reportTypeContent}>
                    <Text
                      style={[styles.reportTypeName, { color: colors.text }]}
                    >
                      Overtime Report
                    </Text>
                    <Text
                      style={[
                        styles.reportTypeDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Details of your overtime hours and approval status
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />

                <TouchableOpacity
                  style={styles.reportTypeItem}
                  onPress={() => {
                    Alert.alert(
                      "Custom Report",
                      "Please select a date range for your custom report.",
                      [{ text: "OK" }],
                    );
                  }}
                >
                  <View
                    style={[
                      styles.reportTypeIcon,
                      { backgroundColor: colors.info + "30" },
                    ]}
                  >
                    <FileText size={24} color={colors.info} />
                  </View>
                  <View style={styles.reportTypeContent}>
                    <Text
                      style={[styles.reportTypeName, { color: colors.text }]}
                    >
                      Custom Report
                    </Text>
                    <Text
                      style={[
                        styles.reportTypeDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Generate a report for a custom date range
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.reportActionsContainer,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    marginTop: 20,
                  },
                ]}
              >
                <Text
                  style={[styles.reportActionsTitle, { color: colors.text }]}
                >
                  Recent Reports
                </Text>

                <View style={styles.reportActionsList}>
                  <TouchableOpacity style={styles.reportActionItem}>
                    <View style={styles.reportActionLeft}>
                      <FileCheck size={20} color={colors.primary} />
                      <View>
                        <Text
                          style={[
                            styles.reportActionName,
                            { color: colors.text },
                          ]}
                        >
                          April 2023 Monthly Report
                        </Text>
                        <Text
                          style={[
                            styles.reportActionDate,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Generated on May 1, 2023
                        </Text>
                      </View>
                    </View>
                    <View style={styles.reportActionButtons}>
                      <TouchableOpacity
                        style={[
                          styles.reportActionButton,
                          { backgroundColor: colors.cardAlt },
                        ]}
                      >
                        <Download size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.reportActionButton,
                          { backgroundColor: colors.cardAlt },
                        ]}
                      >
                        <Share2 size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>

                  <View
                    style={[styles.divider, { backgroundColor: colors.border }]}
                  />

                  <TouchableOpacity style={styles.reportActionItem}>
                    <View style={styles.reportActionLeft}>
                      <FileCheck size={20} color={colors.primary} />
                      <View>
                        <Text
                          style={[
                            styles.reportActionName,
                            { color: colors.text },
                          ]}
                        >
                          Q1 2023 Overtime Report
                        </Text>
                        <Text
                          style={[
                            styles.reportActionDate,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Generated on April 5, 2023
                        </Text>
                      </View>
                    </View>
                    <View style={styles.reportActionButtons}>
                      <TouchableOpacity
                        style={[
                          styles.reportActionButton,
                          { backgroundColor: colors.cardAlt },
                        ]}
                      >
                        <Download size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.reportActionButton,
                          { backgroundColor: colors.cardAlt },
                        ]}
                      >
                        <Share2 size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View
              style={[styles.modalFooter, { borderTopColor: colors.border }]}
            >
              <Button
                title="Generate New Report"
                variant="primary"
                onPress={() => {
                  Alert.alert(
                    "Generate Report",
                    "Please select the type of report you want to generate.",
                    [{ text: "OK" }],
                  );
                }}
              />
            </View>
          </View>
        </View>
      </Modal> */}

      {/* App Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: "rgba(0, 0, 0, 0.5)" },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                App Settings
              </Text>
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.cardAlt },
                ]}
                onPress={() => setShowSettingsModal(false)}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View
                style={[
                  styles.settingGroup,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Moon size={20} color={colors.text} />
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      Dark Mode
                    </Text>
                  </View>
                  <Switch
                    value={isDarkMode}
                    onValueChange={toggleTheme}
                    trackColor={{
                      false: colors.border,
                      true: colors.primary + "40",
                    }}
                    thumbColor={isDarkMode ? colors.primary : colors.textSecondary}
                  />
                </View>

                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />

                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Bell size={20} color={colors.text} />
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      Notifications
                    </Text>
                  </View>
                  <Switch
                    value={appSettings.notifications}
                    onValueChange={(value) =>
                      setAppSettings({ ...appSettings, notifications: value })
                    }
                    trackColor={{
                      false: colors.border,
                      true: colors.primary + "40",
                    }}
                    thumbColor={
                      appSettings.notifications ? colors.primary : colors.textSecondary
                    }
                  />
                </View>

                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />

                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Camera size={20} color={colors.text} />
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      Face Verification Required
                    </Text>
                  </View>
                  <Switch
                    value={appSettings.faceVerificationRequired}
                    onValueChange={(value) =>
                      setAppSettings({
                        ...appSettings,
                        faceVerificationRequired: value,
                      })
                    }
                    trackColor={{
                      false: colors.border,
                      true: colors.primary + "40",
                    }}
                    thumbColor={
                      appSettings.faceVerificationRequired
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                </View>

                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />

                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <MapPin size={20} color={colors.text} />
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      Location Tracking
                    </Text>
                  </View>
                  <Switch
                    value={appSettings.locationTracking}
                    onValueChange={(value) =>
                      setAppSettings({ ...appSettings, locationTracking: value })
                    }
                    trackColor={{
                      false: colors.border,
                      true: colors.primary + "40",
                    }}
                    thumbColor={
                      appSettings.locationTracking ? colors.primary : colors.textSecondary
                    }
                  />
                </View>

                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />

                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => {
                    Alert.alert(
                      "Clear Base URL",
                      "Are you sure you want to clear Base URL? This will log you out and you'll need to enter a new Base URL.",
                      [
                        {
                          text: "Cancel",
                          style: "cancel",
                        },
                        {
                          text: "Yes",
                          style: "destructive",
                          onPress: async () => {
                            try {
                              await AsyncStorage.removeItem('baseUrl');
                              await logout();
                              router.replace('/baseurl');
                              setShowSettingsModal(false);
                            } catch (error) {
                              console.error('Error clearing base URL:', error);
                              Alert.alert('Error', 'Failed to clear base URL. Please try again.');
                            }
                          },
                        },
                      ]
                    );
                  }}
                >
                  <View style={styles.settingLeft}>
                    <Settings size={20} color={colors.error} />
                    <Text style={[styles.settingLabel, { color: colors.error }]}>
                      Clear Base URL
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View
              style={[styles.modalFooter, { borderTopColor: colors.border }]}
            >
              <Button
                title="Save Settings"
                onPress={handleSaveAppSettings}
                icon={<Save size={20} color="#FFFFFF" />}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Face Registration Modal */}
      <LoadingOverlay visible={isLoading} message="Please wait..." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  facePreviewContainer: {
    padding: 16,
    alignItems: "center",
  },
  facePreview: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: "#4F46E5",
  },
  container: {
    flex: 1,
  },
  actionButtons: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'column',
    gap: 12,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profileCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 12,
  },
  userRole: {
    fontSize: 14,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    marginTop: 20,
    width: "100%",
    justifyContent: "center",
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: "100%",
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoItem: {
    flexDirection: "row",
    padding: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
  },
  divider: {
    height: 1,
  },
  settingsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  settingsLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingsText: {
    fontSize: 16,
  },
  registeredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  registeredBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  logoutContainer: {
    padding: 20,
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    padding: 20,
    maxHeight: "60%",
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  hoursInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  hoursInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  hoursUnit: {
    fontSize: 16,
    marginLeft: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  modalNote: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  noteText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  leaveBalanceContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  leaveBalanceTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  leaveBalanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  leaveBalanceItem: {
    alignItems: "center",
    flex: 1,
  },
  leaveBalanceValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  leaveBalanceLabel: {
    fontSize: 12,
  },
  leaveRequestsContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  leaveRequestsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  emptyLeaveRequests: {
    alignItems: "center",
    padding: 24,
  },
  emptyLeaveRequestsText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
  reportTypesContainer: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  reportTypeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  reportTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  reportTypeContent: {
    flex: 1,
  },
  reportTypeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  reportTypeDescription: {
    fontSize: 12,
  },
  settingGroup: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  newLeaveRequestContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  newLeaveRequestTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  leaveFormGroup: {
    marginBottom: 16,
  },
  leaveFormLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  leaveTypeButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  leaveTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: "center",
  },
  leaveTypeButtonActive: {
    borderWidth: 1,
  },
  leaveTypeButtonText: {
    fontSize: 14,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  datePickerText: {
    fontSize: 16,
  },
  leaveReasonInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  leaveRequestItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  leaveRequestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  leaveRequestBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  leaveRequestBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  leaveRequestDate: {
    fontSize: 12,
  },
  leaveRequestType: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  leaveRequestReason: {
    fontSize: 14,
  },
  reportActionsContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  reportActionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  reportActionsList: {
    gap: 12,
  },
  reportActionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reportActionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  reportActionName: {
    fontSize: 14,
    fontWeight: "500",
  },
  reportActionDate: {
    fontSize: 12,
  },
  reportActionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  reportActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  // Face registration styles
  faceRegistrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  faceCamera: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  faceCameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  faceGuide: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  faceGuideInner: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderStyle: "dashed",
  },
  cameraControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    width: "100%",
  },
  flipCameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    left: 20,
  },
  captureFaceButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraInstructions: {
    marginTop: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  cameraPermissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cameraPermissionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  cameraPermissionText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  cameraPermissionButton: {
    width: "80%",
  },
  capturedFaceContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  capturedFaceImage: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 12,
  },
  capturedFaceControls: {
    flexDirection: "column",
    width: "100%",
    marginTop: 20,
    gap: 12,
  },
  useFaceButton: {
    width: "100%",
  },
  retakeFaceButton: {
    width: "100%",
  },
});