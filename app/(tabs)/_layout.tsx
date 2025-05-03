import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Home, History, Users, User } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import { useThemeStore } from "@/store/theme-store";

export default function TabLayout() {
  const colors = useColors();
  const isDarkMode = useThemeStore(state => state.isDarkMode);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => <History size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="employees"
        options={{
          title: "Team",
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}