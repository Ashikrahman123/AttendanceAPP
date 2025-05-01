import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Clock, MapPin, CheckCircle, XCircle, Calendar, Coffee, Timer } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '@/components/Button';
import UserAvatar from '@/components/UserAvatar';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { useAttendanceStore } from '@/store/attendance-store';
import { formatDate, formatTime, formatHours } from '@/utils/date-formatter';
import { getCurrentLocation, getAddressFromCoordinates } from '@/utils/location-service';
import { AttendanceType } from '@/types/user';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const { 
    getLastAttendanceRecord, 
    addAttendanceRecord, 
    getNextExpectedAction,
    getTodayAttendanceSummary,
    getTodayRecords
  } = useAttendanceStore();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  
  const lastRecord = user ? getLastAttendanceRecord(user.id) : undefined;
  const nextAction = user ? getNextExpectedAction(user.id) : null;
  const todaySummary = user ? getTodayAttendanceSummary(user.id) : undefined;
  const todayRecords = user ? getTodayRecords(user.id) : [];
  
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
      console.error('Error fetching location:', error);
    }
  };
  
  const handleAttendance = async () => {
    if (!user || !nextAction) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Navigate to face verification screen
    router.push({
      pathname: '/face-verification',
      params: {
        type: nextAction,
      },
    });
  };
  
  const handleManualAttendance = async () => {
    if (!user || !nextAction) return;
    
    setIsLoading(true);
    
    try {
      await addAttendanceRecord({
        userId: user.id,
        userName: user.name,
        type: nextAction,
        verified: false,
      });
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert(
        'Success',
        getActionSuccessMessage(nextAction),
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error recording attendance:', error);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
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
      case 'check-in':
        return 'You have successfully checked in.';
      case 'break-start':
        return 'Your break has started.';
      case 'break-end':
        return 'Your break has ended.';
      case 'check-out':
        return 'You have successfully checked out.';
      default:
        return 'Action recorded successfully.';
    }
  };
  
  const getActionButtonText = (action: AttendanceType | null): string => {
    switch (action) {
      case 'check-in':
        return 'Check In with Face ID';
      case 'break-start':
        return 'Start Break with Face ID';
      case 'break-end':
        return 'End Break with Face ID';
      case 'check-out':
        return 'Check Out with Face ID';
      default:
        return 'Day Complete';
    }
  };
  
  const getManualActionButtonText = (action: AttendanceType | null): string => {
    switch (action) {
      case 'check-in':
        return 'Manual Check In';
      case 'break-start':
        return 'Manual Break Start';
      case 'break-end':
        return 'Manual Break End';
      case 'check-out':
        return 'Manual Check Out';
      default:
        return 'Day Complete';
    }
  };
  
  const getStatusText = (): string => {
    if (!lastRecord) return 'Not checked in';
    
    switch (lastRecord.type) {
      case 'check-in':
        return 'Checked In';
      case 'break-start':
        return 'On Break';
      case 'break-end':
        return 'Returned from Break';
      case 'check-out':
        return 'Checked Out';
      default:
        return 'Unknown Status';
    }
  };
  
  const getStatusColor = (): string => {
    if (!lastRecord) return Colors.textSecondary;
    
    switch (lastRecord.type) {
      case 'check-in':
        return Colors.primary;
      case 'break-start':
        return Colors.warning;
      case 'break-end':
        return Colors.secondary;
      case 'check-out':
        return Colors.success;
      default:
        return Colors.textSecondary;
    }
  };
  
  const getStatusIcon = () => {
    if (!lastRecord) return <Clock size={16} color={Colors.textSecondary} />;
    
    switch (lastRecord.type) {
      case 'check-in':
        return <CheckCircle size={16} color={Colors.primary} />;
      case 'break-start':
        return <Coffee size={16} color={Colors.warning} />;
      case 'break-end':
        return <Timer size={16} color={Colors.secondary} />;
      case 'check-out':
        return <XCircle size={16} color={Colors.success} />;
      default:
        return <Clock size={16} color={Colors.textSecondary} />;
    }
  };
  
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
              transform: [{ translateY: slideAnim }]
            }
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
              <Text style={styles.greeting}>Hello, {user?.name ? user.name.split(' ')[0] : 'User'}</Text>
              <Text style={styles.role}>{user.role === 'admin' ? 'Administrator' : 'Employee'}</Text>
            </View>
          </View>
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.timeCardContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            style={styles.timeCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.timeInfo}>
              <Text style={styles.date}>{formatDate(currentTime.getTime())}</Text>
              <Text style={styles.time}>{formatTime(currentTime.getTime())}</Text>
            </View>
            
            <View style={styles.locationContainer}>
              <MapPin size={16} color="#FFFFFF" />
              <Text style={styles.location} numberOfLines={2}>
                {currentAddress || 'Fetching location...'}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.statusCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Attendance Status</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor() + '40' } // 40% opacity
            ]}>
              <Text style={[
                styles.statusBadgeText,
                { color: getStatusColor() }
              ]}>
                {getStatusText()}
              </Text>
            </View>
          </View>
          
          {lastRecord ? (
            <View style={styles.lastRecordContainer}>
              <View style={styles.lastRecordInfo}>
                {getStatusIcon()}
                <Text style={styles.lastRecordText}>
                  {getStatusText()} at {formatTime(lastRecord.timestamp)}
                </Text>
              </View>
              
              {lastRecord.verified && (
                <View style={styles.verificationStatus}>
                  <CheckCircle size={16} color={Colors.success} />
                  <Text style={[styles.verificationText, { color: Colors.success }]}>
                    Face Verified
                  </Text>
                </View>
              )}
              
              {!lastRecord.verified && (
                <View style={styles.verificationStatus}>
                  <XCircle size={16} color={Colors.warning} />
                  <Text style={[styles.verificationText, { color: Colors.warning }]}>
                    Manual Entry
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noRecordContainer}>
              <Calendar size={32} color={Colors.textLight} />
              <Text style={styles.noRecordText}>No attendance records today</Text>
            </View>
          )}
          
          {todaySummary && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Today's Summary</Text>
              
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Session 1</Text>
                  <Text style={styles.summaryValue}>
                    {formatHours(todaySummary.sessionOneHours)}
                  </Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Session 2</Text>
                  <Text style={styles.summaryValue}>
                    {formatHours(todaySummary.sessionTwoHours)}
                  </Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total</Text>
                  <Text style={[styles.summaryValue, styles.totalHours]}>
                    {formatHours(todaySummary.totalHours)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.timelineContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.timelineTitle}>Today's Timeline</Text>
          
          {todayRecords.length > 0 ? (
            <View style={styles.timeline}>
              {todayRecords.map((record, index) => (
                <View key={record.id} style={styles.timelineItem}>
                  <View style={styles.timelineDot}>
                    {record.type === 'check-in' && <CheckCircle size={16} color={Colors.primary} />}
                    {record.type === 'break-start' && <Coffee size={16} color={Colors.warning} />}
                    {record.type === 'break-end' && <Timer size={16} color={Colors.secondary} />}
                    {record.type === 'check-out' && <XCircle size={16} color={Colors.success} />}
                  </View>
                  
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTime}>{formatTime(record.timestamp)}</Text>
                    <Text style={styles.timelineAction}>
                      {record.type === 'check-in' && 'Checked In'}
                      {record.type === 'break-start' && 'Started Break'}
                      {record.type === 'break-end' && 'Ended Break'}
                      {record.type === 'check-out' && 'Checked Out'}
                    </Text>
                  </View>
                  
                  {index < todayRecords.length - 1 && (
                    <View style={styles.timelineConnector} />
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noTimelineContainer}>
              <Text style={styles.noTimelineText}>No activities recorded today</Text>
            </View>
          )}
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.actionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {nextAction ? (
            <>
              <Button
                title={getActionButtonText(nextAction)}
                onPress={handleAttendance}
                variant="gradient"
                size="large"
                style={styles.actionButton}
                animated
                icon={
                  nextAction === 'check-in' ? <CheckCircle size={20} color="#FFFFFF" /> :
                  nextAction === 'break-start' ? <Coffee size={20} color="#FFFFFF" /> :
                  nextAction === 'break-end' ? <Timer size={20} color="#FFFFFF" /> :
                  <XCircle size={20} color="#FFFFFF" />
                }
              />
              
              <TouchableOpacity 
                style={styles.manualButton}
                onPress={handleManualAttendance}
                disabled={isLoading}
              >
                <Text style={styles.manualButtonText}>
                  {getManualActionButtonText(nextAction)}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.dayCompleteContainer}>
              <CheckCircle size={32} color={Colors.success} />
              <Text style={styles.dayCompleteText}>Day Complete</Text>
              <Text style={styles.dayCompleteSubtext}>
                You've completed all attendance actions for today
              </Text>
            </View>
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 12,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
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
    alignItems: 'center',
    marginBottom: 16,
  },
  date: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  time: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  location: {
    fontSize: 14,
    color: '#FFFFFF',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  lastRecordContainer: {
    backgroundColor: Colors.cardAlt,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  lastRecordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  lastRecordText: {
    fontSize: 14,
    color: Colors.text,
  },
  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  noRecordContainer: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  noRecordText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  summaryContainer: {
    backgroundColor: Colors.cardAlt,
    padding: 16,
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
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
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
    position: 'relative',
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cardAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    zIndex: 2,
  },
  timelineConnector: {
    position: 'absolute',
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
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  timelineAction: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  noTimelineContainer: {
    alignItems: 'center',
    padding: 24,
  },
  noTimelineText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actionContainer: {
    padding: 20,
    marginTop: 'auto',
  },
  actionButton: {
    width: '100%',
  },
  manualButton: {
    marginTop: 12,
    alignItems: 'center',
    padding: 12,
  },
  manualButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  dayCompleteContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.success + '10', // 10% opacity
    borderRadius: 16,
  },
  dayCompleteText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.success,
    marginTop: 12,
    marginBottom: 4,
  },
  dayCompleteSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});