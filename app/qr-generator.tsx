
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, Download, Share as ShareIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useColors } from '@/hooks/useColors';
import {
  OFFICE_LOCATIONS,
  generateLocationQRCodes,
  QRAttendanceAction,
  getLocationByCode,
} from '@/utils/qr-generator';

const { width } = Dimensions.get('window');
const QR_SIZE = Math.min(width * 0.4, 150);

export default function QRGeneratorScreen() {
  const colors = useColors();
  const [selectedLocation, setSelectedLocation] = useState(OFFICE_LOCATIONS[0]?.code || '');

  const handleShareQR = async (action: QRAttendanceAction, qrData: string) => {
    try {
      const location = getLocationByCode(selectedLocation);
      await Share.share({
        message: `${action} QR Code for ${location?.name}\n\nQR Data: ${qrData}`,
        title: `${action} - ${location?.name}`,
      });
    } catch (error) {
      console.error('Error sharing QR:', error);
    }
  };

  const qrCodes = selectedLocation ? generateLocationQRCodes(selectedLocation) : [];
  const location = getLocationByCode(selectedLocation);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code Generator</Text>
        <Text style={styles.headerSubtitle}>
          Generate location-based attendance QR codes
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Location Selector */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Select Location
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {OFFICE_LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc.code}
                style={[
                  styles.locationChip,
                  {
                    backgroundColor: selectedLocation === loc.code ? colors.primary : colors.cardAlt,
                  },
                ]}
                onPress={() => setSelectedLocation(loc.code)}
              >
                <Text
                  style={[
                    styles.locationChipText,
                    {
                      color: selectedLocation === loc.code ? '#FFFFFF' : colors.text,
                    },
                  ]}
                >
                  {loc.code}
                </Text>
                <Text
                  style={[
                    styles.locationChipSubtext,
                    {
                      color: selectedLocation === loc.code ? 'rgba(255,255,255,0.8)' : colors.textSecondary,
                    },
                  ]}
                >
                  {loc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Location Info */}
        {location && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Location Information
            </Text>
            <Text style={[styles.locationInfo, { color: colors.text }]}>
              <Text style={styles.locationLabel}>Name: </Text>
              {location.name}
            </Text>
            <Text style={[styles.locationInfo, { color: colors.text }]}>
              <Text style={styles.locationLabel}>Code: </Text>
              {location.code}
            </Text>
            <Text style={[styles.locationInfo, { color: colors.text }]}>
              <Text style={styles.locationLabel}>Coordinates: </Text>
              {location.latitude}, {location.longitude}
            </Text>
          </View>
        )}

        {/* QR Codes */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Attendance QR Codes
          </Text>
          
          <View style={styles.qrGrid}>
            {qrCodes.map(({ action, qrData }) => (
              <View key={action} style={styles.qrCard}>
                <Text style={[styles.qrTitle, { color: colors.text }]}>
                  {action.replace('_', ' ')}
                </Text>
                
                <View style={styles.qrCodeContainer}>
                  <QRCode
                    value={qrData}
                    size={QR_SIZE}
                    color="#000000"
                    backgroundColor="#FFFFFF"
                  />
                </View>
                
                <TouchableOpacity
                  style={[styles.shareButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleShareQR(action, qrData)}
                >
                  <ShareIcon size={16} color="#FFFFFF" />
                  <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Instructions */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Instructions
          </Text>
          <Text style={[styles.instruction, { color: colors.textSecondary }]}>
            1. Select the office location above
          </Text>
          <Text style={[styles.instruction, { color: colors.textSecondary }]}>
            2. Print or display the QR codes at the selected location
          </Text>
          <Text style={[styles.instruction, { color: colors.textSecondary }]}>
            3. Employees must be within 100 meters of the location to scan
          </Text>
          <Text style={[styles.instruction, { color: colors.textSecondary }]}>
            4. Each QR code is specific to the attendance action (Check In, Check Out, etc.)
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    padding: 20,
    marginTop: -20,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  locationChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 120,
  },
  locationChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationChipSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  locationInfo: {
    fontSize: 14,
    marginBottom: 6,
  },
  locationLabel: {
    fontWeight: '600',
  },
  qrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  qrCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  qrTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  qrCodeContainer: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
  },
  instruction: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
});
