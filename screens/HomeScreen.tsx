
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useColors } from '../hooks/useColors';

export default function HomeScreen() {
  const colors = useColors();
  const navigation = useNavigation();

  const features = [
    {
      title: 'Face Verification',
      description: 'Verify attendance using face recognition',
      icon: 'scan',
      onPress: () => navigation.navigate('FaceVerification'),
    },
    {
      title: 'Face Comparison',
      description: 'Compare two face images',
      icon: 'people',
      onPress: () => navigation.navigate('FaceComparison'),
    },
    {
      title: 'Register Face',
      description: 'Register a new face for attendance',
      icon: 'person-add',
      onPress: () => navigation.navigate('RegisterFace'),
    },
    {
      title: 'Stored Faces',
      description: 'View all registered faces',
      icon: 'folder',
      onPress: () => navigation.navigate('StoredFaces'),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Face Attendance
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Manage employee attendance with face recognition
          </Text>
        </View>

        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.featureCard,
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}
              onPress={feature.onPress}
            >
              <Icon name={feature.icon} size={32} color={colors.primary} />
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                {feature.title}
              </Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                {feature.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
