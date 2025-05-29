
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Store imports
import { useAuthStore } from './store/auth-store';
import { useThemeStore } from './store/theme-store';

// Screen imports
import LoginScreen from './screens/LoginScreen';
import BaseUrlScreen from './screens/BaseUrlScreen';
import TabNavigator from './navigation/TabNavigator';
import FaceComparisonScreen from './screens/FaceComparisonScreen';
import FaceVerificationScreen from './screens/FaceVerificationScreen';
import RegisterFaceScreen from './screens/RegisterFaceScreen';
import StoredFacesScreen from './screens/StoredFacesScreen';
import EmployeeInfoScreen from './screens/EmployeeInfoScreen';
import AttendanceDetailsScreen from './screens/AttendanceDetailsScreen';

// Context imports
import { BaseUrlProvider } from './context/BaseUrlContext';
import ThemeProvider from './components/ThemeProvider';
import CustomSplashScreen from './components/SplashScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  const { isAuthenticated } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <CustomSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#111827' : '#F9FAFB'}
      />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: {
            backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
          },
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="BaseUrl" component={BaseUrlScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen 
              name="FaceComparison" 
              component={FaceComparisonScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen 
              name="FaceVerification" 
              component={FaceVerificationScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen 
              name="RegisterFace" 
              component={RegisterFaceScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen 
              name="StoredFaces" 
              component={StoredFacesScreen}
            />
            <Stack.Screen 
              name="EmployeeInfo" 
              component={EmployeeInfoScreen}
            />
            <Stack.Screen 
              name="AttendanceDetails" 
              component={AttendanceDetailsScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BaseUrlProvider>
        <ThemeProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </BaseUrlProvider>
    </GestureHandlerRootView>
  );
}
