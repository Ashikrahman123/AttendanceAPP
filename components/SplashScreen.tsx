import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    console.log('Splash screen mounted');

    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(3000), // 3 seconds delay
    ]).start(() => {
      console.log('Splash screen animation finished');
      onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
        style={styles.background}
      />
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.logoContainer}>
          <User size={60} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Face Attendance</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    alignItems: 'center',
    marginBottom:24, //Retained from original
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
     shadowColor: '#000', //Retained from original
    shadowOffset: { width: 0, height: 8 }, //Retained from original
    shadowOpacity: 0.3, //Retained from original
    shadowRadius: 12, //Retained from original
    elevation: 10, //Retained from original
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8, //Retained from original
    textShadowColor: 'rgba(0, 0, 0, 0.2)', //Retained from original
    textShadowOffset: { width: 1, height: 1 }, //Retained from original
    textShadowRadius: 2, //Retained from original
  },
});