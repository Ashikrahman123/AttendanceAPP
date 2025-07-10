
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useColors } from '@/hooks/useColors';

interface QRGeneratorProps {
  baseUrl: string;
  branchCode?: string;
}

export default function QRGenerator({ baseUrl, branchCode = "HO01" }: QRGeneratorProps) {
  const colors = useColors();

  const generateQRValue = (action: "CI" | "CO") => {
    // Remove trailing slash from baseUrl if present
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    return `${cleanBaseUrl}/${action}-${branchCode}`;
  };

  const handleQRPress = (action: "CI" | "CO") => {
    const qrValue = generateQRValue(action);
    Alert.alert(
      'QR Code',
      `QR Code for ${action === 'CI' ? 'Check In' : 'Check Out'}\n\nValue: ${qrValue}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        QR Codes for {branchCode} - Head Office 01
      </Text>
      
      <View style={styles.qrContainer}>
        <View style={styles.qrSection}>
          <Text style={[styles.qrLabel, { color: colors.text }]}>Check In</Text>
          <TouchableOpacity 
            style={[styles.qrWrapper, { backgroundColor: colors.background }]}
            onPress={() => handleQRPress("CI")}
          >
            <QRCode
              value={generateQRValue("CI")}
              size={150}
              color={colors.text}
              backgroundColor={colors.background}
            />
          </TouchableOpacity>
          <Text style={[styles.qrUrl, { color: colors.textSecondary }]}>
            {generateQRValue("CI")}
          </Text>
        </View>

        <View style={styles.qrSection}>
          <Text style={[styles.qrLabel, { color: colors.text }]}>Check Out</Text>
          <TouchableOpacity 
            style={[styles.qrWrapper, { backgroundColor: colors.background }]}
            onPress={() => handleQRPress("CO")}
          >
            <QRCode
              value={generateQRValue("CO")}
              size={150}
              color={colors.text}
              backgroundColor={colors.background}
            />
          </TouchableOpacity>
          <Text style={[styles.qrUrl, { color: colors.textSecondary }]}>
            {generateQRValue("CO")}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 12,
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  qrContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 20,
  },
  qrSection: {
    alignItems: 'center',
    flex: 1,
  },
  qrLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  qrWrapper: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  qrUrl: {
    fontSize: 10,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
});
