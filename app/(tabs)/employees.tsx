import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Users, Search, ChevronRight, X, Clock, Calendar, Camera } from 'lucide-react-native'; // Added Camera import
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserAvatar from '@/components/UserAvatar';
import Input from '@/components/Input';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { User } from '@/types/user';
import { useBaseUrl } from '@/context/BaseUrlContext';

export default function EmployeesScreen() {
  console.log('[EmployeesScreen] Rendering');
  const { baseUrl } = useBaseUrl();
  const user = useAuthStore((state) => state.user);
  const [employees, setEmployees] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false); // Added modal state
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null); // Added selected employee state


  useEffect(() => {
    console.log('[EmployeesScreen] Initial mount, fetching employees');
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    console.log('[EmployeesScreen] Starting fetchEmployees');
    try {
      const token = await AsyncStorage.getItem('bearerToken');
      const orgId = await AsyncStorage.getItem('orgId');

      console.log('[EmployeesScreen] Token:', token ? 'Present' : 'Missing');
      console.log('[EmployeesScreen] OrgId:', orgId);

      if (!token || !orgId) {
        console.error('[EmployeesScreen] Auth data missing:', { token: !!token, orgId: !!orgId });
        throw new Error('Please log in again to continue');
      }

      const requestData = {
        OrgId: parseInt(orgId),
        pageId: 0,
        PageNumber: 1,
        PageSize: 1000,
        BearerTokenValue: token
      };

      console.log('[EmployeesScreen] Making API request with data:', JSON.stringify(requestData));

      const response = await fetch(`${baseUrl}MiddleWare/All_EmployeeList_NewMobileApp?requestData=${JSON.stringify(requestData)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('[EmployeesScreen] API Response:', JSON.stringify(data));

      if (data?.data && Array.isArray(data.data)) {
        const formattedEmployees = data.data.map((emp: any) => ({
          id: emp.recordId,
          name: emp.recordName,
          email: '', // API doesn't provide email
          role: 'employee',
          orgId: emp.orgId,
          orgName: 'Organization',
          userName: emp.recordName,
          contactRecordId: emp.recordId,
          profileImage: undefined
        }));
        console.log('[EmployeesScreen] Formatted employees:', formattedEmployees.length);
        setEmployees(formattedEmployees);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employees';
      console.error('[EmployeesScreen] Error:', errorMessage);
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRegisterFace = async (employee: User) => {
    // Implement face registration logic here.  This is a placeholder.
    try {
      const token = await AsyncStorage.getItem('bearerToken');
      const orgId = await AsyncStorage.getItem('orgId');

      if (!token || !orgId) {
        throw new Error('Authentication required.');
      }

      const faceData = await getFaceData(); // Placeholder for face data capture

      const response = await fetch(`${baseUrl}FaceRegisterApi`, { // Replace with your API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orgId: parseInt(orgId),
          ContactRecordId: employee.contactRecordId,
          FaceData: faceData, // Base64 encoded face data
          ModifyUser: user?.userName, // Assuming user object has userName
          BearerTokenValue: token
        })
      });

      if (!response.ok) {
        throw new Error(`Face registration failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Face registration successful:', data);
      // Update UI or show success message

    } catch (error) {
      console.error('Face registration error:', error);
      Alert.alert('Error', 'Face registration failed. Please try again.');
    } finally {
      setShowEmployeeModal(false); // Close modal
    }
  };


  const getFaceData = async () => {
    // Placeholder for actual face data capture using a library like expo-camera.  Replace with your implementation.
    // This should capture the image, convert it to base64, and return it.
    return "base64EncodedImageData";
  };

  if (!user || user.role !== 'admin') {
    console.log('[EmployeesScreen] User not authorized');
    return null;
  }

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

      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading employees...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            title="Try Again" 
            onPress={fetchEmployees}
            style={styles.retryButton}
            variant="secondary"
          />
        </View>
      ) : filteredEmployees.length > 0 ? (
        <FlatList
          data={filteredEmployees}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => {
              setSelectedEmployee(item);
              setShowEmployeeModal(true);
            }}>
              <View style={styles.employeeCard}>
                <UserAvatar 
                  name={item.name} 
                  imageUrl={item.profileImage}
                  size={50}
                />

                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>{item.name}</Text>
                  <Text style={styles.employeeEmail}>{item.email}</Text>
                </View>

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

      {/* Employee Modal */}
      <Modal
        visible={showEmployeeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEmployeeModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}>
          <View style={[styles.modalContent, { backgroundColor: Colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: Colors.border }]}>
              <Text style={[styles.modalTitle, { color: Colors.text }]}>Employee Details</Text>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: Colors.cardAlt }]}
                onPress={() => setShowEmployeeModal(false)}
              >
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {selectedEmployee && (
              <View style={styles.modalBody}>
                <UserAvatar 
                  name={selectedEmployee.name} 
                  imageUrl={selectedEmployee.profileImage}
                  size={80}
                />
                <Text style={[styles.employeeName, { color: Colors.text }]}>{selectedEmployee.name}</Text>

                <TouchableOpacity
                  style={[styles.registerFaceButton, { backgroundColor: Colors.primary }]}
                  onPress={() => handleRegisterFace(selectedEmployee)}
                >
                  <Camera size={24} color="#FFFFFF" />
                  <Text style={styles.registerFaceButtonText}>Register Face ID</Text>
                </TouchableOpacity>
              </View>
            )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: Colors.error,
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 16,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  retryButton: {
    minWidth: 150,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
    borderRadius: 4,
  },
  modalBody: {
    alignItems: 'center',
  },
  registerFaceButton: {
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  registerFaceButtonText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 16,
  }
});