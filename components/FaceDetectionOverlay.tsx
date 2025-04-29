import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useThemeStore } from '@/store/theme-store';

interface FaceDetectionOverlayProps {
  isDetecting: boolean;
}

export default function FaceDetectionOverlay({ isDetecting }: FaceDetectionOverlayProps) {
  const isDarkMode = useThemeStore(state => state.isDarkMode);
  
  // Animation values
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (isDetecting) {
      // Scan line animation
      Animated.loop(
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
      
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      // Reset animations when not detecting
      scanLineAnim.setValue(0);
      pulseAnim.setValue(0);
    }
    
    return () => {
      scanLineAnim.stopAnimation();
      pulseAnim.stopAnimation();
    };
  }, [isDetecting, scanLineAnim, pulseAnim]);
  
  // Calculate scan line position
  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });
  
  // Calculate pulse scale and opacity
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2],
  });
  
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 0.2, 0],
  });
  
  if (!isDetecting) return null;
  
  return (
    <View style={styles.container}>
      {/* Face detection frame */}
      <View style={styles.faceFrame}>
        {/* Corners */}
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        
        {/* Scan line */}
        {isDetecting && (
          <Animated.View 
            style={[
              styles.scanLine,
              { transform: [{ translateY: scanLineTranslateY }] }
            ]}
          />
        )}
        
        {/* Pulse effect */}
        {isDetecting && (
          <Animated.View 
            style={[
              styles.pulse,
              { 
                transform: [{ scale: pulseScale }],
                opacity: pulseOpacity,
                borderColor: isDarkMode ? 'rgba(99, 102, 241, 0.5)' : 'rgba(79, 70, 229, 0.5)'
              }
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  faceFrame: {
    width: 280,
    height: 280,
    borderRadius: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 15,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 15,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 15,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 15,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(79, 70, 229, 0.6)',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  pulse: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
  },
});