import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  animated?: boolean;
}

export default function Input({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  leftIcon,
  rightIcon,
  isPassword = false,
  secureTextEntry,
  animated = true,
  ...rest
}: InputProps) {
  const colors = useColors();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Animation values
  const focusAnim = React.useRef(new Animated.Value(0)).current;

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (animated) {
      Animated.timing(focusAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (animated) {
      Animated.timing(focusAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  // Interpolate animation values
  const borderColor = animated 
    ? focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.border, colors.primary]
      })
    : isFocused ? colors.primary : colors.border;

  const shadowOpacity = animated
    ? focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.1]
      })
    : isFocused ? 0.1 : 0;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.text }, labelStyle]}>{label}</Text>}

      <Animated.View style={[
        styles.inputContainer, 
        { 
          backgroundColor: colors.card,
          borderColor: error ? colors.error : (animated ? borderColor : (isFocused ? colors.primary : colors.border)),
          shadowColor: colors.primary,
          shadowOpacity: error ? 0 : (animated ? shadowOpacity : (isFocused ? 0.1 : 0)),
        },
        inputStyle
      ]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            { color: colors.text },
            leftIcon ? styles.inputWithLeftIcon : null,
            (rightIcon || isPassword) ? styles.inputWithRightIcon : null,
          ]}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={isPassword ? !isPasswordVisible : secureTextEntry}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />

        {isPassword ? (
          <TouchableOpacity 
            style={styles.iconRight} 
            onPress={togglePasswordVisibility}
          >
            {isPasswordVisible ? (
              <Ionicons name="eye" size={20} color={colors.textSecondary} />
            ) : (
              <Ionicons name="eye-off" size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.iconRight}>{rightIcon}</View>
        ) : null}
      </Animated.View>

      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  iconLeft: {
    paddingLeft: 12,
  },
  iconRight: {
    paddingRight: 12,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});