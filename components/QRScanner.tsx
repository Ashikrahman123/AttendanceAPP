
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { X, Scan } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';

const { width, height } = Dimensions.get('window');

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

export default function QRScanner({ onScan, onClose, isVisible }: QRScannerProps) {
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const lastScannedData = useRef<string | null>(null);
  const scanTimeout = useRef<NodeJS.Timeout | null>(null);
  const scanSessionId = useRef<number>(0);

  useEffect(() => {
    if (isVisible && !permission?.granted) {
      requestPermission();
    }
    if (isVisible) {
      // Start a new scan session - this allows the same QR to be used for different employees
      scanSessionId.current = Date.now();
      setScanned(false);
      setIsProcessing(false);
      lastScannedData.current = null;
      if (scanTimeout.current) {
        clearTimeout(scanTimeout.current);
        scanTimeout.current = null;
      }
      console.log('[QR Scanner] New scan session started:', scanSessionId.current);
    } else {
      // Clean up when scanner is hidden
      if (scanTimeout.current) {
        clearTimeout(scanTimeout.current);
        scanTimeout.current = null;
      }
      setScanned(false);
      setIsProcessing(false);
      lastScannedData.current = null;
      console.log('[QR Scanner] Scanner session ended, cleanup completed');
    }
  }, [isVisible, permission]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    // Prevent multiple scans while processing or already scanned
    if (scanned || isProcessing) {
      console.log('[QR Scanner] QR scan ignored - already processing or scanned');
      return;
    }

    // Only check for duplicates within the same scan session (prevents rapid duplicate scans)
    // But allows the same QR code to be used for different employees in different sessions
    if (lastScannedData.current === data) {
      console.log('[QR Scanner] QR scan ignored - same data in current session');
      return;
    }

    // Clear any existing timeout
    if (scanTimeout.current) {
      clearTimeout(scanTimeout.current);
    }

    console.log('[QR Scanner] QR Code detected:', data, 'in session:', scanSessionId.current);

    // Skip Expo development URLs
    if (data.includes('exp://') || data.includes('expo.dev')) {
      console.log('[QR Scanner] Skipping Expo development QR code');
      return; // Don't show alert, just ignore silently
    }

    // Skip empty or invalid QR codes silently
    if (!data || data.trim().length === 0) {
      console.log('[QR Scanner] Empty QR code detected, ignoring');
      return; // Don't show alert, just ignore silently
    }

    // Parse URL-based QR codes (e.g., https://wageuat.digierp.net/CI-HO01 or https://wageuat.digierp.net/CO-HO01)
    let actionType = '';
    let branchCode = '';
    let isValidQR = false;

    try {
      // Check if it's a URL format
      if (data.includes('https://wageuat.digierp.net/')) {
        const urlPath = data.replace('https://wageuat.digierp.net/', '');
        console.log('[QR Scanner] URL path extracted:', urlPath);
        
        // Parse the action and branch from the path (e.g., CI-HO01, CO-HO01)
        if (urlPath.includes('-')) {
          const parts = urlPath.split('-');
          actionType = parts[0].toUpperCase();
          branchCode = parts.slice(1).join('-'); // Handle branch codes with multiple dashes
          
          console.log('[QR Scanner] Parsed action:', actionType, 'branch:', branchCode);
          
          // Validate action type (CI, CO, SB, EB format)
          const validActions = ['CI', 'CO', 'SB', 'EB'];
          if (validActions.includes(actionType)) {
            isValidQR = true;
          }
        }
      } else {
        // Fallback: Check for simple action codes (backward compatibility)
        const validAttendanceCodes = ['CI', 'CO', 'SB', 'EB'];
        const upperCaseData = data.trim().toUpperCase();
        
        if (validAttendanceCodes.includes(upperCaseData)) {
          actionType = upperCaseData;
          branchCode = ''; // No branch code for simple format
          isValidQR = true;
        }
      }
    } catch (error) {
      console.log('[QR Scanner] Error parsing QR code:', error);
      isValidQR = false;
    }

    if (!isValidQR) {
      console.log('[QR Scanner] Invalid attendance QR code:', data);
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not recognized as a valid attendance code. Please scan a valid attendance QR code with format: https://wageuat.digierp.net/CI-HO01 or https://wageuat.digierp.net/CO-HO01',
        [
          {
            text: 'Try Again',
            onPress: () => {
              setScanned(false);
              setIsProcessing(false);
              lastScannedData.current = null;
              // Clear any pending timeout
              if (scanTimeout.current) {
                clearTimeout(scanTimeout.current);
                scanTimeout.current = null;
              }
            }
          },
          {
            text: 'Cancel',
            onPress: () => {
              setScanned(false);
              setIsProcessing(false);
              lastScannedData.current = null;
              // Clear any pending timeout
              if (scanTimeout.current) {
                clearTimeout(scanTimeout.current);
                scanTimeout.current = null;
              }
              onClose();
            }
          }
        ]
      );
      return;
    }

    console.log('[QR Scanner] Valid attendance QR code detected, processing...');
    
    // Create the QR data object with action and branch info
    const qrDataObject = {
      originalUrl: data,
      actionType,
      branchCode,
      timestamp: Date.now()
    };
    
    // Immediately set flags and store the scanned data
    setScanned(true);
    setIsProcessing(true);
    lastScannedData.current = data;
    
    // Use shorter timeout to reduce chance of wrong QR being processed
    scanTimeout.current = setTimeout(() => {
      console.log('[QR Scanner] Calling onScan with QR data object:', qrDataObject);
      onScan(JSON.stringify(qrDataObject));
      scanTimeout.current = null;
    }, 100);
  };

  if (!isVisible) return null;

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={[styles.message, { color: colors.text }]}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={[styles.message, { color: colors.text }]}>
          Camera permission required for QR scanning
        </Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.scanArea}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        
        <View style={styles.instructionContainer}>
          <Scan size={32} color="#FFFFFF" />
          <Text style={styles.instructionText}>
            Position QR code within the frame
          </Text>
          {scanned && (
            <Text style={styles.scannedText}>QR Code Scanned!</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  scannedText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});
