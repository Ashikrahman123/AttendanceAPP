import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');
const FACE_FRAME_SIZE = width * 0.7;

interface FaceDetectionOverlayProps {
  isDetecting?: boolean;
  isVerified?: boolean;
}

export default function FaceDetectionOverlay({ 
  isDetecting = false,
  isVerified = false,
}: FaceDetectionOverlayProps) {
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Pulse animation for detecting state
    if (isDetecting) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Stop animation
      pulseAnim.setValue(1);
    }
    
    // Border color animation based on state
    Animated.timing(borderColorAnim, {
      toValue: isVerified ? 1 : isDetecting ? 0.5 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
  }, [isDetecting, isVerified]);
  
  // Interpolate border color
  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['rgba(255, 255, 255, 0.7)', Colors.warning, Colors.success]
  });
  
  return (
    <View style={styles.overlay}>
      <Animated.View 
        style={[
          styles.faceFrame,
          {
            borderColor,
            transform: [{ scale: pulseAnim }]
          }
        ]}
      >
        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />
        <View style={styles.cornerBottomRight} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  faceFrame: {
    width: FACE_FRAME_SIZE,
    height: FACE_FRAME_SIZE,
    borderRadius: 16,
    borderWidth: 2,
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: 'white',
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: 'white',
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 24,
    height: 24,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: 'white',
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: 'white',
    borderBottomRightRadius: 8,
  },
});