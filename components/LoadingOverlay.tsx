import React, { useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  Text,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { LinearGradient } from 'expo-linear-gradient';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
}

export default function LoadingOverlay({ 
  visible, 
  message = "Loading...",
  transparent = false,
}: LoadingOverlayProps) {
  const colors = useColors();
  const spinValue = React.useRef(new Animated.Value(0)).current;
  const pulseValue = React.useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      // Spin animation
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
      
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 0,
            duration: 800,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      spinValue.setValue(0);
      pulseValue.setValue(0);
    }
    
    return () => {
      spinValue.stopAnimation();
      pulseValue.stopAnimation();
    };
  }, [visible, spinValue, pulseValue]);
  
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  const scale = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });
  
  const opacity = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });
  
  if (!visible) return null;
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor: transparent ? 'rgba(0,0,0,0.5)' : colors.background }
    ]}>
      <View style={[styles.loadingBox, { 
        backgroundColor: colors.card,
        shadowColor: colors.shadow,
      }]}>
        <Animated.View 
          style={[
            styles.spinnerContainer,
            { 
              transform: [{ rotate: spin }, { scale }],
              opacity,
            }
          ]}
        >
          <LinearGradient
            colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
            style={styles.gradientSpinner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.spinnerInner} />
          </LinearGradient>
        </Animated.View>
        
        <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingBox: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    minWidth: width * 0.4,
    maxWidth: width * 0.8,
  },
  spinnerContainer: {
    width: 60,
    height: 60,
    marginBottom: 16,
  },
  gradientSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});