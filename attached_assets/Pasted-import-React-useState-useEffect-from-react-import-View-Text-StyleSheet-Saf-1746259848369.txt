import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Users, Search, ChevronRight, X, Clock, Calendar, CheckCircle } from 'lucide-react-native';
import UserAvatar from '@/components/UserAvatar';
import Input from '@/components/Input';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { useAttendanceStore } from '@/store/attendance-store';
import { mockUsers } from '@/mocks/users';
import { User, DailyAttendanceSummary } from '@/types/user';
import { formatDate, formatHours } from '@/utils/date-formatter';

export default function EmployeesScreen() {
  const user = useAuthStore((state) => state.user);
  const { 
    fetchAttendance, 
    getDailyAttendanceSummaries,
    summaries
  } = useAttendanceStore();
  
  const [employees, setEmployees] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeStats, setEmployeeStats] = useState<{[key: string]: {checkIns: number, lastActivity: number, totalHours: number, overtimeHours: number}}>({});
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [employeeSummaries, setEmployeeSummaries] = useState<DailyAttendanceSummary[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  useEffect(() => {
    // Filter out the current admin user
    const filteredEmployees = mockUsers.filter(u => u.role === 'employee');
    setEmployees(filteredEmployees);
    
    // Load attendance stats for each employee
    loadEmployeeStats(filteredEmployees);
  }, [summaries]);
  
  const loadEmployeeStats = async (employeeList: User[]) => {
    const stats: {[key: string]: {checkIns: number, lastActivity: number, totalHours: number, overtimeHours: number}} = {};
    
    for (const employee of employeeList) {
      const records = await fetchAttendance(employee.id);
      const employeeSummaries = summaries.filter(s => s.userId === employee.id);
      
      stats[employee.id] = {
        checkIns: records.filter(r => r.type === 'check-in').length,
        lastActivity: records.length > 0 
          ? Math.max(...records.map(r => r.timestamp))
          : 0,
        totalHours: employeeSummaries.reduce((total, s) => total + s.totalHours, 0),
        overtimeHours: employeeSummaries.reduce((total, s) => total + s.overtimeHours, 0),
      };
    }
    
    setEmployeeStats(stats);
  };
  
  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleEmployeePress = (employee: User) => {
    setSelectedEmployee(employee);
    const employeeSummaries = summaries
      .filter(s => s.userId === employee.id)
      .sort((a, b) => b.date - a.date);
    setEmployeeSummaries(employeeSummaries);
    setModalVisible(true);
  };
  
  const handleApproveOvertime = (summary: DailyAttendanceSummary) => {
    // In a real app, this would update the database
    Alert.alert(
      'Approve Overtime',
      `Approve ${formatHours(summary.overtimeHours)} of overtime for ${selectedEmployee?.name} on ${formatDate(summary.date)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          onPress: () => {
            // Update the summary in the state
            const updatedSummaries = employeeSummaries.map(s => 
              s.date === summary.date ? { ...s, approved: true } : s
            );
            setEmployeeSummaries(updatedSummaries);
            
            Alert.alert('Success', 'Overtime has been approved.');
          }
        }
      ]
    );
  };
  
  if (!user || user.role !== 'admin') return null;
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Employees</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search employees..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={Colors.textSecondary} />}
          containerStyle={styles.searchInput}
        />
      </View>
      
      {filteredEmployees.length > 0 ? (
        <FlatList
          data={filteredEmployees}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.employeeCard}
              onPress={() => handleEmployeePress(item)}
            >
              <UserAvatar 
                name={item.name} 
                imageUrl={item.profileImage}
                size={50}
              />
              
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeName}>{item.name}</Text>
                <Text style={styles.employeeEmail}>{item.email}</Text>
              </View>
              
              <View style={styles.employeeStats}>
                <Text style={styles.statText}>
                  {employeeStats[item.id]?.totalHours.toFixed(1) || 0} hours
                </Text>
                <ChevronRight size={20} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <EmptyState
          icon={<Users size={48} color={Colors.textSecondary} />}
          title="No Employees Found"
          message={searchQuery 
            ? "No employees match your search criteria." 
            : "There are no employees in the system."}
        />
      )}
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedEmployee?.name}'s Attendance
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.employeeDetailHeader}>
              <UserAvatar 
                name={selectedEmployee?.name || ''} 
                imageUrl={selectedEmployee?.profileImage}
                size={60}
              />
              
              <View style={styles.employeeDetailInfo}>
                <Text style={styles.employeeDetailName}>
                  {selectedEmployee?.name}
                </Text>
                <Text style={styles.employeeDetailEmail}>
                  {selectedEmployee?.email}
                </Text>
              </View>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Clock size={20} color={Colors.primary} />
                <Text style={styles.statCardValue}>
                  {employeeStats[selectedEmployee?.id || '']?.totalHours.toFixed(1) || 0}h
                </Text>
                <Text style={styles.statCardLabel}>Total Hours</Text>
              </View>
              
              <View style={styles.statCard}>
                <Calendar size={20} color={Colors.secondary} />
                <Text style={styles.statCardValue}>
                  {employeeStats[selectedEmployee?.id || '']?.checkIns || 0}
                </Text>
                <Text style={styles.statCardLabel}>Days Worked</Text>
              </View>
              
              <View style={styles.statCard}>
                <Clock size={20} color={Colors.warning} />
                <Text style={styles.statCardValue}>
                  {employeeStats[selectedEmployee?.id || '']?.overtimeHours.toFixed(1) || 0}h
                </Text>
                <Text style={styles.statCardLabel}>Overtime</Text>
              </View>
            </View>
            
            <Text style={styles.sectionTitle}>Attendance History</Text>
            
            <ScrollView style={styles.summariesContainer}>
              {employeeSummaries.length > 0 ? (
                employeeSummaries.map((summary) => (
                  <View key={summary.date} style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                      <Text style={styles.summaryDate}>
                        {formatDate(summary.date)}
                      </Text>
                      <Text style={styles.summaryHours}>
                        {formatHours(summary.totalHours)}
                      </Text>
                    </View>
                    
                    <View style={styles.summaryDetails}>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Check In:</Text>
                        <Text style={styles.summaryValue}>
                          {summary.checkIn ? new Date(summary.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </Text>
                      </View>
                      
                      {summary.breakStart && (
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Break Start:</Text>
                          <Text style={styles.summaryValue}>
                            {new Date(summary.breakStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      )}
                      
                      {summary.breakEnd && (
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Break End:</Text>
                          <Text style={styles.summaryValue}>
                            {new Date(summary.breakEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      )}
                      
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Check Out:</Text>
                        <Text style={styles.summaryValue}>
                          {summary.checkOut ? new Date(summary.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </Text>
                      </View>
                      
                      {summary.overtimeHours > 0 && (
                        <View style={styles.overtimeSection}>
                          <View style={styles.summaryRow}>
                            <Text style={styles.overtimeLabel}>Overtime:</Text>
                            <Text style={[
                              styles.overtimeValue,
                              summary.approved && styles.approvedOvertime
                            ]}>
                              {formatHours(summary.overtimeHours)}
                            </Text>
                          </View>
                          
                          {!summary.approved && (
                            <Button
                              title="Approve Overtime"
                              onPress={() => handleApproveOvertime(summary)}
                              variant="outline"
                              size="small"
                              icon={<CheckCircle size={16} color={Colors.primary} />}
                              style={styles.approveButton}
                            />
                          )}
                          
                          {summary.approved && (
                            <View style={styles.approvedBadge}>
                              <CheckCircle size={12} color={Colors.success} />
                              <Text style={styles.approvedText}>Approved</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <EmptyState
                  icon={<Calendar size={32} color={Colors.textSecondary} />}
                  title="No Attendance Records"
                  message="This employee has no attendance records yet."
                />
              )}
            </ScrollView>
            
            <Button
              title="Close"
              onPress={() => setModalVisible(false)}
              variant="outline"
              style={styles.closeModalButton}
            />
          </View>
        </View>
      </Modal>
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchInput: {
    marginBottom: 0,
  },
  list: {
    padding: 20,
    paddingTop: 10,
  },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  employeeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  employeeEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  employeeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 5,
  },
  employeeDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  employeeDetailInfo: {
    marginLeft: 15,
  },
  employeeDetailName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  employeeDetailEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '30%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statCardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginVertical: 4,
  },
  statCardLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  summariesContainer: {
    flex: 1,
    marginBottom: 15,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryHours: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  summaryDetails: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 8,
    padding: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
  },
  overtimeSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  overtimeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  overtimeValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warning,
  },
  approvedOvertime: {
    color: Colors.success,
  },
  approveButton: {
    marginTop: 8,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 4,
  },
  approvedText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
  },
  closeModalButton: {
    marginTop: 15,
  },
});