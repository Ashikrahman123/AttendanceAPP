
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Dashboard</Text>
        
        <View style={styles.grid}>
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('FaceComparison')}
          >
            <Icon name="camera" size={40} color="#4F46E5" />
            <Text style={styles.cardTitle}>Face Recognition</Text>
            <Text style={styles.cardSubtitle}>Capture attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('History')}
          >
            <Icon name="time" size={40} color="#4F46E5" />
            <Text style={styles.cardTitle}>History</Text>
            <Text style={styles.cardSubtitle}>View attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card}>
            <Icon name="people" size={40} color="#4F46E5" />
            <Text style={styles.cardTitle}>Employees</Text>
            <Text style={styles.cardSubtitle}>Manage team</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card}>
            <Icon name="settings" size={40} color="#4F46E5" />
            <Text style={styles.cardTitle}>Settings</Text>
            <Text style={styles.cardSubtitle}>App preferences</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 30,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});
