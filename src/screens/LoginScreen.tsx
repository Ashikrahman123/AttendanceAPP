
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Alert,
  StatusBar,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get("window");

// Simple color constants
const Colors = {
  primary: '#007AFF',
  secondary: '#FF6B6B',
  primaryLight: '#4DA6FF',
  secondaryLight: '#FF9999',
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  border: '#E1E5E9',
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
};

// Simple Input Component
const Input = ({ 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  error, 
  secureTextEntry = false,
  autoCapitalize = 'sentences'
}) => {
  return (
    <View style={styles.inputContainer}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        <Text style={styles.inputIcon}>👤</Text>
        <Text 
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          placeholderTextColor={Colors.textSecondary}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// Simple Button Component  
const Button = ({ title, onPress, isLoading = false, style }) => {
  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
      onPress={onPress}
      disabled={isLoading}
    >
      <Text style={styles.buttonText}>
        {isLoading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
};

export default function LoginScreen({ navigation }) {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [userNameError, setUserNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    let isValid = true;

    // Username validation
    if (!userName) {
      setUserNameError("Username is required");
      isValid = false;
    } else if (userName.length < 3) {
      setUserNameError("Username must be at least 3 characters");
      isValid = false;
    } else {
      setUserNameError("");
    }

    // Password validation
    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 5) {
      setPasswordError("Password must be at least 5 characters");
      isValid = false;
    } else {
      setPasswordError("");
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Simple mock authentication
      if (userName === 'admin' && password === 'password') {
        await AsyncStorage.setItem('userToken', 'mock-token');
        await AsyncStorage.setItem('userName', userName);
        setLoginSuccess(true);
        
        // Navigate to main app
        if (navigation) {
          navigation.replace('Home');
        }
      } else {
        Alert.alert('Login Failed', 'Invalid username or password');
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>📱</Text>
            </View>
            <Text style={styles.title}>Face Attendance</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          <View style={styles.formContainer}>
            <Input
              label="Username"
              placeholder="Enter your username"
              value={userName}
              onChangeText={setUserName}
              autoCapitalize="none"
              error={userNameError}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              error={passwordError}
              secureTextEntry={true}
            />

            <Button
              title={loginSuccess ? "Signed In!" : "Sign In"}
              onPress={handleLogin}
              isLoading={isLoading}
              style={styles.loginButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputIcon: {
    marginRight: 12,
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: 16,
  },
});
