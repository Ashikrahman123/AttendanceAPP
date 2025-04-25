import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import { X, Calendar, Clock, MapPin, CheckCircle, XCircle, Coffee, Timer } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useAttendanceStore } from '@/store/attendance-store';
import { formatDate, formatTime, formatHours } from '@/utils/date-formatter';
import { AttendanceRecord, DailyAttendanceSummary } from '@/types/user';

const { width } = Dimensions.get('window');

export default function AttendanceDetailsScreen() {
  const params = useLocalSearchParams<{ date: string }>();
  const dateParam = params.date ? parseInt(params.date) : new Date().getTime();
  
  const { records, summaries } = useAttendanceStore();
  const [dateRecords, setDateRecords] = useState<AttendanceRecord[]>([]);
  const [dateSummary, setDateSummary] = useState<DailyAttendanceSummary | null>(null);
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    // Filter records for the selected date
    const filteredRecords = records.filter(record => {
      const recordDate = new Date(record.timestamp);
      const paramDate = new Date(dateParam);
      return (
        recordDate.getDate() === paramDate.getDate() &&
        recordDate.getMonth() === paramDate.getMonth() &&
        recordDate.getFullYear() === paramDate.getFullYear()
      );
    }).sort((a, b) => a.timestamp - b.timestamp);
    
    setDateRecords(filteredRecords);
    
    // Find summary for the selected date
    const summary = summaries.find(s => {
      const summaryDate = new Date(s.date);
      const paramDate = new Date(dateParam);
      return (
        summaryDate.getDate() === paramDate.getDate() &&
        summaryDate.getMonth() === paramDate.getMonth() &&
        summaryDate.getFullYear() === paramDate.getFullYear()
      );
    }) || null;
    
    setDateSummary(summary);
    
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
  }, [dateParam]);
  
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'check-in':
        return <CheckCircle size={20} color={Colors.primary} />;
      case 'break-start':
        return <Coffee size={20} color={Colors.warning} />;
      case 'break-end':
        return <Timer size={20} color={Colors.secondary} />;
      case 'check-out':
        return <XCircle size={20} color={Colors.success} />;
      default:
        return <Clock size={20} color={Colors.textSecondary} />;
    }
  };
  
  const getActionText = (type: string) => {
    switch (type) {
      case 'check-in':
        return 'Checked In';
      case 'break-start':
        return 'Started Break';
      case 'break-end':
        return 'Ended Break';
      case 'check-out':
        return 'Checked Out';
      default:
        return 'Unknown Action';
    }
  };
  
  const getActionColor = (type: string) => {
    switch (type) {
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
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance Details</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content}>
        <Animated.View 
          style={[
            styles.dateHeader,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.dateIconContainer}>
            <Calendar size={24} color={Colors.primary} />
          </View>
          <Text style={styles.dateText}>{formatDate(dateParam)}</Text>
        </Animated.View>
        
        {dateSummary ? (
          <Animated.View 
            style={[
              styles.summaryCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <LinearGradient
              colors={[Colors.primaryGradientStart + '20', Colors.primaryGradientEnd + '10']}
              style={styles.summaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.summaryRow}>
                <View style={styles.summaryColumn}>
                  <Text style={styles.summaryLabel}>Session 1</Text>
                  <Text style={styles.summaryValue}>
                    {formatHours(dateSummary.sessionOneHours)}
                  </Text>
                </View>
                
                <View style={styles.summaryColumn}>
                  <Text style={styles.summaryLabel}>Session 2</Text>
                  <Text style={styles.summaryValue}>
                    {formatHours(dateSummary.sessionTwoHours)}
                  </Text>
                </View>
                
                <View style={styles.summaryColumn}>
                  <Text style={styles.summaryLabel}>Total</Text>
                  <Text style={[styles.summaryValue, styles.totalHours]}>
                    {formatHours(dateSummary.totalHours)}
                  </Text>
                </View>
              </View>
            </LinearGradient>
            
            {dateSummary.overtimeHours > 0 && (
              <View style={styles.overtimeContainer}>
                <View style={styles.overtimeRow}>
                  <Text style={styles.overtimeLabel}>Regular Hours:</Text>
                  <Text style={styles.overtimeValue}>
                    {formatHours(dateSummary.regularHours)}
                  </Text>
                </View>
                
                <View style={styles.overtimeRow}>
                  <Text style={styles.overtimeLabel}>Overtime:</Text>
                  <Text style={[
                    styles.overtimeValue, 
                    styles.overtimeHours,
                    dateSummary.approved && styles.approvedOvertime
                  ]}>
                    {formatHours(dateSummary.overtimeHours)}
                    {dateSummary.approved ? ' (Approved)' : ' (Pending)'}
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>
        ) : null}
        
        <Animated.View 
          style={[
            styles.timelineContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.timelineTitle}>Activity Timeline</Text>
          
          {dateRecords.length > 0 ? (
            <View style={styles.timeline}>
              {dateRecords.map((record, index) => (
                <View key={record.id} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      { backgroundColor: getActionColor(record.type) + '20' }
                    ]}>
                      {getActionIcon(record.type)}
                    </View>
                    
                    {index < dateRecords.length - 1 && (
                      <View style={styles.timelineConnector} />
                    )}
                  </View>
                  
                  <View style={styles.timelineRight}>
                    <View style={styles.timelineHeader}>
                      <Text style={styles.timelineTime}>{formatTime(record.timestamp)}</Text>
                      <Text style={[
                        styles.timelineAction,
                        { color: getActionColor(record.type) }
                      ]}>
                        {getActionText(record.type)}
                      </Text>
                    </View>
                    
                    {record.location?.address && (
                      <View style={styles.locationContainer}>
                        <MapPin size={14} color={Colors.textSecondary} />
                        <Text style={styles.locationText}>{record.location.address}</Text>
                      </View>
                    )}
                    
                    {record.imageData && (
                      <View style={styles.imageContainer}>
                        <Image 
                          source={{ uri: record.imageData }} 
                          style={styles.verificationImage}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                    
                    <View style={styles.verificationBadge}>
                      {record.verified ? (
                        <>
                          <CheckCircle size={12} color={Colors.success} />
                          <Text style={styles.verificationText}>Face Verified</Text>
                        </>
                      ) : (
                        <>
                          <XCircle size={12} color={Colors.warning} />
                          <Text style={[styles.verificationText, { color: Colors.warning }]}>
                            Manual Entry
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyTimeline}>
              <Clock size={48} color={Colors.textLight} />
              <Text style={styles.emptyTimelineText}>
                No attendance records for this date
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryGradient: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryColumn: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  totalHours: {
    color: Colors.primary,
  },
  overtimeContainer: {
    backgroundColor: Colors.cardAlt,
    padding: 12,
    borderRadius: 8,
  },
  overtimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  overtimeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  overtimeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  overtimeHours: {
    color: Colors.warning,
  },
  approvedOvertime: {
    color: Colors.success,
  },
  timelineContainer: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
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
    marginBottom: 24,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 40,
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    zIndex: 2,
  },
  timelineConnector: {
    position: 'absolute',
    left: 19,
    top: 40,
    bottom: -24,
    width: 2,
    backgroundColor: Colors.border,
    zIndex: 1,
  },
  timelineRight: {
    flex: 1,
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    padding: 16,
    marginLeft: 12,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineTime: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  timelineAction: {
    fontSize: 14,
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  imageContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  verificationImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verificationText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
  },
  emptyTimeline: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTimelineText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
});