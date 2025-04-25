import React from 'react';
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
  
  React.useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [visible, spinValue]);
  
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  if (!visible) return null;
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor: transparent ? 'rgba(0,0,0,0.5)' : colors.background }
    ]}>
      <View style={[styles.loadingBox, { backgroundColor: colors.card }]}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <ActivityIndicator size="large" color={colors.primary} />
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
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    minWidth: width * 0.4,
    maxWidth: width * 0.8,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});