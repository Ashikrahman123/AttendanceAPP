import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
} from 'react-native';
import { Calendar, FileText, ChevronLeft, ChevronRight, Download, ArrowRight } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AttendanceCard from '@/components/AttendanceCard';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { useAttendanceStore } from '@/store/attendance-store';
import { 
  formatDate, 
  formatShortDate, 
  formatMonthYear, 
  getCurrentMonthYear, 
  getMonthDays,
  formatHours,
  isWeekend,
  getWeekday
} from '@/utils/date-formatter';
import { AttendanceRecord, DailyAttendanceSummary } from '@/types/user';

export default function HistoryScreen() {
  const user = useAuthStore((state) => state.user);
  const { 
    fetchAttendance, 
    isLoading, 
    getDailyAttendanceSummaries,
    calculateAttendanceSummaries
  } = useAttendanceStore();
  
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthYear().month);
  const [currentYear, setCurrentYear] = useState(getCurrentMonthYear().year);
  const [monthDays, setMonthDays] = useState<number[]>([]);
  const [summaries, setSummaries] = useState<DailyAttendanceSummary[]>([]);
  
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
    
    if (user) {
      loadAttendanceRecords();
      calculateAttendanceSummaries(user.id);
      
      // Set month days
      const days = getMonthDays(currentMonth, currentYear);
      setMonthDays(days);
      
      // Get summaries for the current month
      const monthlySummaries = getDailyAttendanceSummaries(user.id, currentMonth, currentYear);
      setSummaries(monthlySummaries);
      
      // Set today as selected date by default
      if (!selectedDate) {
        setSelectedDate(new Date().getTime());
      }
    }
  }, [user, currentMonth, currentYear]);
  
  const loadAttendanceRecords = async () => {
    if (!user) return;
    
    try {
      const fetchedRecords = await fetchAttendance(user.id);
      setRecords(fetchedRecords);
    } catch (error) {
      console.error('Error loading attendance records:', error);
    }
  };
  
  const handleDateSelect = (timestamp: number) => {
    setSelectedDate(selectedDate === timestamp ? null : timestamp);
  };
  
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };
  
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };
  
  const getSummaryForDate = (date: number): DailyAttendanceSummary | undefined => {
    return summaries.find(summary => {
      const summaryDate = new Date(summary.date);
      const selectedDate = new Date(date);
      return (
        summaryDate.getDate() === selectedDate.getDate() &&
        summaryDate.getMonth() === selectedDate.getMonth() &&
        summaryDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  };
  
  const getFilteredRecords = (): AttendanceRecord[] => {
    if (!selectedDate) return [];
    
    return records.filter(record => {
      const recordDate = new Date(record.timestamp);
      const selected = new Date(selectedDate);
      return (
        recordDate.getDate() === selected.getDate() &&
        recordDate.getMonth() === selected.getMonth() &&
        recordDate.getFullYear() === selected.getFullYear()
      );
    }).sort((a, b) => a.timestamp - b.timestamp);
  };
  
  const renderDayItem = ({ item }: { item: number }) => {
    const summary = getSummaryForDate(item);
    const isSelected = selectedDate === item;
    const isToday = new Date(item).toDateString() === new Date().toDateString();
    const weekend = isWeekend(item);
    
    return (
      <TouchableOpacity
        style={[
          styles.dayItem,
          isSelected && styles.selectedDayItem,
          weekend && styles.weekendDayItem,
          isToday && styles.todayDayItem,
        ]}
        onPress={() => handleDateSelect(item)}
        disabled={weekend && !summary}
      >
        <Text style={[
          styles.dayWeekday,
          isSelected && styles.selectedDayText,
          weekend && styles.weekendDayText,
        ]}>
          {getWeekday(item)}
        </Text>
        
        <Text style={[
          styles.dayDate,
          isSelected && styles.selectedDayText,
          weekend && styles.weekendDayText,
        ]}>
          {new Date(item).getDate()}
        </Text>
        
        {summary && (
          <View style={[
            styles.dayHoursBadge,
            isSelected && styles.selectedDayHoursBadge
          ]}>
            <Text style={[
              styles.dayHoursText,
              isSelected && styles.selectedDayHoursText
            ]}>
              {summary.totalHours}h
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  const filteredRecords = getFilteredRecords();
  const selectedSummary = selectedDate ? getSummaryForDate(selectedDate) : undefined;
  
  const handleViewDetails = () => {
    if (selectedDate) {
      router.push({
        pathname: '/attendance-details',
        params: { date: selectedDate.toString() }
      });
    }
  };
  
  if (!user) return null;
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Text style={styles.title}>Attendance History</Text>
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.calendarHeader,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthNavButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.monthYearText}>
          {formatMonthYear(new Date(currentYear, currentMonth, 1).getTime())}
        </Text>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.monthNavButton}>
          <ChevronRight size={24} color={Colors.text} />
        </TouchableOpacity>
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.daysContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <FlatList
          data={monthDays}
          renderItem={renderDayItem}
          keyExtractor={item => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysList}
        />
      </Animated.View>
      
      <ScrollView style={styles.contentContainer}>
        {selectedDate && selectedSummary ? (
          <Animated.View 
            style={[
              styles.summaryCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryDate}>
                {formatDate(selectedDate)}
              </Text>
              
              <TouchableOpacity 
                style={styles.viewDetailsButton}
                onPress={handleViewDetails}
              >
                <Text style={styles.viewDetailsText}>View Details</Text>
                <ArrowRight size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            
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
                    {formatHours(selectedSummary.sessionOneHours)}
                  </Text>
                </View>
                
                <View style={styles.summaryColumn}>
                  <Text style={styles.summaryLabel}>Session 2</Text>
                  <Text style={styles.summaryValue}>
                    {formatHours(selectedSummary.sessionTwoHours)}
                  </Text>
                </View>
                
                <View style={styles.summaryColumn}>
                  <Text style={styles.summaryLabel}>Total</Text>
                  <Text style={[styles.summaryValue, styles.totalHours]}>
                    {formatHours(selectedSummary.totalHours)}
                  </Text>
                </View>
              </View>
            </LinearGradient>
            
            {selectedSummary.overtimeHours > 0 && (
              <View style={styles.overtimeContainer}>
                <View style={styles.overtimeRow}>
                  <Text style={styles.overtimeLabel}>Regular Hours:</Text>
                  <Text style={styles.overtimeValue}>
                    {formatHours(selectedSummary.regularHours)}
                  </Text>
                </View>
                
                <View style={styles.overtimeRow}>
                  <Text style={styles.overtimeLabel}>Overtime:</Text>
                  <Text style={[
                    styles.overtimeValue, 
                    styles.overtimeHours,
                    selectedSummary.approved && styles.approvedOvertime
                  ]}>
                    {formatHours(selectedSummary.overtimeHours)}
                    {selectedSummary.approved ? ' (Approved)' : ' (Pending)'}
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>
        ) : selectedDate ? (
          <Animated.View 
            style={[
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <EmptyState
              icon={<Calendar size={48} color={Colors.textSecondary} />}
              title="No Attendance Data"
              message="No attendance records found for this date."
            />
          </Animated.View>
        ) : (
          <Animated.View 
            style={[
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <EmptyState
              icon={<Calendar size={48} color={Colors.textSecondary} />}
              title="Select a Date"
              message="Please select a date to view attendance details."
            />
          </Animated.View>
        )}
        
        {filteredRecords.length > 0 && (
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
            
            <View style={styles.timeline}>
              {filteredRecords.map((record, index) => (
                <AttendanceCard 
                  key={record.id} 
                  record={record} 
                  isLast={index === filteredRecords.length - 1}
                />
              ))}
            </View>
          </Animated.View>
        )}
        
        {selectedDate && filteredRecords.length === 0 && selectedSummary && (
          <Animated.View 
            style={[
              styles.noTimelineContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.noTimelineTitle}>No Timeline Available</Text>
            <Text style={styles.noTimelineText}>
              Summary data exists, but detailed timeline is not available for this date.
            </Text>
          </Animated.View>
        )}
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
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  monthNavButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardAlt,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  daysContainer: {
    marginBottom: 15,
  },
  daysList: {
    paddingHorizontal: 15,
    gap: 8,
  },
  dayItem: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    width: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedDayItem: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  weekendDayItem: {
    backgroundColor: Colors.cardAlt,
    borderColor: Colors.borderLight,
  },
  todayDayItem: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  dayWeekday: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  weekendDayText: {
    color: Colors.textLight,
  },
  dayHoursBadge: {
    backgroundColor: Colors.primaryLight + '40',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  selectedDayHoursBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dayHoursText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '500',
  },
  selectedDayHoursText: {
    color: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
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
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryDate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
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
  noTimelineContainer: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  noTimelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  noTimelineText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});