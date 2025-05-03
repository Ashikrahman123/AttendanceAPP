import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { View, StyleSheet } from "react-native";
import Colors from "@/constants/colors";

export default function AuthLayout() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        {/* <Stack.Screen name="register" /> */}
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});
