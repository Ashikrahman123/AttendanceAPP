
import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const mockHistory = [
  { id: '1', date: '2025-01-20', time: '09:00 AM', type: 'Check In' },
  { id: '2', date: '2025-01-20', time: '06:00 PM', type: 'Check Out' },
  { id: '3', date: '2025-01-19', time: '09:15 AM', type: 'Check In' },
  { id: '4', date: '2025-01-19', time: '05:45 PM', type: 'Check Out' },
];

export default function HistoryScreen() {
  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.iconContainer}>
        <Icon 
          name={item.type === 'Check In' ? 'enter' : 'exit'} 
          size={24} 
          color={item.type === 'Check In' ? '#4CAF50' : '#FF5722'} 
        />
      </View>
      <View style={styles.historyInfo}>
        <Text style={styles.historyType}>{item.type}</Text>
        <Text style={styles.historyDate}>{item.date}</Text>
      </View>
      <Text style={styles.historyTime}>{item.time}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Attendance History</Text>
        <FlatList
          data={mockHistory}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  historyInfo: {
    flex: 1,
  },
  historyType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  historyTime: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
});
