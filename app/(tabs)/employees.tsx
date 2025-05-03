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
import { Users, Search, ChevronRight, X, Clock, Calendar } from 'lucide-react-native';
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
  const { baseUrl } = useBaseUrl();
  const user = useAuthStore((state) => state.user);
  const [employees, setEmployees] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = await AsyncStorage.getItem('bearerToken');
      const orgId = await AsyncStorage.getItem('orgId');

      if (!token || !orgId) {
        throw new Error('Authentication data missing');
      }

      const requestData = {
        OrgId: parseInt(orgId),
        pageId: 0,
        PageNumber: 1,
        PageSize: 1000,
        BearerTokenValue: token
      };

      const response = await fetch(`${baseUrl}MiddleWare/All_EmployeeList_NewMobileApp?requestData=${JSON.stringify(requestData)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data && Array.isArray(data)) {
        const formattedEmployees = data.map((emp: any) => ({
          id: emp.id || emp.employeeId,
          name: emp.name || emp.employeeName,
          email: emp.email || emp.emailId || '',
          role: 'employee',
          orgId: parseInt(orgId),
          orgName: emp.organizationName || 'Organization',
          userName: emp.userName || emp.email,
          contactRecordId: emp.contactRecordId || 0,
          profileImage: emp.profileImage || undefined
        }));
        setEmployees(formattedEmployees);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
      Alert.alert('Error', 'Failed to fetch employees list');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {loading ? (
        <View style={styles.centerContainer}>
          <Text>Loading employees...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            title="Retry" 
            onPress={fetchEmployees}
            style={styles.retryButton}
          />
        </View>
      ) : filteredEmployees.length > 0 ? (
        <FlatList
          data={filteredEmployees}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
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
  },
  errorText: {
    color: Colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 120,
  },
});